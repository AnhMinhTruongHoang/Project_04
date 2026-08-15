import '../core/constants/app_constants.dart';

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

    final rawImage = _nullableString(json['imgUrl'] ?? json['image']);

    final rawAudio = _nullableString(json['trackUrl'] ?? json['audioUrl']);

    return TrackModel(
      id: _string(json['id'] ?? json['_id']),

      title: _string(json['title'], fallback: 'Untitled'),

      slug: _nullableString(json['slug']),

      description: _nullableString(json['description']),

      category: _nullableString(json['category']),

      categoryId: _nullableString(json['categoryId']),

      categoryName: _nullableString(json['categoryName']),

      /*
       * API Track có thể trả full URL.
       * API Playlist có thể trả filename/path tương đối.
       *
       * Chuẩn hóa ở model để Player không cần quan tâm
       * track đến từ API nào.
       */
      imgUrl: _normalizeImageUrl(rawImage),

      trackUrl: _normalizeAudioUrl(rawAudio),

      countLike: _int(json['countLike']),

      countPlay: _int(json['countPlay']),

      durationSeconds: _nullableInt(json['durationSeconds']),

      uploader: uploaderJson is Map
          ? UserSummary.fromJson(Map<String, dynamic>.from(uploaderJson))
          : null,
    );
  }

  // ============================================================
  // ARTIST
  // ============================================================

  String get artistName {
    final name = uploader?.name?.trim();

    if (name != null && name.isNotEmpty) {
      return name;
    }

    final username = uploader?.username?.trim();

    if (username != null && username.isNotEmpty) {
      return username;
    }

    return 'Unknown artist';
  }

  // ============================================================
  // CATEGORY
  // ============================================================

  String get displayCategory {
    if (categoryName?.trim().isNotEmpty == true) {
      return categoryName!.trim();
    }

    if (category?.trim().isNotEmpty == true) {
      return category!.trim();
    }

    return 'Music';
  }

  // ============================================================
  // DURATION
  // ============================================================

  String get formattedDuration {
    final seconds = durationSeconds ?? 0;

    if (seconds <= 0) {
      return '--:--';
    }

    final minutes = seconds ~/ 60;

    final remaining = seconds % 60;

    return '$minutes:'
        '${remaining.toString().padLeft(2, '0')}';
  }

  // ============================================================
  // URL NORMALIZATION
  // ============================================================

  static String? _normalizeImageUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    final url = value.trim();

    /*
     * Cloudinary / remote URL.
     */
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    /*
     * Backend đôi khi có thể trả:
     * /uploads/images/a.jpg
     */
    if (url.startsWith('/uploads/')) {
      return '${AppConstants.serverUrl}$url';
    }

    /*
     * Backend có thể trả:
     * uploads/images/a.jpg
     */
    if (url.startsWith('uploads/')) {
      return '${AppConstants.serverUrl}/$url';
    }

    /*
     * Raw filename:
     * a.jpg
     */
    return '${AppConstants.imageUrl}$url';
  }

  static String? _normalizeAudioUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    final url = value.trim();

    /*
     * Cloudinary / remote URL.
     */
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    /*
     * /uploads/audio/a.mp3
     */
    if (url.startsWith('/uploads/')) {
      return '${AppConstants.serverUrl}$url';
    }

    /*
     * uploads/audio/a.mp3
     */
    if (url.startsWith('uploads/')) {
      return '${AppConstants.serverUrl}/$url';
    }

    /*
     * Raw filename:
     * a.mp3
     */
    return '${AppConstants.audioUrl}$url';
  }

  // ============================================================
  // PARSE HELPERS
  // ============================================================

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

  static int? _nullableInt(dynamic value) {
    if (value == null) {
      return null;
    }

    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

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

      avatarUrl: _normalizeAvatarUrl(
        _nullableString(json['avatarUrl'] ?? json['avatar'] ?? json['image']),
      ),

      verified: json['verified'] == true || json['isVerify'] == true,
    );
  }

  static String? _normalizeAvatarUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null;
    }

    final url = value.trim();

    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    if (url.startsWith('/uploads/')) {
      return '${AppConstants.serverUrl}$url';
    }

    if (url.startsWith('uploads/')) {
      return '${AppConstants.serverUrl}/$url';
    }

    return '${AppConstants.imageUrl}$url';
  }

  static String? _nullableString(dynamic value) {
    if (value == null) {
      return null;
    }

    final text = value.toString().trim();

    return text.isEmpty ? null : text;
  }
}
