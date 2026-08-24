import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart' as ja;

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../models/player_state.dart';

final playerProvider =
    NotifierProvider<PlayerController, PlayerState>(PlayerController.new);

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

  Future<void> playTrack(
    HomeTrack track, {
    List<HomeTrack>? queue,
  }) async {
    final audioUrl = track.resolvedTrackUrl;

    if (audioUrl == null || audioUrl.isEmpty) {
      state = state.copyWith(
        currentTrack: track,
        errorMessage: 'Track does not have an audio URL.',
        isLoading: false,
      );
      return;
    }

    final requestId = ++_playRequestId;
    final nextQueue = queue == null || queue.isEmpty ? [track] : queue;
    final nextIndex = max(
      0,
      nextQueue.indexWhere((item) => item.id == track.id),
    );

    await _saveCurrentHistory(playing: false);
    _historyTimer?.cancel();
    _wantsToPlay = false;

    state = state.copyWith(
      currentTrack: track,
      queue: nextQueue,
      currentIndex: nextIndex,
      isLoading: true,
      position: Duration.zero,
      duration: Duration.zero,
      clearError: true,
      sessionId: DateTime.now().microsecondsSinceEpoch.toString(),
    );

    try {
      await _audioPlayer.stop();

      if (requestId != _playRequestId) {
        return;
      }

      await _audioPlayer.setUrl(audioUrl);

      if (requestId != _playRequestId) {
        return;
      }

      _wantsToPlay = true;
      await _audioPlayer.play();

      state = state.copyWith(
        isLoading: false,
        isPlaying: true,
      );

      _startHistoryTimer();
      unawaited(_increasePlayCount(track));
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

  Future<void> togglePlayPause() async {
    if (!state.hasTrack || state.isLoading) {
      return;
    }

    final shouldPause = state.isPlaying || _audioPlayer.playing;

    try {
      if (shouldPause) {
        _wantsToPlay = false;
        state = state.copyWith(
          isPlaying: false,
          isLoading: false,
        );
        await _audioPlayer.pause();
        _historyTimer?.cancel();
        state = state.copyWith(
          isPlaying: false,
          isLoading: false,
        );
        await _saveCurrentHistory(playing: false);
      } else {
        _wantsToPlay = true;
        state = state.copyWith(
          isPlaying: true,
          isLoading: false,
        );
        await _audioPlayer.play();
        state = state.copyWith(
          isPlaying: true,
          isLoading: false,
        );
        _startHistoryTimer();
      }
    } catch (error) {
      debugPrint('Toggle play/pause error: $error');
      _wantsToPlay = _audioPlayer.playing;
      state = state.copyWith(errorMessage: 'Unable to control playback.');
    }
  }

  Future<void> seekByProgress(double value) async {
    final duration = state.duration;

    if (duration == Duration.zero) {
      return;
    }

    final target = Duration(
      milliseconds: (duration.inMilliseconds * value.clamp(0, 1)).round(),
    );

    await _audioPlayer.seek(target);
  }

  Future<void> next() async {
    if (!state.hasNext) {
      return;
    }

    final nextTrack = state.queue[state.currentIndex + 1];
    await playTrack(nextTrack, queue: state.queue);
  }

  Future<void> previous() async {
    if (!state.hasPrevious) {
      return;
    }

    final previousTrack = state.queue[state.currentIndex - 1];
    await playTrack(previousTrack, queue: state.queue);
  }

  Future<void> stop() async {
    _playRequestId++;
    _historyTimer?.cancel();
    _wantsToPlay = false;

    await _saveCurrentHistory(playing: false);
    await _audioPlayer.stop();

    state = const PlayerState();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  void _listenToPlayer() {
    _positionSubscription = _audioPlayer.positionStream.listen((position) {
      state = state.copyWith(position: position);
    });

    _durationSubscription = _audioPlayer.durationStream.listen((duration) {
      state = state.copyWith(duration: duration ?? Duration.zero);
    });

    _playerStateSubscription =
        _audioPlayer.playerStateStream.listen((playerState) {
      final completed =
          playerState.processingState == ja.ProcessingState.completed;

      state = state.copyWith(
        isPlaying: _wantsToPlay && _audioPlayer.playing && !completed,
        isLoading:
            _wantsToPlay &&
            playerState.processingState == ja.ProcessingState.loading ||
                _wantsToPlay &&
                playerState.processingState == ja.ProcessingState.buffering,
      );

      if (completed) {
        unawaited(_handleCompleted());
      }
    });
  }

  Future<void> _handleCompleted() async {
    await _saveCurrentHistory(
      completed: true,
      playing: false,
    );

    if (state.hasNext) {
      await next();
      return;
    }

    _historyTimer?.cancel();
    _wantsToPlay = false;
    state = state.copyWith(isPlaying: false);
  }

  void _startHistoryTimer() {
    _historyTimer?.cancel();

    _historyTimer = Timer.periodic(
      const Duration(seconds: 15),
      (_) {
        unawaited(
          _saveCurrentHistory(playing: _wantsToPlay && _audioPlayer.playing),
        );
      },
    );
  }

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

  Future<void> _saveCurrentHistory({
    bool completed = false,
    required bool playing,
  }) async {
    final track = state.currentTrack;

    if (track == null || track.id.isEmpty) {
      return;
    }

    final duration = state.duration.inMilliseconds / 1000;
    final position = state.position.inMilliseconds / 1000;

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
    } catch (error) {
      debugPrint('Save listening history error: $error');
    }
  }
}
