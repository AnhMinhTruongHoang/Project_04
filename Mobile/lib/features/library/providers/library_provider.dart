import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/models/user_model.dart';
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

final followingProvider = FutureProvider<List<UserModel>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getMyFollowing();
});

final whoToFollowProvider = FutureProvider<List<UserModel>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getWhoToFollow(limit: 24);
});

final suggestedTracksProvider = FutureProvider<List<HomeTrack>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getSuggestedTracks(limit: 20);
});

final myUploadsProvider = FutureProvider<List<HomeTrack>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getMyUploads();
});

final albumsProvider = FutureProvider<List<Playlist>>((ref) async {
  final service = ref.read(libraryServiceProvider);

  return service.getMyAlbums();
});

final listeningHistoryProvider = FutureProvider<List<ListeningHistoryItem>>((
  ref,
) async {
  final service = ref.read(libraryServiceProvider);

  return service.getListeningHistory(limit: 30);
});

final localListeningHistoryProvider =
    NotifierProvider<
      LocalListeningHistoryController,
      List<ListeningHistoryItem>
    >(LocalListeningHistoryController.new);

class LocalListeningHistoryController
    extends Notifier<List<ListeningHistoryItem>> {
  @override
  List<ListeningHistoryItem> build() {
    return const [];
  }

  void upsert(ListeningHistoryItem item) {
    final trackId = item.track.id;

    if (trackId.isEmpty) {
      return;
    }

    state = [
      item,
      ...state.where((history) => history.track.id != trackId),
    ].take(30).toList();
  }
}

final effectiveListeningHistoryProvider =
    Provider<AsyncValue<List<ListeningHistoryItem>>>((ref) {
      final local = ref.watch(localListeningHistoryProvider);
      final remote = ref.watch(listeningHistoryProvider);

      return remote.whenData((items) => _mergeHistory(local, items));
    });

final playlistDetailProvider = FutureProvider.family<Playlist?, String>((
  ref,
  playlistId,
) async {
  final service = ref.read(libraryServiceProvider);

  return service.getPlaylistById(playlistId);
});

List<ListeningHistoryItem> _mergeHistory(
  List<ListeningHistoryItem> local,
  List<ListeningHistoryItem> remote,
) {
  final merged = <String, ListeningHistoryItem>{};

  for (final item in [...remote, ...local]) {
    final trackId = item.track.id;

    if (trackId.isEmpty) {
      continue;
    }

    final existing = merged[trackId];

    if (existing == null || item.updatedAtMillis >= existing.updatedAtMillis) {
      merged[trackId] = item;
    }
  }

  return merged.values.toList()..sort((first, second) {
    return second.updatedAtMillis.compareTo(first.updatedAtMillis);
  });
}
