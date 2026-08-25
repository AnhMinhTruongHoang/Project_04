import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';

class PlaylistPageData {
  const PlaylistPageData({required this.playlists, required this.tracks});

  final List<Map<String, dynamic>> playlists;
  final List<HomeTrack> tracks;
}

final playlistPageProvider = FutureProvider<PlaylistPageData>((ref) async {
  final api = ApiService.instance;
  final responses = await Future.wait([
    api.getMyPlaylistsApi(),
    api.getTracksApi(current: 1, pageSize: 100),
  ]);

  if (!responses[0].isSuccess) throw StateError(responses[0].message);

  final playlists = api
      .extractResultList(responses[0])
      .whereType<Map>()
      .map((item) => Map<String, dynamic>.from(item))
      .where(
        (item) =>
            item['isAlbum'] != true &&
            (item['id'] ?? item['_id'] ?? '').toString().trim().isNotEmpty,
      )
      .toList();
  final tracks = responses[1].isSuccess
      ? api
            .extractResultList(responses[1])
            .map(HomeTrack.fromJson)
            .where((track) => track.id.isNotEmpty)
            .toList()
      : <HomeTrack>[];

  return PlaylistPageData(playlists: playlists, tracks: tracks);
});
