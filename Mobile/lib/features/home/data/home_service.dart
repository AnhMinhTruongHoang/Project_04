import 'package:dio/dio.dart';

import '../../../core/network/dio_client.dart';
import '../models/home_data.dart';
import '../models/track_model.dart';

class HomeService {
  Future<HomeData> loadHome() async {
    final responses = await Future.wait<dynamic>([
      _safeGet('/tracks/history/home', query: {'limit': 10}),
      _safeGet('/tracks/because-you-listened', query: {'limit': 10}),
      _safeGet('/tracks/hidden-gems', query: {'limit': 10, 'maxPlays': 1000}),
      _safeGet('/tracks/top', query: {'category': 'ncs', 'limit': 10}),
      _safeGet('/tracks/top', query: {'category': 'kpop', 'limit': 10}),
      _safeGet('/tracks/top', query: {'category': 'pop', 'limit': 10}),
      _safeGet('/tracks/top', query: {'category': 'lofi', 'limit': 10}),
    ]);

    final sections = <HomeSectionData>[];

    final historyData = _dataMap(responses[0]);
    final continueListening = _historyTracks(historyData['continueListening']);
    final recentlyPlayed = _historyTracks(historyData['recentlyPlayed']);

    if (continueListening.isNotEmpty) {
      sections.add(
        HomeSectionData(
          title: 'Continue Listening',
          tracks: continueListening,
        ),
      );
    } else if (recentlyPlayed.isNotEmpty) {
      sections.add(
        HomeSectionData(
          title: 'Recently Played',
          tracks: recentlyPlayed,
        ),
      );
    }

    final becauseData = _dataMap(responses[1]);
    final becauseTracks = _trackList(becauseData['result']);
    final basedOn = _asMap(becauseData['basedOn']);
    final basedOnTitle = basedOn['title']?.toString().trim() ?? '';

    if (becauseTracks.isNotEmpty) {
      sections.add(
        HomeSectionData(
          title: basedOnTitle.isNotEmpty
              ? 'Because You Listened to $basedOnTitle'
              : 'Because You Listened To',
          tracks: becauseTracks,
        ),
      );
    }

    _addSection(sections, 'Hidden Gems', _data(responses[2]));
    _addSection(sections, 'Top NCS', _data(responses[3]));
    _addSection(sections, 'Top KPOP', _data(responses[4]));
    _addSection(sections, 'Top POP', _data(responses[5]));
    _addSection(sections, 'Top LOFI', _data(responses[6]));

    return HomeData(sections: sections);
  }

  Future<dynamic> _safeGet(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    try {
      final response = await DioClient.instance.get<dynamic>(
        path,
        queryParameters: query,
      );
      return response.data;
    } on DioException {
      return null;
    }
  }

  void _addSection(
    List<HomeSectionData> sections,
    String title,
    dynamic raw,
  ) {
    final tracks = _trackList(raw);

    if (tracks.isNotEmpty) {
      sections.add(HomeSectionData(title: title, tracks: tracks));
    }
  }

  dynamic _data(dynamic response) {
    if (response is Map) {
      return response['data'];
    }
    return null;
  }

  Map<String, dynamic> _dataMap(dynamic response) {
    return _asMap(_data(response));
  }

  List<TrackModel> _historyTracks(dynamic raw) {
    if (raw is! List) return const [];

    return raw
        .map((item) => _asMap(item))
        .map((item) => _asMap(item['track']))
        .where((track) => track.isNotEmpty)
        .map(TrackModel.fromJson)
        .where((track) => track.id.isNotEmpty || track.slug?.isNotEmpty == true)
        .toList();
  }

  List<TrackModel> _trackList(dynamic raw) {
    if (raw is! List) return const [];

    return raw
        .map((item) => _asMap(item))
        .where((item) => item.isNotEmpty)
        .map(TrackModel.fromJson)
        .where((track) => track.id.isNotEmpty || track.slug?.isNotEmpty == true)
        .toList();
  }
}

Map<String, dynamic> _asMap(dynamic value) {
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}
