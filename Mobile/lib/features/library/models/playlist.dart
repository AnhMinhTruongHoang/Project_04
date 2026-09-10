import '../../home/models/home_track.dart';

class Playlist {
  const Playlist({
    required this.id,
    required this.title,
    this.isPublic = true,
    this.isAlbum = false,
    this.isDeleted = false,
    this.tracks = const [],
    this.ownerName,
  });

  final String id;
  final String title;
  final bool isPublic;
  final bool isAlbum;
  final bool isDeleted;
  final List<HomeTrack> tracks;
  final String? ownerName;

  int get trackCount => tracks.length;

  factory Playlist.fromJson(dynamic value) {
    if (value is! Map) {
      return const Playlist(
        id: '',
        title: 'Untitled playlist',
      );
    }

    final json = Map<String, dynamic>.from(value);
    final user = json['user'] is Map
        ? Map<String, dynamic>.from(json['user'])
        : <String, dynamic>{};

    return Playlist(
      id: _string(json['id'] ?? json['_id']),
      title: _string(json['title']).isEmpty
          ? 'Untitled playlist'
          : _string(json['title']),
      isPublic: _bool(json['isPublic'], fallback: true),
      isAlbum: _bool(json['isAlbum']),
      isDeleted: _bool(json['isDeleted']),
      ownerName: _nullableString(
        user['name'] ?? user['username'],
      ),
      tracks: _trackList(json['tracks']),
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

bool _bool(dynamic value, {bool fallback = false}) {
  if (value is bool) {
    return value;
  }

  if (value == null) {
    return fallback;
  }

  return value.toString().toLowerCase() == 'true';
}

List<HomeTrack> _trackList(dynamic value) {
  if (value is! List) {
    return const [];
  }

  return value
      .map(HomeTrack.fromJson)
      .where((track) => track.id.isNotEmpty)
      .toList();
}
