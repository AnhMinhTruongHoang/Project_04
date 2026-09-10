import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthService {
  // ============================================================
  // LOGIN
  // ============================================================

  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/login',
        data: {'email': email.trim().toLowerCase(), 'password': password},
      );

      final authResponse = AuthResponse.fromApi(response.data);

      await TokenStorage.saveAccessToken(authResponse.accessToken);

      await TokenStorage.saveRefreshToken(authResponse.refreshToken);

      return authResponse;
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on FormatException catch (error) {
      throw AuthException(error.message);
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
    final normalizedEmail = email.trim().toLowerCase();

    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/register',
        data: {
          'name': name.trim(),
          'email': normalizedEmail,
          'password': password,
        },
      );

      final root = _asMapOrEmpty(response.data);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response.statusCode,
      );

      final message = _parseMessage(root['message']);

      final data = _asMapOrEmpty(root['data']);

      if (_isSuccessStatus(statusCode)) {
        final responseEmail = data['email']?.toString().trim().toLowerCase();

        return RegisterResult(
          email: responseEmail != null && responseEmail.isNotEmpty
              ? responseEmail
              : normalizedEmail,
          message: message.isNotEmpty
              ? message
              : 'Registration successful. Please check your email for the verification code.',
        );
      }

      throw AuthRegisterException(
        statusCode: statusCode,
        message: message.isNotEmpty
            ? message
            : 'Registration failed. Please try again.',
        email: data['email']?.toString(),
        requiresVerification: _parseRequiresVerification(
          data: data,
          message: message,
        ),
      );
    } on DioException catch (error) {
      final response = error.response;

      final root = _asMapOrEmpty(response?.data);

      final data = _asMapOrEmpty(root['data']);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response?.statusCode,
      );

      final message = _parseMessage(root['message']);

      throw AuthRegisterException(
        statusCode: statusCode,
        message: message.isNotEmpty ? message : _extractMessage(error),
        email: data['email']?.toString(),
        requiresVerification: _parseRequiresVerification(
          data: data,
          message: message,
        ),
      );
    } on AuthRegisterException {
      rethrow;
    } on FormatException catch (error) {
      throw AuthRegisterException(message: error.message);
    } catch (_) {
      throw const AuthRegisterException(
        message: 'Registration failed. Please try again.',
      );
    }
  }

  // ============================================================
  // VERIFY REGISTER OTP
  // ============================================================

  Future<OtpResult> verifyRegisterOtp({
    required String email,
    required String otp,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();

    final normalizedOtp = otp.trim();

    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/verify-otp',
        data: {'email': normalizedEmail, 'otp': normalizedOtp},
      );

      final root = _asMapOrEmpty(response.data);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response.statusCode,
      );

      final message = _parseMessage(root['message']);

      if (_isSuccessStatus(statusCode)) {
        return OtpResult(
          email: normalizedEmail,
          message: message.isNotEmpty ? message : 'Verify OTP success.',
        );
      }

      throw AuthException(message.isNotEmpty ? message : 'Verify OTP failed.');
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException('Verify OTP failed. Please try again.');
    }
  }

  // ============================================================
  // RESEND REGISTER OTP
  // ============================================================

  Future<OtpResult> resendRegisterOtp({required String email}) async {
    final normalizedEmail = email.trim().toLowerCase();

    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/resend-otp',
        data: {'email': normalizedEmail},
      );

      final root = _asMapOrEmpty(response.data);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response.statusCode,
      );

      final message = _parseMessage(root['message']);

      if (_isSuccessStatus(statusCode)) {
        return OtpResult(
          email: normalizedEmail,
          message: message.isNotEmpty
              ? message
              : 'OTP has been resent to your email.',
        );
      }

      throw AuthException(message.isNotEmpty ? message : 'Resend OTP failed.');
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException('Resend OTP failed. Please try again.');
    }
  }

  // ============================================================
  // FORGOT PASSWORD
  // ============================================================

  Future<ForgotPasswordResult> forgotPassword({required String email}) async {
    final normalizedEmail = email.trim().toLowerCase();

    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/forgot-password',
        data: {'email': normalizedEmail},
      );

      final root = _asMapOrEmpty(response.data);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response.statusCode,
      );

      final message = _parseMessage(root['message']);

      if (_isSuccessStatus(statusCode)) {
        return ForgotPasswordResult(
          email: normalizedEmail,
          message: message.isNotEmpty
              ? message
              : 'OTP has been sent to your email.',
        );
      }

      throw AuthException(
        message.isNotEmpty ? message : 'Send OTP failed. Please try again.',
      );
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException('Send OTP failed. Please try again.');
    }
  }

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  Future<ResetPasswordResult> resetPassword({
    required String email,
    required String otp,
    required String newPassword,
  }) async {
    final normalizedEmail = email.trim().toLowerCase();

    final normalizedOtp = otp.trim();

    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/reset-password',
        data: {
          'email': normalizedEmail,
          'otp': normalizedOtp,
          'newPassword': newPassword,
        },
      );

      final root = _asMapOrEmpty(response.data);

      final statusCode = _parseStatusCode(
        root['statusCode'],
        fallback: response.statusCode,
      );

      final message = _parseMessage(root['message']);

      if (_isSuccessStatus(statusCode)) {
        return ResetPasswordResult(
          email: normalizedEmail,
          message: message.isNotEmpty ? message : 'Reset password success.',
        );
      }

      throw AuthException(
        message.isNotEmpty
            ? message
            : 'Reset password failed. Please try again.',
      );
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on AuthException {
      rethrow;
    } catch (_) {
      throw const AuthException('Reset password failed. Please try again.');
    }
  }

  // ============================================================
  // GET ACCOUNT
  // ============================================================

  Future<UserModel> getAccount() async {
    try {
      final response = await DioClient.instance.get<dynamic>('/auth/account');

      final root = _asMap(response.data);

      final data = _asMap(root['data']);

      final user = _asMap(data['user']);
      final account = UserModel.fromJson(user);
      if (account.id.isEmpty) {
        throw const FormatException('Account is missing an ID.');
      }
      return account;
    } on DioException {
      // Preserve transport/status information for offline session recovery.
      rethrow;
    } on FormatException catch (error) {
      throw AuthException(error.message);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout() async {
    try {
      await DioClient.instance.post<dynamic>('/auth/logout');
    } catch (_) {
      // Dù backend logout lỗi vẫn xóa token local.
    } finally {
      await TokenStorage.clearTokens();
    }
  }

  // ============================================================
  // ERROR MESSAGE
  // ============================================================

  String _extractMessage(DioException error) {
    final responseData = error.response?.data;

    if (responseData is Map) {
      final message = _parseMessage(responseData['message']);

      if (message.isNotEmpty) {
        return message;
      }

      final data = _asMapOrEmpty(responseData['data']);

      final nestedMessage = _parseMessage(data['message']);

      if (nestedMessage.isNotEmpty) {
        return nestedMessage;
      }

      final errorMessage = _parseMessage(responseData['error']);

      if (errorMessage.isNotEmpty) {
        return errorMessage;
      }
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Connection to the server timed out.';
    }

    if (error.type == DioExceptionType.connectionError) {
      return 'Unable to connect to the SoundClone server.';
    }

    if (error.type == DioExceptionType.badCertificate) {
      return 'Unable to establish a secure connection to the server.';
    }

    if (error.type == DioExceptionType.cancel) {
      return 'The request was cancelled.';
    }

    return 'An error occurred while connecting to the server.';
  }
}

// ============================================================
// REGISTER RESULT
// ============================================================

class RegisterResult {
  const RegisterResult({required this.email, required this.message});

  final String email;
  final String message;
}

// ============================================================
// OTP RESULT
// ============================================================

class OtpResult {
  const OtpResult({required this.email, required this.message});

  final String email;
  final String message;
}

// ============================================================
// FORGOT PASSWORD RESULT
// ============================================================

class ForgotPasswordResult {
  const ForgotPasswordResult({required this.email, required this.message});

  final String email;
  final String message;
}

// ============================================================
// RESET PASSWORD RESULT
// ============================================================

class ResetPasswordResult {
  const ResetPasswordResult({required this.email, required this.message});

  final String email;
  final String message;
}

// ============================================================
// AUTH EXCEPTION
// ============================================================

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}

