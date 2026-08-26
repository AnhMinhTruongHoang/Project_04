import 'package:dio/dio.dart';

import 'package:flutter/foundation.dart';
import '../../../core/network/dio_client.dart';
import '../models/home_feed.dart';
import '../models/home_track.dart';

class HomeService {
  HomeService({Dio? dio}) : _dio = dio ?? DioClient.instance;

  final Dio _dio;

  Future<HomeFeed> getHome() async {
    final results = await Future.wait([
      _safeGet(
        '/tracks/hidden-gems',
        queryParameters: {
          'limit': 20,
          'maxPlays': 1000,
        },
      ),

      _safeGet(
        '/tracks/top',
        queryParameters: {
          'category': 'ncs',
          'limit': 20,
        },
      ),

      _safeGet(
        '/tracks/top',
        queryParameters: {
          'category': 'kpop',
          'limit': 20,
        },
      ),

      _safeGet(
        '/tracks/top',
        queryParameters: {
          'category': 'pop',
          'limit': 20,
        },
      ),

      _safeGet(
        '/tracks/top',
        queryParameters: {
          'category': 'lofi',
          'limit': 20,
        },
      ),

      _safeGet(
        '/tracks/history/home',
        queryParameters: {
          'limit': 20,
        },
      ),

      _safeGet(
        '/tracks/because-you-listened',
        queryParameters: {
          'limit': 20,
        },
      ),
      _safeGet(
        '/tracks',
        queryParameters: {
          'current': 1,
          'pageSize': 30,
        },
      ),
    ]);

    // =================================
    // PUBLIC DATA
    // =================================

    final hiddenGems = _trackList(_payload(results[0]));

    final ncsTracks = _trackList(_payload(results[1]));
    final kpopTracks = _trackList(_payload(results[2]));
    final popTracks = _trackList(_payload(results[3]));
    final lofiTracks = _trackList(_payload(results[4]));

    // =================================
    // LISTENING HISTORY
    // =================================

    final historyData = _map(_payload(results[5]));

    final continueListening = _historyTrackList(
      historyData['continueListening'],
    );

    final recentlyPlayed = _historyTrackList(historyData['recentlyPlayed']);

    final historyTracks = continueListening.isNotEmpty
        ? continueListening
        : recentlyPlayed;

    final historyTitle = continueListening.isNotEmpty
        ? 'Continue Listening'
        : 'Recently Played';

    // =================================
    // BECAUSE YOU LISTENED
    // =================================

    final becauseData = _map(_payload(results[6]));

    final becauseTracks = _trackList(becauseData['result']);

    final basedOn = _map(becauseData['basedOn']);

    final basedOnTitle = basedOn['title']?.toString().trim() ?? '';

    final becauseTitle = basedOnTitle.isNotEmpty
        ? 'Because You Listened to $basedOnTitle'
        : 'Because You Listened To';

    final discoverData = _payload(results[7]);
    final discoverTracks = _trackListFromPaged(discoverData);

    return HomeFeed(
      historyTitle: historyTitle,
      historyTracks: historyTracks,
      becauseTitle: becauseTitle,
      becauseTracks: becauseTracks,
      hiddenGems: hiddenGems,
      ncsTracks: ncsTracks,
      kpopTracks: kpopTracks,
      popTracks: popTracks,
      lofiTracks: lofiTracks,
      discoverTracks: discoverTracks,
    );
  }

  Future<dynamic> _safeGet(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);

      return response.data;
    } on DioException catch (error) {
      debugPrint(
        'HOME API ERROR: $path '
        '${error.response?.statusCode}',
      );

      return null;
    } catch (error) {
      debugPrint('HOME API ERROR: $path $error');

      return null;
    }
  }

  dynamic _payload(dynamic response) {
    if (response is Map) {
      final map = Map<String, dynamic>.from(response);

      if (map.containsKey('data')) {
        return map['data'];
      }
    }

    return response;
  }

  Map<String, dynamic> _map(dynamic value) {
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return {};
  }

  List<HomeTrack> _trackList(dynamic value) {
    if (value is! List) {
      return [];
    }

    return value
        .map(HomeTrack.fromJson)
        .where((track) => track.id.isNotEmpty)
        .toList();
  }

  List<HomeTrack> _trackListFromPaged(dynamic value) {
    if (value is List) {
      return _trackList(value);
    }

    final data = _map(value);
    final result = data['result'] ?? data['items'];

    return _trackList(result);
  }

  List<HomeTrack> _historyTrackList(
      dynamic value,
      ) {
    if (value is! List) {
      return [];
    }

    final tracks = <HomeTrack>[];

    for (final item in value) {
      final data = _map(item);

      final trackJson = data['track'];

      if (trackJson == null) {
        continue;
      }

      final track = HomeTrack.fromJson(trackJson);

      if (track.id.isNotEmpty) {
        tracks.add(track);
      }
    }

    return tracks;
  }
}
