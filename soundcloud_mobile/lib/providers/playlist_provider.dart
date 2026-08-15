import 'package:flutter/foundation.dart';

import '../models/playlist_model.dart';
import '../models/track_model.dart';
import '../services/playlist_service.dart';

class PlaylistProvider extends ChangeNotifier {
  final PlaylistService _playlistService;

  PlaylistProvider({
    PlaylistService? playlistService,
  }) : _playlistService =
      playlistService ?? PlaylistService();

  List<PlaylistModel> _playlists = const [];

  bool _isLoading = false;
  bool _isSaving = false;

  String? _errorMessage;

  List<PlaylistModel> get playlists => _playlists;

  bool get isLoading => _isLoading;

  bool get isSaving => _isSaving;

  String? get errorMessage => _errorMessage;

  // ============================================================
  // LOAD PLAYLISTS
  // ============================================================

  Future<void> loadMyPlaylists({
    bool force = false,
  }) async {
    if (_isLoading) return;

    if (_playlists.isNotEmpty && !force) {
      return;
    }

    _isLoading = true;
    _errorMessage = null;

    notifyListeners();

    try {
      _playlists =
      await _playlistService.getMyPlaylists();
    } catch (e) {
      _errorMessage = e.toString();

      debugPrint(
        'Load playlists error: $e',
      );
    } finally {
      _isLoading = false;

      notifyListeners();
    }
  }

  // ============================================================
  // CREATE PLAYLIST
  // ============================================================

  Future<PlaylistModel?> createPlaylist({
    required String title,
    required bool isPublic,
  }) async {
    if (_isSaving) {
      return null;
    }

    final cleanTitle = title.trim();

    if (cleanTitle.isEmpty) {
      return null;
    }

    _isSaving = true;
    _errorMessage = null;

    notifyListeners();

    try {
      final created =
      await _playlistService.createPlaylist(
        title: cleanTitle,
        isPublic: isPublic,
      );

      if (created != null) {
        _playlists = [
          created,
          ..._playlists,
        ];
      }

      return created;
    } catch (e) {
      _errorMessage = e.toString();

      debugPrint(
        'Create playlist error: $e',
      );

      return null;
    } finally {
      _isSaving = false;

      notifyListeners();
    }
  }

  // ============================================================
  // DELETE PLAYLIST
  // ============================================================

  Future<bool> deletePlaylist(
      String playlistId,
      ) async {
    if (_isSaving) {
      return false;
    }

    _isSaving = true;
    _errorMessage = null;

    notifyListeners();

    try {
      await _playlistService.deletePlaylist(
        playlistId,
      );

      _playlists = _playlists
          .where(
            (playlist) =>
        playlist.id != playlistId,
      )
          .toList();

      return true;
    } catch (e) {
      _errorMessage = e.toString();

      debugPrint(
        'Delete playlist error: $e',
      );

      return false;
    } finally {
      _isSaving = false;

      notifyListeners();
    }
  }

  // ============================================================
  // ADD TRACK TO PLAYLIST
  // ============================================================

  Future<bool> addTrackToPlaylist({
    required String playlistId,
    required TrackModel track,
  }) async {
    if (_isSaving) {
      return false;
    }

    _isSaving = true;
    _errorMessage = null;

    notifyListeners();

    try {
      /*
       * Lấy detail mới nhất để chắc chắn có đầy đủ tracks.
       */
      final playlist =
      await _playlistService.getPlaylistById(
        playlistId,
      );

      if (playlist == null) {
        throw Exception(
          'Playlist không tồn tại',
        );
      }

      /*
       * Không cho add trùng.
       */
      final alreadyExists =
      playlist.tracks.any(
            (item) => item.id == track.id,
      );

      if (alreadyExists) {
        _errorMessage =
        'Bài hát đã có trong playlist';

        return false;
      }

      final trackIds = [
        ...playlist.tracks.map(
              (item) => item.id,
        ),
        track.id,
      ];

      final updated =
      await _playlistService.updatePlaylist(
        playlistId: playlist.id,
        title: playlist.title,
        isPublic: playlist.isPublic,
        trackIds: trackIds,
      );

      if (updated == null) {
        throw Exception(
          'Không thể cập nhật playlist',
        );
      }

      _replacePlaylist(updated);

      debugPrint(
        'Added "${track.title}" to "${playlist.title}"',
      );

      return true;
    } catch (e) {
      _errorMessage = e.toString();

      debugPrint(
        'Add track to playlist error: $e',
      );

      return false;
    } finally {
      _isSaving = false;

      notifyListeners();
    }
  }

  // ============================================================
  // REMOVE TRACK FROM PLAYLIST
  // ============================================================

  Future<bool> removeTrackFromPlaylist({
    required String playlistId,
    required String trackId,
  }) async {
    if (_isSaving) {
      return false;
    }

    _isSaving = true;
    _errorMessage = null;

    notifyListeners();

    try {
      final playlist =
      await _playlistService.getPlaylistById(
        playlistId,
      );

      if (playlist == null) {
        return false;
      }

      final trackIds = playlist.tracks
          .where(
            (track) => track.id != trackId,
      )
          .map(
            (track) => track.id,
      )
          .toList();

      final updated =
      await _playlistService.updatePlaylist(
        playlistId: playlist.id,
        title: playlist.title,
        isPublic: playlist.isPublic,
        trackIds: trackIds,
      );

      if (updated == null) {
        return false;
      }

      _replacePlaylist(updated);

      return true;
    } catch (e) {
      _errorMessage = e.toString();

      debugPrint(
        'Remove track from playlist error: $e',
      );

      return false;
    } finally {
      _isSaving = false;

      notifyListeners();
    }
  }

  // ============================================================
  // CHECK TRACK
  // ============================================================

  bool containsTrack({
    required String playlistId,
    required String trackId,
  }) {
    final playlist = _playlists
        .where(
          (item) => item.id == playlistId,
    )
        .firstOrNull;

    if (playlist == null) {
      return false;
    }

    return playlist.tracks.any(
          (track) => track.id == trackId,
    );
  }

  // ============================================================
  // LOCAL UPDATE
  // ============================================================

  void _replacePlaylist(
      PlaylistModel updated,
      ) {
    final index = _playlists.indexWhere(
          (playlist) =>
      playlist.id == updated.id,
    );

    if (index < 0) {
      _playlists = [
        updated,
        ..._playlists,
      ];

      return;
    }

    final newList =
    List<PlaylistModel>.from(
      _playlists,
    );

    newList[index] = updated;

    _playlists = newList;
  }
}