// ============================================================
// REGISTER EXCEPTION
// ============================================================

class AuthRegisterException extends AuthException {
  const AuthRegisterException({
    required String message,
    this.statusCode,
    this.requiresVerification = false,
    this.email,
  }) : super(message);

  final int? statusCode;
  final bool requiresVerification;
  final String? email;
}

// ============================================================
// HELPERS
// ============================================================

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  throw const FormatException('Invalid data returned from the server.');
}

Map<String, dynamic> _asMapOrEmpty(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  return <String, dynamic>{};
}

String _parseMessage(dynamic value) {
  if (value == null) {
    return '';
  }

  if (value is List) {
    return value
        .where((item) => item != null)
        .map((item) => item.toString().trim())
        .where((item) => item.isNotEmpty)
        .join(', ');
  }

  return value.toString().trim();
}

int? _parseStatusCode(dynamic value, {int? fallback}) {
  if (value is int) {
    return value;
  }

  if (value != null) {
    final parsed = int.tryParse(value.toString());

    if (parsed != null) {
      return parsed;
    }
  }

  return fallback;
}

bool _isSuccessStatus(int? statusCode) {
  return statusCode != null && statusCode >= 200 && statusCode < 300;
}

bool _parseRequiresVerification({
  required Map<String, dynamic> data,
  required String message,
}) {
  final value = data['requiresVerification'];

  if (value == true) {
    return true;
  }

  if (value is String && value.toLowerCase() == 'true') {
    return true;
  }

  final lowerMessage = message.toLowerCase();

  return lowerMessage.contains('not been verified') ||
      lowerMessage.contains('not verified') ||
      lowerMessage.contains('verify your email');
}
