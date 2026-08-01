import 'dart:io';

import 'package:flutter/foundation.dart';

import '../services/api_service.dart';

/*
 * ============================================================
 * SOUNDCLONE MOBILE - API USAGE EXAMPLES
 * ============================================================
 *
 * File này dùng để tham khảo cách gọi ApiService.
 *
 * Không bắt buộc phải gọi trực tiếp toàn bộ class này trong UI.
 * Khi làm từng màn hình, copy phần API tương ứng vào:
 *
 * - LoginScreen
 * - RegisterScreen
 * - HomeScreen
 * - ProfileScreen
 * - TrackDetailScreen
 * - PlaylistScreen
 * - ArtistStudioScreen
 *
 * ApiService đã quản lý:
 *
 * - Base URL
 * - Access token
 * - Refresh token
 * - Authorization header
 * - Auto refresh token khi gặp 401
 * - Parse response
 * - Upload multipart
 */

class ApiUsageExamples {
  ApiUsageExamples._();

  static final ApiService api = ApiService.instance;

  /*
   * ============================================================
   * COMMON RESPONSE HANDLER
   * ============================================================
   */

  /// Hàm hỗ trợ in kết quả API khi development.
  static void printResponse(String apiName, ApiResponse<dynamic> response) {
    debugPrint('========== $apiName ==========');

    debugPrint('Status: ${response.statusCode}');

    debugPrint('Message: ${response.message}');

    debugPrint('Data: ${response.data}');

    debugPrint('Error: ${response.error}');

    debugPrint('Success: ${response.isSuccess}');

    debugPrint('==============================');
  }

  /*
   * ============================================================
   * AUTH EXAMPLES
   * ============================================================
   */

  /// Đăng nhập bằng email và mật khẩu.
  ///
  /// Khi đăng nhập thành công, ApiService tự lưu:
  ///
  /// - access_token
  /// - refresh_token
  static Future<ApiResponse<dynamic>> loginExample({
    required String email,
    required String password,
  }) async {
    final response = await api.loginApi(email: email, password: password);

    printResponse('LOGIN', response);

    if (response.isSuccess) {
      debugPrint('Login successful.');

      debugPrint('Access token: ${api.accessToken}');
    } else if (response.isUnauthorized) {
      debugPrint('Email or password is incorrect.');
    } else {
      debugPrint(response.message);
    }

    return response;
  }

