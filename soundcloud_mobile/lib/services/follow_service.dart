import '../core/network/api_client.dart';

class FollowStatus {
  final bool following;
  final int targetFollowers;
  final int currentUserFollowing;

  const FollowStatus({
    this.following = false,
    this.targetFollowers = 0,
    this.currentUserFollowing = 0,
  });

  factory FollowStatus.fromJson(
      Map<String, dynamic> json,
      ) {
    return FollowStatus(
      following:
      json['following'] == true ||
          json['isFollowing'] == true,

      targetFollowers:
      _int(json['targetFollowers']),

      currentUserFollowing:
      _int(
        json['currentUserFollowing'],
      ),
    );
  }

  static int _int(
      dynamic value,
      ) {
    if (value is int) return value;
    if (value is num) return value.toInt();

    return int.tryParse(
      value?.toString() ?? '',
    ) ??
        0;
  }
}

class FollowService {
  final ApiClient _apiClient;

  FollowService({
    ApiClient? apiClient,
  }) : _apiClient =
      apiClient ?? ApiClient.instance;

  Future<FollowStatus> getFollowStatus(
      String userId,
      ) async {
    final response =
    await _apiClient.get(
      '/users/$userId/follow-status',
    );

    return _parse(
      response.data,
    );
  }

  Future<FollowStatus> follow(
      String userId,
      ) async {
    final response =
    await _apiClient.post(
      '/users/$userId/follow',
    );

    return _parse(
      response.data,
    );
  }

  Future<FollowStatus> unfollow(
      String userId,
      ) async {
    final response =
    await _apiClient.delete(
      '/users/$userId/follow',
    );

    return _parse(
      response.data,
    );
  }

  FollowStatus _parse(
      dynamic responseData,
      ) {
    dynamic data = responseData;

    if (data is Map &&
        data['data'] != null) {
      data = data['data'];
    }

    if (data is Map) {
      return FollowStatus.fromJson(
        Map<String, dynamic>.from(
          data,
        ),
      );
    }

    return const FollowStatus();
  }
}