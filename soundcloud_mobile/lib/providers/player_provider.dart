import 'dart:async';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import '../models/track_model.dart';
import '../services/track_service.dart';

class PlayerProvider extends ChangeNotifier {
  final AudioPlayer _player = AudioPlayer();
  final TrackService _trackService = TrackService();

  TrackModel? _currentTrack;

  List<TrackModel> _queue = const [];
  int _currentIndex = -1;

  bool _isLoading = false;
  String? _errorMessage;

  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;

  // ============================================================
  // LIKE
  // ============================================================

  final Set<String> _likedTrackIds = <String>{};

  bool _isLikeLoading = false;
  bool _likedLoaded = false;

  int _currentLikeCount = 0;

  // ============================================================
  // HISTORY
  // ============================================================

  Timer? _historyTimer;

  String? _sessionId;

  String? _lastCountedTrackId;

  // ============================================================
  // PLAY REQUEST CONTROL
  // ============================================================

  /*
   * Mỗi lần playTrack() được gọi sẽ tăng request id.
   *
   * Nếu người dùng bấm:
   *
   * Track A
   * Track B
   * Track C
   *
   * rất nhanh thì request của A/B sẽ tự bị xem là cũ.
   *
   * Chỉ request mới nhất được quyền tiếp tục play.
   */
  int _playRequestId = 0;

  // ============================================================
  // STREAM
  // ============================================================

  StreamSubscription<Duration>? _positionSubscription;

  StreamSubscription<Duration?>? _durationSubscription;

  StreamSubscription<PlayerState>? _playerStateSubscription;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  PlayerProvider() {
    _listenPlayer();
  }

  // ============================================================
  // GETTERS
  // ============================================================

  TrackModel? get currentTrack => _currentTrack;

  List<TrackModel> get queue => _queue;

  int get currentIndex => _currentIndex;

  bool get hasTrack => _currentTrack != null;

  bool get isLoading => _isLoading;

  bool get isPlaying => _player.playing;

  String? get errorMessage => _errorMessage;

  Duration get position => _position;

  Duration get duration => _duration;

  bool get isLikeLoading => _isLikeLoading;

  int get currentLikeCount => _currentLikeCount;

  Set<String> get likedTrackIds => Set.unmodifiable(_likedTrackIds);

  bool get hasNext =>
      _queue.isNotEmpty &&
      _currentIndex >= 0 &&
      _currentIndex < _queue.length - 1;

  bool get hasPrevious => _queue.isNotEmpty && _currentIndex > 0;

  bool get isCurrentTrackLiked {
    final track = _currentTrack;

    if (track == null) {
      return false;
    }

    return _likedTrackIds.contains(track.id);
  }

  bool isTrackLiked(String trackId) {
    return _likedTrackIds.contains(trackId);
  }

  double get progress {
    if (_duration.inMilliseconds <= 0) {
      return 0;
    }

    return (_position.inMilliseconds / _duration.inMilliseconds).clamp(
      0.0,
      1.0,
    );
  }

  // ============================================================
  // LOAD LIKED TRACKS
  // ============================================================

  Future<void> loadLikedTracks({bool force = false}) async {
    if (_likedLoaded && !force) {
      return;
    }

    try {
      final likedTracks = await _trackService.getLikedTracks();

      _likedTrackIds
        ..clear()
        ..addAll(likedTracks.map((track) => track.id));

      _likedLoaded = true;

      notifyListeners();
    } catch (e) {
      debugPrint('Load liked tracks error: $e');
    }
  }

  // ============================================================
  // TOGGLE LIKE CURRENT TRACK
  // ============================================================

  Future<void> toggleLike() async {
    final track = _currentTrack;

    if (track == null || _isLikeLoading) {
      return;
    }

    final wasLiked = _likedTrackIds.contains(track.id);

    final oldLikeCount = _currentLikeCount;

    _isLikeLoading = true;

    /*
   * Optimistic UI:
   * tim và count thay đổi ngay.
   */
    if (wasLiked) {
      _likedTrackIds.remove(track.id);

      _currentLikeCount = (_currentLikeCount - 1).clamp(0, 2147483647);
    } else {
      _likedTrackIds.add(track.id);

      _currentLikeCount++;
    }

    notifyListeners();

    try {
      TrackModel? updatedTrack;

      if (wasLiked) {
        updatedTrack = await _trackService.dislikeTrack(track.id);
      } else {
        updatedTrack = await _trackService.likeTrack(track.id);
      }

      /*
     * BE trả Track mới thì lấy countLike
     * thật từ database.
     */
      if (updatedTrack != null && _currentTrack?.id == track.id) {
        _currentLikeCount = updatedTrack.countLike;
      }

      debugPrint(
        wasLiked
            ? 'Track disliked: ${track.title} '
                  'likes=$_currentLikeCount'
            : 'Track liked: ${track.title} '
                  'likes=$_currentLikeCount',
      );
    } catch (e) {
      /*
     * API lỗi -> rollback cả tim và count.
     */
      if (wasLiked) {
        _likedTrackIds.add(track.id);
      } else {
        _likedTrackIds.remove(track.id);
      }

      _currentLikeCount = oldLikeCount;

      debugPrint('Toggle like error: $e');

      rethrow;
    } finally {
      _isLikeLoading = false;

      notifyListeners();
    }
  }

