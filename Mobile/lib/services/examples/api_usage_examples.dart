import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:soundclone_mobile/services/api/api_service.dart';

/*
 * ============================================================
 * SOUNDCLONE MOBILE - API USAGE EXAMPLES
 * ============================================================
 *
 * SOURCE:
 * - Flutter ApiService mirrors current Web src/utils/api.ts.
 *
 * PURPOSE:
 * - Show how each Flutter screen/repository can call ApiService.
 * - This file is documentation/example code, not UI state management.
 *
 * IMPORTANT ARCHITECTURE NOTE:
 *
 * Widget
 *   -> Controller / Provider / Repository
 *   -> ApiService
 *   -> DioClient
 *   -> Spring Boot Backend
 *
 * Do NOT create a separate Dio instance inside each screen.
 *
 * ============================================================
 * IMPORTANT WEB -> MOBILE DIFFERENCES
 * ============================================================
 *
 * [1] Next.js /api/revalidate
 *     -> WEB ONLY.
 *     -> Flutter does NOT call it.
 *
 * [2] getTracksByUserApi / getUserPlaylistsApi / getUserAlbumsApi
 *     -> Current Web compatibility fallbacks.
 *     -> Backend does not currently provide dedicated public endpoints.
 *     -> Flutter ApiService keeps equivalent helpers but marks them clearly.
 *
 * [3] Payment
 *     -> VNPay remains the main provider.
 *     -> Test Payment is DEV ONLY and does not replace VNPay.
 *
 * [4] Payment status
 *     -> Use unified:
 *
 *        GET /api/v1/payments/{orderCode}
 *
 *     -> Prefix routing:
 *        SC...  = Subscription
 *        SCM... = Membership
 *        SCT... = Ticket
 *
 * [5] Token
 *     -> DioClient automatically adds Bearer token and refreshes once on 401.
 *     -> UI should not manually attach Authorization headers.
 */

class ApiUsageExamples {
  ApiUsageExamples._();

  static final ApiService api = ApiService.instance;

  /*
   * ============================================================
   * COMMON RESPONSE HANDLER
   * ============================================================
   */

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

  static Future<ApiResponse<dynamic>> loginExample({
    required String email,
    required String password,
  }) async {
    final response = await api.loginApi(email: email, password: password);

    printResponse('LOGIN', response);

    if (response.isSuccess) {
      debugPrint('Login successful.');

      /*
       * ApiService saves access/refresh token automatically.
       * DioClient reads token from secure storage for later requests.
       */
      debugPrint('Access token loaded: ${api.accessToken != null}');
    }

    return response;
  }

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

