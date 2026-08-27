import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../library/providers/library_provider.dart';
import '../models/player_social_state.dart';

final playerSocialProvider =
    NotifierProvider<PlayerSocialController, PlayerSocialState>(
  PlayerSocialController.new,
);

class PlayerSocialController extends Notifier<PlayerSocialState> {
  late final ApiService _apiService;
  String? _currentUserId;

  @override
  PlayerSocialState build() {
    _apiService = ApiService.instance;

    ref.listen(likedTracksProvider, (_, next) {
      next.whenData(markTracksLiked);
    });

    return const PlayerSocialState();
  }

  Future<PlayerSocialActionResult> toggleLike(HomeTrack track) async {
    if (track.id.isEmpty) {
      return const PlayerSocialActionResult(
        success: false,
        isActive: false,
      );
    }

    if (state.isTrackLiked(track)) {
      try {
        final response = await _apiService.dislikeTrackApi(track.id);

        if (!response.isSuccess) {
          return const PlayerSocialActionResult(
            success: false,
            isActive: true,
          );
        }

        final countLike = _countLikeFromResponse(response.data) ??
            _nextLikeCount(track, liked: false);

        _markTrackUnliked(track.id, countLike: countLike);
        ref.invalidate(likedTracksProvider);

        return PlayerSocialActionResult(
          success: true,
          isActive: false,
          likeCount: countLike,
        );
      } catch (_) {
        return const PlayerSocialActionResult(
          success: false,
          isActive: true,
        );
      }
    }

    try {
      final response = await _apiService.likeTrackApi(track.id);

      if (!response.isSuccess) {
        if (response.message.toLowerCase().contains('already liked')) {
          _markTrackLiked(
            track.id,
            countLike: _countLikeFromResponse(response.data),
          );
          ref.invalidate(likedTracksProvider);

          return PlayerSocialActionResult(
            success: true,
            isActive: true,
            likeCount: _countLikeFromResponse(response.data),
          );
        }

        return const PlayerSocialActionResult(
          success: false,
          isActive: false,
        );
      }

      final countLike = _countLikeFromResponse(response.data) ??
          _nextLikeCount(track, liked: true);

      _markTrackLiked(track.id, countLike: countLike);
      ref.invalidate(likedTracksProvider);

      return PlayerSocialActionResult(
        success: true,
        isActive: true,
        likeCount: countLike,
      );
    } catch (error) {
      if (error.toString().toLowerCase().contains('already liked')) {
        _markTrackLiked(
          track.id,
          countLike: _nextLikeCount(track, liked: true),
        );
        ref.invalidate(likedTracksProvider);

        return PlayerSocialActionResult(
          success: true,
          isActive: true,
          likeCount: state.likeCountFor(track),
        );
      }

      return const PlayerSocialActionResult(
        success: false,
        isActive: false,
      );
    }
  }

  Future<PlayerSocialActionResult> toggleFollow(HomeTrack track) async {
    final uploaderId = track.uploaderId;

    if (uploaderId == null || uploaderId.isEmpty) {
      return const PlayerSocialActionResult(
        success: false,
        isActive: false,
      );
    }

    if (await _isCurrentUser(uploaderId)) {
      return const PlayerSocialActionResult(
        success: false,
        isActive: false,
        reason: PlayerSocialActionReason.self,
      );
    }

    if (state.isArtistFollowed(track)) {
      try {
        final response = await _apiService.unfollowUserApi(uploaderId);

        if (!response.isSuccess) {
          return const PlayerSocialActionResult(
            success: false,
            isActive: true,
          );
        }

        _markArtistUnfollowed(uploaderId);

        return const PlayerSocialActionResult(
          success: true,
          isActive: false,
        );
      } catch (_) {
        return const PlayerSocialActionResult(
          success: false,
          isActive: true,
        );
      }
    }

    try {
      final response = await _apiService.followUserApi(uploaderId);

      if (!response.isSuccess) {
        if (response.message.toLowerCase().contains('cannot follow yourself')) {
          return const PlayerSocialActionResult(
            success: false,
            isActive: false,
            reason: PlayerSocialActionReason.self,
          );
        }

        return const PlayerSocialActionResult(
          success: false,
          isActive: false,
        );
      }

      _markArtistFollowed(uploaderId);

      return const PlayerSocialActionResult(
        success: true,
        isActive: true,
      );
    } catch (error) {
      if (error.toString().toLowerCase().contains('cannot follow yourself')) {
        return const PlayerSocialActionResult(
          success: false,
          isActive: false,
          reason: PlayerSocialActionReason.self,
        );
      }

      return const PlayerSocialActionResult(
        success: false,
        isActive: false,
      );
    }
  }

