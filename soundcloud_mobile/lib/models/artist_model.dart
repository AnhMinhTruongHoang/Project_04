class ArtistModel {
  final String id;
  final String name;
  final String? username;
  final String? avatarUrl;
  final int followers;
  final int following;
  final bool verified;
  final String? type;
  final String? role;

  const ArtistModel({
    required this.id,
    required this.name,
    this.username,
    this.avatarUrl,
    this.followers = 0,
    this.following = 0,
    this.verified = false,
    this.type,
    this.role,
  });

  factory ArtistModel.fromJson(Map<String, dynamic> json) {
    return ArtistModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? json['username'] ?? 'Unknown Artist').toString(),
      username: json['username']?.toString(),
      avatarUrl: json['avatarUrl']?.toString(),
      followers: _toInt(json['followers']),
      following: _toInt(json['following']),
      verified:
      json['verified'] == true ||
          json['isVerify'] == true,
      type: json['type']?.toString(),
      role: json['role']?.toString(),
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}