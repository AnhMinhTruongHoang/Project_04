import 'dart:async';
import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/token_storage.dart';
import '../data/auth_service.dart';
import '../models/user_model.dart';

final authProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(
  AuthNotifier.new,
);

class AuthNotifier extends AsyncNotifier<UserModel?> {
  final AuthService _authService = AuthService();
  int _generation = 0;

  Future<void> _remember(UserModel user) async {
    if (user.id.isNotEmpty) {
      await TokenStorage.saveOfflineAccount(jsonEncode(user.toJson()));
    }
  }

  Future<void> _refreshCachedAccount(int generation) async {
    try {
      final user = await _authService.getAccount();
      if (!ref.mounted || generation != _generation) return;
      await _remember(user);
      if (ref.mounted && generation == _generation) state = AsyncData(user);
    } on DioException catch (error) {
      if (!ref.mounted || generation != _generation) return;
      if (error.response?.statusCode == 401 ||
          error.response?.statusCode == 403) {
        await TokenStorage.clearTokens();
        if (ref.mounted && generation == _generation) {
          state = const AsyncData(null);
        }
      }
      // Transport/server failure leaves the locally remembered account usable.
    } catch (_) {
      // A malformed refresh must not prevent local playback.
    }
  }

  // ============================================================
  // INITIAL AUTH STATE
  // ============================================================

  @override
  Future<UserModel?> build() async {
    final generation = ++_generation;
    final accessToken = await TokenStorage.getAccessToken();
    final refreshToken = await TokenStorage.getRefreshToken();

    final hasAccessToken = accessToken != null && accessToken.trim().isNotEmpty;

    final hasRefreshToken =
        refreshToken != null && refreshToken.trim().isNotEmpty;

    if (!hasAccessToken && !hasRefreshToken) {
      return null;
    }

    final cached = await TokenStorage.getOfflineAccount();
    if (cached != null) {
      try {
        final user = UserModel.fromJson(
          jsonDecode(cached) as Map<String, dynamic>,
        );
        if (user.id.isNotEmpty) {
          // Open the local library immediately, validating API access in background.
          Timer.run(() {
            if (ref.mounted && generation == _generation) {
              unawaited(_refreshCachedAccount(generation));
            }
          });
          return user;
        }
      } on FormatException {
        /* Fetch a fresh account below. */
      } on TypeError {
        /* Fetch a fresh account below. */
      }
    }

    try {
      final user = await _authService.getAccount();
      await _remember(user);
      return user;
    } on DioException catch (error) {
      if (error.response?.statusCode == 401 ||
          error.response?.statusCode == 403) {
        await TokenStorage.clearTokens();
      }
      return null;
    }
  }

  // ============================================================
  // LOGIN
  // ============================================================

  Future<void> login({required String email, required String password}) async {
    ++_generation;
    state = const AsyncLoading();

    try {
      final authResponse = await _authService.login(
        email: email.trim().toLowerCase(),
        password: password,
      );

      await _remember(authResponse.user);
      state = AsyncData(authResponse.user);
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);

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
      final result = await _authService.register(
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password,
      );

      // Register chưa phải login.
      // User vẫn là null cho đến khi verify OTP/login.
      state = const AsyncData(null);

      return result;
    } catch (error, stackTrace) {
      state = AsyncError(error, stackTrace);

      rethrow;
    }
  }

  // ============================================================
  // RELOAD ACCOUNT
  // ============================================================

  Future<void> reloadAccount() async {
    final generation = ++_generation;
    final previous = state;

    try {
      final user = await _authService.getAccount();
      if (!ref.mounted || generation != _generation) return;
      await _remember(user);
      state = AsyncData(user);
    } on DioException catch (error, stackTrace) {
      if (!ref.mounted || generation != _generation) return;
      if (error.response?.statusCode == 401 ||
          error.response?.statusCode == 403) {
        await TokenStorage.clearTokens();
        if (ref.mounted && generation == _generation) {
          state = const AsyncData(null);
        }
      } else {
        state = previous.hasValue ? previous : AsyncError(error, stackTrace);
      }
    } catch (error, stackTrace) {
      if (!ref.mounted || generation != _generation) return;
      state = previous.hasValue ? previous : AsyncError(error, stackTrace);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout() async {
    ++_generation;
    state = const AsyncData(null);
    try {
      await _authService.logout();
    } finally {
      state = const AsyncData(null);
    }
  }
}
