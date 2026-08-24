import '../core/network/api_client.dart';
import '../models/following_user_model.dart';

class FollowStatus {
  final bool following;
  final int targetFollowers;
  final int currentUserFollowing;

  const FollowStatus({
    this.following = false,
    this.targetFollowers = 0,
    this.currentUserFollowing = 0,
  });

  factory FollowStatus.fromJson(Map<String, dynamic> json) {
    return FollowStatus(
      following: json['following'] == true || json['isFollowing'] == true,
      targetFollowers: _int(json['targetFollowers']),
      currentUserFollowing: _int(json['currentUserFollowing']),
    );
  }

  static int _int(dynamic value) {
    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}

class FollowService {
  final ApiClient _apiClient;

  FollowService({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient.instance;

  // ============================================================
  // FOLLOW STATUS
  // ============================================================

  Future<FollowStatus> getFollowStatus(String userId) async {
    final response = await _apiClient.get('/users/$userId/follow-status');

    return _parseStatus(response.data);
  }

  // ============================================================
  // FOLLOW
  // ============================================================

  Future<FollowStatus> follow(String userId) async {
    final response = await _apiClient.post('/users/$userId/follow');

    return _parseStatus(response.data);
  }

  // ============================================================
  // UNFOLLOW
  // ============================================================

  Future<FollowStatus> unfollow(String userId) async {
    final response = await _apiClient.delete('/users/$userId/follow');

    return _parseStatus(response.data);
  }

  // ============================================================
  // MY FOLLOWING
  // ============================================================

  Future<List<FollowingUserModel>> getMyFollowing() async {
    final response = await _apiClient.get('/users/me/following');

    final data = _unwrapData(response.data);

    /*
     * UserController trả:
     *
     * data: {
     *   result: [...],
     *   total: ...
     * }
     */
    dynamic result = data;

    if (data is Map) {
      result = data['result'];
    }

    if (result is! List) {
      return const [];
    }

    return result
        .whereType<Map>()
        .map(
          (item) =>
              FollowingUserModel.fromJson(Map<String, dynamic>.from(item)),
        )
        .where((user) => user.id.trim().isNotEmpty)
        .toList();
  }

  // ============================================================
  // PARSE
  // ============================================================

  FollowStatus _parseStatus(dynamic responseData) {
    final data = _unwrapData(responseData);

    if (data is Map) {
      return FollowStatus.fromJson(Map<String, dynamic>.from(data));
    }

    return const FollowStatus();
  }

  dynamic _unwrapData(dynamic responseData) {
    if (responseData is Map && responseData['data'] != null) {
      return responseData['data'];
    }

    return responseData;
  }
}
