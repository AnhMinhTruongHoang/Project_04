import 'package:google_sign_in/google_sign_in.dart';
import 'package:soundcloud_mobile/core/network/api_exception.dart';
import 'package:soundcloud_mobile/services/google_auth_service.dart';

import '../core/network/api_client.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthService {
  final ApiClient _apiClient;

  AuthService({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.instance;

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final data = responseData['data'];

    if (data is! Map) {
      throw Exception(
        responseData['message']?.toString() ?? 'Đăng nhập thất bại',
      );
    }

    return AuthResponse.fromJson(Map<String, dynamic>.from(data));
  }

  // ==================================================
  // REFRESH TOKEN
  // ==================================================

  Future<AuthResponse> refreshToken({required String refreshToken}) async {
    final response = await _apiClient.post(
      '/auth/refresh',
      data: {'refresh_token': refreshToken},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final data = responseData['data'];

    if (data is! Map) {
      throw Exception(
        responseData['message']?.toString() ?? 'Refresh token thất bại',
      );
    }

    return AuthResponse.fromJson(Map<String, dynamic>.from(data));
  }

  // ==================================================
  // CURRENT USER
  // ==================================================

  Future<UserModel> getCurrentUser() async {
    final response = await _apiClient.get('/auth/account');

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final data = responseData['data'];

    if (data is! Map) {
      throw ApiException(
        message:
            responseData['message']?.toString() ??
            'Không thể lấy thông tin tài khoản',
        statusCode: response.statusCode,
      );
    }

    final userData = data['user'];

    if (userData is! Map) {
      throw ApiException(
        message: 'Không tìm thấy thông tin người dùng',
        statusCode: response.statusCode,
      );
    }

    return UserModel.fromJson(Map<String, dynamic>.from(userData));
  }

  // ==================================================
  // LOGOUT
  // ==================================================

  Future<void> logout() async {
    await _apiClient.post('/auth/logout');
  }

  Future<UserModel> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/auth/register',
      data: {'name': name, 'email': email, 'password': password},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final data = responseData['data'];

    if (data is! Map) {
      throw ApiException(
        message: responseData['message']?.toString() ?? 'Đăng ký thất bại',
        statusCode: response.statusCode,
      );
    }

    return UserModel.fromJson(Map<String, dynamic>.from(data));
  }

  Future<UserModel> verifyOtp({
    required String email,
    required String otp,
  }) async {
    final response = await _apiClient.post(
      '/auth/verify-otp',
      data: {'email': email, 'otp': otp},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final data = responseData['data'];

    if (data is! Map) {
      throw Exception(
        responseData['message']?.toString() ?? 'Xác thực OTP thất bại',
      );
    }

    return UserModel.fromJson(Map<String, dynamic>.from(data));
  }

  Future<void> resendOtp({required String email}) async {
    final response = await _apiClient.post(
      '/auth/resend-otp',
      data: {'email': email},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final status = responseData['status'];

    if (status != null && status != 200) {
      throw Exception(
        responseData['message']?.toString() ?? 'Không thể gửi lại OTP',
      );
    }
  }

  Future<void> forgotPassword({required String email}) async {
    final response = await _apiClient.post(
      '/auth/forgot-password',
      data: {'email': email},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final status = responseData['status'];

    if (status != null && status != 200) {
      throw Exception(
        responseData['message']?.toString() ?? 'Không thể gửi mã OTP',
      );
    }
  }

  Future<void> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final response = await _apiClient.post(
      '/auth/reset-password',
      data: {'email': email, 'otp': otp, 'newPassword': newPassword},
    );

    final responseData = response.data;

    if (responseData is! Map) {
      throw Exception('Dữ liệu trả về không hợp lệ');
    }

    final status = responseData['status'];

    if (status != null && status != 200) {
      throw Exception(
        responseData['message']?.toString() ?? 'Không thể đặt lại mật khẩu',
      );
    }
  }

  // ==================================================
  // GOOGLE LOGIN
  // ==================================================
  Future<AuthResponse> googleLogin() async {
    try {
      final GoogleSignInAccount googleUser = await GoogleAuthService.instance
          .signIn();

      final response = await _apiClient.post(
        '/auth/social-media',
        data: {
          'type': 'GOOGLE',
          'email': googleUser.email,
          'name': googleUser.displayName,
          'avatarUrl': googleUser.photoUrl,
        },
      );

      final responseData = response.data;

      if (responseData is! Map) {
        throw Exception('Dữ liệu Google Login trả về không hợp lệ');
      }

      final data = responseData['data'];

      if (data is! Map) {
        throw ApiException(
          message:
              responseData['message']?.toString() ??
              'Đăng nhập Google thất bại',
          statusCode: response.statusCode,
        );
      }

      return AuthResponse.fromJson(Map<String, dynamic>.from(data));
    } catch (e) {
      rethrow;
    }
  }
}