  // ============================================================
  // TOGGLE LIKE ANY TRACK
  // ============================================================

  Future<void> toggleLikeTrack(TrackModel track) async {
    if (_isLikeLoading) {
      return;
    }

    _isLikeLoading = true;

    notifyListeners();

    final wasLiked = _likedTrackIds.contains(track.id);

    /*
     * Optimistic UI.
     */
    if (wasLiked) {
      _likedTrackIds.remove(track.id);
    } else {
      _likedTrackIds.add(track.id);
    }

    notifyListeners();

    try {
      if (wasLiked) {
        await _trackService.dislikeTrack(track.id);

        debugPrint('Track disliked: ${track.title}');
      } else {
        await _trackService.likeTrack(track.id);

        debugPrint('Track liked: ${track.title}');
      }
    } catch (e) {
      /*
       * API lỗi -> rollback UI.
       */
      if (wasLiked) {
        _likedTrackIds.add(track.id);
      } else {
        _likedTrackIds.remove(track.id);
      }

      debugPrint('Toggle like error: $e');

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
    _positionSubscription = _player.positionStream.listen((position) {
      _position = position;

      notifyListeners();
    });

    _durationSubscription = _player.durationStream.listen((duration) {
      _duration = duration ?? Duration.zero;

      notifyListeners();
    });

    _playerStateSubscription = _player.playerStateStream.listen((state) {
      notifyListeners();

      if (state.processingState == ProcessingState.completed) {
        unawaited(_handleCompleted());
      }
    });
  }

  // ============================================================
  // PLAY TRACK
  // ============================================================

  Future<void> playTrack(TrackModel track, {List<TrackModel>? queue}) async {
    if (track.trackUrl == null || track.trackUrl!.trim().isEmpty) {
      _errorMessage = 'Track không có audio URL';

      notifyListeners();

      return;
    }

    /*
     * Tạo request mới.
     */
    final requestId = ++_playRequestId;

    // ==========================================================
    // SAME TRACK
    // ==========================================================

    if (_currentTrack?.id == track.id) {
      if (!_player.playing) {
        try {
          unawaited(_player.play());

          _startHistoryTimer();

          notifyListeners();
        } catch (e) {
          debugPrint('Resume current track error: $e');
        }
      }

      return;
    }

    try {
      _isLoading = true;
      _errorMessage = null;

      notifyListeners();

      // ========================================================
      // SAVE OLD TRACK HISTORY
      // ========================================================

      /*
       * Không await vì backend history có thể chậm.
       * Không cho history chặn việc đổi bài.
       */
      if (_currentTrack != null) {
        unawaited(_saveCurrentHistory(playing: false));
      }

      _stopHistoryTimer();

      // ========================================================
      // QUEUE
      // ========================================================

      if (queue != null && queue.isNotEmpty) {
        _queue = List<TrackModel>.from(queue);

        _currentIndex = _queue.indexWhere((item) => item.id == track.id);

        /*
         * Track không nằm trong queue.
         */
        if (_currentIndex < 0) {
          _queue = [track, ..._queue];

          _currentIndex = 0;
        }
      } else {
        _queue = [track];

        _currentIndex = 0;
      }

      // ========================================================
      // CURRENT TRACK
      // ========================================================

      _currentTrack = track;
      _currentLikeCount = track.countLike;

      _position = Duration.zero;
      _duration = Duration.zero;

      _sessionId = _createSessionId();

      notifyListeners();

      // ========================================================
      // DEBUG
      // ========================================================

      debugPrint('================ PLAYER ================');

      debugPrint('TITLE   : ${track.title}');

      debugPrint('ID      : ${track.id}');

      debugPrint('AUDIO   : ${track.trackUrl}');

      debugPrint('REQUEST : $requestId');

      debugPrint('========================================');

      // ========================================================
      // STOP OLD AUDIO
      // ========================================================

      await _player.stop();

      if (requestId != _playRequestId) {
        debugPrint('Play request $requestId cancelled after stop');

        return;
      }

      // ========================================================
      // LOAD NEW AUDIO
      // ========================================================

      await _player.setUrl(track.trackUrl!);

      if (requestId != _playRequestId) {
        debugPrint('Play request $requestId cancelled after setUrl');

        return;
      }

      // ========================================================
      // RESET POSITION
      // ========================================================

      await _player.seek(Duration.zero);

      if (requestId != _playRequestId) {
        return;
      }

      // ========================================================
      // PLAY COUNT
      // ========================================================

      await _increasePlayCount(track);

      if (requestId != _playRequestId) {
        return;
      }

      // ========================================================
      // PLAY
      // ========================================================

      /*
       * QUAN TRỌNG:
       *
       * Không await _player.play().
       *
       * play() có thể tồn tại cho tới khi audio pause,
       * stop hoặc completed.
       *
       * Nếu await, nhiều playTrack() có thể chạy chồng nhau
       * trên Flutter Web.
       */
      unawaited(_player.play());

      // ========================================================
      // HISTORY TIMER
      // ========================================================

      /*
       * Không save history ngay khi 0s.
       * Timer sẽ gửi heartbeat sau 15 giây.
       */
      _startHistoryTimer();
    } catch (e, stackTrace) {
      /*
       * Request cũ không được phép ghi đè lỗi
       * của request mới.
       */
      if (requestId != _playRequestId) {
        return;
      }

      debugPrint('Play track error: $e');

      debugPrint('$stackTrace');

      _errorMessage = 'Không thể phát bài hát';

      _stopHistoryTimer();
    } finally {
      /*
       * Request cũ không được quyền thay loading
       * của request mới.
       */
      if (requestId == _playRequestId) {
        _isLoading = false;

        notifyListeners();
      }
    }
  }

  // ============================================================
  // PLAY COUNT
  // ============================================================

  Future<void> _increasePlayCount(TrackModel track) async {
    if (_lastCountedTrackId == track.id) {
      return;
    }

    try {
      await _trackService.increasePlayCount(track.id);

      _lastCountedTrackId = track.id;

      debugPrint('Play count increased: ${track.id}');
    } catch (e) {
      /*
       * API play count lỗi không làm audio dừng.
       */
      debugPrint('Increase play count error: $e');
    }
  }

  // ============================================================
  // PLAY / PAUSE
  // ============================================================

  Future<void> togglePlayPause() async {
    if (_currentTrack == null) {
      return;
    }

    try {
      if (_player.playing) {
        // ------------------------------------------------------
        // PAUSE
        // ------------------------------------------------------

        await _player.pause();

        _stopHistoryTimer();

        await _saveCurrentHistory(playing: false);
      } else {
        // ------------------------------------------------------
        // RESUME
        // ------------------------------------------------------

        unawaited(_player.play());

        _startHistoryTimer();
      }
    } catch (e) {
      debugPrint('Toggle play/pause error: $e');
    }

    notifyListeners();
  }

  // ============================================================
  // SEEK
  // ============================================================

  Future<void> seek(Duration position) async {
    try {
      await _player.seek(position);

      _position = position;

      notifyListeners();
    } catch (e) {
      debugPrint('Seek error: $e');
    }
  }

  Future<void> seekByProgress(double value) async {
    if (_duration.inMilliseconds <= 0) {
      return;
    }

    final safeValue = value.clamp(0.0, 1.0);

    final milliseconds = (_duration.inMilliseconds * safeValue).round();

    await seek(Duration(milliseconds: milliseconds));
  }

  // ============================================================
  // NEXT
  // ============================================================

  Future<void> next() async {
    if (_queue.isEmpty) {
      return;
    }

    if (_currentIndex < 0 || _currentIndex + 1 >= _queue.length) {
      await _saveCurrentHistory(playing: false);

      _stopHistoryTimer();

      return;
    }

    /*
     * Không save history ở đây.
     *
     * playTrack() sẽ snapshot bài cũ.
     * Tránh gửi history hai lần.
     */
    final nextTrack = _queue[_currentIndex + 1];

    /*
     * Cho phép bài mới tăng play count.
     */
    _lastCountedTrackId = null;

    await playTrack(nextTrack, queue: _queue);
  }

  // ============================================================
  // PREVIOUS
  // ============================================================

  Future<void> previous() async {
    if (_queue.isEmpty) {
      return;
    }

    /*
     * Nếu đã nghe hơn 3 giây:
     * previous = quay về đầu bài.
     */
    if (_position.inSeconds > 3) {
      await seek(Duration.zero);

      return;
    }

    if (_currentIndex <= 0) {
      await seek(Duration.zero);

      return;
    }

    final previousTrack = _queue[_currentIndex - 1];

    _lastCountedTrackId = null;

    await playTrack(previousTrack, queue: _queue);
  }

  // ============================================================
  // COMPLETED
  // ============================================================

  Future<void> _handleCompleted() async {
    _stopHistoryTimer();

    await _saveCurrentHistory(playing: false, forceCompleted: true);

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

    _historyTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      if (_player.playing && _currentTrack != null) {
        unawaited(_saveCurrentHistory(playing: true));
      }
    });
  }

  void _stopHistoryTimer() {
    _historyTimer?.cancel();

    _historyTimer = null;
  }

  // ============================================================
  // SAVE HISTORY
  // ============================================================

  Future<void> _saveCurrentHistory({
    required bool playing,
    bool forceCompleted = false,
  }) async {
    final track = _currentTrack;

    if (track == null) {
      return;
    }

    final durationSeconds = _duration.inMilliseconds / 1000.0;

    final positionSeconds = _position.inMilliseconds / 1000.0;

    /*
     * Audio chưa load duration.
     */
    if (durationSeconds <= 0) {
      return;
    }

    final completed =
        forceCompleted || positionSeconds / durationSeconds >= 0.95;

    try {
      await _trackService.saveListeningHistory(
        track.id,
        position: positionSeconds,
        duration: durationSeconds,
        completed: completed,
        playing: playing,
        sessionId: _sessionId,
      );

      debugPrint(
        'History saved: '
        '${track.title} '
        '${positionSeconds.toStringAsFixed(1)}/'
        '${durationSeconds.toStringAsFixed(1)} '
        'completed=$completed '
        'playing=$playing',
      );
    } catch (e) {
      /*
       * Backend history hiện có thể trả duplicate.
       * Không làm Player ngừng hoạt động.
       */
      debugPrint('Save listening history error: $e');
    }
  }

  // ============================================================
  // SESSION
  // ============================================================

  String _createSessionId() {
    final timestamp = DateTime.now().millisecondsSinceEpoch;

    final random = Random().nextInt(999999999);

    return 'flutter-$timestamp-$random';
  }

  // ============================================================
  // STOP
  // ============================================================

  Future<void> stop() async {
    /*
     * Hủy tất cả playTrack() đang chạy.
     */
    ++_playRequestId;

    await _saveCurrentHistory(playing: false);

    _stopHistoryTimer();

    try {
      await _player.stop();
    } catch (e) {
      debugPrint('Stop player error: $e');
    }

    _currentTrack = null;

    _currentLikeCount = 0;

    _queue = const <TrackModel>[];

    _currentIndex = -1;

    _position = Duration.zero;

    _duration = Duration.zero;

    _sessionId = null;

    _lastCountedTrackId = null;

    _errorMessage = null;

    _isLoading = false;

    notifyListeners();
  }

  // ============================================================
  // FORMAT DURATION
  // ============================================================

  String formatDuration(Duration duration) {
    if (duration.inHours > 0) {
      final hours = duration.inHours;

      final minutes = duration.inMinutes.remainder(60);

      final seconds = duration.inSeconds.remainder(60);

      return '$hours:'
          '${minutes.toString().padLeft(2, '0')}:'
          '${seconds.toString().padLeft(2, '0')}';
    }

    final minutes = duration.inMinutes;

    final seconds = duration.inSeconds.remainder(60);

    return '$minutes:'
        '${seconds.toString().padLeft(2, '0')}';
  }

  // ============================================================
  // DISPOSE
  // ============================================================

  @override
  void dispose() {
    /*
     * Hủy các request đang chạy.
     */
    ++_playRequestId;

    if (_currentTrack != null) {
      unawaited(_saveCurrentHistory(playing: false));
    }

    _stopHistoryTimer();

    _positionSubscription?.cancel();

    _durationSubscription?.cancel();

    _playerStateSubscription?.cancel();

    _player.dispose();

    super.dispose();
  }
}
