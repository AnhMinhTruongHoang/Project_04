import '../core/network/api_client.dart';
import '../models/playlist_model.dart';

class PlaylistService {
  final ApiClient _apiClient;

  PlaylistService({
    ApiClient? apiClient,
  }) : _apiClient =
      apiClient ?? ApiClient.instance;

  Future<List<PlaylistModel>>
  getMyPlaylists() async {
    final response =
    await _apiClient.get(
      '/playlists/my-playlists',
    );

    final data = _unwrapData(
      response.data,
    );

    if (data is List) {
      return _playlistList(data);
    }

    if (data is Map) {
      final result =
      data['result'];

      if (result is List) {
        return _playlistList(result);
      }
    }

    return const [];
  }

  Future<PlaylistModel?>
  getPlaylistById(
      String playlistId,
      ) async {
    final response =
    await _apiClient.get(
      '/playlists/$playlistId',
    );

    final data =
    _unwrapData(
      response.data,
    );

    if (data is Map) {
      return PlaylistModel.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    return null;
  }

  Future<PlaylistModel?>
  createPlaylist({
    required String title,
    required bool isPublic,
  }) async {
    final response =
    await _apiClient.post(
      '/playlists',
      data: {
        'title': title,
        'isPublic': isPublic,
      },
    );

    final data =
    _unwrapData(
      response.data,
    );

    if (data is Map) {
      return PlaylistModel.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    return null;
  }

  Future<PlaylistModel?>
  updatePlaylist({
    required String playlistId,
    required String title,
    required bool isPublic,
    required List<String> trackIds,
  }) async {
    final response =
    await _apiClient.patch(
      '/playlists/$playlistId',
      data: {
        'title': title,
        'isPublic': isPublic,
        'tracks': trackIds,
      },
    );

    final data =
    _unwrapData(
      response.data,
    );

    if (data is Map) {
      return PlaylistModel.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    return null;
  }

  Future<void> deletePlaylist(
      String playlistId,
      ) async {
    await _apiClient.delete(
      '/playlists/$playlistId',
    );
  }

  dynamic _unwrapData(
      dynamic responseData,
      ) {
    if (responseData is Map &&
        responseData['data'] != null) {
      return responseData['data'];
    }

    return responseData;
  }

  List<PlaylistModel>
  _playlistList(
      List value,
      ) {
    return value
        .whereType<Map>()
        .map(
          (item) =>
          PlaylistModel.fromJson(
            Map<String, dynamic>.from(
              item,
            ),
          ),
    )
        .where(
          (playlist) =>
      !playlist.isDeleted &&
          !playlist.isAlbum,
    )
        .toList();
  }
}