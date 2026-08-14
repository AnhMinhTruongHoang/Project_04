import '../core/network/api_client.dart';
import '../models/artist_model.dart';

class ArtistService {
  final ApiClient _apiClient;

  ArtistService({ApiClient? apiClient})
      : _apiClient = apiClient ?? ApiClient.instance;

  Future<List<ArtistModel>> getWhoToFollow({
    int limit = 12,
  }) async {
    final response = await _apiClient.get(
      '/users/who-to-follow',
      queryParameters: {
        'limit': limit,
      },
    );

    final data = _unwrapData(response.data);

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) => ArtistModel.fromJson(
        Map<String, dynamic>.from(item),
      ),
    )
        .toList();
  }

  Future<List<ArtistModel>> getArtistLeaderboard({
    int limit = 10,
  }) async {
    final response = await _apiClient.get(
      '/users/leaderboard/artists',
      queryParameters: {
        'limit': limit,
      },
    );

    final data = _unwrapData(response.data);

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) => ArtistModel.fromJson(
        Map<String, dynamic>.from(item),
      ),
    )
        .toList();
  }

  dynamic _unwrapData(dynamic responseData) {
    if (responseData is Map &&
        responseData['data'] != null) {
      return responseData['data'];
    }

    return responseData;
  }
}