import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/token_storage.dart';

class DioClient {
  DioClient._();

  static final Dio instance = Dio(_createOptions());
  static final Dio _refreshDio = Dio(_createOptions());

  static Future<String?>? _refreshingFuture;

  static BaseOptions _createOptions() {
    return BaseOptions(
      baseUrl: ApiConfig.apiV1,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    );
  }

  static void initialize() {
    instance.interceptors.clear();
    _refreshDio.interceptors.clear();

    instance.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final accessToken = await TokenStorage.getAccessToken();

          if (accessToken != null && accessToken.trim().isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }

          handler.next(options);
        },
        onError: (error, handler) async {
          final requestOptions = error.requestOptions;
          final statusCode = error.response?.statusCode;
          final alreadyRetried =
              requestOptions.extra['auth_already_retried'] == true;

          if (statusCode != 401 ||
              alreadyRetried ||
              _skipRefresh(requestOptions.path)) {
            handler.next(error);
            return;
          }

          final newAccessToken = await _refreshAccessToken();

          if (newAccessToken == null || newAccessToken.isEmpty) {
            await TokenStorage.clearTokens();
            handler.next(error);
            return;
          }

          requestOptions.extra['auth_already_retried'] = true;
          requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';

          try {
            final response = await instance.fetch<dynamic>(requestOptions);

            handler.resolve(response);
          } on DioException catch (retryError) {
            handler.next(retryError);
          }
        },
      ),
    );

    instance.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: true,
        responseHeader: false,
        error: true,
      ),
    );
  }

  static bool _skipRefresh(String path) {
    return path.endsWith('/auth/login') ||
        path.endsWith('/auth/refresh') ||
        path.endsWith('/auth/logout');
  }

  static Future<String?> _refreshAccessToken() async {
    final runningRefresh = _refreshingFuture;

    if (runningRefresh != null) {
      return runningRefresh;
    }

    final refreshFuture = _performRefresh();
    _refreshingFuture = refreshFuture;

    try {
      return await refreshFuture;
    } finally {
      _refreshingFuture = null;
    }
  }

  static Future<String?> _performRefresh() async {
    final refreshToken = await TokenStorage.getRefreshToken();

    if (refreshToken == null || refreshToken.trim().isEmpty) {
      return null;
    }

    try {
      final response = await _refreshDio.post<dynamic>(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );

      final root = _asMap(response.data);
      final data = _asMap(root['data']);

      final accessToken = (data['access_token'] ?? data['accessToken'])
          ?.toString()
          .trim();

      final newRefreshToken = (data['refresh_token'] ?? data['refreshToken'])
          ?.toString()
          .trim();

      if (accessToken == null || accessToken.isEmpty) {
        return null;
      }

      await TokenStorage.saveAccessToken(accessToken);

      if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
        await TokenStorage.saveRefreshToken(newRefreshToken);
      }

      return accessToken;
    } catch (_) {
      await TokenStorage.clearTokens();
      return null;
    }
  }

  static Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return <String, dynamic>{};
  }
}
