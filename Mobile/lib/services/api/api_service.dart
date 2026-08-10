import 'dart:io';

import 'package:dio/dio.dart';

import '../config/api_config.dart';
import '../storage/token_storage.dart';
import 'dio_client.dart';

/*
 * ============================================================
 * SOUNDCLONE MOBILE - API SERVICE
 * ============================================================
 *
 * SOURCE OF TRUTH:
 * - SoundClone Web: src/utils/api.ts
 * - Backend Spring Boot: /api/v1/...
 *
 * IMPORTANT:
 * ApiConfig.apiV1 already contains:
 *
 *   https://<backend>/api/v1
 *
 * Therefore Flutter paths below DO NOT repeat "/api/v1".
 *
 * Example:
 *
 * Web:
 *   GET /api/v1/tracks
 *
 * Flutter:
 *   DioClient.instance.get('/tracks')
 *
 * ============================================================
 * WEB-ONLY LOGIC NOT PORTED AS BACKEND ENDPOINTS
 * ============================================================
 *
 * 1. /api/revalidate
 *    -> Next.js internal route. Flutter MUST NOT call it.
 *
 * 2. getTracksByUserApi()
 *    -> Web currently fetches all public tracks then filters locally
 *       because Backend does not expose GET /users/{id}/tracks.
 *    -> Flutter keeps a compatibility helper with the same behavior.
 *
 * 3. getUserPlaylistsApi()/getUserAlbumsApi()
 *    -> Web currently fetches playlists then filters locally.
 *    -> Flutter keeps compatibility helpers, clearly marked below.
 *
 * 4. getUserLikedTracksApi(userId)
 *    -> Backend only supports liked tracks of current authenticated user.
 *    -> Flutter keeps an alias and DOES NOT pretend it can fetch another
 *       user's private liked tracks.
 *
 * ============================================================
 * AUTH
 * ============================================================
 *
 * DioClient automatically:
 * - reads access token from TokenStorage
 * - adds Authorization: Bearer <token>
 * - refreshes token once on HTTP 401
 *
 * ApiService is responsible for:
 * - endpoint paths
 * - payload/query mapping
 * - multipart creation
 * - common ApiResponse parsing
 */

class ApiResponse<T> {
  final int statusCode;
  final String message;
  final String? error;
  final T? data;

  const ApiResponse({
    required this.statusCode,
    required this.message,
    this.error,
    this.data,
  });

  bool get isSuccess => statusCode >= 200 && statusCode < 300;
  bool get isUnauthorized => statusCode == 401;
  bool get isForbidden => statusCode == 403;
  bool get isNotFound => statusCode == 404;
  bool get isConflict => statusCode == 409;
  bool get isNetworkError => statusCode == 0;

  @override
  String toString() {
    return 'ApiResponse(statusCode: $statusCode, message: $message, error: $error, data: $data)';
  }
}

class ApiService {
  ApiService._();

  static final ApiService instance = ApiService._();

  final Dio _dio = DioClient.instance;

  String? _accessToken;

  String? get accessToken => _accessToken;

  /*
   * ============================================================
   * COMMON HELPERS
   * ============================================================
   */

  String _id(String value) => Uri.encodeComponent(value.trim());

  Map<String, dynamic> _withoutNulls(Map<String, dynamic> source) {
    final result = <String, dynamic>{};

    for (final entry in source.entries) {
      final value = entry.value;

      if (value == null) {
        continue;
      }

      if (value is String && value.trim().isEmpty) {
        continue;
      }

      result[entry.key] = value;
    }

    return result;
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return <String, dynamic>{};
  }

  List<dynamic> extractResultList(ApiResponse<dynamic> response) {
    final data = response.data;

    if (data is List) {
      return data;
    }

    if (data is Map) {
      final result = data['result'];

      if (result is List) {
        return result;
      }

      final items = data['items'];

      if (items is List) {
        return items;
      }
    }

    return const <dynamic>[];
  }

  String getUserId(dynamic user) {
    if (user is! Map) {
      return '';
    }

    return (user['_id'] ?? user['id'] ?? '').toString().trim();
  }

  String getTrackId(dynamic track) {
    if (track is! Map) {
      return '';
    }

    return (track['id'] ?? track['_id'] ?? '').toString().trim();
  }

  Future<void> restoreAccessToken() async {
    _accessToken = await TokenStorage.getAccessToken();
  }

