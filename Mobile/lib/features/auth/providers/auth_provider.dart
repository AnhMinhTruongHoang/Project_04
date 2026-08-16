import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/token_storage.dart';
import '../data/auth_service.dart';
import '../models/user_model.dart';

final authProvider =
AsyncNotifierProvider<AuthNotifier, UserModel?>(
  AuthNotifier.new,
);

class AuthNotifier
    extends AsyncNotifier<UserModel?> {
  final AuthService _authService =
  AuthService();

  // ============================================================
  // INITIAL AUTH STATE
  // ============================================================

  @override
  Future<UserModel?> build() async {
    final accessToken =
    await TokenStorage.getAccessToken();

    final refreshToken =
    await TokenStorage.getRefreshToken();

    final hasAccessToken =
        accessToken != null &&
            accessToken.trim().isNotEmpty;

    final hasRefreshToken =
        refreshToken != null &&
            refreshToken.trim().isNotEmpty;

    if (!hasAccessToken &&
        !hasRefreshToken) {
      return null;
    }

    try {
      return await _authService.getAccount();
    } catch (_) {
      await TokenStorage.clearTokens();

      return null;
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();

    try {
      final authResponse =
      await _authService.login(
        email: email.trim().toLowerCase(),
        password: password,
      );

      state = AsyncData(
        authResponse.user,
      );
    } catch (error, stackTrace) {
      state = AsyncError(
        error,
        stackTrace,
      );

      rethrow;
    }
  }

  // ============================================================
  // REGISTER
  // ============================================================

  Future<RegisterResult> register({
    required String name,
    required String email,
    required String password,
  }) async {
    state = const AsyncLoading();

    try {
      final result =
      await _authService.register(
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      );

      // Register chưa phải login.
      // User vẫn là null cho đến khi verify OTP/login.
      state = const AsyncData(null);

      return result;
    } catch (error, stackTrace) {
      state = AsyncError(
        error,
        stackTrace,
      );

      rethrow;
    }
  }

  // ============================================================
  // RELOAD ACCOUNT
  // ============================================================

  Future<void> reloadAccount() async {
    state = const AsyncLoading();

    try {
      final user =
      await _authService.getAccount();

      state = AsyncData(
        user,
      );
    } catch (error, stackTrace) {
      state = AsyncError(
        error,
        stackTrace,
      );

      rethrow;
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout() async {
    try {
      await _authService.logout();
    } finally {
      state = const AsyncData(null);
    }
  }
}