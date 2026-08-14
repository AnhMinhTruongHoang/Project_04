import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/app_constants.dart';

class StorageService {
  StorageService._();

  static final StorageService instance = StorageService._();

  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // ==============================
  // Access Token
  // ==============================

  Future<void> saveAccessToken(String token) async {
    await _storage.write(
      key: AppConstants.accessTokenKey,
      value: token,
    );
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(
      key: AppConstants.accessTokenKey,
    );
  }

  // ==============================
  // Refresh Token
  // ==============================

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(
      key: AppConstants.refreshTokenKey,
      value: token,
    );
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(
      key: AppConstants.refreshTokenKey,
    );
  }

  // ==============================
  // Delete token
  // ==============================

  Future<void> clearTokens() async {
    await _storage.delete(
      key: AppConstants.accessTokenKey,
    );

    await _storage.delete(
      key: AppConstants.refreshTokenKey,
    );
  }

  // ==============================
  // Clear all
  // ==============================

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}