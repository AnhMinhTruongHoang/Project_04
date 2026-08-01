import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

/*
 * ============================================================
 * SOUNDCLONE MOBILE - CENTRALIZED API SERVICE
 * ============================================================
 *
 * File này chứa toàn bộ:
 *
 * - Base URL
 * - HTTP Client
 * - Access Token / Refresh Token
 * - Secure token storage
 * - Auto refresh token
 * - JSON request
 * - Multipart upload
 * - Auth APIs
 * - User APIs
 * - Follow APIs
 * - Track APIs
 * - Comment APIs
 * - Playlist APIs
 * - Category APIs
 * - Subscription APIs
 * - Notification APIs
 * - Artist Studio APIs
 * - Artist Earnings APIs
 * - Payout APIs
 * - VNPay APIs
 * - Admin APIs
 *
 * KHỞI TẠO TRONG main.dart:
 *
 * Future<void> main() async {
 *   WidgetsFlutterBinding.ensureInitialized();
 *   await ApiService.instance.initialize();
 *   runApp(const MyApp());
 * }
 *
 * CHẠY VỚI BACKEND LOCAL TRÊN ANDROID EMULATOR:
 *
 * flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000
 *
 * CHẠY VỚI RENDER:
 *
 * flutter run --dart-define=API_BASE_URL=https://soundclone-backend.onrender.com
 */

/*
 * ============================================================
 * API RESPONSE MODEL
 * ============================================================
 */

class ApiResponse<T> {
  final int statusCode;
  final String message;
  final T? data;
  final String? error;

  const ApiResponse({
    required this.statusCode,
    required this.message,
    this.data,
    this.error,
  });

  /// Request thành công khi status nằm trong khoảng 200–299.
  bool get isSuccess {
    return statusCode >= 200 && statusCode < 300;
  }

  /// Token thiếu, sai hoặc hết hạn.
  bool get isUnauthorized {
    return statusCode == 401;
  }

  /// User đã đăng nhập nhưng không có quyền sử dụng endpoint.
  bool get isForbidden {
    return statusCode == 403;
  }

  /// Dữ liệu xung đột, ví dụ email đã đăng ký.
  bool get isConflict {
    return statusCode == 409;
  }

  /// Không kết nối được Backend hoặc request timeout.
  bool get isNetworkError {
    return statusCode == 0;
  }

  @override
  String toString() {
    return 'ApiResponse('
        'statusCode: $statusCode, '
        'message: $message, '
        'data: $data, '
        'error: $error'
        ')';
  }
}

