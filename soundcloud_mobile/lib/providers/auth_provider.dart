import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../core/storage/storage_service.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService;

  AuthProvider({AuthService? authService})
    : _authService = authService ?? AuthService();

  // ==============================
  // State
  // ==============================

  UserModel? _currentUser;

  bool _isLoading = false;
  bool _isAuthenticated = false;

  String? _errorMessage;

  // ==============================
  // Getters
  // ==============================

  UserModel? get currentUser => _currentUser;

  bool get isLoading => _isLoading;

  bool get isAuthenticated => _isAuthenticated;

  String? get errorMessage => _errorMessage;

  // ==============================
  // Login
  // ==============================

  Future<bool> login({required String email, required String password}) async {
    _setLoading(true);
    _clearError();

    try {
      final authResponse = await _authService.login(
        email: email,
        password: password,
      );

      // Lưu access token
      await StorageService.instance.saveAccessToken(authResponse.accessToken);

      // Lưu refresh token
      await StorageService.instance.saveRefreshToken(authResponse.refreshToken);

      // Lưu user vào state
      _currentUser = authResponse.user;

      _isAuthenticated = true;

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _isAuthenticated = false;

      return false;
    } catch (e) {
      _errorMessage = 'Đã xảy ra lỗi không xác định';
      _isAuthenticated = false;

      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Login google
  // ==============================

  Future<bool> googleLogin() async {
    _setLoading(true);
    _clearError();

    try {
      final authResponse = await _authService.googleLogin();

      await StorageService.instance.saveAccessToken(authResponse.accessToken);

      await StorageService.instance.saveRefreshToken(authResponse.refreshToken);

      _currentUser = authResponse.user;

      _isAuthenticated = true;

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      _isAuthenticated = false;

      return false;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');

      _isAuthenticated = false;

      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Check authentication
  // ==============================

  Future<bool> checkAuth() async {
    _setLoading(true);
    _clearError();

    try {
      final accessToken = await StorageService.instance.getAccessToken();

      if (accessToken == null || accessToken.isEmpty) {
        _isAuthenticated = false;
        _currentUser = null;

        return false;
      }

      final user = await _authService.getCurrentUser();

      _currentUser = user;
      _isAuthenticated = true;

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;

      await StorageService.instance.clearTokens();

      _currentUser = null;
      _isAuthenticated = false;

      return false;
    } catch (e) {
      _errorMessage = 'Không thể kiểm tra phiên đăng nhập';

      _currentUser = null;
      _isAuthenticated = false;

      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Refresh Token
  // ==============================

  Future<bool> refreshToken() async {
    try {
      final refreshToken = await StorageService.instance.getRefreshToken();

      if (refreshToken == null || refreshToken.isEmpty) {
        return false;
      }

      final authResponse = await _authService.refreshToken(
        refreshToken: refreshToken,
      );

      await StorageService.instance.saveAccessToken(authResponse.accessToken);

      await StorageService.instance.saveRefreshToken(authResponse.refreshToken);

      _currentUser = authResponse.user;
      _isAuthenticated = true;

      notifyListeners();

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;

      await logout();

      return false;
    } catch (e) {
      _errorMessage = 'Không thể làm mới phiên đăng nhập';

      await logout();

      return false;
    }
  }

  // ==============================
  // Logout
  // ==============================

  Future<void> logout() async {
    try {
      if (_isAuthenticated) {
        await _authService.logout();
      }
    } catch (_) {
      // Dù API logout lỗi,
      // vẫn phải xóa token local.
    } finally {
      await StorageService.instance.clearTokens();

      _currentUser = null;
      _isAuthenticated = false;

      notifyListeners();
    }
  }

  // ==============================
  // Clear error
  // ==============================

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // ==============================
  // Private helpers
  // ==============================

  void _clearError() {
    _errorMessage = null;
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      final user = await _authService.register(
        name: name,
        email: email,
        password: password,
      );

      _currentUser = user;

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (e) {
      _errorMessage = 'Đã xảy ra lỗi không xác định';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Verify OTP
  // ==============================

  Future<bool> verifyOtp({required String email, required String otp}) async {
    _setLoading(true);
    _clearError();

    try {
      final user = await _authService.verifyOtp(email: email, otp: otp);

      _currentUser = user;

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (e) {
      _errorMessage = 'Không thể xác thực OTP';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Resend OTP
  // ==============================

  Future<bool> resendOtp({required String email}) async {
    _setLoading(true);
    _clearError();

    try {
      await _authService.resendOtp(email: email);

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (e) {
      _errorMessage = 'Không thể gửi lại mã OTP';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Forgot Password
  // ==============================

  Future<bool> forgotPassword({required String email}) async {
    _setLoading(true);
    _clearError();

    try {
      await _authService.forgotPassword(email: email);

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (e) {
      _errorMessage = 'Không thể gửi mã OTP';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // ==============================
  // Reset Password
  // ==============================

  Future<bool> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      await _authService.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPassword,
      );

      return true;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (e) {
      _errorMessage = 'Không thể đặt lại mật khẩu';
      return false;
    } finally {
      _setLoading(false);
    }
  }
}
