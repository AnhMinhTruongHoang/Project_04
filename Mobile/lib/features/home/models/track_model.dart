class TrackModel {
  const TrackModel({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.category,
    this.imgUrl,
    this.trackUrl,
    this.countLike = 0,
    this.countPlay = 0,
    this.uploaderId,
    this.uploaderName,
    this.durationSeconds,
  });

  final String id;
  final String title;
  final String? slug;
  final String? description;
  final String? category;
  final String? imgUrl;
  final String? trackUrl;
  final int countLike;
  final int countPlay;
  final String? uploaderId;
  final String? uploaderName;
  final int? durationSeconds;

  factory TrackModel.fromJson(Map<String, dynamic> json) {
    final uploader = _asMap(json['uploader']);

    return TrackModel(
      id: _text(json['id'] ?? json['_id']),
      title: _text(json['title']),
      slug: _nullableText(json['slug']),
      description: _nullableText(json['description']),
      category: _nullableText(
        json['category'] ?? json['categoryName'],
      ),
      imgUrl: _nullableText(
        json['imgUrl'] ?? json['image'] ?? json['thumbnail'],
      ),
      trackUrl: _nullableText(
        json['trackUrl'] ?? json['audioUrl'] ?? json['audio'],
      ),
      countLike: _int(json['countLike']),
      countPlay: _int(json['countPlay']),
      uploaderId: _nullableText(
        json['uploaderId'] ?? uploader['id'] ?? uploader['_id'],
      ),
      uploaderName: _nullableText(
        uploader['name'] ?? uploader['username'] ?? json['artistName'],
      ),
      durationSeconds: _nullableInt(json['durationSeconds']),
    );
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

String _text(dynamic value) => value?.toString().trim() ?? '';

String? _nullableText(dynamic value) {
  final text = _text(value);
  return text.isEmpty || text == 'null' ? null : text;
}

int _int(dynamic value) => _nullableInt(value) ?? 0;

int? _nullableInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '');
}