/*
 * ============================================================
 * API SERVICE
 * ============================================================
 */

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  /*
   * ============================================================
   * API CONFIGURATION
   * ============================================================
   */

  /*
   * Android Emulator gọi máy Windows:
   * http://10.0.2.2:8000
   *
   * Windows Desktop:
   * http://localhost:8000
   *
   * Android điện thoại thật:
   * http://IP_MAY_TINH:8000
   *
   * Production:
   * https://soundclone-backend.onrender.com
   */
  static const String _environmentBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const Duration requestTimeout = Duration(
    seconds: 45,
  );

  static const String _accessTokenStorageKey =
      'soundclone_access_token';

  static const String _refreshTokenStorageKey =
      'soundclone_refresh_token';

  static const FlutterSecureStorage _secureStorage =
      FlutterSecureStorage();

  final http.Client _client = http.Client();

  String? _accessToken;
  String? _refreshToken;

  /*
   * Dùng chung một refresh task để tránh nhiều API cùng lúc
   * gửi nhiều request refresh token.
   */
  Future<bool>? _refreshTask;

  String get baseUrl {
    return _environmentBaseUrl.replaceAll(
      RegExp(r'/+$'),
      '',
    );
  }

  String? get accessToken {
    return _accessToken;
  }

  String? get refreshToken {
    return _refreshToken;
  }

  bool get hasAccessToken {
    return _accessToken != null &&
        _accessToken!.trim().isNotEmpty;
  }

  bool get hasRefreshToken {
    return _refreshToken != null &&
        _refreshToken!.trim().isNotEmpty;
  }

  /*
   * ============================================================
   * INITIALIZATION
   * ============================================================
   */

  /// Đọc access token và refresh token đã lưu khi mở ứng dụng.
  Future<void> initialize() async {
    _accessToken = await _secureStorage.read(
      key: _accessTokenStorageKey,
    );

    _refreshToken = await _secureStorage.read(
      key: _refreshTokenStorageKey,
    );
  }

  /// Đóng HTTP client khi ứng dụng không còn sử dụng ApiService.
  void dispose() {
    _client.close();
  }

  /*
   * ============================================================
   * TOKEN MANAGEMENT
   * ============================================================
   */

  /// Lưu token vào RAM và FlutterSecureStorage.
  Future<void> setTokens({
    String? accessToken,
    String? refreshToken,
  }) async {
    final normalizedAccessToken =
        accessToken?.trim();

    final normalizedRefreshToken =
        refreshToken?.trim();

    if (normalizedAccessToken != null &&
        normalizedAccessToken.isNotEmpty) {
      _accessToken = normalizedAccessToken;

      await _secureStorage.write(
        key: _accessTokenStorageKey,
        value: normalizedAccessToken,
      );
    }

    if (normalizedRefreshToken != null &&
        normalizedRefreshToken.isNotEmpty) {
      _refreshToken = normalizedRefreshToken;

      await _secureStorage.write(
        key: _refreshTokenStorageKey,
        value: normalizedRefreshToken,
      );
    }
  }

  /// Xóa toàn bộ token khi logout hoặc refresh token thất bại.
  Future<void> clearTokens() async {
    _accessToken = null;
    _refreshToken = null;

    await Future.wait([
      _secureStorage.delete(
        key: _accessTokenStorageKey,
      ),
      _secureStorage.delete(
        key: _refreshTokenStorageKey,
      ),
    ]);
  }

  /// Chuyển dữ liệu dynamic thành Map<String, dynamic>.
  Map<String, dynamic>? _toMap(
    dynamic value,
  ) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(
        value,
      );
    }

    return null;
  }

  /// Lấy access_token và refresh_token từ response login/refresh.
  Future<void> _storeTokensFromResponse(
    ApiResponse<dynamic> response,
  ) async {
    Map<String, dynamic>? data = _toMap(
      response.data,
    );

    if (data == null) {
      return;
    }

    /*
     * Hỗ trợ response có thêm lớp data:
     *
     * {
     *   "data": {
     *     "access_token": "...",
     *     "refresh_token": "..."
     *   }
     * }
     */
    final nestedData = _toMap(
      data['data'],
    );

    if (nestedData != null) {
      data = {
        ...data,
        ...nestedData,
      };
    }

    final accessToken =
        data['access_token']?.toString() ??
        data['accessToken']?.toString();

    final refreshToken =
        data['refresh_token']?.toString() ??
        data['refreshToken']?.toString();

    await setTokens(
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }

  /*
   * ============================================================
   * COMMON HELPERS
   * ============================================================
   */

  int _clampInt(
    int value,
    int min,
    int max,
  ) {
    if (value < min) {
      return min;
    }

    if (value > max) {
      return max;
    }

    return value;
  }

  /// Tạo URL hoàn chỉnh từ path Backend.
  String buildUrl(
    String path,
  ) {
    final normalizedPath = path.trim();

    if (normalizedPath.isEmpty) {
      return baseUrl;
    }

    if (normalizedPath.startsWith('http://') ||
        normalizedPath.startsWith('https://')) {
      return normalizedPath;
    }

    if (normalizedPath.startsWith('/')) {
      return '$baseUrl$normalizedPath';
    }

    return '$baseUrl/$normalizedPath';
  }

  /// Tạo URI và tự thêm query parameters.
  Uri _buildUri(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) {
    final originalUri = Uri.parse(
      buildUrl(path),
    );

    if (queryParameters == null ||
        queryParameters.isEmpty) {
      return originalUri;
    }

    final query = <String, String>{};

    queryParameters.forEach((key, value) {
      if (value == null) {
        return;
      }

      String normalizedValue;

      if (value is List || value is Map) {
        normalizedValue = jsonEncode(value);
      } else {
        normalizedValue =
            value.toString().trim();
      }

      if (normalizedValue.isEmpty) {
        return;
      }

      query[key] = normalizedValue;
    });

    if (query.isEmpty) {
      return originalUri;
    }

    return originalUri.replace(
      queryParameters: {
        ...originalUri.queryParameters,
        ...query,
      },
    );
  }

  /// Chuẩn hóa URL ảnh từ Cloudinary hoặc BackendParameters,
        ...query,
      },
    );
  }

  /// Chuẩn hóa URL ảnh từ Cloudinary hoặc Backend local.
  String getImageUrl(
    String? imageUrl, {
    String fallback = '',
  }) {
    final value = imageUrl?.trim() ?? '';

    if (value.isEmpty) {
      return fallback;
    }

    if (value.startsWith('http://') ||
        value.startsWith('https://')) {
      return value;
    }

    if (value.startsWith('/')) {
      return '$baseUrl$value';
    }

    return '$baseUrl/uploads/images/$value';
  }

  /// Chuẩn hóa avatar URL.
  String getAvatarUrl(
    String? avatarUrl, {
    String fallback = '',
  }) {
    return getImageUrl(
      avatarUrl,
      fallback: fallback,
    );
  }

  /// Chuẩn hóa URL audio từ Cloudinary hoặc Backend local.
  String getAudioUrl(
    String? audioUrl,
  ) {
    final value = audioUrl?.trim() ?? '';

    if (value.isEmpty) {
      return '';
    }

    if (value.startsWith('http://') ||
        value.startsWith('https://')) {
      return value;
    }

    if (value.startsWith('/')) {
      return '$baseUrl$value';
    }

    return '$baseUrl/uploads/audio/$value';
  }

  /// Lấy id từ object hỗ trợ cả id và _id.
  String getObjectId(
    dynamic object,
  ) {
    final map = _toMap(object);

    if (map == null) {
      return '';
    }

    return (
      map['_id'] ??
      map['id'] ??
      ''
    ).toString();
  }

  /// Lấy danh sách result từ response hỗ trợ nhiều cấu trúc Backend.
  List<dynamic> extractResultList(
    ApiResponse<dynamic> response,
  ) {
    final data = response.data;

    if (data is List) {
      return data;
    }

    final dataMap = _toMap(data);

    if (dataMap == null) {
      return [];
    }

    final result = dataMap['result'];

    if (result is List) {
      return result;
    }

    return [];
  }

  /*
   * ============================================================
   * REQUEST HELPERS
   * ============================================================
   */

  Map<String, String> _buildHeaders({
    bool requiresAuth = false,
    bool hasJsonBody = false,
    Map<String, String>? additionalHeaders,
  }) {
    final headers = <String, String>{
      'Accept': 'application/json',
    };

    if (hasJsonBody) {
      headers['Content-Type'] =
          'application/json';
    }

    if (requiresAuth && hasAccessToken) {
      headers['Authorization'] =
          'Bearer $_accessToken';
    }

    if (additionalHeaders != null) {
      headers.addAll(
        additionalHeaders,
      );
    }

    return headers;
  }

  int _parseStatusCode(
    dynamic value,
    int fallback,
  ) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(
          value?.toString() ?? '',
        ) ??
        fallback;
  }

  /// Parse JSON response chuẩn ApiResponse của Spring Boot.
  ApiResponse<dynamic> _parseResponse(
    http.Response response,
  ) {
    dynamic decodedBody;

    final responseText =
        response.body.trim();

    if (responseText.isNotEmpty) {
      try {
        decodedBody = jsonDecode(
          responseText,
        );
      } catch (_) {
        decodedBody = responseText;
      }
    }

    final responseMap = _toMap(
      decodedBody,
    );

    if (responseMap != null) {
      return ApiResponse<dynamic>(
        statusCode: _parseStatusCode(
          responseMap['statusCode'],
          response.statusCode,
        ),
        message:
            responseMap['message']?.toString() ??
            response.reasonPhrase ??
            'Request completed.',
        data: responseMap.containsKey('data')
            ? responseMap['data']
            : responseMap,
        error:
            responseMap['error']?.toString() ??
            (
              response.statusCode >= 400
                  ? response.reasonPhrase
                  : null
            ),
      );
    }

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message:
          response.reasonPhrase ??
          (
            response.statusCode >= 200 &&
                    response.statusCode < 300
                ? 'Request completed.'
                : 'Request failed.'
          ),
      data: decodedBody,
      error: response.statusCode >= 400
          ? response.reasonPhrase
          : null,
    );
  }

  /// Chuyển lỗi mạng thành ApiResponse thống nhất.
  ApiResponse<dynamic> _networkError(
    Object error,
  ) {
    if (error is TimeoutException) {
      return const ApiResponse<dynamic>(
        statusCode: 0,
        message:
            'Request timed out. Please try again.',
        error: 'TIMEOUT_ERROR',
      );
    }

    if (error is SocketException) {
      return const ApiResponse<dynamic>(
        statusCode: 0,
        message:
            'Cannot connect to the server. Please check your network.',
        error: 'NETWORK_ERROR',
      );
    }

    return ApiResponse<dynamic>(
      statusCode: 0,
      message: error.toString(),
      error: 'UNKNOWN_ERROR',
    );
  }

  Future<http.Response> _executeRequest({
    required String method,
    required Uri uri,
    required Map<String, String> headers,
    Map<String, dynamic>? body,
  }) async {
    final request = http.Request(
      method.toUpperCase(),
      uri,
    );

    request.headers.addAll(
      headers,
    );

    if (body != null) {
      request.body = jsonEncode(
        body,
      );
    }

    final streamedResponse = await _client
        .send(request)
        .timeout(requestTimeout);

    return http.Response.fromStream(
      streamedResponse,
    );
  }

  /// Hàm request trung tâm cho GET/POST/PUT/PATCH/DELETE.
  Future<ApiResponse<dynamic>> _send({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    bool retryOnUnauthorized = true,
    Map<String, String>? headers,
  }) async {
    final uri = _buildUri(
      path,
      queryParameters: queryParameters,
    );

    final requestHeaders = _buildHeaders(
      requiresAuth: requiresAuth,
      hasJsonBody: body != null,
      additionalHeaders: headers,
    );

    try {
      final response = await _executeRequest(
        method: method,
        uri: uri,
        headers: requestHeaders,
        body: body,
      );

      final parsedResponse =
          _parseResponse(response);

      final unauthorized =
          response.statusCode == 401 ||
          parsedResponse.statusCode == 401;

      /*
       * Nếu access token hết hạn:
       *
       * 1. Gọi refresh token.
       * 2. Lưu token mới.
       * 3. Gửi lại request cũ một lần.
       */
      if (unauthorized &&
          requiresAuth &&
          retryOnUnauthorized) {
        final refreshed =
            await _refreshTokenOnce();

        if (refreshed) {
          return _send(
            method: method,
            path: path,
            body: body,
            queryParameters: queryParameters,
            requiresAuth: requiresAuth,
            retryOnUnauthorized: false,
            headers: headers,
          );
        }
      }

      return parsedResponse;
    } catch (error) {
      return _networkError(error);
    }
  }

  /*
   * ============================================================
   * MULTIPART REQUEST
   * ============================================================
   */

  /// Gửi multipart cho upload ảnh, audio hoặc track.
  Future<ApiResponse<dynamic>> _sendMultipart({
    required String method,
    required String path,
    Map<String, dynamic>? fields,
    Map<String, File>? files,
    Map<String, List<File>>? multipleFiles,
    bool requiresAuth = true,
    bool retryOnUnauthorized = true,
  }) async {
    final uri = _buildUri(path);

    try {
      final request = http.MultipartRequest(
        method.toUpperCase(),
        uri,
      );

      request.headers['Accept'] =
          'application/json';

      if (requiresAuth && hasAccessToken) {
        request.headers['Authorization'] =
            'Bearer $_accessToken';
      }

      fields?.forEach((key, value) {
        if (value == null) {
          return;
        }

        if (value is List || value is Map) {
          request.fields[key] =
              jsonEncode(value);
        } else {
          request.fields[key] =
              value.toString();
        }
      });

      if (files != null) {
        for (final entry in files.entries) {
          request.files.add(
            await http.MultipartFile.fromPath(
              entry.key,
              entry.value.path,
            ),
          );
        }
      }

      if (multipleFiles != null) {
        for (final entry
            in multipleFiles.entries) {
          for (final file in entry.value) {
            request.files.add(
              await http.MultipartFile.fromPath(
                entry.key,
                file.path,
              ),
            );
          }
        }
      }

      final streamedResponse = await request
          .send()
          .timeout(requestTimeout);

      final response =
          await http.Response.fromStream(
        streamedResponse,
      );

      final parsedResponse =
          _parseResponse(response);

      final unauthorized =
          response.statusCode == 401 ||
          parsedResponse.statusCode == 401;

      if (unauthorized &&
          requiresAuth &&
          retryOnUnauthorized) {
        final refreshed =
            await _refreshTokenOnce();

        if (refreshed) {
          return _sendMultipart(
            method: method,
            path: path,
            fields: fields,
            files: files,
            multipleFiles: multipleFiles,
            requiresAuth: requiresAuth,
            retryOnUnauthorized: false,
          );
        }
      }

      return parsedResponse;
    } catch (error) {
      return _networkError(error);
    }
  }

  /*
   * ============================================================
   * GENERIC HTTP METHODS
   * ============================================================
   */

  /// Gửi GET request.
  Future<ApiResponse<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'GET',
      path: path,
      queryParameters: queryParameters,
      requiresAuth: requiresAuth,
      headers: headers,
    );
  }

  /// Gửi POST request.
  Future<ApiResponse<dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'POST',
      path: path,
      body: body,
      queryParameters: queryParameters,
      requiresAuth: requiresAuth,
      headers: headers,
    );
  }

  /// Gửi PUT request.
  Future<ApiResponse<dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'PUT',
      path: path,
      body: body,
      queryParameters: queryParameters,
      requiresAuth: requiresAuth,
      headers: headers,
    );
  }

  /// Gửi PATCH request.
  Future<ApiResponse<dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'PATCH',
      path: path,
      body: body,
      queryParameters: queryParameters,
      requiresAuth: requiresAuth,
      headers: headers,
    );
  }

  /// Gửi DELETE request, hỗ trợ cả request body.
  Future<ApiResponse<dynamic>> delete(
    String path, {
    Map<String, dynamic>? body,
    Map<String, dynamic>? queryParameters,
    bool requiresAuth = false,
    Map<String, String>? headers,
  }) {
    return _send(
      method: 'DELETE',
      path: path,
      body: body,
      queryParameters: queryParameters,
      requiresAuth: requiresAuth,
      headers: headers,
    );
  }

  /*
   * ============================================================
   * AUTH APIs
   * ============================================================
   */

  /// Đăng nhập bằng email và password, sau đó tự lưu token.
  Future<ApiResponse<dynamic>> loginApi({
    required String email,
    required String password,
  }) async {
    final response = await post(
      '/api/v1/auth/login',
      body: {
        'email':
            email.trim().toLowerCase(),
        'password': password,
      },
    );

    if (response.isSuccess) {
      await _storeTokensFromResponse(
        response,
      );
    }

    return response;
  }

  /// Đăng ký tài khoản local mới và gửi OTP xác thực email.
  Future<ApiResponse<dynamic>> registerApi({
    required String name,
    required String email,
    required String password,
  }) {
    return post(
      '/api/v1/auth/register',
      body: {
        'name': name.trim(),
        'email':
            email.trim().toLowerCase(),
        'password': password,
      },
    );
  }

  /// Xác thực OTP sau khi đăng ký tài khoản.
  Future<ApiResponse<dynamic>>
      verifyRegisterOtpApi({
    required String email,
    required String otp,
  }) {
    return post(
      '/api/v1/auth/verify-otp',
      body: {
        'email':
            email.trim().toLowerCase(),
        'otp': otp.trim(),
      },
    );
  }

  /// Gửi lại OTP cho tài khoản chưa xác thực.
  Future<ApiResponse<dynamic>>
      resendRegisterOtpApi({
    required String email,
  }) {
    return post(
      '/api/v1/auth/resend-otp',
      body: {
        'email':
            email.trim().toLowerCase(),
      },
    );
  }

  /// Gửi OTP đặt lại mật khẩu.
  Future<ApiResponse<dynamic>>
      forgotPasswordApi({
    required String email,
  }) {
    return post(
      '/api/v1/auth/forgot-password',
      body: {
        'email':
            email.trim().toLowerCase(),
      },
    );
  }

  /// Đổi mật khẩu bằng email, OTP và mật khẩu mới.
  Future<ApiResponse<dynamic>>
      resetPasswordApi({
    required String email,
    required String otp,
    required String newPassword,
  }) {
    return post(
      '/api/v1/auth/reset-password',
      body: {
        'email':
            email.trim().toLowerCase(),
        'otp': otp.trim(),
        'newPassword': newPassword,
      },
    );
  }

  /// Đăng nhập Google hoặc GitHub và tự lưu token.
  Future<ApiResponse<dynamic>>
      socialMediaLoginApi({
    required String type,
    required String email,
    String? username,
    String? name,
    String? avatarUrl,
  }) async {
    final normalizedEmail =
        email.trim().toLowerCase();

    final response = await post(
      '/api/v1/auth/social-media',
      body: {
        'type':
            type.trim().toUpperCase(),
        'email': normalizedEmail,
        'username':
            username?.trim().isNotEmpty ==
                    true
                ? username!.trim()
                : normalizedEmail,
        'name': name?.trim(),
        'avatarUrl':
            avatarUrl?.trim(),
      },
    );

    if (response.isSuccess) {
      await _storeTokensFromResponse(
        response,
      );
    }

    return response;
  }

  /// Lấy thông tin tài khoản đang đăng nhập.
  Future<ApiResponse<dynamic>>
      getAccountApi() {
    return get(
      '/api/v1/auth/account',
      requiresAuth: true,
    );
  }

  /// Chủ động refresh access token bằng refresh token hiện tại.
  Future<ApiResponse<dynamic>>
      refreshTokenApi() {
    return _performRefreshToken();
  }

  /// Đăng xuất và xóa token trên thiết bị.
  Future<ApiResponse<dynamic>>
      logoutApi() async {
    final response = await post(
      '/api/v1/auth/logout',
      requiresAuth: true,
    );

    await clearTokens();

    return response;
  }

  Future<bool> _refreshTokenOnce() {
    final currentTask = _refreshTask;

    if (currentTask != null) {
      return currentTask;
    }

    final task = _performRefreshToken()
        .then((response) {
      return response.isSuccess;
    });

    _refreshTask = task;

    task.whenComplete(() {
      _refreshTask = null;
    });

    return task;
  }

  Future<ApiResponse<dynamic>>
      _performRefreshToken() async {
    if (!hasRefreshToken) {
      await clearTokens();

      return const ApiResponse<dynamic>(
        statusCode: 401,
        message:
            'Refresh token is missing.',
        error:
            'MISSING_REFRESH_TOKEN',
      );
    }

    final response = await _send(
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: {
        'refresh_token':
            _refreshToken,
      },
      retryOnUnauthorized: false,
    );

    if (response.isSuccess) {
      await _storeTokensFromResponse(
        response,
      );
    } else {
      await clearTokens();
    }

    return response;
  }

  /*
   * ============================================================
   * USER APIs
   * ============================================================
   */

  /// Admin lấy toàn bộ tài khoản người dùng.
  Future<ApiResponse<dynamic>>
      getAllUsersApi() {
    return get(
      '/api/v1/users/all',
      requiresAuth: true,
    );
  }

  /// Admin lấy danh sách user có phân trang và sắp xếp.
  Future<ApiResponse<dynamic>> getUsersApi({
    int current = 1,
    int pageSize = 10,
    String? sort,
  }) {
    return get(
      '/api/v1/users',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
        'sort': sort,
      },
      requiresAuth: true,
    );
  }

  /// Lấy thông tin public của một user theo ID.
  Future<ApiResponse<dynamic>>
      getUserByIdApi(
    String userId,
  ) {
    return get(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}',
    );
  }

  /// Admin tạo tài khoản user mới.
  Future<ApiResponse<dynamic>>
      createUserApi(
    Map<String, dynamic> payload,
  ) {
    return post(
      '/api/v1/users',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin cập nhật tài khoản bất kỳ theo user ID.
  Future<ApiResponse<dynamic>>
      updateUserApi({
    required String userId,
    required Map<String, dynamic> payload,
  }) {
    return patch(
      '/api/v1/users/update/'
      '${Uri.encodeComponent(userId)}',
      body: payload,
      requiresAuth: true,
    );
  }

  /// User đang đăng nhập tự cập nhật profile của chính mình.
  Future<ApiResponse<dynamic>>
      updateMyProfileApi({
    required String name,
    String? bio,
    String? website,
    String? avatarUrl,
    String? coverUrl,
    String? city,
    String? country,
    String? gender,
    int? age,
    String? spotlightTrackId,
  }) {
    final body = <String, dynamic>{
      'name': name.trim(),
      'bio': bio?.trim(),
      'website': website?.trim(),
      'avatarUrl':
          avatarUrl?.trim(),
      'coverUrl':
          coverUrl?.trim(),
      'city': city?.trim(),
      'country': country?.trim(),
      'gender': gender?.trim(),
      'age': age,
      'spotlightTrackId':
          spotlightTrackId?.trim(),
    };

    body.removeWhere(
      (_, value) => value == null,
    );

    return patch(
      '/api/v1/users/me',
      body: body,
      requiresAuth: true,
    );
  }

  /// Admin vô hiệu hóa tài khoản user và lưu lý do.
  Future<ApiResponse<dynamic>>
      deleteUserApi({
    required String userId,
    required String reason,
  }) {
    return delete(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}',
      body: {
        'reason': reason.trim(),
      },
      requiresAuth: true,
    );
  }

  /// Admin đình chỉ tài khoản user trong 7 ngày.
  Future<ApiResponse<dynamic>>
      suspendUserApi({
    required String userId,
    String? reason,
  }) {
    return patch(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/suspend',
      body: {
        if (reason != null)
          'reason': reason.trim(),
      },
      requiresAuth: true,
    );
  }

  /// Admin kích hoạt lại tài khoản đã bị đình chỉ hoặc vô hiệu hóa.
  Future<ApiResponse<dynamic>>
      activateUserApi(
    String userId,
  ) {
    return patch(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/activate',
      requiresAuth: true,
    );
  }

  /// Admin khóa quyền comment/chat của user.
  Future<ApiResponse<dynamic>>
      banUserChatApi({
    required String userId,
    String? reason,
  }) {
    return patch(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/ban-chat',
      body: {
        if (reason != null)
          'reason': reason.trim(),
      },
      requiresAuth: true,
    );
  }

  /// Admin mở lại quyền comment/chat của user.
  Future<ApiResponse<dynamic>>
      enableUserChatApi(
    String userId,
  ) {
    return patch(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/enable-chat',
      requiresAuth: true,
    );
  }

  /// Lấy bảng xếp hạng artist có nhiều follower nhất.
  Future<ApiResponse<dynamic>>
      getArtistLeaderboardApi({
    int limit = 10,
  }) {
    return get(
      '/api/v1/users/leaderboard/artists',
      queryParameters: {
        'limit': _clampInt(
          limit,
          1,
          100,
        ),
      },
    );
  }

  /// Lấy danh sách user được đề xuất để follow.
  Future<ApiResponse<dynamic>>
      getWhoToFollowApi({
    int limit = 12,
  }) {
    return get(
      '/api/v1/users/who-to-follow',
      queryParameters: {
        'limit': _clampInt(
          limit,
          1,
          24,
        ),
      },
    );
  }

  /*
   * ============================================================
   * FOLLOW APIs
   * ============================================================
   */

  /// Follow một user theo user ID.
  Future<ApiResponse<dynamic>>
      followUserApi(
    String userId,
  ) {
    return post(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/follow',
      requiresAuth: true,
    );
  }

  /// Bỏ follow một user theo user ID.
  Future<ApiResponse<dynamic>>
      unfollowUserApi(
    String userId,
  ) {
    return delete(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/follow',
      requiresAuth: true,
    );
  }

  /// Kiểm tra current user đã follow target user hay chưa.
  Future<ApiResponse<dynamic>>
      getFollowStatusApi(
    String userId,
  ) {
    return get(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/follow-status',
      requiresAuth: true,
    );
  }

  /// Lấy danh sách tài khoản mà một user đang follow.
  Future<ApiResponse<dynamic>>
      getUserFollowingApi({
    required String userId,
    int current = 1,
    int pageSize = 20,
  }) {
    return get(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/following',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Lấy danh sách follower của một user.
  Future<ApiResponse<dynamic>>
      getUserFollowersApi({
    required String userId,
    int current = 1,
    int pageSize = 20,
  }) {
    return get(
      '/api/v1/users/'
      '${Uri.encodeComponent(userId)}'
      '/followers',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Lấy danh sách user mà tài khoản hiện tại đang follow.
  Future<ApiResponse<dynamic>>
      getMyFollowingApi() {
    return get(
      '/api/v1/users/me/following',
      requiresAuth: true,
    );
  }

  /// Lấy danh sách follower của tài khoản hiện tại.
  Future<ApiResponse<dynamic>>
      getMyFollowersApi() {
    return get(
      '/api/v1/users/me/followers',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * TRACK APIs
   * ============================================================
   */

  /// Lấy danh sách track có phân trang.
  Future<ApiResponse<dynamic>> getTracksApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/tracks',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
    );
  }

  /// Lấy toàn bộ track public/approved.
  Future<ApiResponse<dynamic>>
      getAllTracksApi() {
    return get(
      '/api/v1/tracks/find-all',
    );
  }

  /// Lấy chi tiết track theo ID.
  Future<ApiResponse<dynamic>>
      getTrackByIdApi(
    String trackId,
  ) {
    return get(
      '/api/v1/tracks/search/'
      '${Uri.encodeComponent(trackId)}',
    );
  }

  /// Lấy chi tiết track theo slug hoặc ID.
  Future<ApiResponse<dynamic>>
      getTrackBySlugOrIdApi(
    String slugOrId,
  ) {
    return get(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(slugOrId)}',
    );
  }

  /// Tạo track mới bằng multipart audio, ảnh và metadata.
  Future<ApiResponse<dynamic>>
      createTrackApi({
    required Map<String, dynamic> fields,
    required Map<String, File> files,
  }) {
    return _sendMultipart(
      method: 'POST',
      path: '/api/v1/tracks',
      fields: fields,
      files: files,
      requiresAuth: true,
    );
  }

  /// Cập nhật metadata, ảnh hoặc audio của track.
  Future<ApiResponse<dynamic>>
      updateTrackApi({
    required String trackId,
    required Map<String, dynamic> fields,
    Map<String, File>? files,
  }) {
    return _sendMultipart(
      method: 'PATCH',
      path:
          '/api/v1/tracks/'
          '${Uri.encodeComponent(trackId)}',
      fields: fields,
      files: files,
      requiresAuth: true,
    );
  }

  /// Xóa track của tài khoản hiện tại.
  Future<ApiResponse<dynamic>>
      deleteTrackApi(
    String trackId,
  ) {
    return delete(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}',
      requiresAuth: true,
    );
  }

  /// Lấy top track theo category.
  Future<ApiResponse<dynamic>>
      getTopTracksApi({
    required String category,
    int limit = 10,
  }) {
    return get(
      '/api/v1/tracks/top',
      queryParameters: {
        'category':
            category.trim().toLowerCase(),
        'limit': _clampInt(
          limit,
          1,
          100,
        ),
      },
    );
  }

  /// Lấy comment của một track.
  Future<ApiResponse<dynamic>>
      getTrackCommentsApi(
    String trackId,
  ) {
    return get(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/comments',
    );
  }

  /// Lấy toàn bộ track do tài khoản hiện tại upload.
  Future<ApiResponse<dynamic>>
      getMyTracksApi() {
    return get(
      '/api/v1/tracks/my-tracks',
      requiresAuth: true,
    );
  }

  /// Alias phục vụ màn hình Artist Studio.
  Future<ApiResponse<dynamic>>
      getMyStudioTracksApi() {
    return getMyTracksApi();
  }

  /// Lọc track theo uploader ID ở phía Mobile.
  Future<ApiResponse<dynamic>>
      getTracksByUserApi({
    required String userId,
    int current = 1,
    int pageSize = 10,
  }) async {
    final response =
        await getAllTracksApi();

    if (!response.isSuccess) {
      return response;
    }

    final tracks =
        extractResultList(response);

    final filtered = tracks.where((item) {
      final track = _toMap(item);

      if (track == null) {
        return false;
      }

      final uploader =
          _toMap(track['uploader']);

      final uploaderId =
          track['uploaderId']?.toString() ??
          uploader?['_id']?.toString() ??
          uploader?['id']?.toString() ??
          '';

      return uploaderId == userId;
    }).toList();

    final safeCurrent =
        current < 1 ? 1 : current;

    final safePageSize = _clampInt(
      pageSize,
      1,
      100,
    );

    final start =
        (safeCurrent - 1) *
            safePageSize;

    final end = start + safePageSize >
            filtered.length
        ? filtered.length
        : start + safePageSize;

    final result =
        start >= filtered.length
            ? <dynamic>[]
            : filtered.sublist(
                start,
                end,
              );

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message: response.message,
      data: {
        'meta': {
          'current': safeCurrent,
          'pageSize': safePageSize,
          'pages': filtered.isEmpty
              ? 0
              : (
                  filtered.length /
                  safePageSize
                ).ceil(),
          'total': filtered.length,
        },
        'result': result,
      },
    );
  }

  /// Tìm kiếm track theo keyword.
  Future<ApiResponse<dynamic>>
      searchTracksApi(
    String keyword,
  ) {
    return get(
      '/api/v1/tracks/search',
      queryParameters: {
        'keyword': keyword.trim(),
      },
    );
  }

  /// Tạo album từ nhiều track ID.
  Future<ApiResponse<dynamic>>
      createAlbumApi({
    required String title,
    required List<String> trackIds,
    bool isPublic = true,
  }) {
    return post(
      '/api/v1/tracks/create-album',
      body: {
        'title': title.trim(),
        'isPublic': isPublic,
        'trackIds': trackIds,
      },
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ADMIN TRACK APIs
   * ============================================================
   */

  /// Admin lấy danh sách track chờ kiểm duyệt.
  Future<ApiResponse<dynamic>>
      getAdminTracksApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/admin/tracks/find-all',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Admin phê duyệt một track.
  Future<ApiResponse<dynamic>>
      approveTrackApi(
    String trackId,
  ) {
    return patch(
      '/api/v1/admin/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/approve',
      requiresAuth: true,
    );
  }

  /// Admin từ chối track và lưu lý do.
  Future<ApiResponse<dynamic>>
      rejectTrackApi({
    required String trackId,
    required String reason,
  }) {
    return patch(
      '/api/v1/admin/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/reject',
      body: {
        'reason': reason.trim(),
      },
      requiresAuth: true,
    );
  }

  /// Admin chạy kiểm tra bản quyền Chromaprint cho track.
  Future<ApiResponse<dynamic>>
      scanTrackCopyrightApi(
    String trackId,
  ) {
    return post(
      '/api/v1/admin/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/copyright-scan',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * FILE UPLOAD APIs
   * ============================================================
   */

  /// Upload một ảnh lên Backend/Cloudinary.
  Future<ApiResponse<dynamic>>
      uploadImageApi(
    File file,
  ) {
    return _sendMultipart(
      method: 'POST',
      path: '/api/v1/uploads/image',
      files: {
        'file': file,
      },
      requiresAuth: true,
    );
  }

  /// Upload một file audio lên Backend/Cloudinary.
  Future<ApiResponse<dynamic>>
      uploadAudioApi(
    File file,
  ) {
    return _sendMultipart(
      method: 'POST',
      path: '/api/v1/uploads/audio',
      files: {
        'file': file,
      },
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * COMMENT APIs
   * ============================================================
   */

  /// Admin lấy danh sách comment có phân trang.
  Future<ApiResponse<dynamic>>
      getCommentsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/comments',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// User tạo comment cho một track.
  Future<ApiResponse<dynamic>>
      createTrackCommentApi({
    required String trackId,
    required String content,
  }) {
    return post(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/comments',
      body: {
        'content': content.trim(),
      },
      requiresAuth: true,
    );
  }

  /// Xóa comment theo comment ID.
  Future<ApiResponse<dynamic>>
      deleteCommentApi(
    String commentId,
  ) {
    return delete(
      '/api/v1/comments/'
      '${Uri.encodeComponent(commentId)}',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * PLAYLIST APIs
   * ============================================================
   */

  /// Tạo playlist rỗng.
  Future<ApiResponse<dynamic>>
      createEmptyPlaylistApi({
    required String title,
    bool isPublic = true,
  }) {
    return post(
      '/api/v1/playlists',
      body: {
        'title': title.trim(),
        'isPublic': isPublic,
      },
      requiresAuth: true,
    );
  }

  /// Cập nhật tên, trạng thái public hoặc track trong playlist.
  Future<ApiResponse<dynamic>>
      updatePlaylistApi({
    required String playlistId,
    required Map<String, dynamic> payload,
  }) {
    return patch(
      '/api/v1/playlists/'
      '${Uri.encodeComponent(playlistId)}',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Xóa playlist theo playlist ID.
  Future<ApiResponse<dynamic>>
      deletePlaylistApi(
    String playlistId,
  ) {
    return delete(
      '/api/v1/playlists/'
      '${Uri.encodeComponent(playlistId)}',
      requiresAuth: true,
    );
  }

  /// Lấy chi tiết một playlist.
  Future<ApiResponse<dynamic>>
      getPlaylistByIdApi(
    String playlistId,
  ) {
    return get(
      '/api/v1/playlists/'
      '${Uri.encodeComponent(playlistId)}',
      requiresAuth: true,
    );
  }

  /// Lấy danh sách playlist có phân trang.
  Future<ApiResponse<dynamic>>
      getPlaylistsApi({
    int current = 1,
    int pageSize = 10,
    bool requiresAuth = false,
  }) {
    return get(
      '/api/v1/playlists',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: requiresAuth,
    );
  }

  /// Lấy playlist thuộc tài khoản đang đăng nhập.
  Future<ApiResponse<dynamic>>
      getMyPlaylistsApi() {
    return get(
      '/api/v1/playlists/my-playlists',
      requiresAuth: true,
    );
  }

  /// Lọc playlist thường của một user ở phía Mobile.
  Future<ApiResponse<dynamic>>
      getUserPlaylistsApi(
    String userId,
  ) async {
    final response =
        await getPlaylistsApi(
      current: 1,
      pageSize: 100,
    );

    if (!response.isSuccess) {
      return response;
    }

    final playlists =
        extractResultList(response);

    final result =
        playlists.where((item) {
      final playlist = _toMap(item);

      if (playlist == null) {
        return false;
      }

      final owner =
          _toMap(playlist['user']);

      final ownerId =
          playlist['userId']?.toString() ??
          owner?['_id']?.toString() ??
          owner?['id']?.toString() ??
          '';

      final isAlbum =
          playlist['isAlbum'] == true;

      return ownerId == userId &&
          !isAlbum;
    }).toList();

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message: response.message,
      data: result,
    );
  }

  /// Lọc album của một user ở phía Mobile.
  Future<ApiResponse<dynamic>>
      getUserAlbumsApi(
    String userId,
  ) async {
    final response =
        await getPlaylistsApi(
      current: 1,
      pageSize: 100,
    );

    if (!response.isSuccess) {
      return response;
    }

    final playlists =
        extractResultList(response);

    final result =
        playlists.where((item) {
      final playlist = _toMap(item);

      if (playlist == null) {
        return false;
      }

      final owner =
          _toMap(playlist['user']);

      final ownerId =
          playlist['userId']?.toString() ??
          owner?['_id']?.toString() ??
          owner?['id']?.toString() ??
          '';

      final isAlbum =
          playlist['isAlbum'] == true;

      return ownerId == userId &&
          isAlbum;
    }).toList();

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message: response.message,
      data: result,
    );
  }

  /*
   * ============================================================
   * LIKE APIs
   * ============================================================
   */

  /// Like một track.
  Future<ApiResponse<dynamic>>
      likeTrackApi(
    String trackId,
  ) {
    return post(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/like',
      requiresAuth: true,
    );
  }

  /// Dislike hoặc bỏ like một track theo logic Backend.
  Future<ApiResponse<dynamic>>
      dislikeTrackApi(
    String trackId,
  ) {
    return post(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/dislike',
      requiresAuth: true,
    );
  }

  /// Lấy danh sách track mà current user đã like.
  Future<ApiResponse<dynamic>>
      getLikedTracksApi() {
    return get(
      '/api/v1/tracks/liked',
      requiresAuth: true,
    );
  }

  /// Alias tương thích với tên API Web cũ.
  Future<ApiResponse<dynamic>>
      getUserLikedTracksApi(
    String userId,
  ) {
    return getLikedTracksApi();
  }

  /*
   * ============================================================
   * CATEGORY APIs
   * ============================================================
   */

  /// Lấy category có phân trang.
  Future<ApiResponse<dynamic>>
      getCategoriesApi({
    int current = 1,
    int pageSize = 100,
  }) {
    return get(
      '/api/v1/categories',
      queryParameters: {
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
    );
  }

  /// Lấy toàn bộ category.
  Future<ApiResponse<dynamic>>
      getAllCategoriesApi() {
    return get(
      '/api/v1/categories/all',
    );
  }

  /// Lấy category theo ID.
  Future<ApiResponse<dynamic>>
      getCategoryByIdApi(
    String categoryId,
  ) {
    return get(
      '/api/v1/categories/'
      '${Uri.encodeComponent(categoryId)}',
    );
  }

  /// Lấy category theo slug.
  Future<ApiResponse<dynamic>>
      getCategoryBySlugApi(
    String slug,
  ) {
    return get(
      '/api/v1/categories/slug/'
      '${Uri.encodeComponent(slug)}',
    );
  }

  /// Admin tạo category mới.
  Future<ApiResponse<dynamic>>
      createCategoryApi({
    required Map<String, dynamic> payload,
  }) {
    return post(
      '/api/v1/categories',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin cập nhật category.
  Future<ApiResponse<dynamic>>
      updateCategoryApi({
    required String categoryId,
    required Map<String, dynamic> payload,
  }) {
    return put(
      '/api/v1/categories/'
      '${Uri.encodeComponent(categoryId)}',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin xóa category.
  Future<ApiResponse<dynamic>>
      deleteCategoryApi(
    String categoryId,
  ) {
    return delete(
      '/api/v1/categories/'
      '${Uri.encodeComponent(categoryId)}',
      requiresAuth: true,
    );
  }

  /// Lấy track thuộc một category.
  Future<ApiResponse<dynamic>>
      getTracksByCategoryApi(
    String categorySlug,
  ) {
    return get(
      '/api/v1/tracks/top',
      queryParameters: {
        'category':
            categorySlug.trim(),
      },
    );
  }

  /*
   * ============================================================
   * LISTENING HISTORY & RECOMMENDATION APIs
   * ============================================================
   */

  /// Lưu tiến độ nghe của một track.
  Future<ApiResponse<dynamic>>
      saveListeningProgressApi({
    required String trackId,
    String? sessionId,
    required double position,
    required double duration,
    bool completed = false,
    bool playing = false,
  }) {
    return post(
      '/api/v1/tracks/'
      '${Uri.encodeComponent(trackId)}'
      '/history',
      body: {
        if (sessionId != null &&
            sessionId.trim().isNotEmpty)
          'sessionId':
              sessionId.trim(),
        'position':
            position < 0 ? 0 : position,
        'duration':
            duration < 0 ? 0 : duration,
        'completed': completed,
        'playing': playing,
      },
      requiresAuth: true,
    );
  }

  /// Lấy lịch sử nghe gần đây để hiển thị Home.
  Future<ApiResponse<dynamic>>
      getHomeListeningHistoryApi({
    int limit = 10,
  }) {
    return get(
      '/api/v1/tracks/history/home',
      queryParameters: {
        'limit': _clampInt(
          limit,
          1,
          20,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Lấy đề xuất dựa trên các bài user từng nghe.
  Future<ApiResponse<dynamic>>
      getBecauseYouListenedApi({
    int limit = 10,
  }) {
    return get(
      '/api/v1/tracks/because-you-listened',
      queryParameters: {
        'limit': _clampInt(
          limit,
          1,
          20,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Lấy hidden gems: track có ít lượt nghe nhưng đáng khám phá.
  Future<ApiResponse<dynamic>>
      getHiddenGemsApi({
    int limit = 10,
    int maxPlays = 1000,
  }) {
    return get(
      '/api/v1/tracks/hidden-gems',
      queryParameters: {
        'limit': _clampInt(
          limit,
          1,
          20,
        ),
        'maxPlays':
            maxPlays < 0 ? 0 : maxPlays,
      },
    );
  }

  /*
   * ============================================================
   * SUBSCRIPTION APIs
   * ============================================================
   */

  /// Lấy danh sách gói FREE, ARTIST và ARTIST_PRO.
  Future<ApiResponse<dynamic>>
      getSubscriptionPlansApi() {
    return get(
      '/api/v1/subscriptions/plans',
    );
  }

  /// Lấy gói subscription hiện tại của user.
  Future<ApiResponse<dynamic>>
      getMySubscriptionApi() {
    return get(
      '/api/v1/subscriptions/me',
      requiresAuth: true,
    );
  }

  /// Lấy mức sử dụng và giới hạn của gói hiện tại.
  Future<ApiResponse<dynamic>>
      getMySubscriptionUsageApi() {
    return get(
      '/api/v1/subscriptions/me/usage',
      requiresAuth: true,
    );
  }

  /// Đăng ký một plan trực tiếp theo planCode.
  Future<ApiResponse<dynamic>>
      subscribePlanApi(
    String planCode,
  ) {
    return post(
      '/api/v1/subscriptions/subscribe',
      body: {
        'planCode':
            planCode.trim().toUpperCase(),
      },
      requiresAuth: true,
    );
  }

  /// Đổi plan subscription hiện tại.
  Future<ApiResponse<dynamic>>
      changeSubscriptionPlanApi(
    String planCode,
  ) {
    return post(
      '/api/v1/subscriptions/change-plan',
      body: {
        'planCode':
            planCode.trim().toUpperCase(),
      },
      requiresAuth: true,
    );
  }

  /// Hủy subscription ở cuối chu kỳ hiện tại.
  Future<ApiResponse<dynamic>>
      cancelSubscriptionApi() {
    return post(
      '/api/v1/subscriptions/cancel',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ARTIST BENEFIT APIs
   * ============================================================
   */

  /// Artist lấy danh sách quyền lợi của gói Artist Pro.
  Future<ApiResponse<dynamic>>
      getArtistBenefitsApi() {
    return get(
      '/api/v1/artist-studio/benefits',
      requiresAuth: true,
    );
  }

  /// Admin lấy toàn bộ Artist Pro benefit.
  Future<ApiResponse<dynamic>>
      getAdminArtistBenefitsApi() {
    return get(
      '/api/v1/admin/artist-benefits',
      requiresAuth: true,
    );
  }

  /// Admin tạo Artist Pro benefit mới.
  Future<ApiResponse<dynamic>>
      createAdminArtistBenefitApi(
    Map<String, dynamic> payload,
  ) {
    return post(
      '/api/v1/admin/artist-benefits',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin cập nhật Artist Pro benefit.
  Future<ApiResponse<dynamic>>
      updateAdminArtistBenefitApi({
    required String benefitId,
    required Map<String, dynamic> payload,
  }) {
    return put(
      '/api/v1/admin/artist-benefits/'
      '${Uri.encodeComponent(benefitId)}',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin bật hoặc tắt một Artist Pro benefit.
  Future<ApiResponse<dynamic>>
      toggleAdminArtistBenefitApi(
    String benefitId,
  ) {
    return patch(
      '/api/v1/admin/artist-benefits/'
      '${Uri.encodeComponent(benefitId)}'
      '/toggle',
      requiresAuth: true,
    );
  }

  /// Admin xóa Artist Pro benefit.
  Future<ApiResponse<dynamic>>
      deleteAdminArtistBenefitApi(
    String benefitId,
  ) {
    return delete(
      '/api/v1/admin/artist-benefits/'
      '${Uri.encodeComponent(benefitId)}',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ARTIST STUDIO APIs
   * ============================================================
   */

  /// Lấy thống kê Artist Studio như track, stream và doanh thu.
  Future<ApiResponse<dynamic>>
      getArtistStudioStatsApi() {
    return get(
      '/api/v1/artist-studio/stats',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * NOTIFICATION APIs
   * ============================================================
   */

  /// Lấy danh sách notification theo trang và trạng thái.
  Future<ApiResponse<dynamic>>
      getNotificationsApi({
    int page = 0,
    int size = 20,
    String status = 'all',
  }) {
    final normalizedStatus =
        status == 'unread'
            ? 'unread'
            : 'all';

    return get(
      '/api/v1/notifications',
      queryParameters: {
        'page': page < 0 ? 0 : page,
        'size': _clampInt(
          size,
          1,
          100,
        ),
        'status': normalizedStatus,
      },
      requiresAuth: true,
    );
  }

  /// Lấy số lượng notification chưa đọc.
  Future<ApiResponse<dynamic>>
      getUnreadNotificationCountApi() {
    return get(
      '/api/v1/notifications/unread-count',
      requiresAuth: true,
    );
  }

  /// Đánh dấu một notification đã đọc.
  Future<ApiResponse<dynamic>>
      markNotificationAsReadApi(
    String notificationId,
  ) {
    return patch(
      '/api/v1/notifications/'
      '${Uri.encodeComponent(notificationId)}'
      '/read',
      requiresAuth: true,
    );
  }

  /// Đánh dấu toàn bộ notification đã đọc.
  Future<ApiResponse<dynamic>>
      markAllNotificationsAsReadApi() {
    return patch(
      '/api/v1/notifications/read-all',
      requiresAuth: true,
    );
  }

  /// Xóa một notification.
  Future<ApiResponse<dynamic>>
      deleteNotificationApi(
    String notificationId,
  ) {
    return delete(
      '/api/v1/notifications/'
      '${Uri.encodeComponent(notificationId)}',
      requiresAuth: true,
    );
  }

  /// Xóa toàn bộ notification đã đọc.
  Future<ApiResponse<dynamic>>
      clearReadNotificationsApi() {
    return delete(
      '/api/v1/notifications/clear-read',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ARTIST WALLET & EARNINGS APIs
   * ============================================================
   */

  /// Lấy số dư ví của artist.
  Future<ApiResponse<dynamic>>
      getArtistWalletApi() {
    return get(
      '/api/v1/artist/earnings/wallet',
      requiresAuth: true,
    );
  }

  /// Lấy lịch sử earning của artist.
  Future<ApiResponse<dynamic>>
      getArtistEarningHistoryApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/artist/earnings/history',
      queryParameters: {
        'status': status,
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Lấy tổng hợp doanh thu pending, available và paid.
  Future<ApiResponse<dynamic>>
      getArtistEarningSummaryApi() {
    return get(
      '/api/v1/artist/earnings/summary',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ARTIST PAYOUT APIs
   * ============================================================
   */

  /// Artist tạo yêu cầu rút tiền.
  Future<ApiResponse<dynamic>>
      createArtistPayoutRequestApi(
    Map<String, dynamic> payload,
  ) {
    return post(
      '/api/v1/artist/earnings/payouts',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Artist xem lịch sử yêu cầu rút tiền.
  Future<ApiResponse<dynamic>>
      getArtistPayoutHistoryApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/artist/earnings/payouts',
      queryParameters: {
        'status': status,
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Artist hủy yêu cầu payout đang chờ xử lý.
  Future<ApiResponse<dynamic>>
      cancelArtistPayoutRequestApi(
    String payoutRequestId,
  ) {
    return post(
      '/api/v1/artist/earnings/payouts/'
      '${Uri.encodeComponent(payoutRequestId)}'
      '/cancel',
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * ADMIN PAYOUT APIs
   * ============================================================
   */

  /// Admin lấy danh sách payout request.
  Future<ApiResponse<dynamic>>
      getAdminArtistPayoutsApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return get(
      '/api/v1/admin/artist-payouts',
      queryParameters: {
        'status': status,
        'current':
            current < 1 ? 1 : current,
        'pageSize': _clampInt(
          pageSize,
          1,
          100,
        ),
      },
      requiresAuth: true,
    );
  }

  /// Admin xem chi tiết một payout request.
  Future<ApiResponse<dynamic>>
      getAdminArtistPayoutDetailApi(
    String payoutRequestId,
  ) {
    return get(
      '/api/v1/admin/artist-payouts/'
      '${Uri.encodeComponent(payoutRequestId)}',
      requiresAuth: true,
    );
  }

  /// Admin phê duyệt payout request.
  Future<ApiResponse<dynamic>>
      approveAdminArtistPayoutApi({
    required String payoutRequestId,
    Map<String, dynamic>? payload,
  }) {
    return patch(
      '/api/v1/admin/artist-payouts/'
      '${Uri.encodeComponent(payoutRequestId)}'
      '/approve',
      body: payload ?? {},
      requiresAuth: true,
    );
  }

  /// Admin từ chối payout request và lưu lý do.
  Future<ApiResponse<dynamic>>
      rejectAdminArtistPayoutApi({
    required String payoutRequestId,
    required Map<String, dynamic> payload,
  }) {
    return patch(
      '/api/v1/admin/artist-payouts/'
      '${Uri.encodeComponent(payoutRequestId)}'
      '/reject',
      body: payload,
      requiresAuth: true,
    );
  }

  /// Admin đánh dấu payout đã thanh toán.
  Future<ApiResponse<dynamic>>
      markAdminArtistPayoutPaidApi({
    required String payoutRequestId,
    required Map<String, dynamic> payload,
  }) {
    return patch(
      '/api/v1/admin/artist-payouts/'
      '${Uri.encodeComponent(payoutRequestId)}'
      '/paid',
      body: payload,
      requiresAuth: true,
    );
  }

  /*
   * ============================================================
   * VNPAY PAYMENT API
   * ============================================================
   */

  /// Tạo URL thanh toán VNPay cho một subscription plan.
  Future<ApiResponse<dynamic>>
      createVnPayPaymentApi(
    String planCode,
  ) {
    return post(
      '/api/v1/payments/vnpay/create',
      body: {
        'planCode':
            planCode.trim().toUpperCase(),
      },
      requiresAuth: true,
    );
  }
