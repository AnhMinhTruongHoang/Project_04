class AppConstants {
  AppConstants._();

  // ==============================
  // SERVER
  // ==============================

  static const String serverUrl =
      'http://localhost:8000';

  // ==============================
  // API
  // ==============================

  static const String baseUrl =
      '$serverUrl/api/v1';

  // ==============================
  // MEDIA
  // ==============================

  static const String imageUrl =
      '$serverUrl/uploads/images/';

  static const String audioUrl =
      '$serverUrl/uploads/audio/';

  // ==============================
  // Storage
  // ==============================

  static const String accessTokenKey =
      'access_token';

  static const String refreshTokenKey =
      'refresh_token';

  static const String userKey =
      'current_user';

  // ==============================
  // App
  // ==============================

  static const String appName =
      'SoundApp';
}