  /// Đăng ký tài khoản local mới.
  ///
  /// Backend sẽ gửi OTP về email sau khi đăng ký thành công.
  static Future<ApiResponse<dynamic>> registerExample({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await api.registerApi(
      name: name,
      email: email,
      password: password,
    );

    printResponse('REGISTER', response);

    if (response.statusCode == 201) {
      debugPrint('Registration successful. Open OTP screen.');
    } else if (response.isConflict) {
      final data = response.data;

      debugPrint('Email already exists.');

      debugPrint('Conflict data: $data');
    }

    return response;
  }

  /// Xác thực OTP đăng ký.
  static Future<ApiResponse<dynamic>> verifyOtpExample({
    required String email,
    required String otp,
  }) async {
    final response = await api.verifyRegisterOtpApi(email: email, otp: otp);

    printResponse('VERIFY OTP', response);

    if (response.isSuccess) {
      debugPrint('Account verified successfully.');
    }

    return response;
  }

  /// Gửi lại OTP đăng ký.
  static Future<ApiResponse<dynamic>> resendOtpExample({
    required String email,
  }) async {
    final response = await api.resendRegisterOtpApi(email: email);

    printResponse('RESEND OTP', response);

    return response;
  }

  /// Gửi OTP quên mật khẩu.
  static Future<ApiResponse<dynamic>> forgotPasswordExample({
    required String email,
  }) async {
    final response = await api.forgotPasswordApi(email: email);

    printResponse('FORGOT PASSWORD', response);

    return response;
  }

  /// Đặt lại mật khẩu bằng OTP.
  static Future<ApiResponse<dynamic>> resetPasswordExample({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await api.resetPasswordApi(
      email: email,
      otp: otp,
      newPassword: newPassword,
    );

    printResponse('RESET PASSWORD', response);

    return response;
  }

  /// Lấy tài khoản hiện đang đăng nhập.
  static Future<ApiResponse<dynamic>> getAccountExample() async {
    final response = await api.getAccountApi();

    printResponse('GET ACCOUNT', response);

    if (response.isSuccess) {
      final data = response.data;

      debugPrint('Account data: $data');
    }

    return response;
  }

  /// Đăng xuất và xóa token trên thiết bị.
  static Future<ApiResponse<dynamic>> logoutExample() async {
    final response = await api.logoutApi();

    printResponse('LOGOUT', response);

    debugPrint('Access token after logout: ${api.accessToken}');

    return response;
  }

  /*
   * ============================================================
   * PROFILE EXAMPLES
   * ============================================================
   */

  /// Lấy thông tin user theo ID.
  static Future<ApiResponse<dynamic>> getUserByIdExample({
    required String userId,
  }) async {
    final response = await api.getUserByIdApi(userId);

    printResponse('GET USER BY ID', response);

    return response;
  }

  /// User tự cập nhật profile của mình.
  ///
  /// Backend nhận user hiện tại từ access token,
  /// vì vậy không cần truyền userId.
  static Future<ApiResponse<dynamic>> updateMyProfileExample({
    required String name,
    String? bio,
    String? website,
    String? avatarUrl,
    String? coverUrl,
  }) async {
    final response = await api.updateMyProfileApi(
      name: name,
      bio: bio,
      website: website,
      avatarUrl: avatarUrl,
      coverUrl: coverUrl,
    );

    printResponse('UPDATE MY PROFILE', response);

    if (response.isSuccess) {
      debugPrint('Profile updated successfully.');
    } else if (response.isForbidden) {
      debugPrint('Account is not allowed to update this profile.');
    }

    return response;
  }

  /// Upload avatar rồi cập nhật profile.
  static Future<ApiResponse<dynamic>> uploadAndUpdateAvatarExample({
    required File avatarFile,
    required String currentName,
    String? currentBio,
    String? currentWebsite,
  }) async {
    /*
     * Bước 1:
     * Upload file ảnh.
     */
    final uploadResponse = await api.uploadImageApi(avatarFile);

    printResponse('UPLOAD AVATAR', uploadResponse);

    if (!uploadResponse.isSuccess) {
      return uploadResponse;
    }

    /*
     * Bước 2:
     * Lấy URL ảnh từ response upload.
     */
    final uploadData = uploadResponse.data;

    String? avatarUrl;

    if (uploadData is Map) {
      avatarUrl =
          uploadData['url']?.toString() ??
          uploadData['path']?.toString() ??
          uploadData['fileUrl']?.toString() ??
          uploadData['filePath']?.toString();
    }

    if (avatarUrl == null || avatarUrl.trim().isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 400,
        message: 'Cannot resolve uploaded avatar URL.',
        error: 'INVALID_UPLOAD_RESPONSE',
      );
    }

    /*
     * Bước 3:
     * Lưu URL ảnh mới vào profile user.
     */
    final updateResponse = await api.updateMyProfileApi(
      name: currentName,
      bio: currentBio,
      website: currentWebsite,
      avatarUrl: avatarUrl,
    );

    printResponse('UPDATE PROFILE AVATAR', updateResponse);

    return updateResponse;
  }

  /*
   * ============================================================
   * TRACK EXAMPLES
   * ============================================================
   */

  /// Lấy danh sách track có phân trang.
  static Future<ApiResponse<dynamic>> getTracksExample({
    int current = 1,
    int pageSize = 10,
  }) async {
    final response = await api.getTracksApi(
      current: current,
      pageSize: pageSize,
    );

    printResponse('GET TRACKS', response);

    if (response.isSuccess) {
      final tracks = api.extractResultList(response);

      debugPrint('Track count: ${tracks.length}');

      for (final track in tracks) {
        debugPrint('Track: $track');
      }
    }

    return response;
  }

  /// Lấy toàn bộ track approved/public.
  static Future<ApiResponse<dynamic>> getAllTracksExample() async {
    final response = await api.getAllTracksApi();

    printResponse('GET ALL TRACKS', response);

    return response;
  }

  /// Lấy chi tiết track theo ID.
  static Future<ApiResponse<dynamic>> getTrackDetailExample({
    required String trackId,
  }) async {
    final response = await api.getTrackByIdApi(trackId);

    printResponse('GET TRACK DETAIL', response);

    return response;
  }

  /// Tìm kiếm track theo từ khóa.
  static Future<ApiResponse<dynamic>> searchTrackExample({
    required String keyword,
  }) async {
    final response = await api.searchTracksApi(keyword);

    printResponse('SEARCH TRACK', response);

    return response;
  }

  /// Like một track.
  static Future<ApiResponse<dynamic>> likeTrackExample({
    required String trackId,
  }) async {
    final response = await api.likeTrackApi(trackId);

    printResponse('LIKE TRACK', response);

    return response;
  }

  /// Bỏ like hoặc dislike track.
  static Future<ApiResponse<dynamic>> dislikeTrackExample({
    required String trackId,
  }) async {
    final response = await api.dislikeTrackApi(trackId);

    printResponse('DISLIKE TRACK', response);

    return response;
  }

  /// Lấy danh sách track current user đã like.
  static Future<ApiResponse<dynamic>> getLikedTracksExample() async {
    final response = await api.getLikedTracksApi();

    printResponse('GET LIKED TRACKS', response);

    return response;
  }

  /// Lấy track do current user upload.
  static Future<ApiResponse<dynamic>> getMyTracksExample() async {
    final response = await api.getMyTracksApi();

    printResponse('GET MY TRACKS', response);

    return response;
  }

  /// Tạo track mới bằng audio, ảnh và metadata.
  static Future<ApiResponse<dynamic>> createTrackExample({
    required String title,
    required File audioFile,
    File? imageFile,
    String? description,
    String? categoryId,
  }) async {
    final files = <String, File>{
      /*
       * Tên field phải đúng với MultipartFile
       * mà TrackController Backend đang nhận.
       */
      'audioFile': audioFile,
    };

    if (imageFile != null) {
      files['imageFile'] = imageFile;
    }

    final fields = <String, dynamic>{
      'title': title.trim(),
      'description': description?.trim(),
      'categoryId': categoryId?.trim(),
    };

    fields.removeWhere((_, value) => value == null);

    final response = await api.createTrackApi(fields: fields, files: files);

    printResponse('CREATE TRACK', response);

    return response;
  }

  /*
   * ============================================================
   * FOLLOW EXAMPLES
   * ============================================================
   */

  /// Follow một user.
  static Future<ApiResponse<dynamic>> followUserExample({
    required String userId,
  }) async {
    final response = await api.followUserApi(userId);

    printResponse('FOLLOW USER', response);

    return response;
  }

  /// Bỏ follow một user.
  static Future<ApiResponse<dynamic>> unfollowUserExample({
    required String userId,
  }) async {
    final response = await api.unfollowUserApi(userId);

    printResponse('UNFOLLOW USER', response);

    return response;
  }

  /// Kiểm tra đã follow user hay chưa.
  static Future<ApiResponse<dynamic>> getFollowStatusExample({
    required String userId,
  }) async {
    final response = await api.getFollowStatusApi(userId);

    printResponse('GET FOLLOW STATUS', response);

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map;

      final isFollowing = data['following'] ?? data['isFollowing'] ?? false;

      debugPrint('Following: $isFollowing');
    }

    return response;
  }

