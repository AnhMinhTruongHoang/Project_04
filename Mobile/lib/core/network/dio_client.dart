import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/token_storage.dart';

class DioClient {
  DioClient._();

  // ============================================================
  // DIO INSTANCES
  // ============================================================

  static final Dio instance = Dio(
    _createOptions(),
  );

  /// Dio riêng dùng để refresh token.
  ///
  /// Không sử dụng interceptor của [instance] để tránh vòng lặp:
  /// request -> 401 -> refresh -> 401 -> refresh...
  static final Dio _refreshDio = Dio(
    _createOptions(),
  );

  /// Nếu nhiều request đồng thời bị 401,
  /// chỉ thực hiện refresh token một lần.
  static Future<String?>? _refreshingFuture;

  // ============================================================
  // BASE OPTIONS
  // ============================================================

  static BaseOptions _createOptions() {
    return BaseOptions(
      baseUrl: ApiConfig.apiV1,
      // Backend local/Render có thể cold-start và endpoint find-all hiện mất
      // hơn 40 giây. 30 giây khiến Dio hủy request trước khi BE trả 200.
      connectTimeout: const Duration(seconds: 90),
      receiveTimeout: const Duration(seconds: 90),
      sendTimeout: const Duration(seconds: 90),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
  }

  // ============================================================
  // INITIALIZE
  // ============================================================

  static void initialize() {
    // Tránh duplicate interceptor khi hot reload / initialize lại.
    instance.interceptors.clear();
    _refreshDio.interceptors.clear();

    instance.interceptors.add(
      InterceptorsWrapper(
        // ======================================================
        // REQUEST
        // ======================================================

        onRequest: (
            RequestOptions options,
            RequestInterceptorHandler handler,
            ) async {
          /*
           * Các API public của Auth không cần Bearer token.
           *
           * Ví dụ:
           * login
           * register
           * verify otp
           * forgot password
           * reset password
           */
          if (!_isPublicAuthPath(options.path)) {
            final accessToken =
            await TokenStorage.getAccessToken();

            if (accessToken != null &&
                accessToken.trim().isNotEmpty) {
              options.headers['Authorization'] =
              'Bearer ${accessToken.trim()}';
            }
          } else {
            // Đảm bảo guest endpoint không vô tình gửi token cũ.
            options.headers.remove('Authorization');
          }

          handler.next(options);
        },

        // ======================================================
        // ERROR
        // ======================================================

        onError: (
            DioException error,
            ErrorInterceptorHandler handler,
            ) async {
          final requestOptions =
              error.requestOptions;

          final statusCode =
              error.response?.statusCode;

          final alreadyRetried =
              requestOptions.extra[
              'auth_already_retried'] ==
                  true;

          // Chỉ xử lý refresh khi backend trả 401.
          if (statusCode != 401) {
            handler.next(error);
            return;
          }

          // Không retry request quá 1 lần.
          if (alreadyRetried) {
            handler.next(error);
            return;
          }

          /*
           * Các endpoint Auth public không refresh token.
           *
           * Ví dụ OTP sai ở reset-password có thể backend trả
           * lỗi auth. Ta phải trả lỗi đó cho UI, không được
           * chuyển sang refresh token.
           */
          if (_skipRefresh(
            requestOptions.path,
          )) {
            handler.next(error);
            return;
          }

          // ====================================================
          // REFRESH TOKEN
          // ====================================================

          final newAccessToken =
          await _refreshAccessToken();

          if (newAccessToken == null ||
              newAccessToken.isEmpty) {
            await TokenStorage.clearTokens();

            handler.next(error);
            return;
          }

          // Đánh dấu request đã retry.
          requestOptions.extra[
          'auth_already_retried'] = true;

          // Gắn access token mới.
          requestOptions.headers[
          'Authorization'] =
          'Bearer $newAccessToken';

          try {
            final response =
            await instance.fetch<dynamic>(
              requestOptions,
            );

            handler.resolve(response);
          } on DioException catch (
          retryError
          ) {
          handler.next(retryError);
          } catch (_) {
          handler.next(error);
          }
        },
      ),
    );

    // ==========================================================
    // LOGGING
    // ==========================================================

    instance.interceptors.add(
      LogInterceptor(
        request: true,
        requestBody: true,

        // Không log Authorization token ra console.
        requestHeader: false,

        responseBody: true,
        responseHeader: false,
        error: true,
      ),
    );
  }

  // ============================================================
  // PUBLIC AUTH ENDPOINTS
  // ============================================================

  static bool _isPublicAuthPath(
      String path,
      ) {
    final normalizedPath =
    _normalizePath(path);

    return normalizedPath.endsWith(
      '/auth/login',
    ) ||
        normalizedPath.endsWith(
          '/auth/register',
        ) ||
        normalizedPath.endsWith(
          '/auth/verify-otp',
        ) ||
        normalizedPath.endsWith(
          '/auth/resend-otp',
        ) ||
        normalizedPath.endsWith(
          '/auth/forgot-password',
        ) ||
        normalizedPath.endsWith(
          '/auth/reset-password',
        );
  }

  // ============================================================
  // SKIP REFRESH
  // ============================================================

  static bool _skipRefresh(
      String path,
      ) {
    final normalizedPath =
    _normalizePath(path);

    return _isPublicAuthPath(
      normalizedPath,
    ) ||
        normalizedPath.endsWith(
          '/auth/refresh',
        ) ||
        normalizedPath.endsWith(
          '/auth/logout',
        );
  }

  // ============================================================
  // REFRESH ACCESS TOKEN
  // ============================================================

  static Future<String?>
  _refreshAccessToken() async {
    /*
     * Nếu đã có request khác đang refresh,
     * các request còn lại chờ chung Future đó.
     */
    final runningRefresh =
        _refreshingFuture;

    if (runningRefresh != null) {
      return runningRefresh;
    }

    final refreshFuture =
    _performRefresh();

    _refreshingFuture =
        refreshFuture;

    try {
      return await refreshFuture;
    } finally {
      _refreshingFuture = null;
    }
  }

  // ============================================================
  // PERFORM REFRESH
  // ============================================================

  static Future<String?>
  _performRefresh() async {
    final refreshToken =
    await TokenStorage.getRefreshToken();

    if (refreshToken == null ||
        refreshToken.trim().isEmpty) {
      return null;
    }

    try {
      final response =
      await _refreshDio.post<dynamic>(
        '/auth/refresh',
        data: {
          'refresh_token':
          refreshToken.trim(),
        },
      );

      final root =
      _asMap(response.data);

      /*
       * Hỗ trợ response:
       *
       * {
       *   "data": {
       *     "access_token": "...",
       *     "refresh_token": "..."
       *   }
       * }
       *
       * hoặc:
       *
       * {
       *   "access_token": "...",
       *   "refresh_token": "..."
       * }
       */
      final nestedData =
      _asMap(root['data']);

      final tokenData =
      nestedData.isNotEmpty
          ? nestedData
          : root;

      final accessToken =
      _readString(
        tokenData['access_token'] ??
            tokenData['accessToken'],
      );

      final newRefreshToken =
      _readString(
        tokenData['refresh_token'] ??
            tokenData['refreshToken'],
      );

      // Backend không trả access token hợp lệ.
      if (accessToken == null ||
          accessToken.isEmpty) {
        await TokenStorage.clearTokens();

        return null;
      }

      // Lưu access token mới.
      await TokenStorage.saveAccessToken(
        accessToken,
      );

      /*
       * Một số backend rotate refresh token.
       * Nếu có refresh token mới thì lưu lại.
       */
      if (newRefreshToken != null &&
          newRefreshToken.isNotEmpty) {
        await TokenStorage
            .saveRefreshToken(
          newRefreshToken,
        );
      }

      return accessToken;
    } on DioException {
      await TokenStorage.clearTokens();

      return null;
    } catch (_) {
      await TokenStorage.clearTokens();

      return null;
    }
  }

  // ============================================================
  // NORMALIZE PATH
  // ============================================================

  static String _normalizePath(
      String path,
      ) {
    return path
        .split('?')
        .first
        .trim()
        .toLowerCase();
  }

  // ============================================================
  // MAP HELPER
  // ============================================================

  static Map<String, dynamic> _asMap(
      dynamic value,
      ) {
    if (value
    is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(
        value,
      );
    }

    return <String, dynamic>{};
  }

  // ============================================================
  // STRING HELPER
  // ============================================================

  static String? _readString(
      dynamic value,
      ) {
    if (value == null) {
      return null;
    }

    final result =
    value.toString().trim();

    if (result.isEmpty ||
        result.toLowerCase() ==
            'null') {
      return null;
    }

    return result;
  }
}
