class UserModel {
  const UserModel({
    required this.id,
    required this.email,
    required this.name,
    required this.role,
    this.username,
    this.age,
    this.gender,
    this.isVerify = false,
    this.type,
    this.avatarUrl,
    this.followers = 0,
    this.following = 0,
    this.coverUrl,
    this.bio,
    this.website,
    this.city,
    this.country,
    this.verified = false,
    this.spotlightTrackId,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String email;
  final String name;
  final String role;

  final String? username;
  final int? age;
  final String? gender;
  final bool isVerify;
  final String? type;
  final String? avatarUrl;
  final int followers;
  final int following;
  final String? coverUrl;
  final String? bio;
  final String? website;
  final String? city;
  final String? country;
  final bool verified;
  final String? spotlightTrackId;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final email = _stringValue(json['email']);

    return UserModel(
      id: _stringValue(json['id'] ?? json['_id']),
      email: email,
      name: _nullableString(json['name']) ?? email,
      role: _nullableString(json['role']) ?? 'USER',
      username: _nullableString(json['username']),
      age: _nullableInt(json['age']),
      gender: _nullableString(json['gender']),
      isVerify: _boolValue(json['isVerify']),
      type: _nullableString(json['type']),
      avatarUrl: _nullableString(
        json['avatarUrl'] ?? json['avatar'] ?? json['image'],
      ),
      followers: _nullableInt(json['followers']) ?? 0,
      following: _nullableInt(json['following']) ?? 0,
      coverUrl: _nullableString(json['coverUrl']),
      bio: _nullableString(json['bio']),
      website: _nullableString(json['website']),
      city: _nullableString(json['city']),
      country: _nullableString(json['country']),
      verified: _boolValue(json['verified']),
      spotlightTrackId: _nullableString(json['spotlightTrackId']),
      createdAt: _nullableDateTime(json['createdAt']),
      updatedAt: _nullableDateTime(json['updatedAt']),
    );
  }
}

String _stringValue(dynamic value) {
  return value?.toString() ?? '';
}

String? _nullableString(dynamic value) {
  final text = value?.toString().trim();

  if (text == null || text.isEmpty || text == 'null') {
    return null;
  }

  return text;
}

int? _nullableInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '');
}

bool _boolValue(dynamic value) {
  if (value is bool) {
    return value;
  }

  if (value is num) {
    return value != 0;
  }

  return value?.toString().toLowerCase() == 'true';
}

DateTime? _nullableDateTime(dynamic value) {
  final text = _nullableString(value);

  if (text == null) {
    return null;
  }

  return DateTime.tryParse(text);
}