  /// Lấy danh sách user current user đang follow.
  static Future<ApiResponse<dynamic>> getMyFollowingExample() async {
    final response = await api.getMyFollowingApi();

    printResponse('GET MY FOLLOWING', response);

    return response;
  }

  /*
   * ============================================================
   * COMMENT EXAMPLES
   * ============================================================
   */

  /// Lấy comment của một track.
  static Future<ApiResponse<dynamic>> getTrackCommentsExample({
    required String trackId,
  }) async {
    final response = await api.getTrackCommentsApi(trackId);

    printResponse('GET TRACK COMMENTS', response);

    return response;
  }

  /// Tạo comment cho một track.
  static Future<ApiResponse<dynamic>> createCommentExample({
    required String trackId,
    required String content,
  }) async {
    if (content.trim().isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 400,
        message: 'Comment content is required.',
        error: 'INVALID_COMMENT_CONTENT',
      );
    }

    final response = await api.createTrackCommentApi(
      trackId: trackId,
      content: content,
    );

    printResponse('CREATE COMMENT', response);

    return response;
  }

  /// Xóa comment theo ID.
  static Future<ApiResponse<dynamic>> deleteCommentExample({
    required String commentId,
  }) async {
    final response = await api.deleteCommentApi(commentId);

    printResponse('DELETE COMMENT', response);

    return response;
  }

  /*
   * ============================================================
   * PLAYLIST EXAMPLES
   * ============================================================
   */

  /// Lấy playlist của current user.
  static Future<ApiResponse<dynamic>> getMyPlaylistsExample() async {
    final response = await api.getMyPlaylistsApi();

    printResponse('GET MY PLAYLISTS', response);

    return response;
  }

  /// Tạo playlist rỗng.
  static Future<ApiResponse<dynamic>> createPlaylistExample({
    required String title,
    bool isPublic = true,
  }) async {
    final response = await api.createEmptyPlaylistApi(
      title: title,
      isPublic: isPublic,
    );

    printResponse('CREATE PLAYLIST', response);

    return response;
  }

  /// Cập nhật playlist.
  static Future<ApiResponse<dynamic>> updatePlaylistExample({
    required String playlistId,
    required String title,
    required bool isPublic,
  }) async {
    final response = await api.updatePlaylistApi(
      playlistId: playlistId,
      payload: {'title': title.trim(), 'isPublic': isPublic},
    );

    printResponse('UPDATE PLAYLIST', response);

    return response;
  }

  /// Xóa playlist.
  static Future<ApiResponse<dynamic>> deletePlaylistExample({
    required String playlistId,
  }) async {
    final response = await api.deletePlaylistApi(playlistId);

    printResponse('DELETE PLAYLIST', response);

    return response;
  }

  /*
   * ============================================================
   * LISTENING HISTORY EXAMPLES
   * ============================================================
   */

  /// Lưu tiến độ nghe track.
  static Future<ApiResponse<dynamic>> saveListeningProgressExample({
    required String trackId,
    required double position,
    required double duration,
    required bool playing,
    bool completed = false,
    String? sessionId,
  }) async {
    final response = await api.saveListeningProgressApi(
      trackId: trackId,
      position: position,
      duration: duration,
      playing: playing,
      completed: completed,
      sessionId: sessionId,
    );

    printResponse('SAVE LISTENING PROGRESS', response);

    return response;
  }

  /// Lấy lịch sử nghe ở trang Home.
  static Future<ApiResponse<dynamic>> getListeningHistoryExample() async {
    final response = await api.getHomeListeningHistoryApi(limit: 10);

    printResponse('GET LISTENING HISTORY', response);

    return response;
  }

  /*
   * ============================================================
   * NOTIFICATION EXAMPLES
   * ============================================================
   */

  /// Lấy notification của current user.
  static Future<ApiResponse<dynamic>> getNotificationsExample({
    int page = 0,
    int size = 20,
    String status = 'all',
  }) async {
    final response = await api.getNotificationsApi(
      page: page,
      size: size,
      status: status,
    );

    printResponse('GET NOTIFICATIONS', response);

    return response;
  }

  /// Lấy số notification chưa đọc.
  static Future<ApiResponse<dynamic>> getUnreadCountExample() async {
    final response = await api.getUnreadNotificationCountApi();

    printResponse('GET UNREAD NOTIFICATION COUNT', response);

    return response;
  }

  /// Đánh dấu notification đã đọc.
  static Future<ApiResponse<dynamic>> readNotificationExample({
    required String notificationId,
  }) async {
    final response = await api.markNotificationAsReadApi(notificationId);

    printResponse('READ NOTIFICATION', response);

    return response;
  }

  /*
   * ============================================================
   * SUBSCRIPTION & PAYMENT EXAMPLES
   * ============================================================
   */

  /// Lấy danh sách gói subscription.
  static Future<ApiResponse<dynamic>> getSubscriptionPlansExample() async {
    final response = await api.getSubscriptionPlansApi();

    printResponse('GET SUBSCRIPTION PLANS', response);

    return response;
  }

  /// Lấy subscription hiện tại.
  static Future<ApiResponse<dynamic>> getMySubscriptionExample() async {
    final response = await api.getMySubscriptionApi();

    printResponse('GET MY SUBSCRIPTION', response);

    return response;
  }

  /// Tạo URL thanh toán VNPay.
  static Future<ApiResponse<dynamic>> createVnPayPaymentExample({
    required String planCode,
  }) async {
    final response = await api.createVnPayPaymentApi(planCode);

    printResponse('CREATE VNPAY PAYMENT', response);

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map;

      final paymentUrl =
          data['paymentUrl']?.toString() ?? data['url']?.toString();

      debugPrint('VNPay URL: $paymentUrl');
    }

    return response;
  }

  /*
   * ============================================================
   * ARTIST STUDIO EXAMPLES
   * ============================================================
   */

  /// Lấy thống kê Artist Studio.
  static Future<ApiResponse<dynamic>> getArtistStudioStatsExample() async {
    final response = await api.getArtistStudioStatsApi();

    printResponse('GET ARTIST STUDIO STATS', response);

    return response;
  }

  /// Lấy số dư ví artist.
  static Future<ApiResponse<dynamic>> getArtistWalletExample() async {
    final response = await api.getArtistWalletApi();

    printResponse('GET ARTIST WALLET', response);

    return response;
  }

  /// Lấy lịch sử earnings.
  static Future<ApiResponse<dynamic>> getArtistEarningsExample() async {
    final response = await api.getArtistEarningHistoryApi(
      current: 1,
      pageSize: 10,
    );

    printResponse('GET ARTIST EARNINGS', response);

    return response;
  }
}
