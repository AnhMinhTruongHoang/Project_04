import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import '../models/track_model.dart';
import '../services/track_service.dart';

class PlayerProvider extends ChangeNotifier {
  final AudioPlayer _player =
  AudioPlayer();

  final TrackService _trackService =
  TrackService();

  TrackModel? _currentTrack;

  List<TrackModel> _queue =
  const [];

  int _currentIndex = -1;

  bool _isLoading = false;

  String? _errorMessage;

  Duration _position =
      Duration.zero;

  Duration _duration =
      Duration.zero;

  // ============================================================
  // LIKE
  // ============================================================

  final Set<String> _likedTrackIds =
  <String>{};

  bool _isLikeLoading = false;

  bool _likedLoaded = false;

  // ============================================================
  // HISTORY
  // ============================================================

  Timer? _historyTimer;

  String? _sessionId;

  String? _lastCountedTrackId;

  // ============================================================
  // STREAM
  // ============================================================

  StreamSubscription<Duration>?
  _positionSubscription;

  StreamSubscription<Duration?>?
  _durationSubscription;

  StreamSubscription<PlayerState>?
  _playerStateSubscription;

  PlayerProvider() {
    _listenPlayer();
  }

  // ============================================================
  // GETTERS
  // ============================================================

  TrackModel?
  get currentTrack =>
      _currentTrack;

  List<TrackModel>
  get queue => _queue;

  int get currentIndex =>
      _currentIndex;

  bool get hasTrack =>
      _currentTrack != null;

  bool get isLoading =>
      _isLoading;

  bool get isPlaying =>
      _player.playing;

  String? get errorMessage =>
      _errorMessage;

  Duration get position =>
      _position;

  Duration get duration =>
      _duration;

  bool get isLikeLoading =>
      _isLikeLoading;

  Set<String> get likedTrackIds =>
      Set.unmodifiable(
        _likedTrackIds,
      );

  bool get hasNext =>
      _queue.isNotEmpty &&
          _currentIndex >= 0 &&
          _currentIndex <
              _queue.length - 1;

  bool get hasPrevious =>
      _queue.isNotEmpty &&
          _currentIndex > 0;

  bool get isCurrentTrackLiked {
    final track =
        _currentTrack;

    if (track == null) {
      return false;
    }

    return _likedTrackIds
        .contains(
      track.id,
    );
  }

  bool isTrackLiked(
      String trackId,
      ) {
    return _likedTrackIds
        .contains(
      trackId,
    );
  }

  double get progress {
    if (_duration
        .inMilliseconds <=
        0) {
      return 0;
    }

    return (_position
        .inMilliseconds /
        _duration
            .inMilliseconds)
        .clamp(
      0.0,
      1.0,
    );
  }

  // ============================================================
  // INIT LIKES
  // ============================================================

  Future<void>
  loadLikedTracks({
    bool force = false,
  }) async {
    if (_likedLoaded &&
        !force) {
      return;
    }

    try {
      final likedTracks =
      await _trackService
          .getLikedTracks();

      _likedTrackIds
        ..clear()
        ..addAll(
          likedTracks.map(
                (track) =>
            track.id,
          ),
        );

      _likedLoaded = true;

      notifyListeners();
    } catch (e) {
      debugPrint(
        'Load liked tracks error: $e',
      );
    }
  }

  // ============================================================
  // TOGGLE LIKE
  // ============================================================

  Future<void>
  toggleLike() async {
    final track =
        _currentTrack;

    if (track == null ||
        _isLikeLoading) {
      return;
    }

    _isLikeLoading = true;

    notifyListeners();

    final wasLiked =
    _likedTrackIds
        .contains(
      track.id,
    );

    /*
     * Optimistic UI:
     * bấm là tim đổi ngay.
     */
    if (wasLiked) {
      _likedTrackIds.remove(
        track.id,
      );
    } else {
      _likedTrackIds.add(
        track.id,
      );
    }

    notifyListeners();

    try {
      if (wasLiked) {
        await _trackService
            .dislikeTrack(
          track.id,
        );
      } else {
        await _trackService
            .likeTrack(
          track.id,
        );
      }

      debugPrint(
        wasLiked
            ? 'Track disliked: ${track.title}'
            : 'Track liked: ${track.title}',
      );
    } catch (e) {
      /*
       * API lỗi -> rollback UI.
       */
      if (wasLiked) {
        _likedTrackIds.add(
          track.id,
        );
      } else {
        _likedTrackIds.remove(
          track.id,
        );
      }

      debugPrint(
        'Toggle like error: $e',
      );

      rethrow;
    } finally {
      _isLikeLoading = false;

      notifyListeners();
    }
  }

  // ============================================================
  // PLAYER LISTENERS
  // ============================================================

