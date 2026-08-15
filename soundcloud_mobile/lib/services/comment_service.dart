import '../core/network/api_client.dart';
import '../models/comment_model.dart';

class CommentService {
  final ApiClient _apiClient;

  CommentService({
    ApiClient? apiClient,
  }) : _apiClient =
      apiClient ?? ApiClient.instance;

  Future<List<CommentModel>> getTrackComments(
      String trackId,
      ) async {
    final response =
    await _apiClient.get(
      '/tracks/$trackId/comments',
    );

    final data =
    _unwrapData(response.data);

    if (data is! List) {
      return const [];
    }

    return data
        .whereType<Map>()
        .map(
          (item) =>
          CommentModel.fromJson(
            Map<String, dynamic>.from(
              item,
            ),
          ),
    )
        .toList();
  }

  Future<CommentModel?> createComment({
    required String trackId,
    required String content,
  }) async {
    final clean =
    content.trim();

    if (clean.isEmpty) {
      return null;
    }

    final response =
    await _apiClient.post(
      '/tracks/$trackId/comments',
      data: {
        'content': clean,
      },
    );

    final data =
    _unwrapData(
      response.data,
    );

    if (data is Map) {
      return CommentModel.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    return null;
  }

  dynamic _unwrapData(
      dynamic responseData,
      ) {
    if (responseData is Map &&
        responseData['data'] != null) {
      return responseData['data'];
    }

    return responseData;
  }
}