  Future<ApiResponse<dynamic>> _request({
    required String method,
    required String path,
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: queryParameters == null
            ? null
            : _withoutNulls(queryParameters),
        options: options ?? Options(method: method),
      );

      return _fromDioResponse(response);
    } on DioException catch (error) {
      return _fromDioError(error);
    } catch (error) {
      return ApiResponse<dynamic>(
        statusCode: 0,
        message: error.toString(),
        error: 'NETWORK_ERROR',
      );
    }
  }

  ApiResponse<dynamic> _fromDioResponse(Response<dynamic> response) {
    final root = _asMap(response.data);

    if (root.isNotEmpty &&
        (root.containsKey('statusCode') ||
            root.containsKey('message') ||
            root.containsKey('data'))) {
      return ApiResponse<dynamic>(
        statusCode:
            int.tryParse(root['statusCode']?.toString() ?? '') ??
            response.statusCode ??
            200,
        message: root['message']?.toString() ?? 'Success',
        error: root['error']?.toString(),
        data: root['data'],
      );
    }

    return ApiResponse<dynamic>(
      statusCode: response.statusCode ?? 200,
      message: 'Success',
      data: response.data,
    );
  }

  ApiResponse<dynamic> _fromDioError(DioException error) {
    final statusCode = error.response?.statusCode ?? 0;
    final root = _asMap(error.response?.data);

    return ApiResponse<dynamic>(
      statusCode: statusCode,
      message:
          root['message']?.toString() ??
          root['error']?.toString() ??
          error.message ??
          'Request failed',
      error:
          root['error']?.toString() ??
          (statusCode == 0 ? 'NETWORK_ERROR' : 'HTTP_ERROR'),
      data: root['data'],
    );
  }

  /*
   * ============================================================
   * MEDIA URL HELPERS
   * ============================================================
   *
   * Equivalent to Web:
   * - getImageUrl()
   * - getAudioUrl()
   * - getAvatarUrl()
   * - getLicenseUrl()
   */

  String getImageUrl(String? value) {
    final url = value?.trim() ?? '';

    if (url.isEmpty) {
      return '';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/uploads/images')) {
      return '${ApiConfig.baseUrl}$url';
    }

    if (url.startsWith('/')) {
      return '${ApiConfig.baseUrl}$url';
    }

    return '${ApiConfig.baseUrl}/uploads/images/$url';
  }

  String getAvatarUrl(String? value) => getImageUrl(value);

  String getAudioUrl(String? value) {
    final url = value?.trim() ?? '';

    if (url.isEmpty) {
      return '';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return '${ApiConfig.baseUrl}$url';
    }

    return '${ApiConfig.baseUrl}/uploads/audio/$url';
  }

  String getLicenseUrl(String? value) {
    final url = value?.trim() ?? '';

    if (url.isEmpty) {
      return '';
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/')) {
      return '${ApiConfig.baseUrl}$url';
    }

    return '${ApiConfig.baseUrl}/uploads/licenses/$url';
  }

  /*
   * ============================================================
   * AUTH APIs
   * Web source: AUTH APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> loginApi({
    required String email,
    required String password,
  }) async {
    final response = await _request(
      method: 'POST',
      path: '/auth/login',
      data: {'email': email.trim(), 'password': password},
    );

    if (response.isSuccess) {
      final data = _asMap(response.data);

      final accessToken = (data['access_token'] ?? data['accessToken'])
          ?.toString()
          .trim();

      final refreshToken = (data['refresh_token'] ?? data['refreshToken'])
          ?.toString()
          .trim();

      if (accessToken != null && accessToken.isNotEmpty) {
        _accessToken = accessToken;
        await TokenStorage.saveAccessToken(accessToken);
      }

      if (refreshToken != null && refreshToken.isNotEmpty) {
        await TokenStorage.saveRefreshToken(refreshToken);
      }
    }

    return response;
  }

  Future<ApiResponse<dynamic>> getAccountApi() {
    return _request(method: 'GET', path: '/auth/account');
  }

  Future<ApiResponse<dynamic>> refreshTokenApi(String refreshToken) async {
    final response = await _request(
      method: 'POST',
      path: '/auth/refresh',
      data: {'refresh_token': refreshToken.trim()},
    );

    if (response.isSuccess) {
      final data = _asMap(response.data);

      final accessToken = (data['access_token'] ?? data['accessToken'])
          ?.toString()
          .trim();

      final newRefreshToken = (data['refresh_token'] ?? data['refreshToken'])
          ?.toString()
          .trim();

      if (accessToken != null && accessToken.isNotEmpty) {
        _accessToken = accessToken;
        await TokenStorage.saveAccessToken(accessToken);
      }

      if (newRefreshToken != null && newRefreshToken.isNotEmpty) {
        await TokenStorage.saveRefreshToken(newRefreshToken);
      }
    }

    return response;
  }

  Future<ApiResponse<dynamic>> logoutApi() async {
    final response = await _request(method: 'POST', path: '/auth/logout');

    _accessToken = null;
    await TokenStorage.clearTokens();

    return response;
  }

  Future<ApiResponse<dynamic>> socialMediaLoginApi({
    required String type,
    String? email,
    String? username,
    String? name,
    String? avatarUrl,
    String? image,
  }) {
    return _request(
      method: 'POST',
      path: '/auth/social-media',
      data: _withoutNulls({
        'type': type,
        'email': email ?? username,
        'username': username ?? email,
        'name': name,
        'avatarUrl': avatarUrl ?? image,
      }),
    );
  }

  Future<ApiResponse<dynamic>> registerApi({
    required String name,
    required String email,
    required String password,
    int? age,
    String? gender,
  }) {
    return _request(
      method: 'POST',
      path: '/auth/register',
      data: _withoutNulls({
        'name': name.trim(),
        'email': email.trim(),
        'password': password,
        'age': age,
        'gender': gender,
      }),
    );
  }

  Future<ApiResponse<dynamic>> verifyRegisterOtpApi({
    required String email,
    required String otp,
  }) {
    return _request(
      method: 'POST',
      path: '/auth/verify-otp',
      data: {'email': email.trim(), 'otp': otp.trim()},
    );
  }

  Future<ApiResponse<dynamic>> resendRegisterOtpApi({required String email}) {
    return _request(
      method: 'POST',
      path: '/auth/resend-otp',
      data: {'email': email.trim()},
    );
  }

  Future<ApiResponse<dynamic>> forgotPasswordApi({required String email}) {
    return _request(
      method: 'POST',
      path: '/auth/forgot-password',
      data: {'email': email.trim()},
    );
  }

  Future<ApiResponse<dynamic>> resetPasswordApi({
    required String email,
    required String otp,
    required String newPassword,
  }) {
    return _request(
      method: 'POST',
      path: '/auth/reset-password',
      data: {
        'email': email.trim(),
        'otp': otp.trim(),
        'newPassword': newPassword,
      },
    );
  }

  /*
   * ============================================================
   * USERS APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getAllUsersApi() {
    return _request(method: 'GET', path: '/users/all');
  }

  Future<ApiResponse<dynamic>> getUsersApi({
    int current = 1,
    int pageSize = 10,
    String? sort,
  }) {
    return _request(
      method: 'GET',
      path: '/users',
      queryParameters: {'current': current, 'pageSize': pageSize, 'sort': sort},
    );
  }

  Future<ApiResponse<dynamic>> getUserByIdApi(String userId) {
    return _request(method: 'GET', path: '/users/${_id(userId)}');
  }

  Future<ApiResponse<dynamic>> createUserApi(Map<String, dynamic> payload) {
    return _request(method: 'POST', path: '/users', data: payload);
  }

  /*
   * ADMIN USER UPDATE.
   *
   * NOTE:
   * This is NOT the endpoint for a normal user editing their own profile.
   * Self-edit must use updateMyProfileApi().
   */
  Future<ApiResponse<dynamic>> updateUserApi({
    required String userId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/users/update/${_id(userId)}',
      data: payload,
    );
  }

  /*
   * SELF PROFILE PATCH.
   *
   * NOTE:
   * Fields are optional because Backend PATCH /users/me supports partial
   * updates. This is important for avatar/cover-only updates.
   */
  Future<ApiResponse<dynamic>> updateMyProfileApi({
    String? name,
    String? website,
    String? bio,
    String? avatarUrl,
    String? coverUrl,
    String? city,
    String? country,
    String? gender,
    int? age,
  }) {
    return _request(
      method: 'PATCH',
      path: '/users/me',
      data: _withoutNulls({
        'name': name?.trim(),
        'website': website?.trim(),
        'bio': bio?.trim(),
        'avatarUrl': avatarUrl?.trim(),
        'coverUrl': coverUrl?.trim(),
        'city': city?.trim(),
        'country': country?.trim(),
        'gender': gender?.trim(),
        'age': age,
      }),
    );
  }

  Future<ApiResponse<dynamic>> deleteUserApi(String userId) {
    return _request(method: 'DELETE', path: '/users/${_id(userId)}');
  }

  Future<ApiResponse<dynamic>> getArtistLeaderboardApi({int limit = 10}) {
    return _request(
      method: 'GET',
      path: '/users/leaderboard/artists',
      queryParameters: {'limit': limit < 1 ? 1 : limit},
    );
  }

  Future<ApiResponse<dynamic>> getWhoToFollowApi({int limit = 12}) {
    final safeLimit = limit.clamp(1, 24);

    return _request(
      method: 'GET',
      path: '/users/who-to-follow',
      queryParameters: {'limit': safeLimit},
    );
  }

  Future<ApiResponse<dynamic>> getUserBadgesApi(String userId) {
    return _request(method: 'GET', path: '/users/${_id(userId)}/badges');
  }

  /*
   * ============================================================
   * FOLLOW APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> followUserApi(String userId) {
    return _request(method: 'POST', path: '/users/${_id(userId)}/follow');
  }

  Future<ApiResponse<dynamic>> unfollowUserApi(String userId) {
    return _request(method: 'DELETE', path: '/users/${_id(userId)}/follow');
  }

  Future<ApiResponse<dynamic>> getFollowStatusApi(String userId) {
    return _request(method: 'GET', path: '/users/${_id(userId)}/follow-status');
  }

  Future<ApiResponse<dynamic>> getUserFollowingApi({
    required String userId,
    int current = 1,
    int pageSize = 20,
  }) {
    return _request(
      method: 'GET',
      path: '/users/${_id(userId)}/following',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getUserFollowersApi({
    required String userId,
    int current = 1,
    int pageSize = 20,
  }) {
    return _request(
      method: 'GET',
      path: '/users/${_id(userId)}/followers',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getMyFollowingApi() {
    return _request(method: 'GET', path: '/users/me/following');
  }

  /*
   * Web does not expose /users/me/followers directly.
   * Match Web behavior:
   * account -> current user id -> /users/{id}/followers.
   */
  Future<ApiResponse<dynamic>> getMyFollowersApi({
    int current = 1,
    int pageSize = 20,
  }) async {
    final account = await getAccountApi();

    if (!account.isSuccess) {
      return account;
    }

    final root = _asMap(account.data);
    final user = root['user'] ?? account.data;
    final userId = getUserId(user);

    if (userId.isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 401,
        message: 'Cannot resolve current user',
        error: 'UNAUTHORIZED',
      );
    }

    return getUserFollowersApi(
      userId: userId,
      current: current,
      pageSize: pageSize,
    );
  }

  /*
   * ============================================================
   * TRACK APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getTracksApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/tracks',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getAllTracksApi() {
    return _request(method: 'GET', path: '/tracks/find-all');
  }

  Future<ApiResponse<dynamic>> getTrackByIdApi(String trackId) {
    return _request(method: 'GET', path: '/tracks/search/${_id(trackId)}');
  }

  Future<ApiResponse<dynamic>> getTrackBySlugOrIdApi(String slugOrId) {
    return _request(method: 'GET', path: '/tracks/${_id(slugOrId)}');
  }

  Future<ApiResponse<dynamic>> getTopTracksApi({
    required String category,
    int limit = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/tracks/top',
      queryParameters: {
        'category': category.trim().toLowerCase(),
        'limit': limit,
      },
    );
  }

  Future<ApiResponse<dynamic>> getTrackCommentsApi(String trackId) {
    return _request(method: 'GET', path: '/tracks/${_id(trackId)}/comments');
  }

  Future<ApiResponse<dynamic>> getMyTracksApi() {
    return _request(method: 'GET', path: '/tracks/my-tracks');
  }

  Future<ApiResponse<dynamic>> getMyStudioTracksApi() {
    return getMyTracksApi();
  }

  Future<ApiResponse<dynamic>> searchTracksApi(String keyword) {
    return _request(
      method: 'GET',
      path: '/tracks/search',
      queryParameters: {'keyword': keyword.trim()},
    );
  }

  Future<ApiResponse<dynamic>> createAlbumApi({
    required String title,
    required List<String> trackIds,
    bool isPublic = true,
  }) {
    return _request(
      method: 'POST',
      path: '/tracks/create-album',
      data: {'title': title.trim(), 'isPublic': isPublic, 'trackIds': trackIds},
    );
  }

  /*
   * MULTIPART TRACK CREATE.
   *
   * NOTE:
   * Web api.ts forwards FormData keys as supplied by the caller.
   * These field names must match your current TrackController exactly.
   *
   * Current Flutter usage keeps:
   * - audioFile
   * - imageFile
   *
   * If Backend uses different @RequestParam names, change ONLY the
   * keys passed by the caller, not the generic multipart mechanism.
   */
  Future<ApiResponse<dynamic>> createTrackApi({
    required Map<String, dynamic> fields,
    required Map<String, File> files,
  }) async {
    final formMap = <String, dynamic>{};

    for (final entry in fields.entries) {
      if (entry.value != null) {
        formMap[entry.key] = entry.value;
      }
    }

    for (final entry in files.entries) {
      formMap[entry.key] = await MultipartFile.fromFile(
        entry.value.path,
        filename: entry.value.uri.pathSegments.isEmpty
            ? 'upload'
            : entry.value.uri.pathSegments.last,
      );
    }

    return _request(
      method: 'POST',
      path: '/tracks',
      data: FormData.fromMap(formMap),
      options: Options(method: 'POST', contentType: 'multipart/form-data'),
    );
  }

  Future<ApiResponse<dynamic>> updateTrackApi({
    required String trackId,
    required Map<String, dynamic> fields,
    Map<String, File> files = const {},
  }) async {
    final formMap = <String, dynamic>{};

    for (final entry in fields.entries) {
      if (entry.value != null) {
        formMap[entry.key] = entry.value;
      }
    }

    for (final entry in files.entries) {
      formMap[entry.key] = await MultipartFile.fromFile(
        entry.value.path,
        filename: entry.value.uri.pathSegments.isEmpty
            ? 'upload'
            : entry.value.uri.pathSegments.last,
      );
    }

    return _request(
      method: 'PATCH',
      path: '/tracks/${_id(trackId)}',
      data: FormData.fromMap(formMap),
      options: Options(method: 'PATCH', contentType: 'multipart/form-data'),
    );
  }

  Future<ApiResponse<dynamic>> deleteTrackApi(String trackId) {
    return _request(method: 'DELETE', path: '/tracks/${_id(trackId)}');
  }

  /*
   * WEB COMPATIBILITY FALLBACK - NOT A DEDICATED BACKEND ENDPOINT.
   *
   * Backend currently does not expose:
   * GET /users/{userId}/tracks
   *
   * Same behavior as Web:
   * GET all public tracks -> filter by uploaderId locally -> paginate locally.
   */
  Future<ApiResponse<dynamic>> getTracksByUserApi({
    required String userId,
    int current = 1,
    int pageSize = 10,
  }) async {
    final response = await getAllTracksApi();

    if (!response.isSuccess) {
      return response;
    }

    final source = extractResultList(response);

    final filtered = source.where((item) {
      if (item is! Map) {
        return false;
      }

      final uploader = item['uploader'];
      final uploaderId = (item['uploaderId'] ?? getUserId(uploader)).toString();

      return uploaderId == userId;
    }).toList();

    final safeCurrent = current < 1 ? 1 : current;
    final safePageSize = pageSize < 1 ? 10 : pageSize;

    final start = (safeCurrent - 1) * safePageSize;
    final end = (start + safePageSize).clamp(0, filtered.length).toInt();

    final result = start >= filtered.length
        ? <dynamic>[]
        : filtered.sublist(start, end);

    final pages = filtered.isEmpty
        ? 0
        : (filtered.length / safePageSize).ceil();

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message: response.message,
      data: {
        'meta': {
          'current': safeCurrent,
          'pageSize': safePageSize,
          'pages': pages,
          'total': filtered.length,
        },
        'result': result,
      },
    );
  }

  /*
   * ============================================================
   * ADMIN TRACK APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getAdminTracksApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/admin/tracks/find-all',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> approveTrackApi(String trackId) {
    return _request(
      method: 'PATCH',
      path: '/admin/tracks/${_id(trackId)}/approve',
    );
  }

  Future<ApiResponse<dynamic>> rejectTrackApi({
    required String trackId,
    required String reason,
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/tracks/${_id(trackId)}/reject',
      data: {'reason': reason.trim()},
    );
  }

  Future<ApiResponse<dynamic>> approveTrackLicenseApi(String trackId) {
    return _request(
      method: 'PATCH',
      path: '/admin/tracks/${_id(trackId)}/license/approve',
    );
  }

  Future<ApiResponse<dynamic>> rejectTrackLicenseApi({
    required String trackId,
    required String reason,
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/tracks/${_id(trackId)}/license/reject',
      data: {'reason': reason.trim()},
    );
  }

  Future<ApiResponse<dynamic>> scanTrackCopyrightApi(String trackId) {
    return _request(
      method: 'POST',
      path: '/admin/tracks/${_id(trackId)}/copyright-scan',
    );
  }

  /*
   * ============================================================
   * FILE UPLOAD APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> uploadImageApi(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.uri.pathSegments.isEmpty
            ? 'image'
            : file.uri.pathSegments.last,
      ),
    });

    return _request(
      method: 'POST',
      path: '/uploads/image',
      data: formData,
      options: Options(method: 'POST', contentType: 'multipart/form-data'),
    );
  }

  Future<ApiResponse<dynamic>> uploadTrackFileApi(File file) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        file.path,
        filename: file.uri.pathSegments.isEmpty
            ? 'audio'
            : file.uri.pathSegments.last,
      ),
    });

    return _request(
      method: 'POST',
      path: '/uploads/audio',
      data: formData,
      options: Options(method: 'POST', contentType: 'multipart/form-data'),
    );
  }

  /*
   * ============================================================
   * COMMENT APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getCommentsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/comments',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> createTrackCommentApi({
    required String trackId,
    required String content,
    double? moment,
  }) {
    return _request(
      method: 'POST',
      path: '/tracks/${_id(trackId)}/comments',
      data: _withoutNulls({'content': content.trim(), 'moment': moment}),
    );
  }

  Future<ApiResponse<dynamic>> deleteCommentApi(String commentId) {
    return _request(method: 'DELETE', path: '/comments/${_id(commentId)}');
  }

  /*
   * ============================================================
   * PLAYLIST APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> createEmptyPlaylistApi({
    required String title,
    bool isPublic = true,
  }) {
    return _request(
      method: 'POST',
      path: '/playlists',
      data: {'title': title.trim(), 'isPublic': isPublic},
    );
  }

  Future<ApiResponse<dynamic>> updatePlaylistApi({
    required String playlistId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/playlists/${_id(playlistId)}',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> deletePlaylistApi(String playlistId) {
    return _request(method: 'DELETE', path: '/playlists/${_id(playlistId)}');
  }

  Future<ApiResponse<dynamic>> getPlaylistByIdApi(String playlistId) {
    return _request(method: 'GET', path: '/playlists/${_id(playlistId)}');
  }

  Future<ApiResponse<dynamic>> getPlaylistsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/playlists',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getMyPlaylistsApi() {
    return _request(method: 'GET', path: '/playlists/my-playlists');
  }

  /*
   * WEB COMPATIBILITY FALLBACK.
   * Not a dedicated Backend public-user playlist endpoint.
   */
  Future<ApiResponse<dynamic>> getUserPlaylistsApi(String userId) async {
    return _getFilteredUserPlaylists(userId: userId, albumOnly: false);
  }

  /*
   * WEB COMPATIBILITY FALLBACK.
   * Not a dedicated Backend public-user album endpoint.
   */
  Future<ApiResponse<dynamic>> getUserAlbumsApi(String userId) async {
    return _getFilteredUserPlaylists(userId: userId, albumOnly: true);
  }

  Future<ApiResponse<dynamic>> _getFilteredUserPlaylists({
    required String userId,
    required bool albumOnly,
  }) async {
    final response = await getPlaylistsApi(current: 1, pageSize: 100);

    if (!response.isSuccess) {
      return response;
    }

    final items = extractResultList(response);

    final filtered = items.where((item) {
      if (item is! Map) {
        return false;
      }

      final ownerId = (item['userId'] ?? getUserId(item['user'])).toString();

      final isAlbum = item['isAlbum'] == true;

      return ownerId == userId && isAlbum == albumOnly;
    }).toList();

    return ApiResponse<dynamic>(
      statusCode: response.statusCode,
      message: response.message,
      data: filtered,
    );
  }

  /*
   * ============================================================
   * LIKE APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> likeTrackApi(String trackId) {
    return _request(method: 'POST', path: '/tracks/${_id(trackId)}/like');
  }

  Future<ApiResponse<dynamic>> dislikeTrackApi(String trackId) {
    return _request(method: 'POST', path: '/tracks/${_id(trackId)}/dislike');
  }

  Future<ApiResponse<dynamic>> getLikedTracksApi() {
    return _request(method: 'GET', path: '/tracks/liked');
  }

  /*
   * COMPATIBILITY ALIAS.
   *
   * userId is intentionally ignored because Backend only supports
   * current authenticated user's liked tracks.
   */
  Future<ApiResponse<dynamic>> getUserLikedTracksApi(String userId) {
    return getLikedTracksApi();
  }

  /*
   * ============================================================
   * CATEGORY APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getCategoriesApi({
    int current = 1,
    int pageSize = 100,
  }) {
    return _request(
      method: 'GET',
      path: '/categories',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getAllCategoriesApi() {
    return _request(method: 'GET', path: '/categories/all');
  }

  Future<ApiResponse<dynamic>> getCategoryByIdApi(String categoryId) {
    return _request(method: 'GET', path: '/categories/${_id(categoryId)}');
  }

  Future<ApiResponse<dynamic>> getCategoryBySlugApi(String slug) {
    return _request(method: 'GET', path: '/categories/slug/${_id(slug)}');
  }

  Future<ApiResponse<dynamic>> createCategoryApi(Map<String, dynamic> payload) {
    return _request(method: 'POST', path: '/categories', data: payload);
  }

  Future<ApiResponse<dynamic>> updateCategoryApi({
    required String categoryId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PUT',
      path: '/categories/${_id(categoryId)}',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> deleteCategoryApi(String categoryId) {
    return _request(method: 'DELETE', path: '/categories/${_id(categoryId)}');
  }

  Future<ApiResponse<dynamic>> getTracksByCategoryApi(String categorySlug) {
    return _request(
      method: 'GET',
      path: '/tracks/top',
      queryParameters: {'category': categorySlug},
    );
  }

  /*
   * ============================================================
   * LISTENING / HOME APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> saveListeningProgressApi({
    required String trackId,
    required double position,
    required double duration,
    required bool completed,
    required bool playing,
    String? sessionId,
  }) {
    return _request(
      method: 'POST',
      path: '/tracks/${_id(trackId)}/history',
      data: _withoutNulls({
        'sessionId': sessionId?.trim(),
        'position': position < 0 ? 0 : position,
        'duration': duration < 0 ? 0 : duration,
        'completed': completed,
        'playing': playing,
      }),
    );
  }

  Future<ApiResponse<dynamic>> getHomeListeningHistoryApi({int limit = 10}) {
    return _request(
      method: 'GET',
      path: '/tracks/history/home',
      queryParameters: {'limit': limit.clamp(1, 20)},
    );
  }

  Future<ApiResponse<dynamic>> getBecauseYouListenedApi({int limit = 10}) {
    return _request(
      method: 'GET',
      path: '/tracks/because-you-listened',
      queryParameters: {'limit': limit.clamp(1, 20)},
    );
  }

  Future<ApiResponse<dynamic>> getHiddenGemsApi({
    int limit = 10,
    int maxPlays = 1000,
  }) {
    return _request(
      method: 'GET',
      path: '/tracks/hidden-gems',
      queryParameters: {
        'limit': limit.clamp(1, 20),
        'maxPlays': maxPlays < 0 ? 0 : maxPlays,
      },
    );
  }

  /*
   * ============================================================
   * SUBSCRIPTION APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getSubscriptionPlansApi() {
    return _request(method: 'GET', path: '/subscriptions/plans');
  }

  Future<ApiResponse<dynamic>> getMySubscriptionApi() {
    return _request(method: 'GET', path: '/subscriptions/me');
  }

  Future<ApiResponse<dynamic>> getMySubscriptionUsageApi() {
    return _request(method: 'GET', path: '/subscriptions/me/usage');
  }

  /*
   * NOTE:
   * These methods exist in Web api.ts for API parity.
   * If Backend currently blocks direct paid activation, paid plans must
   * still use verified payment flow instead of relying on this method.
   */
  Future<ApiResponse<dynamic>> subscribePlanApi(String planCode) {
    return _request(
      method: 'POST',
      path: '/subscriptions/subscribe',
      data: {'planCode': planCode.trim().toUpperCase()},
    );
  }

  Future<ApiResponse<dynamic>> changeSubscriptionPlanApi(String planCode) {
    return _request(
      method: 'POST',
      path: '/subscriptions/change-plan',
      data: {'planCode': planCode.trim().toUpperCase()},
    );
  }

  Future<ApiResponse<dynamic>> cancelSubscriptionApi() {
    return _request(method: 'POST', path: '/subscriptions/cancel');
  }

  /*
   * ============================================================
   * ARTIST STUDIO / BENEFITS
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistBenefitsApi() {
    return _request(method: 'GET', path: '/artist-studio/benefits');
  }

  Future<ApiResponse<dynamic>> getArtistStudioStatsApi() {
    return _request(method: 'GET', path: '/artist-studio/stats');
  }

  Future<ApiResponse<dynamic>> getAdminArtistBenefitsApi() {
    return _request(method: 'GET', path: '/admin/artist-benefits');
  }

  Future<ApiResponse<dynamic>> createAdminArtistBenefitApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/admin/artist-benefits',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> updateAdminArtistBenefitApi({
    required String benefitId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PUT',
      path: '/admin/artist-benefits/${_id(benefitId)}',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> toggleAdminArtistBenefitApi(String benefitId) {
    return _request(
      method: 'PATCH',
      path: '/admin/artist-benefits/${_id(benefitId)}/toggle',
    );
  }

  Future<ApiResponse<dynamic>> deleteAdminArtistBenefitApi(String benefitId) {
    return _request(
      method: 'DELETE',
      path: '/admin/artist-benefits/${_id(benefitId)}',
    );
  }

  /*
   * ============================================================
   * NOTIFICATION APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getNotificationsApi({
    int page = 0,
    int size = 20,
    String status = 'all',
  }) {
    return _request(
      method: 'GET',
      path: '/notifications',
      queryParameters: {
        'page': page < 0 ? 0 : page,
        'size': size.clamp(1, 100),
        'status': status,
      },
    );
  }

  Future<ApiResponse<dynamic>> getUnreadNotificationCountApi() {
    return _request(method: 'GET', path: '/notifications/unread-count');
  }

  Future<ApiResponse<dynamic>> markNotificationAsReadApi(
    String notificationId,
  ) {
    return _request(
      method: 'PATCH',
      path: '/notifications/${_id(notificationId)}/read',
    );
  }

  Future<ApiResponse<dynamic>> markAllNotificationsAsReadApi() {
    return _request(method: 'PATCH', path: '/notifications/read-all');
  }

  Future<ApiResponse<dynamic>> deleteNotificationApi(String notificationId) {
    return _request(
      method: 'DELETE',
      path: '/notifications/${_id(notificationId)}',
    );
  }

  Future<ApiResponse<dynamic>> clearReadNotificationsApi() {
    return _request(method: 'DELETE', path: '/notifications/clear-read');
  }

  /*
   * ============================================================
   * ARTIST EARNINGS / WALLET / PAYOUT
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistWalletApi() {
    return _request(method: 'GET', path: '/artist/earnings/wallet');
  }

  Future<ApiResponse<dynamic>> getArtistEarningHistoryApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artist/earnings/history',
      queryParameters: {
        'status': status,
        'current': current,
        'pageSize': pageSize,
      },
    );
  }

  Future<ApiResponse<dynamic>> getArtistEarningSummaryApi() {
    return _request(method: 'GET', path: '/artist/earnings/summary');
  }

  Future<ApiResponse<dynamic>> createArtistPayoutRequestApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/artist/earnings/payouts',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> getArtistPayoutHistoryApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artist/earnings/payouts',
      queryParameters: {
        'status': status,
        'current': current,
        'pageSize': pageSize,
      },
    );
  }

  Future<ApiResponse<dynamic>> cancelArtistPayoutRequestApi(
    String payoutRequestId,
  ) {
    return _request(
      method: 'POST',
      path: '/artist/earnings/payouts/${_id(payoutRequestId)}/cancel',
    );
  }

  Future<ApiResponse<dynamic>> getAdminArtistPayoutsApi({
    String? status,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/admin/artist-payouts',
      queryParameters: {
        'status': status,
        'current': current,
        'pageSize': pageSize,
      },
    );
  }

  Future<ApiResponse<dynamic>> getAdminArtistPayoutDetailApi(
    String payoutRequestId,
  ) {
    return _request(
      method: 'GET',
      path: '/admin/artist-payouts/${_id(payoutRequestId)}',
    );
  }

  Future<ApiResponse<dynamic>> approveAdminArtistPayoutApi({
    required String payoutRequestId,
    Map<String, dynamic> payload = const {},
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/artist-payouts/${_id(payoutRequestId)}/approve',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> rejectAdminArtistPayoutApi({
    required String payoutRequestId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/artist-payouts/${_id(payoutRequestId)}/reject',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> markAdminArtistPayoutPaidApi({
    required String payoutRequestId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/artist-payouts/${_id(payoutRequestId)}/paid',
      data: payload,
    );
  }

  /*
   * ============================================================
   * SUBSCRIPTION VNPAY PAYMENT
   * ============================================================
   */

  Future<ApiResponse<dynamic>> createVnPayPaymentApi(String planCode) {
    return _request(
      method: 'POST',
      path: '/payments/vnpay/create',
      data: {'planCode': planCode.trim().toUpperCase()},
    );
  }

  /*
   * Unified payment detail endpoint.
   *
   * Backend routes by orderCode prefix:
   * - SC...  -> subscription payment
   * - SCM... -> artist membership payment
   * - SCT... -> ticket payment
   */
  Future<ApiResponse<dynamic>> getPaymentApi(String orderCode) {
    return _request(method: 'GET', path: '/payments/${_id(orderCode)}');
  }

  /*
   * ============================================================
   * ADMIN EARNING RATE APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getAdminEarningRatesApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/admin/earning-rates',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getActiveAdminEarningRateApi() {
    return _request(method: 'GET', path: '/admin/earning-rates/active');
  }

  Future<ApiResponse<dynamic>> createAdminEarningRateApi({
    required num amountPerStream,
    String currency = 'VND',
    String? effectiveFrom,
    String? reason,
  }) {
    return _request(
      method: 'POST',
      path: '/admin/earning-rates',
      data: {
        'amountPerStream': amountPerStream,
        'currency': currency,
        'effectiveFrom': effectiveFrom,
        'reason': reason?.trim(),
      },
    );
  }

  /*
   * ============================================================
   * ARTIST MEMBERSHIP PLAN APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistMembershipPlansApi(String artistId) {
    return _request(
      method: 'GET',
      path: '/artists/${_id(artistId)}/membership-plans',
    );
  }

  Future<ApiResponse<dynamic>> getMyArtistMembershipPlansApi() {
    return _request(method: 'GET', path: '/artist/membership-plans');
  }

  Future<ApiResponse<dynamic>> createArtistMembershipPlanApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/artist/membership-plans',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> updateArtistMembershipPlanApi({
    required String planId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/artist/membership-plans/${_id(planId)}',
      data: payload,
    );
  }

  /*
   * ============================================================
   * MEMBERSHIP ACCESS / MY MEMBERSHIPS
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistMembershipAccessApi(String artistId) {
    return _request(
      method: 'GET',
      path: '/artists/${_id(artistId)}/membership/access',
    );
  }

  Future<ApiResponse<dynamic>> getMyArtistMembershipsApi() {
    return _request(method: 'GET', path: '/memberships/me');
  }

  Future<ApiResponse<dynamic>> cancelArtistMembershipApi(
    String subscriptionId,
  ) {
    return _request(
      method: 'PATCH',
      path: '/memberships/${_id(subscriptionId)}/cancel',
    );
  }

  /*
   * ============================================================
   * MEMBERSHIP COMMUNITY FEED
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistMembershipPostsApi({
    required String artistId,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artists/${_id(artistId)}/membership-posts',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getMyArtistMembershipPostsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artist/membership-posts',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> createArtistMembershipPostApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/artist/membership-posts',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> createArtistMembershipImagePostApi({
    required String visibility,
    required File image,
    String? requiredPlanId,
    String? content,
    bool allowComments = true,
    String status = 'PUBLISHED',
  }) async {
    final formData = FormData.fromMap(
      _withoutNulls({
        'visibility': visibility,
        'requiredPlanId': requiredPlanId,
        'content': content?.trim(),
        'allowComments': allowComments.toString(),
        'status': status,
        'image': await MultipartFile.fromFile(
          image.path,
          filename: image.uri.pathSegments.isEmpty
              ? 'membership-image'
              : image.uri.pathSegments.last,
        ),
      }),
    );

    return _request(
      method: 'POST',
      path: '/artist/membership-posts/image',
      data: formData,
      options: Options(method: 'POST', contentType: 'multipart/form-data'),
    );
  }

  Future<ApiResponse<dynamic>> createArtistMembershipPollApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/artist/membership-posts/poll',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> updateArtistMembershipPostApi({
    required String postId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/artist/membership-posts/${_id(postId)}',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> replaceArtistMembershipPostImageApi({
    required String postId,
    required File image,
  }) async {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(
        image.path,
        filename: image.uri.pathSegments.isEmpty
            ? 'membership-image'
            : image.uri.pathSegments.last,
      ),
    });

    return _request(
      method: 'PATCH',
      path: '/artist/membership-posts/${_id(postId)}/image',
      data: formData,
      options: Options(method: 'PATCH', contentType: 'multipart/form-data'),
    );
  }

  Future<ApiResponse<dynamic>> publishArtistMembershipPostApi(String postId) {
    return _request(
      method: 'PATCH',
      path: '/artist/membership-posts/${_id(postId)}/publish',
    );
  }

  Future<ApiResponse<dynamic>> archiveArtistMembershipPostApi(String postId) {
    return _request(
      method: 'PATCH',
      path: '/artist/membership-posts/${_id(postId)}/archive',
    );
  }

  Future<ApiResponse<dynamic>> deleteArtistMembershipPostApi(String postId) {
    return _request(
      method: 'DELETE',
      path: '/artist/membership-posts/${_id(postId)}',
    );
  }

  Future<ApiResponse<dynamic>> getArtistMembershipPollApi(String postId) {
    return _request(
      method: 'GET',
      path: '/membership-posts/${_id(postId)}/poll',
    );
  }

  Future<ApiResponse<dynamic>> voteArtistMembershipPollApi({
    required String postId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'POST',
      path: '/membership-posts/${_id(postId)}/poll/vote',
      data: payload,
    );
  }

  /*
   * ============================================================
   * MEMBERSHIP COMMENT APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getArtistMembershipPostCommentsApi({
    required String postId,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/membership-posts/${_id(postId)}/comments',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getArtistMembershipCommentRepliesApi({
    required String postId,
    required String commentId,
  }) {
    return _request(
      method: 'GET',
      path:
          '/membership-posts/${_id(postId)}/comments/${_id(commentId)}/replies',
    );
  }

  Future<ApiResponse<dynamic>> createArtistMembershipCommentApi({
    required String postId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'POST',
      path: '/membership-posts/${_id(postId)}/comments',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> updateArtistMembershipCommentApi({
    required String postId,
    required String commentId,
    required Map<String, dynamic> payload,
  }) {
    return _request(
      method: 'PATCH',
      path: '/membership-posts/${_id(postId)}/comments/${_id(commentId)}',
      data: payload,
    );
  }

  Future<ApiResponse<dynamic>> deleteArtistMembershipCommentApi({
    required String postId,
    required String commentId,
  }) {
    return _request(
      method: 'DELETE',
      path: '/membership-posts/${_id(postId)}/comments/${_id(commentId)}',
    );
  }

  /*
   * ============================================================
   * MEMBERSHIP PAYMENT APIs
   * ============================================================
   */

  Future<ApiResponse<dynamic>> createArtistMembershipPaymentApi(
    Map<String, dynamic> payload,
  ) {
    return _request(
      method: 'POST',
      path: '/membership-payments/vnpay/create',
      data: payload,
    );
  }

  /*
   * NOTE:
   * Web now uses the UNIFIED payment endpoint, not
   * /membership-payments/{orderCode}.
   */
  Future<ApiResponse<dynamic>> getArtistMembershipPaymentApi(String orderCode) {
    return getPaymentApi(orderCode);
  }

  /*
   * ============================================================
   * ARTIST TICKETING - PUBLIC EVENTS
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getPublicArtistEventsApi({
    required String artistId,
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artists/${_id(artistId)}/events',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getPublicArtistEventApi(String eventId) {
    return _request(method: 'GET', path: '/events/${_id(eventId)}');
  }

  /*
   * ============================================================
   * ARTIST EVENT MANAGEMENT
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getMyArtistEventsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/artist/events',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  /*
   * Multipart fields are copied from current Web api.ts:
   * - eventName
   * - eventType
   * - description?
   * - venueName
   * - venueAddress
   * - eventStartAt
   * - eventEndAt?
   * - saleStartAt
   * - saleEndAt
   * - ticketPrice
   * - totalQuantity
   * - ticketImage
   */
  Future<ApiResponse<dynamic>> createArtistEventApi({
    required String eventName,
    required String eventType,
    String? description,
    required String venueName,
    required String venueAddress,
    required String eventStartAt,
    String? eventEndAt,
    required String saleStartAt,
    required String saleEndAt,
    required num ticketPrice,
    required int totalQuantity,
    required File ticketImage,
  }) async {
    final formData = FormData.fromMap(
      _withoutNulls({
        'eventName': eventName.trim(),
        'eventType': eventType,
        'description': description?.trim(),
        'venueName': venueName.trim(),
        'venueAddress': venueAddress.trim(),
        'eventStartAt': eventStartAt,
        'eventEndAt': eventEndAt,
        'saleStartAt': saleStartAt,
        'saleEndAt': saleEndAt,
        'ticketPrice': ticketPrice.toString(),
        'totalQuantity': totalQuantity.toString(),
        'ticketImage': await MultipartFile.fromFile(
          ticketImage.path,
          filename: ticketImage.uri.pathSegments.isEmpty
              ? 'ticket-image'
              : ticketImage.uri.pathSegments.last,
        ),
      }),
    );

    return _request(
      method: 'POST',
      path: '/artist/events',
      data: formData,
      options: Options(method: 'POST', contentType: 'multipart/form-data'),
    );
  }

  /*
   * ============================================================
   * TICKET PAYMENT
   * ============================================================
   */

  /*
   * MAIN payment method for tickets.
   *
   * Backend:
   * POST /api/v1/ticket-payments/vnpay/create
   *
   * Response should contain an SCT... orderCode and VNPay paymentUrl.
   */
  Future<ApiResponse<dynamic>> createTicketPaymentApi({
    required String eventId,
    required int quantity,
  }) {
    return _request(
      method: 'POST',
      path: '/ticket-payments/vnpay/create',
      data: {'eventId': eventId, 'quantity': quantity},
    );
  }

  /*
   * Uses unified GET /payments/{orderCode}.
   */
  Future<ApiResponse<dynamic>> getTicketPaymentApi(String orderCode) {
    return getPaymentApi(orderCode);
  }

  /*
   * ============================================================
   * USER TICKET COLLECTION
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getMyTicketsApi({
    int current = 1,
    int pageSize = 10,
  }) {
    return _request(
      method: 'GET',
      path: '/tickets/me',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );
  }

  Future<ApiResponse<dynamic>> getMyTicketApi(String ticketId) {
    return _request(method: 'GET', path: '/tickets/${_id(ticketId)}');
  }

  Future<ApiResponse<dynamic>> getMyTicketQrApi(String ticketId) {
    return _request(method: 'GET', path: '/tickets/${_id(ticketId)}/qr');
  }

  /*
   * ============================================================
   * TICKET CHECK-IN
   * ============================================================
   */

  Future<ApiResponse<dynamic>> checkInTicketApi(Map<String, dynamic> payload) {
    return _request(method: 'POST', path: '/tickets/check-in', data: payload);
  }

  /*
   * ============================================================
   * ADMIN TICKET EVENT MODERATION
   * ============================================================
   */

  Future<ApiResponse<dynamic>> getAdminTicketEventsApi({
    int current = 1,
    int pageSize = 10,
    String? approvalStatus,
  }) {
    return _request(
      method: 'GET',
      path: '/admin/ticket-events',
      queryParameters: {
        'current': current,
        'pageSize': pageSize,
        'approvalStatus': approvalStatus,
      },
    );
  }

  Future<ApiResponse<dynamic>> approveArtistTicketEventApi(String eventId) {
    return _request(
      method: 'PATCH',
      path: '/admin/ticket-events/${_id(eventId)}/approve',
    );
  }

  Future<ApiResponse<dynamic>> rejectArtistTicketEventApi({
    required String eventId,
    required String reason,
  }) {
    return _request(
      method: 'PATCH',
      path: '/admin/ticket-events/${_id(eventId)}/reject',
      data: {'reason': reason.trim()},
    );
  }

  /*
   * ============================================================
   * TEST PAYMENT - DEV/LOCAL ONLY
   * ============================================================
   *
   * THIS DOES NOT REPLACE VNPAY.
   *
   * VNPay remains the main payment provider.
   * Test Payment is only an internal alternative for development.
   *
   * Backend must have:
   *
   *   soundclone.payment.test-mode=true
   *
   * Production must use:
   *
   *   soundclone.payment.test-mode=false
   *
   * Current test codes:
   * - SC_TEST_SUCCESS_123456
   * - SC_TEST_FAILED_123456
   * - SC_TEST_CANCEL_123456
   * - SC_TEST_EXPIRED_123456
   *
   * Current Backend implementation was added for SCT ticket payments.
   */
  Future<ApiResponse<dynamic>> completeTestPaymentApi({
    required String orderCode,
    required String testCode,
  }) {
    return _request(
      method: 'POST',
      path: '/payments/test/complete',
      data: {'orderCode': orderCode.trim(), 'testCode': testCode.trim()},
    );
  }
}
