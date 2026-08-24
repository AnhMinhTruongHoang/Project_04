class FollowingUserModel {
  final String id;
  final String? username;
  final String name;
  final String? avatarUrl;
  final String? coverUrl;
  final String? bio;
  final String? city;
  final String? country;
  final bool verified;
  final int followers;
  final int following;

  const FollowingUserModel({
    required this.id,
    this.username,
    required this.name,
    this.avatarUrl,
    this.coverUrl,
    this.bio,
    this.city,
    this.country,
    this.verified = false,
    this.followers = 0,
    this.following = 0,
  });

  factory FollowingUserModel.fromJson(Map<String, dynamic> json) {
    return FollowingUserModel(
      id: _string(json['id'] ?? json['_id']),
      username: _nullableString(json['username']),
      name: _string(json['name'] ?? json['username'], fallback: 'Unknown user'),
      avatarUrl: _nullableString(
        json['avatarUrl'] ?? json['avatar'] ?? json['image'],
      ),
      coverUrl: _nullableString(json['coverUrl']),
      bio: _nullableString(json['bio']),
      city: _nullableString(json['city']),
      country: _nullableString(json['country']),
      verified: json['verified'] == true || json['isVerify'] == true,
      followers: _int(json['followers']),
      following: _int(json['following']),
    );
  }

  String get displayUsername {
    final value = username?.trim();

    if (value == null || value.isEmpty) {
      return '';
    }

    return value.startsWith('@') ? value : '@$value';
  }

  String get location {
    final parts = <String>[
      if (city?.trim().isNotEmpty == true) city!.trim(),
      if (country?.trim().isNotEmpty == true) country!.trim(),
    ];

    return parts.join(', ');
  }

  static String _string(dynamic value, {String fallback = ''}) {
    if (value == null) {
      return fallback;
    }

    final text = value.toString().trim();

    return text.isEmpty ? fallback : text;
  }

  static String? _nullableString(dynamic value) {
    if (value == null) {
      return null;
    }

    final text = value.toString().trim();

    return text.isEmpty ? null : text;
  }

  static int _int(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
