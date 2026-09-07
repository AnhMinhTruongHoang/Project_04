import '../../../core/storage/token_storage.dart';
import '../../../services/api/api_service.dart';
import '../../auth/models/user_model.dart';
import '../../home/models/home_track.dart';
import '../models/listening_history_item.dart';
import '../models/playlist.dart';

class LibraryService {
  LibraryService({ApiService? apiService})
    : _apiService = apiService ?? ApiService.instance;

  final ApiService _apiService;

  Future<List<HomeTrack>> getLikedTracks() async {
    final response = await _apiService.getLikedTracksApi();

    return _trackList(response.data);
  }

  Future<List<Playlist>> getMyPlaylists() async {
    final response = await _apiService.getMyPlaylistsApi();

    return _playlistList(response.data);
  }

  Future<List<UserModel>> getMyFollowing() async {
    final response = await _apiService.getMyFollowingApi();

    return _userList(response.data);
  }

  Future<List<UserModel>> getWhoToFollow({int limit = 24}) async {
    final response = await _apiService.getWhoToFollowApi(limit: limit);

    return _userList(response.data);
  }

  Future<List<HomeTrack>> getSuggestedTracks({int limit = 12}) async {
    final response = await _apiService.getTracksApi(
      current: 1,
      pageSize: limit,
    );

    return _trackList(response.data);
  }

  Future<List<HomeTrack>> getMyUploads() async {
    final response = await _apiService.getMyTracksApi();

    if (response.isUnauthorized) {
      await TokenStorage.clearTokens();
      return const [];
    }

    return _trackList(response.data);
  }

  Future<List<Playlist>> getMyAlbums() async {
    final response = await _apiService.getMyPlaylistsApi();

    return _resultList(response.data).map(Playlist.fromJson).where((playlist) {
      return playlist.id.isNotEmpty && !playlist.isDeleted && playlist.isAlbum;
    }).toList();
  }

  Future<Playlist?> createAlbum({
    required String title,
    required bool isPublic,
    required List<String> trackIds,
  }) async {
    final response = await _apiService.createAlbumApi(
      title: title,
      isPublic: isPublic,
      trackIds: trackIds,
    );

    _ensureSuccess(response);

    final data = _unwrap(response.data);

    if (data is Map) {
      return Playlist.fromJson(data);
    }

    return null;
  }

  Future<List<ListeningHistoryItem>> getListeningHistory({
    int limit = 20,
  }) async {
    final response = await _apiService.getHomeListeningHistoryApi(limit: limit);
    final data = _unwrap(response.data);

    if (data is! Map) {
      return const [];
    }

    final continueListening = _historyList(data['continueListening']);
    final recentlyPlayed = _historyList(data['recentlyPlayed']);
    final merged = <String, ListeningHistoryItem>{};

    for (final item in [...continueListening, ...recentlyPlayed]) {
      if (item.track.id.isNotEmpty) {
        final existing = merged[item.track.id];

        if (existing == null ||
            item.updatedAtMillis >= existing.updatedAtMillis) {
          merged[item.track.id] = item;
        }
      }
    }

    final items = merged.values.toList();

    if (items.any((item) => item.updatedAtMillis > 0)) {
      items.sort(
        (first, second) =>
            second.updatedAtMillis.compareTo(first.updatedAtMillis),
      );
    }

    return items;
  }

  Future<Playlist?> getPlaylistById(String playlistId) async {
    final response = await _apiService.getPlaylistByIdApi(playlistId);
    final data = _unwrap(response.data);

    if (data is Map) {
      return Playlist.fromJson(data);
    }

    return null;
  }

  Future<Playlist?> createPlaylist({
    required String title,
    required bool isPublic,
  }) async {
    final response = await _apiService.createEmptyPlaylistApi(
      title: title,
      isPublic: isPublic,
    );

    _ensureSuccess(response);

    final data = _unwrap(response.data);

    if (data is Map) {
      return Playlist.fromJson(data);
    }

    return null;
  }

  Future<Playlist?> updatePlaylist({
    required String playlistId,
    required String title,
    required bool isPublic,
    required List<String> trackIds,
  }) async {
    final response = await _apiService.updatePlaylistApi(
      playlistId: playlistId,
      payload: {'title': title, 'isPublic': isPublic, 'trackIds': trackIds},
    );

    _ensureSuccess(response);

    final data = _unwrap(response.data);

    if (data is Map) {
      return Playlist.fromJson(data);
    }

    return null;
  }

  Future<void> deletePlaylist(String playlistId) async {
    final response = await _apiService.deletePlaylistApi(playlistId);

    _ensureSuccess(response);
  }

  Future<void> unlikeTrack(String trackId) async {
    final response = await _apiService.dislikeTrackApi(trackId);

    _ensureSuccess(response);
  }

  Future<void> addTrackToPlaylist({
    required Playlist playlist,
    required HomeTrack track,
  }) async {
    final fullPlaylist = await getPlaylistById(playlist.id) ?? playlist;
    final trackIds = fullPlaylist.tracks.map((item) => item.id).toSet();

    trackIds.add(track.id);

    await updatePlaylist(
      playlistId: fullPlaylist.id,
      title: fullPlaylist.title,
      isPublic: fullPlaylist.isPublic,
      trackIds: trackIds.toList(),
    );
  }

  dynamic _unwrap(dynamic value) {
    if (value is Map && value['data'] != null) {
      return value['data'];
    }

    return value;
  }

  List<dynamic> _resultList(dynamic value) {
    final data = _unwrap(value);

    if (data is List) {
      return data;
    }

    if (data is Map) {
      final result = data['result'];

      if (result is List) {
        return result;
      }
    }

    return const [];
  }

  List<HomeTrack> _trackList(dynamic value) {
    return _resultList(
      value,
    ).map(HomeTrack.fromJson).where((track) => track.id.isNotEmpty).toList();
  }

  List<ListeningHistoryItem> _historyList(dynamic value) {
    if (value is! List) {
      return const [];
    }

    return value
        .map(ListeningHistoryItem.fromJson)
        .where((item) => item.track.id.isNotEmpty)
        .toList();
  }

  List<Playlist> _playlistList(dynamic value) {
    return _resultList(value).map(Playlist.fromJson).where((playlist) {
      return playlist.id.isNotEmpty && !playlist.isDeleted && !playlist.isAlbum;
    }).toList();
  }

  List<UserModel> _userList(dynamic value) {
    return _resultList(value)
        .whereType<Map>()
        .map((item) => UserModel.fromJson(Map<String, dynamic>.from(item)))
        .where((user) => user.id.isNotEmpty)
        .toList();
  }

  void _ensureSuccess(ApiResponse<dynamic> response) {
    if (response.isSuccess) {
      return;
    }

    throw StateError(
      response.message.isEmpty ? 'Request failed.' : response.message,
    );
  }
}
