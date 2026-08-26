import '../../home/models/home_track.dart';

class PlayerState {
  const PlayerState({
    this.currentTrack,
    this.queue = const [],
    this.currentIndex = -1,
    this.isPlaying = false,
    this.isLoading = false,
    this.position = Duration.zero,
    this.duration = Duration.zero,
    this.errorMessage,
    this.sessionId,
  });

  final HomeTrack? currentTrack;
  final List<HomeTrack> queue;
  final int currentIndex;
  final bool isPlaying;
  final bool isLoading;
  final Duration position;
  final Duration duration;
  final String? errorMessage;
  final String? sessionId;

  bool get hasTrack => currentTrack != null;

  bool get hasNext {
    return queue.isNotEmpty &&
        currentIndex >= 0 &&
        currentIndex < queue.length - 1;
  }

  bool get hasPrevious {
    return queue.isNotEmpty && currentIndex > 0;
  }

  double get progress {
    final total = duration.inMilliseconds;

    if (total <= 0) {
      return 0;
    }

    return (position.inMilliseconds / total).clamp(0, 1);
  }

  PlayerState copyWith({
    HomeTrack? currentTrack,
    List<HomeTrack>? queue,
    int? currentIndex,
    bool? isPlaying,
    bool? isLoading,
    Duration? position,
    Duration? duration,
    String? errorMessage,
    String? sessionId,
    bool clearTrack = false,
    bool clearError = false,
    bool clearSession = false,
  }) {
    return PlayerState(
      currentTrack: clearTrack ? null : currentTrack ?? this.currentTrack,
      queue: queue ?? this.queue,
      currentIndex: currentIndex ?? this.currentIndex,
      isPlaying: isPlaying ?? this.isPlaying,
      isLoading: isLoading ?? this.isLoading,
      position: position ?? this.position,
      duration: duration ?? this.duration,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
      sessionId: clearSession ? null : sessionId ?? this.sessionId,
    );
  }
}
