class UserModel {
  final String id;
  final String email;

  final String? username;
  final String? name;
  final String? role;

  final String? address;
  final int? age;
  final String? gender;

  final bool isVerify;
  final String? type;

  final String? avatarUrl;
  final String? coverUrl;

  final int followers;
  final int following;

  final String? bio;
  final String? website;

  final String? city;
  final String? country;

  final bool verified;

  final String? spotlightTrackId;

  final String accountStatus;
  final String? statusReason;

  final DateTime? suspendedUntil;
  final DateTime? statusUpdatedAt;

  final String chatStatus;
  final String? chatBanReason;
  final DateTime? chatStatusUpdatedAt;

  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserModel({
    required this.id,
    required this.email,
    this.username,
    this.name,
    this.role,
    this.address,
    this.age,
    this.gender,
    this.isVerify = false,
    this.type,
    this.avatarUrl,
    this.coverUrl,
    this.followers = 0,
    this.following = 0,
    this.bio,
    this.website,
    this.city,
    this.country,
    this.verified = false,
    this.spotlightTrackId,
    this.accountStatus = 'ACTIVE',
    this.statusReason,
    this.suspendedUntil,
    this.statusUpdatedAt,
    this.chatStatus = 'ACTIVE',
    this.chatBanReason,
    this.chatStatusUpdatedAt,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',

      username: json['username']?.toString(),
      name: json['name']?.toString(),
      role: json['role']?.toString(),

      address: json['address']?.toString(),
      age: _parseInt(json['age']),
      gender: json['gender']?.toString(),

      isVerify: _parseBool(
        json['isVerify'] ?? json['is_verify'],
      ),

      type: json['type']?.toString(),

      avatarUrl: json['avatarUrl']?.toString()
          ?? json['avatar']?.toString()
          ?? json['image']?.toString()
          ?? json['avatar_url']?.toString(),

      coverUrl: json['coverUrl']?.toString()
          ?? json['cover_url']?.toString(),

      followers: _parseInt(json['followers']) ?? 0,
      following: _parseInt(json['following']) ?? 0,

      bio: json['bio']?.toString(),
      website: json['website']?.toString(),

      city: json['city']?.toString(),
      country: json['country']?.toString(),

      verified: _parseBool(json['verified']),

      spotlightTrackId:
      json['spotlightTrackId']?.toString(),

      accountStatus:
      json['accountStatus']?.toString() ?? 'ACTIVE',

      statusReason:
      json['statusReason']?.toString(),

      suspendedUntil:
      _parseDate(json['suspendedUntil']),

      statusUpdatedAt:
      _parseDate(json['statusUpdatedAt']),

      chatStatus:
      json['chatStatus']?.toString() ?? 'ACTIVE',

      chatBanReason:
      json['chatBanReason']?.toString(),

      chatStatusUpdatedAt:
      _parseDate(json['chatStatusUpdatedAt']),

      createdAt:
      _parseDate(json['createdAt']),

      updatedAt:
      _parseDate(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'name': name,
      'role': role,
      'address': address,
      'age': age,
      'gender': gender,
      'isVerify': isVerify,
      'type': type,
      'avatarUrl': avatarUrl,
      'coverUrl': coverUrl,
      'followers': followers,
      'following': following,
      'bio': bio,
      'website': website,
      'city': city,
      'country': country,
      'verified': verified,
      'spotlightTrackId': spotlightTrackId,
      'accountStatus': accountStatus,
      'statusReason': statusReason,
      'suspendedUntil': suspendedUntil?.toIso8601String(),
      'statusUpdatedAt': statusUpdatedAt?.toIso8601String(),
      'chatStatus': chatStatus,
      'chatBanReason': chatBanReason,
      'chatStatusUpdatedAt':
      chatStatusUpdatedAt?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  static int? _parseInt(dynamic value) {
    if (value == null) return null;

    if (value is int) return value;

    return int.tryParse(value.toString());
  }

  static bool _parseBool(dynamic value) {
    if (value == null) return false;

    if (value is bool) return value;

    if (value is num) {
      return value != 0;
    }

    return value.toString().toLowerCase() == 'true';
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) return null;

    return DateTime.tryParse(value.toString());
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? username,
    String? name,
    String? role,
    String? address,
    int? age,
    String? gender,
    bool? isVerify,
    String? type,
    String? avatarUrl,
    String? coverUrl,
    int? followers,
    int? following,
    String? bio,
    String? website,
    String? city,
    String? country,
    bool? verified,
    String? spotlightTrackId,
    String? accountStatus,
    String? statusReason,
    DateTime? suspendedUntil,
    DateTime? statusUpdatedAt,
    String? chatStatus,
    String? chatBanReason,
    DateTime? chatStatusUpdatedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      username: username ?? this.username,
      name: name ?? this.name,
      role: role ?? this.role,
      address: address ?? this.address,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      isVerify: isVerify ?? this.isVerify,
      type: type ?? this.type,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coverUrl: coverUrl ?? this.coverUrl,
      followers: followers ?? this.followers,
      following: following ?? this.following,
      bio: bio ?? this.bio,
      website: website ?? this.website,
      city: city ?? this.city,
      country: country ?? this.country,
      verified: verified ?? this.verified,
      spotlightTrackId:
      spotlightTrackId ?? this.spotlightTrackId,
      accountStatus:
      accountStatus ?? this.accountStatus,
      statusReason:
      statusReason ?? this.statusReason,
      suspendedUntil:
      suspendedUntil ?? this.suspendedUntil,
      statusUpdatedAt:
      statusUpdatedAt ?? this.statusUpdatedAt,
      chatStatus:
      chatStatus ?? this.chatStatus,
      chatBanReason:
      chatBanReason ?? this.chatBanReason,
      chatStatusUpdatedAt:
      chatStatusUpdatedAt ?? this.chatStatusUpdatedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}