  Future<bool> _isCurrentUser(String userId) async {
    final cachedId = _currentUserId;

    if (cachedId != null && cachedId.isNotEmpty) {
      return cachedId == userId;
    }

    try {
      final response = await _apiService.getAccountApi();
      final data = _unwrap(response.data);

      if (data is Map) {
        _currentUserId = _findUserId(data);
      }
    } catch (_) {
      return false;
    }

    return _currentUserId == userId;
  }

  void markTrackLiked(HomeTrack track) {
    if (track.id.isNotEmpty) {
      _markTrackLiked(track.id);
    }
  }

  void markTrackUnliked(HomeTrack track) {
    if (track.id.isNotEmpty) {
      _markTrackUnliked(track.id);
    }
  }

  void markTracksLiked(Iterable<HomeTrack> tracks) {
    final ids = tracks
        .map((track) => track.id)
        .where((id) => id.isNotEmpty)
        .toSet();

    if (ids.isEmpty) {
      return;
    }

    state = state.copyWith(
      likedTrackIds: {...state.likedTrackIds, ...ids},
      trackLikeCounts: {
        ...state.trackLikeCounts,
        for (final track in tracks)
          if (track.id.isNotEmpty) track.id: track.countLike,
      },
    );
  }

  void markArtistFollowed(HomeTrack track) {
    final uploaderId = track.uploaderId;

    if (uploaderId != null && uploaderId.isNotEmpty) {
      _markArtistFollowed(uploaderId);
    }
  }

  int _nextLikeCount(HomeTrack track, {required bool liked}) {
    final current = state.likeCountFor(track);

    if (liked) {
      return current + 1;
    }

    return current > 0 ? current - 1 : 0;
  }

  void _markTrackLiked(String trackId, {int? countLike}) {
    state = state.copyWith(
      likedTrackIds: {...state.likedTrackIds, trackId},
      trackLikeCounts: _withLikeCount(trackId, countLike),
    );
  }

  void _markTrackUnliked(String trackId, {int? countLike}) {
    state = state.copyWith(
      likedTrackIds: {
        for (final id in state.likedTrackIds)
          if (id != trackId) id,
      },
      trackLikeCounts: _withLikeCount(trackId, countLike),
    );
  }

  Map<String, int> _withLikeCount(String trackId, int? countLike) {
    if (countLike == null) {
      return state.trackLikeCounts;
    }

    return {
      ...state.trackLikeCounts,
      trackId: countLike,
    };
  }

  void _markArtistFollowed(String uploaderId) {
    state = state.copyWith(
      followedUserIds: {...state.followedUserIds, uploaderId},
    );
  }

  void _markArtistUnfollowed(String uploaderId) {
    state = state.copyWith(
      followedUserIds: {
        for (final id in state.followedUserIds)
          if (id != uploaderId) id,
      },
    );
  }
}

class PlayerSocialActionResult {
  const PlayerSocialActionResult({
    required this.success,
    required this.isActive,
    this.likeCount,
    this.reason,
  });

  final bool success;
  final bool isActive;
  final int? likeCount;
  final PlayerSocialActionReason? reason;
}

enum PlayerSocialActionReason {
  self,
}

dynamic _unwrap(dynamic value) {
  if (value is Map && value['data'] != null) {
    return value['data'];
  }

  return value;
}

String? _findUserId(Map<dynamic, dynamic> data) {
  final direct = (data['id'] ?? data['_id'])?.toString();

  if (direct != null && direct.trim().isNotEmpty) {
    return direct.trim();
  }

  for (final key in const ['user', 'account', 'profile']) {
    final nested = data[key];

    if (nested is Map) {
      final id = _findUserId(nested);

      if (id != null && id.isNotEmpty) {
        return id;
      }
    }
  }

  return null;
}

int? _countLikeFromResponse(dynamic value) {
  final data = _unwrap(value);

  if (data is Map) {
    final raw = data['countLike'];

    if (raw is int) {
      return raw;
    }

    if (raw is num) {
      return raw.toInt();
    }

    return int.tryParse(raw?.toString() ?? '');
  }

  return null;
}
