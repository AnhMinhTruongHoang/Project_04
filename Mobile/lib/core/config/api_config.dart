class ApiConfig {
  ApiConfig._();

  /*
   * ============================================================
   * SOUNDCLONE MOBILE API CONFIG
   * ============================================================
   *
   * Web:
   * http://localhost:8000
   *
   * Android Emulator:
   * localhost của máy Windows phải dùng 10.0.2.2.
   *
   * Vì vậy:
   * http://10.0.2.2:8000
   */

  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000',
  );

  static const String apiV1 = '$baseUrl/api/v1';

  /*
   * ============================================================
   * TEST PAYMENT
   * ============================================================
   *
   * Chỉ dùng DEV/LOCAL.
   *
   * false ở production.
   *
   * Test Payment KHÔNG thay thế VNPay.
   */
  static const bool paymentTestMode = bool.fromEnvironment(
    'PAYMENT_TEST_MODE',
    defaultValue: true,
  );
}