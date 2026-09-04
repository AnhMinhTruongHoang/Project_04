import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart' as ja;

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../home/providers/home_provider.dart';
import '../../library/models/listening_history_item.dart';
import '../../library/providers/library_provider.dart';
import '../models/player_state.dart';

final playerProvider = NotifierProvider<PlayerController, PlayerState>(
  PlayerController.new,
);

class PlayerController extends Notifier<PlayerState> {
  late final ja.AudioPlayer _audioPlayer;
  late final ApiService _apiService;

  StreamSubscription<Duration>? _positionSubscription;
  StreamSubscription<Duration?>? _durationSubscription;
  StreamSubscription<ja.PlayerState>? _playerStateSubscription;

  Timer? _historyTimer;

  int _playRequestId = 0;

  String? _lastCountedTrackId;

  bool _wantsToPlay = false;

  // =========================================================
  // BUILD
  // =========================================================

  @override
  PlayerState build() {
    _audioPlayer = ja.AudioPlayer();
    _apiService = ApiService.instance;

    _listenToPlayer();

    ref.onDispose(() {
      _historyTimer?.cancel();

      _positionSubscription?.cancel();
      _durationSubscription?.cancel();
      _playerStateSubscription?.cancel();

      _audioPlayer.dispose();
    });

    return const PlayerState();
  }

  // =========================================================
  // PLAY TRACK
  // =========================================================

  Future<void> playTrack(HomeTrack track, {List<HomeTrack>? queue}) async {
    final audioUrl = track.resolvedTrackUrl;

    if (audioUrl == null || audioUrl.isEmpty) {
      state = state.copyWith(
        currentTrack: track,
        errorMessage: 'Track does not have an audio URL.',
        isLoading: false,
        isPlaying: false,
      );

      return;
    }

    final requestId = ++_playRequestId;

    final nextQueue = queue == null || queue.isEmpty ? [track] : queue;

    final foundIndex = nextQueue.indexWhere((item) => item.id == track.id);

    final nextIndex = max(0, foundIndex);

    // Lưu lịch sử bài cũ chạy nền, không chặn việc chuyển sang bài mới.
    unawaited(_saveCurrentHistory(playing: false));

    _historyTimer?.cancel();

    _wantsToPlay = false;

    state = state.copyWith(
      currentTrack: track,
      queue: nextQueue,
      currentIndex: nextIndex,
      isPlaying: false,
      isLoading: true,
      position: Duration.zero,
      duration: Duration.zero,
      clearError: true,
      sessionId: DateTime.now().microsecondsSinceEpoch.toString(),
    );

    _pushLocalHistory(track);

    try {
      // Dừng bài cũ
      await _audioPlayer.stop();

      if (requestId != _playRequestId) {
        return;
      }

      // Load URL bài mới
      await _audioPlayer.setUrl(audioUrl);

      if (requestId != _playRequestId) {
        return;
      }

      _wantsToPlay = true;

      /*
       * QUAN TRỌNG:
       *
       * Không await _audioPlayer.play().
       *
       * Trạng thái playing sẽ được cập nhật thông qua
       * playerStateStream trong _listenToPlayer().
       */
      unawaited(_audioPlayer.play());

      if (track.id.isNotEmpty) {
        _startHistoryTimer();

        unawaited(_saveCurrentHistory(playing: true));
      }

      if (track.canUsePublicTrackActions) {
        unawaited(_increasePlayCount(track));
      }
    } catch (error, stackTrace) {
      debugPrint('Play track error: $error');

      debugPrint('$stackTrace');

      if (requestId != _playRequestId) {
        return;
      }

      _wantsToPlay = false;

      state = state.copyWith(
        isLoading: false,
        isPlaying: false,
        errorMessage: 'Unable to play this track.',
      );
    }
  }

  // =========================================================
  // PLAY / PAUSE
  // =========================================================

  Future<void> togglePlayPause() async {
    if (!state.hasTrack) {
      return;
    }

    if (state.isLoading) {
      return;
    }

    try {
      // =====================================================
      // PAUSE
      // =====================================================

      if (_audioPlayer.playing) {
        _wantsToPlay = false;

        await _audioPlayer.pause();

        _historyTimer?.cancel();

        await _saveCurrentHistory(playing: false);

        return;
      }

      // =====================================================
      // PLAY / RESUME
      // =====================================================

      _wantsToPlay = true;

      /*
       * Không await play().
       *
       * playerStateStream sẽ báo:
       *
       * playing = true
       *
       * và cập nhật Riverpod state.
       */
      unawaited(_audioPlayer.play());

      if (state.currentTrack?.id.isNotEmpty == true) {
        _startHistoryTimer();
      }
    } catch (error, stackTrace) {
      debugPrint('Toggle play/pause error: $error');

      debugPrint('$stackTrace');

      _wantsToPlay = _audioPlayer.playing;

      state = state.copyWith(
        isPlaying: _audioPlayer.playing,
        errorMessage: 'Unable to control playback.',
      );
    }
  }

  // =========================================================
  // SEEK
  // =========================================================

  Future<void> seekByProgress(double value) async {
    final duration = state.duration;

    if (duration == Duration.zero) {
      return;
    }

    final progress = value.clamp(0.0, 1.0);

    final target = Duration(
      milliseconds: (duration.inMilliseconds * progress).round(),
    );

    try {
      await _audioPlayer.seek(target);
    } catch (error) {
      debugPrint('Seek error: $error');
    }
  }

  // =========================================================
  // NEXT
  // =========================================================

