class TrackModel {
  final String id;
  final String title;
  final String? slug;
  final String? description;
  final String? category;
  final String? categoryId;
  final String? categoryName;
  final String? imgUrl;
  final String? trackUrl;
  final int countLike;
  final int countPlay;
  final int? durationSeconds;
  final UserSummary? uploader;

  const TrackModel({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.category,
    this.categoryId,
    this.categoryName,
    this.imgUrl,
    this.trackUrl,
    this.countLike = 0,
    this.countPlay = 0,
    this.durationSeconds,
    this.uploader,
  });

  factory TrackModel.fromJson(Map<String, dynamic> json) {
    final uploaderJson = json['uploader'];

    return TrackModel(
      id: _string(json['id'] ?? json['_id']),
      title: _string(json['title'], fallback: 'Untitled'),
      slug: _nullableString(json['slug']),
      description: _nullableString(json['description']),
      category: _nullableString(json['category']),
      categoryId: _nullableString(json['categoryId']),
      categoryName: _nullableString(json['categoryName']),
      imgUrl: _nullableString(json['imgUrl'] ?? json['image']),
      trackUrl: _nullableString(json['trackUrl'] ?? json['audioUrl']),
      countLike: _int(json['countLike']),
      countPlay: _int(json['countPlay']),
      durationSeconds: _nullableInt(json['durationSeconds']),
      uploader: uploaderJson is Map
          ? UserSummary.fromJson(Map<String, dynamic>.from(uploaderJson))
          : null,
    );
  }

  String get artistName {
    final name = uploader?.name?.trim();
    if (name != null && name.isNotEmpty) return name;

    final username = uploader?.username?.trim();
    if (username != null && username.isNotEmpty) return username;

    return 'Unknown artist';
  }

  String get displayCategory =>
      categoryName?.trim().isNotEmpty == true
          ? categoryName!.trim()
          : (category?.trim().isNotEmpty == true ? category!.trim() : 'Music');

  String get formattedDuration {
    final seconds = durationSeconds ?? 0;
    if (seconds <= 0) return '--:--';

    final minutes = seconds ~/ 60;
    final remaining = seconds % 60;
    return '$minutes:${remaining.toString().padLeft(2, '0')}';
  }

  static String _string(dynamic value, {String fallback = ''}) {
    if (value == null) return fallback;
    final text = value.toString().trim();
    return text.isEmpty ? fallback : text;
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }

  static int _int(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  static int? _nullableInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    return int.tryParse(value.toString());
  }
}

class UserSummary {
  final String? id;
  final String? username;
  final String? name;
  final String? avatarUrl;
  final bool verified;

  const UserSummary({
    this.id,
    this.username,
    this.name,
    this.avatarUrl,
    this.verified = false,
  });

  factory UserSummary.fromJson(Map<String, dynamic> json) {
    return UserSummary(
      id: _nullableString(json['id'] ?? json['_id']),
      username: _nullableString(json['username']),
      name: _nullableString(json['name']),
      avatarUrl: _nullableString(
        json['avatarUrl'] ?? json['avatar'] ?? json['image'],
      ),
      verified: json['verified'] == true || json['isVerify'] == true,
    );
  }

  static String? _nullableString(dynamic value) {
    if (value == null) return null;
    final text = value.toString().trim();
    return text.isEmpty ? null : text;
  }
}
