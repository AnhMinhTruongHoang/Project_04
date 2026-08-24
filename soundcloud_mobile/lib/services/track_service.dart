import 'package:flutter/cupertino.dart';

import '../core/network/api_client.dart';
import '../models/category_model.dart';
import '../models/track_model.dart';

class ListeningHistoryItem {
  final TrackModel track;
  final double progress;
  final double lastPosition;
  final double duration;
  final bool completed;

  const ListeningHistoryItem({
    required this.track,
    this.progress = 0,
    this.lastPosition = 0,
    this.duration = 0,
    this.completed = false,
  });

  factory ListeningHistoryItem.fromJson(Map<String, dynamic> json) {
    final trackJson = json['track'];
    if (trackJson is! Map) {
      throw const FormatException('History item không có track');
    }

    return ListeningHistoryItem(
      track: TrackModel.fromJson(Map<String, dynamic>.from(trackJson)),
      progress: _double(json['progress']),
      lastPosition: _double(json['lastPosition']),
      duration: _double(json['duration']),
      completed: json['completed'] == true,
    );
  }

  static double _double(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString() ?? '') ?? 0;
  }
}

class BecauseYouListenedResult {
  final TrackModel? basedOn;
  final List<TrackModel> tracks;

  const BecauseYouListenedResult({this.basedOn, this.tracks = const []});
}

class TrackService {
  final ApiClient _apiClient;

  TrackService({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.instance;

  Future<List<TrackModel>> getTracks({
    int current = 1,
    int pageSize = 20,
  }) async {
    final response = await _apiClient.get(
      '/tracks',
      queryParameters: {'current': current, 'pageSize': pageSize},
    );

    final data = _data(response.data);
    final result = data['result'];
    return _trackList(result);
  }

  Future<List<TrackModel>> getAllApprovedTracks() async {
    final response = await _apiClient.get('/tracks/find-all');
    final data = _data(response.data);
    return _trackList(data['result']);
  }

  Future<List<CategoryModel>> getAllCategories() async {
    final response = await _apiClient.get('/categories/all');
    final data = _unwrapData(response.data);

    if (data is! List) return const [];

    return data
        .whereType<Map>()
        .map((item) => CategoryModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<HomeListeningHistory> getHomeListeningHistory({int limit = 10}) async {
    final stopwatch = Stopwatch()..start();

    debugPrint('========== HISTORY REQUEST START ==========');

    debugPrint('GET /tracks/history/home?limit=$limit');

    try {
      final response = await _apiClient.get(
        '/tracks/history/home',
        queryParameters: {'limit': limit},
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      );

      stopwatch.stop();

      debugPrint('HISTORY RESPONSE STATUS: ${response.statusCode}');

      debugPrint('HISTORY RESPONSE TIME: ${stopwatch.elapsedMilliseconds} ms');

      debugPrint('HISTORY RAW DATA: ${response.data}');

      final data = _data(response.data);

      final continueListening = _historyList(data['continueListening']);

      final recentlyPlayed = _historyList(data['recentlyPlayed']);

      debugPrint('Continue listening: ${continueListening.length}');

      debugPrint('Recently played: ${recentlyPlayed.length}');

      debugPrint('========== HISTORY REQUEST SUCCESS ==========');

      return HomeListeningHistory(
        continueListening: continueListening,
        recentlyPlayed: recentlyPlayed,
      );
    } catch (e, stackTrace) {
      stopwatch.stop();

      debugPrint('========== HISTORY REQUEST ERROR ==========');

      debugPrint('TIME: ${stopwatch.elapsedMilliseconds} ms');

      debugPrint('ERROR: $e');

      debugPrint('STACK: $stackTrace');

      rethrow;
    }
  }

  Future<BecauseYouListenedResult> getBecauseYouListened({
    int limit = 10,
  }) async {
    final response = await _apiClient.get(
      '/tracks/because-you-listened',
      queryParameters: {'limit': limit},
    );

    final data = _data(response.data);
    final basedOnJson = data['basedOn'];

    return BecauseYouListenedResult(
      basedOn: basedOnJson is Map
          ? TrackModel.fromJson(Map<String, dynamic>.from(basedOnJson))
          : null,
      tracks: _trackList(data['result']),
    );
  }

  Future<List<TrackModel>> getHiddenGems({
    int limit = 10,
    int maxPlays = 1000,
  }) async {
    final response = await _apiClient.get(
      '/tracks/hidden-gems',
      queryParameters: {'limit': limit, 'maxPlays': maxPlays},
    );

    return _trackList(_unwrapData(response.data));
  }

  Future<List<TrackModel>> getTopTracksByCategory(String category) async {
    final response = await _apiClient.get(
      '/tracks/top',
      queryParameters: {'category': category},
    );

    return _trackList(_unwrapData(response.data));
  }

  dynamic _unwrapData(dynamic responseData) {
    if (responseData is Map && responseData['data'] != null) {
      return responseData['data'];
    }
    return responseData;
  }

  Map<String, dynamic> _data(dynamic responseData) {
    final data = _unwrapData(responseData);
    if (data is Map) return Map<String, dynamic>.from(data);
    return <String, dynamic>{};
  }

  List<TrackModel> _trackList(dynamic value) {
    if (value is! List) return const [];

    return value
        .whereType<Map>()
        .map((item) => TrackModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  List<ListeningHistoryItem> _historyList(dynamic value) {
    if (value is! List) return const [];

    return value
        .whereType<Map>()
        .map(
          (item) =>
              ListeningHistoryItem.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  Future<void> increasePlayCount(String trackId) async {
    await _apiClient.post('/tracks/$trackId/play');
  }

  Future<void> saveListeningHistory(
    String trackId, {
    required double position,
    required double duration,
    required bool completed,
    required bool playing,
    String? sessionId,
  }) async {
    await _apiClient.post(
      '/tracks/$trackId/history',
      data: {
        if (sessionId != null && sessionId.isNotEmpty) 'sessionId': sessionId,
        'position': position,
        'duration': duration,
        'completed': completed,
        'playing': playing,
      },
    );
  }

  Future<TrackModel?> likeTrack(String trackId) async {
    final response = await _apiClient.post('/tracks/$trackId/like');

    final data = _unwrapData(response.data);

    if (data is Map) {
      return TrackModel.fromJson(Map<String, dynamic>.from(data));
    }

    return null;
  }

  Future<TrackModel?> dislikeTrack(String trackId) async {
    final response = await _apiClient.post('/tracks/$trackId/dislike');

    final data = _unwrapData(response.data);

    if (data is Map) {
      return TrackModel.fromJson(Map<String, dynamic>.from(data));
    }

    return null;
  }

  Future<List<TrackModel>> getLikedTracks() async {
    final response = await _apiClient.get('/tracks/liked');

    final data = _unwrapData(response.data);

    return _trackList(data);
  }
}

class HomeListeningHistory {
  final List<ListeningHistoryItem> continueListening;
  final List<ListeningHistoryItem> recentlyPlayed;

  const HomeListeningHistory({
    this.continueListening = const [],
    this.recentlyPlayed = const [],
  });
}