    return response;
  }

  static Future<ApiResponse<dynamic>> verifyOtpExample({
    required String email,
    required String otp,
  }) async {
    final response = await api.verifyRegisterOtpApi(email: email, otp: otp);

    printResponse('VERIFY OTP', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> resendOtpExample({
    required String email,
  }) async {
    final response = await api.resendRegisterOtpApi(email: email);

    printResponse('RESEND OTP', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> forgotPasswordExample({
    required String email,
  }) async {
    final response = await api.forgotPasswordApi(email: email);

    printResponse('FORGOT PASSWORD', response);

    return response;
  }

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

  static Future<ApiResponse<dynamic>> getAccountExample() async {
    final response = await api.getAccountApi();

    printResponse('GET ACCOUNT', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> logoutExample() async {
    final response = await api.logoutApi();

    printResponse('LOGOUT', response);

    return response;
  }

  /*
   * ============================================================
   * PROFILE / USER EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getUserByIdExample({
    required String userId,
  }) async {
    final response = await api.getUserByIdApi(userId);

    printResponse('GET USER BY ID', response);

    return response;
  }

  /*
   * PATCH /users/me is PARTIAL.
   *
   * name is NOT required.
   * This allows avatar-only or cover-only updates.
   */
  static Future<ApiResponse<dynamic>> updateMyProfileExample({
    String? name,
    String? bio,
    String? website,
    String? avatarUrl,
    String? coverUrl,
    String? city,
    String? country,
  }) async {
    final response = await api.updateMyProfileApi(
      name: name,
      bio: bio,
      website: website,
      avatarUrl: avatarUrl,
      coverUrl: coverUrl,
      city: city,
      country: country,
    );

    printResponse('UPDATE MY PROFILE', response);

    return response;
  }

  /*
   * Example:
   * Upload image first, then PATCH only avatarUrl.
   */
  static Future<ApiResponse<dynamic>> uploadAndUpdateAvatarExample({
    required File avatarFile,
  }) async {
    final uploadResponse = await api.uploadImageApi(avatarFile);

    printResponse('UPLOAD AVATAR', uploadResponse);

    if (!uploadResponse.isSuccess) {
      return uploadResponse;
    }

    final data = uploadResponse.data;

    String? avatarUrl;

    if (data is Map) {
      avatarUrl =
          data['url']?.toString() ??
          data['path']?.toString() ??
          data['fileUrl']?.toString() ??
          data['filePath']?.toString();
    }

    if (avatarUrl == null || avatarUrl.trim().isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 400,
        message: 'Cannot resolve uploaded avatar URL.',
        error: 'INVALID_UPLOAD_RESPONSE',
      );
    }

    final updateResponse = await api.updateMyProfileApi(avatarUrl: avatarUrl);

    printResponse('UPDATE PROFILE AVATAR', updateResponse);

    return updateResponse;
  }

  /*
   * Same flow for cover image.
   */
  static Future<ApiResponse<dynamic>> uploadAndUpdateCoverExample({
    required File coverFile,
  }) async {
    final uploadResponse = await api.uploadImageApi(coverFile);

    if (!uploadResponse.isSuccess) {
      return uploadResponse;
    }

    final data = uploadResponse.data;

    String? coverUrl;

    if (data is Map) {
      coverUrl =
          data['url']?.toString() ??
          data['path']?.toString() ??
          data['fileUrl']?.toString() ??
          data['filePath']?.toString();
    }

    if (coverUrl == null || coverUrl.trim().isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 400,
        message: 'Cannot resolve uploaded cover URL.',
        error: 'INVALID_UPLOAD_RESPONSE',
      );
    }

    final response = await api.updateMyProfileApi(coverUrl: coverUrl);

    printResponse('UPDATE PROFILE COVER', response);

    return response;
  }

  /*
   * ============================================================
   * FOLLOW EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> followUserExample({
    required String userId,
  }) async {
    final response = await api.followUserApi(userId);

    printResponse('FOLLOW USER', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> unfollowUserExample({
    required String userId,
  }) async {
    final response = await api.unfollowUserApi(userId);

    printResponse('UNFOLLOW USER', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getFollowStatusExample({
    required String userId,
  }) async {
    final response = await api.getFollowStatusApi(userId);

    printResponse('FOLLOW STATUS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getMyFollowingExample() async {
    final response = await api.getMyFollowingApi();

    printResponse('GET MY FOLLOWING', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getMyFollowersExample() async {
    final response = await api.getMyFollowersApi();

    printResponse('GET MY FOLLOWERS', response);

    return response;
  }

  /*
   * ============================================================
   * TRACK EXAMPLES
   * ============================================================
   */

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
    }

    return response;
  }

  static Future<ApiResponse<dynamic>> getAllTracksExample() async {
    final response = await api.getAllTracksApi();

    printResponse('GET ALL TRACKS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getTrackDetailExample({
    required String trackId,
  }) async {
    final response = await api.getTrackByIdApi(trackId);

    printResponse('GET TRACK DETAIL', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> searchTrackExample({
    required String keyword,
  }) async {
    final response = await api.searchTracksApi(keyword);

    printResponse('SEARCH TRACK', response);

    return response;
  }

  /*
   * WEB COMPATIBILITY EXAMPLE.
   *
   * This currently downloads public tracks and filters by uploaderId
   * locally because Backend does not expose /users/{userId}/tracks.
   *
   * Do NOT treat this as a dedicated Backend endpoint.
   */
  static Future<ApiResponse<dynamic>> getArtistTracksCompatibilityExample({
    required String artistId,
  }) async {
    final response = await api.getTracksByUserApi(
      userId: artistId,
      current: 1,
      pageSize: 20,
    );

    printResponse('GET ARTIST TRACKS - COMPATIBILITY', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> createTrackExample({
    required String title,
    required File audioFile,
    File? imageFile,
    String? description,
    String? categoryId,
  }) async {
    final files = <String, File>{
      /*
       * IMPORTANT:
       * Keep these multipart keys synchronized with TrackController.
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

    fields.removeWhere((_, value) {
      return value == null || (value is String && value.trim().isEmpty);
    });

    final response = await api.createTrackApi(fields: fields, files: files);

    printResponse('CREATE TRACK', response);

    return response;
  }

  /*
   * ============================================================
   * LIKE / COMMENT EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> likeTrackExample({
    required String trackId,
  }) async {
    final response = await api.likeTrackApi(trackId);

    printResponse('LIKE TRACK', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> dislikeTrackExample({
    required String trackId,
  }) async {
    final response = await api.dislikeTrackApi(trackId);

    printResponse('DISLIKE TRACK', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getLikedTracksExample() async {
    final response = await api.getLikedTracksApi();

    printResponse('GET LIKED TRACKS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getTrackCommentsExample({
    required String trackId,
  }) async {
    final response = await api.getTrackCommentsApi(trackId);

    printResponse('GET TRACK COMMENTS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> createCommentExample({
    required String trackId,
    required String content,
    double? moment,
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
      moment: moment,
    );

    printResponse('CREATE COMMENT', response);

    return response;
  }

  /*
   * ============================================================
   * PLAYLIST EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getMyPlaylistsExample() async {
    final response = await api.getMyPlaylistsApi();

    printResponse('GET MY PLAYLISTS', response);

    return response;
  }

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

  static Future<ApiResponse<dynamic>> getListeningHistoryExample() async {
    final response = await api.getHomeListeningHistoryApi(limit: 10);

    printResponse('GET LISTENING HISTORY', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getBecauseYouListenedExample() async {
    final response = await api.getBecauseYouListenedApi(limit: 10);

    printResponse('GET BECAUSE YOU LISTENED', response);

    return response;
  }

  /*
   * ============================================================
   * NOTIFICATION EXAMPLES
   * ============================================================
   */

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

  static Future<ApiResponse<dynamic>> getUnreadCountExample() async {
    final response = await api.getUnreadNotificationCountApi();

    printResponse('GET UNREAD NOTIFICATION COUNT', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> readNotificationExample({
    required String notificationId,
  }) async {
    final response = await api.markNotificationAsReadApi(notificationId);

    printResponse('READ NOTIFICATION', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> readAllNotificationsExample() async {
    final response = await api.markAllNotificationsAsReadApi();

    printResponse('READ ALL NOTIFICATIONS', response);

    return response;
  }

  /*
   * ============================================================
   * SUBSCRIPTION + VNPAY EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getSubscriptionPlansExample() async {
    final response = await api.getSubscriptionPlansApi();

    printResponse('GET SUBSCRIPTION PLANS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getMySubscriptionExample() async {
    final response = await api.getMySubscriptionApi();

    printResponse('GET MY SUBSCRIPTION', response);

    return response;
  }

  /*
   * MAIN paid subscription payment flow.
   */
  static Future<ApiResponse<dynamic>> createVnPaySubscriptionExample({
    required String planCode,
  }) async {
    final response = await api.createVnPayPaymentApi(planCode);

    printResponse('CREATE SUBSCRIPTION VNPAY', response);

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map;

      final paymentUrl =
          data['paymentUrl']?.toString() ?? data['url']?.toString();

      final orderCode = data['orderCode']?.toString();

      debugPrint('Order code: $orderCode');
      debugPrint('VNPay URL: $paymentUrl');

      /*
       * Mobile next step:
       * Open paymentUrl using url_launcher/webview/external browser.
       *
       * After return/deep-link:
       * GET /payments/{orderCode}
       */
    }

    return response;
  }

  /*
   * Unified payment status example.
   *
   * Works for:
   * SC...
   * SCM...
   * SCT...
   */
  static Future<ApiResponse<dynamic>> getPaymentStatusExample({
    required String orderCode,
  }) async {
    final response = await api.getPaymentApi(orderCode);

    printResponse('GET PAYMENT STATUS', response);

    return response;
  }

  /*
   * ============================================================
   * ARTIST STUDIO / EARNINGS EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getArtistStudioStatsExample() async {
    final response = await api.getArtistStudioStatsApi();

    printResponse('GET ARTIST STUDIO STATS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getArtistBenefitsExample() async {
    final response = await api.getArtistBenefitsApi();

    printResponse('GET ARTIST BENEFITS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getArtistWalletExample() async {
    final response = await api.getArtistWalletApi();

    printResponse('GET ARTIST WALLET', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getArtistEarningsExample() async {
    final response = await api.getArtistEarningHistoryApi(
      current: 1,
      pageSize: 10,
    );

    printResponse('GET ARTIST EARNINGS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getArtistEarningSummaryExample() async {
    final response = await api.getArtistEarningSummaryApi();

    printResponse('GET ARTIST EARNING SUMMARY', response);

    return response;
  }

  /*
   * ============================================================
   * ARTIST MEMBERSHIP EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getArtistMembershipPlansExample({
    required String artistId,
  }) async {
    final response = await api.getArtistMembershipPlansApi(artistId);

    printResponse('GET ARTIST MEMBERSHIP PLANS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getMembershipAccessExample({
    required String artistId,
  }) async {
    final response = await api.getArtistMembershipAccessApi(artistId);

    printResponse('GET MEMBERSHIP ACCESS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getMembershipFeedExample({
    required String artistId,
    int current = 1,
    int pageSize = 10,
  }) async {
    final response = await api.getArtistMembershipPostsApi(
      artistId: artistId,
      current: current,
      pageSize: pageSize,
    );

    printResponse('GET MEMBERSHIP FEED', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> createMembershipTextPostExample({
    required String visibility,
    required String content,
    String? requiredPlanId,
  }) async {
    final response = await api.createArtistMembershipPostApi({
      'visibility': visibility,
      'content': content.trim(),
      if (requiredPlanId != null) 'requiredPlanId': requiredPlanId,
      'allowComments': true,
      'status': 'PUBLISHED',
    });

    printResponse('CREATE MEMBERSHIP TEXT POST', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> createMembershipImagePostExample({
    required String visibility,
    required File image,
    String? content,
    String? requiredPlanId,
  }) async {
    final response = await api.createArtistMembershipImagePostApi(
      visibility: visibility,
      image: image,
      content: content,
      requiredPlanId: requiredPlanId,
      allowComments: true,
      status: 'PUBLISHED',
    );

    printResponse('CREATE MEMBERSHIP IMAGE POST', response);

    return response;
  }

  /*
   * Membership purchase via VNPay.
   *
   * The exact payload fields must follow the current Backend DTO.
   * Web sends an ICreateArtistMembershipPaymentPayload.
   */
  static Future<ApiResponse<dynamic>> createMembershipPaymentExample({
    required String artistId,
    required String planId,
  }) async {
    final response = await api.createArtistMembershipPaymentApi({
      'artistId': artistId,
      'planId': planId,
    });

    printResponse('CREATE MEMBERSHIP VNPAY PAYMENT', response);

    return response;
  }

  /*
   * Membership payment status uses unified /payments/{orderCode}.
   */
  static Future<ApiResponse<dynamic>> getMembershipPaymentExample({
    required String orderCode,
  }) async {
    final response = await api.getArtistMembershipPaymentApi(orderCode);

    printResponse('GET MEMBERSHIP PAYMENT', response);

    return response;
  }

  /*
   * ============================================================
   * ARTIST EVENT / TICKETING EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getPublicArtistEventsExample({
    required String artistId,
  }) async {
    final response = await api.getPublicArtistEventsApi(
      artistId: artistId,
      current: 1,
      pageSize: 20,
    );

    printResponse('GET PUBLIC ARTIST EVENTS', response);

    return response;
  }

  /*
   * ARTIST_PRO creates an event.
   * Backend performs the real permission check.
   *
   * ticketImage is multipart.
   */
  static Future<ApiResponse<dynamic>> createArtistEventExample({
    required String eventName,
    required String eventType,
    required String venueName,
    required String venueAddress,
    required String eventStartAt,
    required String saleStartAt,
    required String saleEndAt,
    required num ticketPrice,
    required int totalQuantity,
    required File ticketImage,
    String? description,
    String? eventEndAt,
  }) async {
    final response = await api.createArtistEventApi(
      eventName: eventName,
      eventType: eventType,
      description: description,
      venueName: venueName,
      venueAddress: venueAddress,
      eventStartAt: eventStartAt,
      eventEndAt: eventEndAt,
      saleStartAt: saleStartAt,
      saleEndAt: saleEndAt,
      ticketPrice: ticketPrice,
      totalQuantity: totalQuantity,
      ticketImage: ticketImage,
    );

    printResponse('CREATE ARTIST EVENT', response);

    return response;
  }

  /*
   * ============================================================
   * TICKET PURCHASE - MAIN VNPAY FLOW
   * ============================================================
   *
   * VNPay remains the normal payment method.
   *
   * Flow:
   *
   * 1. POST /ticket-payments/vnpay/create
   * 2. Backend reserves ticket quantity
   * 3. Response returns:
   *      orderCode = SCT...
   *      paymentUrl = VNPay URL
   * 4. Open VNPay
   * 5. VNPay return/IPN
   * 6. GET /payments/{SCT...}
   * 7. PAID -> ticket fulfillment already executed by Backend
   * 8. GET /tickets/me
   */
  static Future<ApiResponse<dynamic>> createTicketVnPayPaymentExample({
    required String eventId,
    int quantity = 1,
  }) async {
    final response = await api.createTicketPaymentApi(
      eventId: eventId,
      quantity: quantity,
    );

    printResponse('CREATE TICKET VNPAY PAYMENT', response);

    if (response.isSuccess && response.data is Map) {
      final data = response.data as Map;

      debugPrint('Ticket order: ${data['orderCode']}');

      debugPrint('VNPay URL: ${data['paymentUrl']}');
    }

    return response;
  }

  /*
   * ============================================================
   * TEST PAYMENT - DEV ONLY
   * ============================================================
   *
   * IMPORTANT:
   * Test Payment DOES NOT replace VNPay.
   *
   * It is a second development-only way to confirm an SCT ticket order
   * without depending on VNPay Sandbox.
   *
   * Backend must have:
   *
   *   soundclone.payment.test-mode=true
   *
   * Production:
   *
   *   soundclone.payment.test-mode=false
   *
   * Recommended mobile UI:
   *
   * [ Continue to VNPay ]  <- normal
   * [ Test Payment ]       <- only visible in dev
   */
  static Future<ApiResponse<dynamic>> completeTicketTestPaymentExample({
    required String orderCode,
    String testCode = 'SC_TEST_SUCCESS_123456',
  }) async {
    final response = await api.completeTestPaymentApi(
      orderCode: orderCode,
      testCode: testCode,
    );

    printResponse('COMPLETE TEST TICKET PAYMENT', response);

    /*
     * On SUCCESS:
     * navigate directly to current user's Ticket Collection.
     *
     * Mobile route example:
     * /profile/<currentUserId>?tab=Tickets
     *
     * Do NOT navigate there for FAILED/CANCELED/EXPIRED.
     */
    return response;
  }

  /*
   * Full DEV ticket flow:
   *
   * createTicketPaymentApi()
   * -> SCT order + reservation
   * -> completeTestPaymentApi()
   * -> Backend calls real TicketFulfillmentService
   * -> getMyTicketsApi()
   */
  static Future<ApiResponse<dynamic>> ticketDevHappyPathExample({
    required String eventId,
    int quantity = 1,
  }) async {
    final createResponse = await api.createTicketPaymentApi(
      eventId: eventId,
      quantity: quantity,
    );

    printResponse('1. CREATE TICKET ORDER', createResponse);

    if (!createResponse.isSuccess || createResponse.data is! Map) {
      return createResponse;
    }

    final data = createResponse.data as Map;

    final orderCode = data['orderCode']?.toString() ?? '';

    if (orderCode.isEmpty) {
      return const ApiResponse<dynamic>(
        statusCode: 400,
        message: 'Ticket orderCode is missing.',
        error: 'INVALID_TICKET_PAYMENT_RESPONSE',
      );
    }

    final payResponse = await api.completeTestPaymentApi(
      orderCode: orderCode,
      testCode: 'SC_TEST_SUCCESS_123456',
    );

    printResponse('2. COMPLETE TEST PAYMENT', payResponse);

    if (!payResponse.isSuccess) {
      return payResponse;
    }

    final ticketsResponse = await api.getMyTicketsApi(current: 1, pageSize: 50);

    printResponse('3. GET MY TICKETS', ticketsResponse);

    return ticketsResponse;
  }

  /*
   * ============================================================
   * TICKET COLLECTION / QR / CHECK-IN
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getMyTicketsExample() async {
    final response = await api.getMyTicketsApi(current: 1, pageSize: 50);

    printResponse('GET MY TICKETS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> getTicketQrExample({
    required String ticketId,
  }) async {
    final response = await api.getMyTicketQrApi(ticketId);

    printResponse('GET TICKET QR', response);

    return response;
  }

  /*
   * QR scanner should read the qrValue/token and send the exact payload
   * expected by Backend ICheckInTicketPayload.
   *
   * Current common form:
   * {
   *   "qrValue": "<signed token>"
   * }
   *
   * If your Backend DTO uses "qrToken" instead, use that exact field.
   */
  static Future<ApiResponse<dynamic>> checkInTicketExample({
    required String qrValue,
  }) async {
    final response = await api.checkInTicketApi({'qrValue': qrValue});

    printResponse('CHECK IN TICKET', response);

    return response;
  }

  /*
   * ============================================================
   * ADMIN TICKET MODERATION EXAMPLES
   * ============================================================
   */

  static Future<ApiResponse<dynamic>> getPendingTicketEventsExample() async {
    final response = await api.getAdminTicketEventsApi(
      current: 1,
      pageSize: 20,
      approvalStatus: 'PENDING_REVIEW',
    );

    printResponse('ADMIN GET PENDING TICKET EVENTS', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> approveTicketEventExample({
    required String eventId,
  }) async {
    final response = await api.approveArtistTicketEventApi(eventId);

    printResponse('ADMIN APPROVE TICKET EVENT', response);

    return response;
  }

  static Future<ApiResponse<dynamic>> rejectTicketEventExample({
    required String eventId,
    required String reason,
  }) async {
    final response = await api.rejectArtistTicketEventApi(
      eventId: eventId,
      reason: reason,
    );

    printResponse('ADMIN REJECT TICKET EVENT', response);

    return response;
  }

  /*
   * ============================================================
   * FINAL MOBILE INTEGRATION NOTE
   * ============================================================
   *
   * Before building a screen:
   *
   * 1. Find the matching method in ApiService.
   * 2. Confirm payload field names with current Backend DTO/controller.
   * 3. Call ApiService from repository/provider/controller.
   * 4. UI handles:
   *      loading
   *      empty
   *      success
   *      error
   * 5. Do not duplicate API URLs inside widgets.
   *
   * For payment:
   *
   * VNPay:
   *   create -> open URL -> deep-link/return -> GET payment -> refresh UI
   *
   * Test Ticket Payment:
   *   create SCT -> test complete -> GET tickets -> open Tickets tab
   *
   * Test mode is DEV ONLY.
   */
}
