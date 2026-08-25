import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  // ==========================================================
  // BACKEND
  // ==========================================================

  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:8000',
  );

  /// Android emulator chạy trong một máy ảo riêng, vì vậy `localhost`
  /// trỏ tới emulator chứ không phải máy tính đang chạy Spring Boot.
  /// `10.0.2.2` là địa chỉ đặc biệt để emulator truy cập host machine.
  static final String baseUrl = _resolveBaseUrl(_configuredBaseUrl);

  static final String apiV1 = '$baseUrl/api/v1';



  // ==========================================================
  // AUTH
  // ==========================================================

  static final String auth = '$apiV1/auth';

  static final String login = '$auth/login';

  static final String register = '$auth/register';

  static final String verifyOtp = '$auth/verify-otp';

  static final String resendOtp = '$auth/resend-otp';

  static final String forgotPassword = '$auth/forgot-password';

  static final String resetPassword = '$auth/reset-password';

  // ==========================================================
  // TRACKS
  // ==========================================================

  static final String tracks = '$apiV1/tracks';

  // ==========================================================
  // USERS
  // ==========================================================

  static final String users = '$apiV1/users';

  // ==========================================================
  // PLAYLISTS
  // ==========================================================

  static final String playlists = '$apiV1/playlists';

  // ==========================================================
  // COMMENTS
  // ==========================================================

  static final String comments = '$apiV1/comments';

  // ==========================================================
  // HISTORY
  // ==========================================================

  static final String history = '$apiV1/history';

  // ==========================================================
  // PAYMENTS
  // ==========================================================

  static final String payments = '$apiV1/payments';

  static final String vnpay = '$payments/vnpay';

  static final String vnpayCreate = '$vnpay/create';

  // ==========================================================
  // FRONTEND
  // ==========================================================

  static const String frontendUrl = String.fromEnvironment(
    'FRONTEND_URL',
    defaultValue: 'http://localhost:3000',
  );

  // ==========================================================
  // TEST PAYMENT
  // ==========================================================

  static const bool paymentTestMode = bool.fromEnvironment(
    'PAYMENT_TEST_MODE',
    defaultValue: false,
  );

  // ==========================================================
  // LEGACY MEDIA
  // ==========================================================

  static final String imagesUrl =
      '$baseUrl/uploads/images/';

  static final String audioUrl =
      '$baseUrl/uploads/audio/';

  static String _resolveBaseUrl(String configuredUrl) {
    var url = configuredUrl.trim().replaceFirst(RegExp(r'/+$'), '');

    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      url = url
          .replaceFirst('://localhost', '://10.0.2.2')
          .replaceFirst('://127.0.0.1', '://10.0.2.2');
    }

    return url;
  }
}
