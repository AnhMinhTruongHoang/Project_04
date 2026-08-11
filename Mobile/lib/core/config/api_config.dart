class ApiConfig {
  ApiConfig._();

  // ==========================================================
  // BACKEND
  // ==========================================================

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://soundclone-backend.onrender.com',
  );

  static const String apiV1 = '$baseUrl/api/v1';



  // ==========================================================
  // AUTH
  // ==========================================================

  static const String auth = '$apiV1/auth';

  static const String login = '$auth/login';

  static const String register = '$auth/register';

  static const String verifyOtp = '$auth/verify-otp';

  static const String resendOtp = '$auth/resend-otp';

  static const String forgotPassword = '$auth/forgot-password';

  static const String resetPassword = '$auth/reset-password';

  // ==========================================================
  // TRACKS
  // ==========================================================

  static const String tracks = '$apiV1/tracks';

  // ==========================================================
  // USERS
  // ==========================================================

  static const String users = '$apiV1/users';

  // ==========================================================
  // PLAYLISTS
  // ==========================================================

  static const String playlists = '$apiV1/playlists';

  // ==========================================================
  // COMMENTS
  // ==========================================================

  static const String comments = '$apiV1/comments';

  // ==========================================================
  // HISTORY
  // ==========================================================

  static const String history = '$apiV1/history';

  // ==========================================================
  // PAYMENTS
  // ==========================================================

  static const String payments = '$apiV1/payments';

  static const String vnpay = '$payments/vnpay';

  static const String vnpayCreate = '$vnpay/create';

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

  static const String imagesUrl =
      '$baseUrl/uploads/images/';

  static const String audioUrl =
      '$baseUrl/uploads/audio/';
}