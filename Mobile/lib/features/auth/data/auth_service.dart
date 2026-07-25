import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/auth_response.dart';
import '../models/user_model.dart';

class AuthService {
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await DioClient.instance.post<dynamic>(
        '/auth/login',
        data: {'email': email.trim(), 'password': password},
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

  Future<UserModel> getAccount() async {
    try {
      final response = await DioClient.instance.get<dynamic>('/auth/account');

      final root = _asMap(response.data);
      final data = _asMap(root['data']);
      final user = _asMap(data['user']);

      return UserModel.fromJson(user);
    } on DioException catch (error) {
      throw AuthException(_extractMessage(error));
    } on FormatException catch (error) {
      throw AuthException(error.message);
    }
  }

  Future<void> logout() async {
    try {
      await DioClient.instance.post<dynamic>('/auth/logout');
    } catch (_) {
      // Vẫn đăng xuất local nếu backend không phản hồi.
    } finally {
      await TokenStorage.clearTokens();
    }
  }

  String _extractMessage(DioException error) {
    final responseData = error.response?.data;

    if (responseData is Map) {
      final message = responseData['message'];

      if (message != null && message.toString().trim().isNotEmpty) {
        return message.toString();
      }
    }

    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Kết nối đến máy chủ quá thời gian.';
    }

    if (error.type == DioExceptionType.connectionError) {
      return 'Không thể kết nối đến máy chủ SoundClone.';
    }

    return 'Đã xảy ra lỗi khi kết nối đến máy chủ.';
  }
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;

  @override
  String toString() => message;
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  throw const FormatException('Dữ liệu trả về từ máy chủ không hợp lệ.');
}
