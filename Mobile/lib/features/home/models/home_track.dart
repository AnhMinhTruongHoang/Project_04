class HomeTrack {
  const HomeTrack({
    required this.id,
    required this.title,
    this.slug,
    this.imgUrl,
    this.trackUrl,
    this.description,
    this.category,
    this.uploaderName,
    this.countPlay = 0,
    this.countLike = 0,
  });

  final String id;
  final String title;

  final String? slug;
  final String? imgUrl;
  final String? trackUrl;
  final String? description;
  final String? category;
  final String? uploaderName;

  final int countPlay;
  final int countLike;

  String get artistName {
    final name = uploaderName?.trim() ?? '';

    if (name.isNotEmpty) {
      return name;
    }

    return 'Unknown artist';
  }

  factory HomeTrack.fromJson(dynamic value) {
    if (value is! Map) {
      return const HomeTrack(
        id: '',
        title: 'Unknown track',
      );
    }

    final json = Map<String, dynamic>.from(value);

    Map<String, dynamic> uploader = {};

    if (json['uploader'] is Map) {
      uploader = Map<String, dynamic>.from(
        json['uploader'],
      );
    }

    return HomeTrack(
      id: _string(
        json['id'] ?? json['_id'],
      ),
      title: _string(json['title']).isEmpty
          ? 'Unknown track'
          : _string(json['title']),
      slug: _nullableString(json['slug']),
      imgUrl: _nullableString(
        json['imgUrl'] ??
            json['image'] ??
            json['thumbnail'],
      ),
      trackUrl: _nullableString(
        json['trackUrl'] ??
            json['audioUrl'] ??
            json['audio'],
      ),
      description:
      _nullableString(json['description']),
      category:
      _nullableString(json['category']),
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
    );
  }
}

String _string(dynamic value) {
  return value?.toString().trim() ?? '';
}

String? _nullableString(dynamic value) {
  final result =
  value?.toString().trim();

  if (result == null ||
      result.isEmpty ||
      result == 'null') {
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

  return int.tryParse(
    value?.toString() ?? '',
  ) ??
      0;
}