  void _listenPlayer() {
    _positionSubscription =
        _player
            .positionStream
            .listen(
              (position) {
            _position =
                position;

            notifyListeners();
          },
        );

    _durationSubscription =
        _player
            .durationStream
            .listen(
              (duration) {
            _duration =
                duration ??
                    Duration.zero;

            notifyListeners();
          },
        );

    _playerStateSubscription =
        _player
            .playerStateStream
            .listen(
              (state) {
            notifyListeners();

            if (state
                .processingState ==
                ProcessingState
                    .completed) {
              _handleCompleted();
            }
          },
        );
  }

  // ============================================================
  // PLAY TRACK
  // ============================================================

  Future<void> playTrack(
      TrackModel track, {
        List<TrackModel>? queue,
      }) async {
    if (track.trackUrl ==
        null ||
        track.trackUrl!
            .trim()
            .isEmpty) {
      _errorMessage =
      'Track không có audio URL';

      notifyListeners();

      return;
    }

    /*
     * Nếu bấm lại bài hiện tại,
     * resume thay vì load lại.
     */
    if (_currentTrack
        ?.id ==
        track.id) {
      if (!_player
          .playing) {
        await _player
            .play();

        _startHistoryTimer();

        notifyListeners();
      }

      return;
    }

    try {
      _isLoading = true;

      _errorMessage =
      null;

      notifyListeners();

      if (_currentTrack !=
          null) {
        await _saveCurrentHistory(
          playing: false,
        );
      }

      _stopHistoryTimer();

      if (queue != null &&
          queue.isNotEmpty) {
        _queue =
        List<TrackModel>.from(
          queue,
        );

        _currentIndex =
            _queue.indexWhere(
                  (item) =>
              item.id ==
                  track.id,
            );

        if (_currentIndex <
            0) {
          _queue = [
            track,
            ..._queue,
          ];

          _currentIndex =
          0;
        }
      } else {
        _queue = [
          track,
        ];

        _currentIndex =
        0;
      }

      _currentTrack =
          track;

      _position =
          Duration.zero;

      _duration =
          Duration.zero;

      _sessionId =
          _createSessionId();

      notifyListeners();

      await _player.setUrl(
        track.trackUrl!,
      );

      await _increasePlayCount(
        track,
      );

      await _player
          .play();

      _startHistoryTimer();

      await _saveCurrentHistory(
        playing: true,
      );
    } catch (e,
    stackTrace) {
      debugPrint(
        'Play track error: $e',
      );

      debugPrint(
        '$stackTrace',
      );

      _errorMessage =
      'Không thể phát bài hát';

      _stopHistoryTimer();
    } finally {
      _isLoading =
      false;

      notifyListeners();
    }
  }

  // ============================================================
  // PLAY COUNT
  // ============================================================

  Future<void>
  _increasePlayCount(
      TrackModel track,
      ) async {
    if (_lastCountedTrackId ==
        track.id) {
      return;
    }

    try {
      await _trackService
          .increasePlayCount(
        track.id,
      );

      _lastCountedTrackId =
          track.id;

      debugPrint(
        'Play count increased: ${track.id}',
      );
    } catch (e) {
      debugPrint(
        'Increase play count error: $e',
      );
    }
  }

  // ============================================================
  // PLAY / PAUSE
  // ============================================================

  Future<void>
  togglePlayPause() async {
    if (_currentTrack ==
        null) {
      return;
    }

    try {
      if (_player
          .playing) {
        await _player
            .pause();

        _stopHistoryTimer();

        await _saveCurrentHistory(
          playing: false,
        );
      } else {
        await _player
            .play();

        _startHistoryTimer();

        await _saveCurrentHistory(
          playing: true,
        );
      }
    } catch (e) {
      debugPrint(
        'Toggle play/pause error: $e',
      );
    }

    notifyListeners();
  }

  // ============================================================
  // SEEK
  // ============================================================

  Future<void> seek(
      Duration position,
      ) async {
    try {
      await _player.seek(
        position,
      );

      _position =
          position;

      notifyListeners();
    } catch (e) {
      debugPrint(
        'Seek error: $e',
      );
    }
  }

  Future<void>
  seekByProgress(
      double value,
      ) async {
    if (_duration
        .inMilliseconds <=
        0) {
      return;
    }

    final safeValue =
    value.clamp(
      0.0,
      1.0,
    );

    final milliseconds =
    (_duration
        .inMilliseconds *
        safeValue)
        .round();

    await seek(
      Duration(
        milliseconds:
        milliseconds,
      ),
    );
  }

  // ============================================================
  // NEXT
  // ============================================================

  Future<void> next() async {
    if (_queue.isEmpty) {
      return;
    }

    if (_currentIndex <
        0 ||
        _currentIndex + 1 >=
            _queue.length) {
      await _saveCurrentHistory(
        playing: false,
      );

      _stopHistoryTimer();

      return;
    }

    await _saveCurrentHistory(
      playing: false,
    );

    final nextTrack =
    _queue[
    _currentIndex +
        1];

    _lastCountedTrackId =
    null;

    await playTrack(
      nextTrack,
      queue: _queue,
    );
  }

