import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  static const String productionUrl =
      'https://soundclone-backend.onrender.com';

  static const String localWebUrl =
      'http://localhost:8000';

  static const String localAndroidEmulatorUrl =
      'http://10.0.2.2:8000';

  // Đổi IP này thành IPv4 của máy Windows
  static const String localPhoneUrl =
      'http://192.168.1.100:8000';

  static String get baseUrl {
    // Nếu build production thì dùng Render
    const bool production = bool.fromEnvironment(
      'PRODUCTION',
      defaultValue: false,
    );

    if (production) {
      return productionUrl;
    }

    // Flutter Web
    if (kIsWeb) {
      return localWebUrl;
    }

    // Android Emulator
    if (defaultTargetPlatform == TargetPlatform.android) {
      return localAndroidEmulatorUrl;
    }

    return localWebUrl;
  }

  static String get apiV1 => '$baseUrl/api/v1';

  // AUTH
  static String get auth => '$apiV1/auth';

  static String get login => '$auth/login';
  static String get register => '$auth/register';
  static String get verifyOtp => '$auth/verify-otp';
  static String get resendOtp => '$auth/resend-otp';
  static String get forgotPassword => '$auth/forgot-password';
  static String get resetPassword => '$auth/reset-password';

  // TRACKS
  static String get tracks => '$apiV1/tracks';

  // USERS
  static String get users => '$apiV1/users';

  // PLAYLISTS
  static String get playlists => '$apiV1/playlists';

  // COMMENTS
  static String get comments => '$apiV1/comments';

  // HISTORY
  static String get history => '$apiV1/history';

  // PAYMENTS
  static String get payments => '$apiV1/payments';
  static String get vnpay => '$payments/vnpay';
  static String get vnpayCreate => '$vnpay/create';
  static String get vnpayReturn => '$vnpay/return';

  // TEST PAYMENT
  static const bool paymentTestMode = bool.fromEnvironment(
    'PAYMENT_TEST_MODE',
    defaultValue: true,
  );
}