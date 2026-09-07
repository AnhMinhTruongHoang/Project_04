import '../../home/models/home_track.dart';

class ListeningHistoryItem {
  const ListeningHistoryItem({
    required this.track,
    this.progress = 0,
    this.lastPosition = 0,
    this.duration = 0,
    this.completed = false,
    this.updatedAtMillis = 0,
  });

  final HomeTrack track;
  final double progress;
  final double lastPosition;
  final double duration;
  final bool completed;
  final int updatedAtMillis;

  factory ListeningHistoryItem.fromJson(dynamic value) {
    if (value is! Map) {
      return const ListeningHistoryItem(
        track: HomeTrack(id: '', title: 'Unknown track'),
      );
    }

    final json = Map<String, dynamic>.from(value);

    return ListeningHistoryItem(
      track: HomeTrack.fromJson(json['track']),
      progress: _double(json['progress']),
      lastPosition: _double(json['lastPosition']),
      duration: _double(json['duration']),
      completed: json['completed'] == true,
      updatedAtMillis: _dateMillis(
        json['updatedAt'] ??
            json['lastPlayedAt'] ??
            json['playedAt'] ??
            json['listenedAt'] ??
            json['createdAt'],
      ),
    );
  }
}

double _double(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

int _dateMillis(dynamic value) {
  if (value is num) {
    return value.toInt();
  }

  return DateTime.tryParse(value?.toString() ?? '')?.millisecondsSinceEpoch ??
      0;
}
