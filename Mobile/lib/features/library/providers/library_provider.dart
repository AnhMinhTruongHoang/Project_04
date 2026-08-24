import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../data/library_service.dart';
import '../models/listening_history_item.dart';
import '../models/playlist.dart';

final libraryServiceProvider = Provider<LibraryService>((ref) {
  return LibraryService();
});

final likedTracksProvider = FutureProvider<List<HomeTrack>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getLikedTracks();
});

final playlistsProvider = FutureProvider<List<Playlist>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getMyPlaylists();
});

final albumsProvider = FutureProvider<List<Playlist>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getMyAlbums();
});

final listeningHistoryProvider =
    FutureProvider<List<ListeningHistoryItem>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getListeningHistory(limit: 30);
});

final playlistDetailProvider =
    FutureProvider.family<Playlist?, String>((ref, playlistId) async {
  final service = ref.read(libraryServiceProvider);

  return service.getPlaylistById(playlistId);
});