  // ============================================================
  // PREVIOUS
  // ============================================================

  Future<void>
  previous() async {
    if (_queue.isEmpty) {
      return;
    }

    if (_position
        .inSeconds >
        3) {
      await seek(
        Duration.zero,
      );

      await _saveCurrentHistory(
        playing:
        _player.playing,
      );

      return;
    }

    if (_currentIndex <=
        0) {
      await seek(
        Duration.zero,
      );

      return;
    }

    await _saveCurrentHistory(
      playing: false,
    );

    final previousTrack =
    _queue[
    _currentIndex -
        1];

    _lastCountedTrackId =
    null;

    await playTrack(
      previousTrack,
      queue: _queue,
    );
  }

  // ============================================================
  // COMPLETE
  // ============================================================

  Future<void>
  _handleCompleted() async {
    _stopHistoryTimer();

    await _saveCurrentHistory(
      playing: false,
      forceCompleted:
      true,
    );

    if (hasNext) {
      await next();
    } else {
      notifyListeners();
    }
  }

  // ============================================================
  // HISTORY TIMER
  // ============================================================

  void _startHistoryTimer() {
    _stopHistoryTimer();

    _historyTimer =
        Timer.periodic(
          const Duration(
            seconds: 15,
          ),
              (_) {
            if (_player.playing &&
                _currentTrack !=
                    null) {
              unawaited(
                _saveCurrentHistory(
                  playing:
                  true,
                ),
              );
            }
          },
        );
  }

  void _stopHistoryTimer() {
    _historyTimer
        ?.cancel();

    _historyTimer =
    null;
  }

  Future<void>
  _saveCurrentHistory({
    required bool playing,
    bool forceCompleted =
    false,
  }) async {
    final track =
        _currentTrack;

    if (track == null) {
      return;
    }

    final durationSeconds =
        _duration
            .inMilliseconds /
            1000.0;

    final positionSeconds =
        _position
            .inMilliseconds /
            1000.0;

    if (durationSeconds <=
        0) {
      return;
    }

    final completed =
        forceCompleted ||
            positionSeconds /
                durationSeconds >=
                0.95;

    try {
      await _trackService
          .saveListeningHistory(
        track.id,
        position:
        positionSeconds,
        duration:
        durationSeconds,
        completed:
        completed,
        playing:
        playing,
        sessionId:
        _sessionId,
      );

      debugPrint(
        'History saved: '
            '${track.title} '
            '${positionSeconds.toStringAsFixed(1)}/'
            '${durationSeconds.toStringAsFixed(1)}',
      );
    } catch (e) {
      /*
       * Backend history đang có race-condition riêng.
       * Không để lỗi history làm player dừng.
       */
      debugPrint(
        'Save listening history error: $e',
      );
    }
  }

  String _createSessionId() {
    final timestamp =
        DateTime.now()
            .millisecondsSinceEpoch;

    final random =
    Random()
        .nextInt(
      999999999,
    );

    return 'flutter-$timestamp-$random';
  }

  // ============================================================
  // STOP
  // ============================================================

  Future<void> stop() async {
    await _saveCurrentHistory(
      playing: false,
    );

    _stopHistoryTimer();

    try {
      await _player
          .stop();
    } catch (e) {
      debugPrint(
        'Stop error: $e',
      );
    }

    _currentTrack =
    null;

    _queue =
    const [];

    _currentIndex =
    -1;

    _position =
        Duration.zero;

    _duration =
        Duration.zero;

    _sessionId =
    null;

    _lastCountedTrackId =
    null;

    _errorMessage =
    null;

    notifyListeners();
  }

  // ============================================================
  // FORMAT TIME
  // ============================================================

  String formatDuration(
      Duration duration,
      ) {
    if (duration.inHours >
        0) {
      final hours =
          duration.inHours;

      final minutes =
      duration.inMinutes
          .remainder(
        60,
      );

      final seconds =
      duration.inSeconds
          .remainder(
        60,
      );

      return '$hours:'
          '${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
    }

    final minutes =
        duration.inMinutes;

    final seconds =
    duration.inSeconds
        .remainder(
      60,
    );

    return '$minutes:'
        '${seconds.toString().padLeft(2, '0')}';
  }

  // ============================================================
  // DISPOSE
  // ============================================================

  @override
  void dispose() {
    if (_currentTrack !=
        null) {
      unawaited(
        _saveCurrentHistory(
          playing:
          false,
        ),
      );
    }

    _stopHistoryTimer();

    _positionSubscription
        ?.cancel();

    _durationSubscription
        ?.cancel();

    _playerStateSubscription
        ?.cancel();

    _player.dispose();

    super.dispose();
  }
}