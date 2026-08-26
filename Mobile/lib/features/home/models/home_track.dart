import '../../../core/config/api_config.dart';

class HomeTrack {
  const HomeTrack({
    required this.id,
    required this.title,
    this.slug,
    this.imgUrl,
    this.trackUrl,
    this.description,
    this.category,
    this.uploaderId,
    this.uploaderName,
    this.countPlay = 0,
    this.countLike = 0,
    this.durationSeconds,
  });

  final String id;
  final String title;

  final String? slug;
  final String? imgUrl;
  final String? trackUrl;
  final String? description;
  final String? category;
  final String? uploaderId;
  final String? uploaderName;

  final int countPlay;
  final int countLike;
  final double? durationSeconds;

  String? get resolvedImageUrl {
    return _resolveMediaUrl(
      imgUrl,
      fallbackPath: '/uploads/images/',
    );
  }

  String? get resolvedTrackUrl {
    return _resolveMediaUrl(
      trackUrl,
      fallbackPath: '/uploads/audio/',
    );
  }

  String get artistName {
    final name = uploaderName?.trim() ?? '';

    if (name.isNotEmpty) {
      return name;
    }

    return 'Unknown artist';
  }

  factory HomeTrack.fromJson(dynamic value) {
    if (value is! Map) {
      return const HomeTrack(id: '', title: 'Unknown track');
    }

    final json = Map<String, dynamic>.from(value);

    Map<String, dynamic> uploader = {};

    if (json['uploader'] is Map) {
      uploader = Map<String, dynamic>.from(json['uploader']);
    }

    return HomeTrack(
      id: _string(json['id'] ?? json['_id']),
      title: _string(json['title']).isEmpty
          ? 'Unknown track'
          : _string(json['title']),
      slug: _nullableString(json['slug']),
      imgUrl: _nullableString(
        json['imgUrl'] ?? json['image'] ?? json['thumbnail'],
      ),
      trackUrl: _nullableString(
        json['trackUrl'] ?? json['audioUrl'] ?? json['audio'],
      ),
      description:
      _nullableString(json['description']),
      category:
      _nullableString(json['category']),
      uploaderId: _nullableString(
        json['uploaderId'] ??
            uploader['id'] ??
            uploader['_id'],
      ),
      uploaderName: _nullableString(
        uploader['name'] ??
            uploader['username'],
      ),
      countPlay: _toInt(
        json['countPlay'],
      ),
      countLike: _toInt(
        json['countLike'],
      ),
      durationSeconds: _toDouble(
        json['durationSeconds'] ??
            json['duration'] ??
            json['audioDuration'],
      ),
    );
  }
}

String _string(dynamic value) {
  return value?.toString().trim() ?? '';
}

String? _nullableString(dynamic value) {
  final result = value?.toString().trim();

  if (result == null || result.isEmpty || result == 'null') {
    return null;
  }

  return result;
}

int _toInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double? _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(
    value?.toString() ?? '',
  );
}

String? _resolveMediaUrl(
  String? value, {
  required String fallbackPath,
}) {
  final raw = value?.trim();

  if (raw == null || raw.isEmpty) {
    return null;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return '${ApiConfig.baseUrl}$raw';
  }

  return '${ApiConfig.baseUrl}$fallbackPath$raw';
}
