import 'track_model.dart';

class PlaylistModel {
  final String id;
  final String title;
  final String? userId;
  final bool isPublic;
  final bool isAlbum;
  final bool isDeleted;
  final List<TrackModel> tracks;

  const PlaylistModel({
    required this.id,
    required this.title,
    this.userId,
    this.isPublic = false,
    this.isAlbum = false,
    this.isDeleted = false,
    this.tracks = const [],
  });

  factory PlaylistModel.fromJson(
      Map<String, dynamic> json,
      ) {
    final rawTracks = json['tracks'];

    final tracks = rawTracks is List
        ? rawTracks
        .whereType<Map>()
        .map(
          (item) => TrackModel.fromJson(
        Map<String, dynamic>.from(item),
      ),
    )
        .toList()
        : <TrackModel>[];

    return PlaylistModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: (json['title'] ?? 'Untitled Playlist').toString(),
      userId: json['userId']?.toString(),
      isPublic: json['isPublic'] == true,
      isAlbum: json['isAlbum'] == true,
      isDeleted: json['isDeleted'] == true,
      tracks: tracks,
    );
  }

  int get trackCount => tracks.length;

  String? get coverUrl {
    if (tracks.isEmpty) return null;

    final value = tracks.first.imgUrl;

    if (value == null || value.trim().isEmpty) {
      return null;
    }

    return value;
  }
}