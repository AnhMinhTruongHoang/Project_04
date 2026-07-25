import 'user_model.dart';

class AuthResponse {
  const AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  final String accessToken;
  final String refreshToken;
  final UserModel user;

  factory AuthResponse.fromApi(dynamic json) {
    final root = _asMap(json);
    final data = _asMap(root['data']);

    final accessToken = _readString(
      data['access_token'] ?? data['accessToken'],
    );

    final refreshToken = _readString(
      data['refresh_token'] ?? data['refreshToken'],
    );

    if (accessToken.isEmpty || refreshToken.isEmpty) {
      throw const FormatException(
        'Login response does not contain valid tokens.',
      );
    }

    return AuthResponse(
      accessToken: accessToken,
      refreshToken: refreshToken,
      user: UserModel.fromJson(_asMap(data['user'])),
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) {
    return value;
  }

  if (value is Map) {
    return Map<String, dynamic>.from(value);
  }

  throw const FormatException('Invalid API response format.');
}

String _readString(dynamic value) {
  return value?.toString().trim() ?? '';
}