  Future<void> next() async {
    if (!state.hasNext) {
      return;
    }

    final nextIndex = state.currentIndex + 1;

    final nextTrack = state.queue[nextIndex];

    await playTrack(nextTrack, queue: state.queue);
  }

  // =========================================================
  // PREVIOUS
  // =========================================================

  Future<void> previous() async {
    if (!state.hasPrevious) {
      return;
    }

    final previousIndex = state.currentIndex - 1;

    final previousTrack = state.queue[previousIndex];

    await playTrack(previousTrack, queue: state.queue);
  }

  // =========================================================
  // STOP
  // =========================================================

  Future<void> stop() async {
    // Làm các request play cũ mất hiệu lực
    _playRequestId++;

    _historyTimer?.cancel();

    _wantsToPlay = false;

    await _saveCurrentHistory(playing: false);

    try {
      await _audioPlayer.stop();
    } catch (error) {
      debugPrint('Stop player error: $error');
    }

    state = const PlayerState();
  }

  // =========================================================
  // CLEAR ERROR
  // =========================================================

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  // =========================================================
  // AUDIO PLAYER LISTENERS
  // =========================================================

  void _listenToPlayer() {
    // -------------------------------------------------------
    // Position
    // -------------------------------------------------------

    _positionSubscription = _audioPlayer.positionStream.listen((position) {
      state = state.copyWith(position: position);
    });

    // -------------------------------------------------------
    // Duration
    // -------------------------------------------------------

    _durationSubscription = _audioPlayer.durationStream.listen((duration) {
      state = state.copyWith(duration: duration ?? Duration.zero);
    });

    // -------------------------------------------------------
    // Player state
    // -------------------------------------------------------

    _playerStateSubscription = _audioPlayer.playerStateStream.listen(
      (playerState) {
        final processingState = playerState.processingState;

        final completed = processingState == ja.ProcessingState.completed;

        final loading =
            processingState == ja.ProcessingState.loading ||
            processingState == ja.ProcessingState.buffering;

        /*
         * playerState.playing là nguồn trạng thái thật
         * của just_audio.
         *
         * Không lấy state.isPlaying làm nguồn quyết định.
         */
        final isPlaying = playerState.playing && !completed;

        state = state.copyWith(isPlaying: isPlaying, isLoading: loading);

        if (completed) {
          unawaited(_handleCompleted());
        }
      },
      onError: (Object error, StackTrace stackTrace) {
        debugPrint('Player state stream error: $error');

        debugPrint('$stackTrace');

        _wantsToPlay = false;

        state = state.copyWith(
          isPlaying: false,
          isLoading: false,
          errorMessage: 'Playback encountered an error.',
        );
      },
    );
  }

  // =========================================================
  // TRACK COMPLETED
  // =========================================================

  Future<void> _handleCompleted() async {
    _historyTimer?.cancel();

    _wantsToPlay = false;

    await _saveCurrentHistory(completed: true, playing: false);

    /*
     * Nếu còn bài tiếp theo thì tự động phát.
     */
    if (state.hasNext) {
      await next();
      return;
    }

    /*
     * Nếu queue đã hết:
     *
     * giữ currentTrack để MiniPlayer vẫn hiển thị,
     * nhưng chuyển icon về Play.
     */
    state = state.copyWith(isPlaying: false, isLoading: false);
  }

  // =========================================================
  // HISTORY TIMER
  // =========================================================

  void _startHistoryTimer() {
    _historyTimer?.cancel();

    _historyTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      unawaited(
        _saveCurrentHistory(playing: _wantsToPlay && _audioPlayer.playing),
      );
    });
  }

  // =========================================================
  // PLAY COUNT
  // =========================================================

  Future<void> _increasePlayCount(HomeTrack track) async {
    if (_lastCountedTrackId == track.id) {
      return;
    }

    _lastCountedTrackId = track.id;

    try {
      await _apiService.increasePlayCountApi(track.id);
    } catch (error) {
      debugPrint('Increase play count error: $error');
    }
  }

  // =========================================================
  // LISTENING HISTORY
  // =========================================================

  Future<void> _saveCurrentHistory({
    bool completed = false,
    required bool playing,
  }) async {
    final track = state.currentTrack;

    if (track == null) {
      return;
    }

    if (track.id.isEmpty) {
      return;
    }

    final resolvedDuration = state.duration == Duration.zero
        ? _audioPlayer.duration ?? Duration.zero
        : state.duration;

    final duration = resolvedDuration.inMilliseconds / 1000;

    final position = state.position.inMilliseconds / 1000;

    /*
     * Nếu vừa load bài và chưa có duration/position
     * thì chưa cần lưu.
     */
    if (duration <= 0 && position <= 0) {
      return;
    }

    try {
      await _apiService.saveListeningProgressApi(
        trackId: track.id,
        position: position,
        duration: duration,
        completed: completed,
        playing: playing,
        sessionId: state.sessionId,
      );
      ref.invalidate(listeningHistoryProvider);
      ref.invalidate(homeFeedProvider);
    } catch (error) {
      debugPrint('Save listening history error: $error');
    }
  }

  void _pushLocalHistory(HomeTrack track) {
    if (track.id.isEmpty) {
      return;
    }

    final item = ListeningHistoryItem(
      track: track,
      progress: 0,
      lastPosition: 0,
      duration: 0,
      completed: false,
      updatedAtMillis: DateTime.now().millisecondsSinceEpoch,
    );

    ref.read(localListeningHistoryProvider.notifier).upsert(item);
  }
}
