part of 'profile_screen.dart';

final _fullProfileProvider = FutureProvider.family<UserModel, String>((
  ref,
  userId,
) async {
  final response = await ApiService.instance.getUserByIdApi(userId);
  if (!response.isSuccess || response.data is! Map) {
    throw StateError(response.message);
  }
  return UserModel.fromJson(Map<String, dynamic>.from(response.data as Map));
});

final profileTracksProvider = FutureProvider.family<List<HomeTrack>, String>((
  ref,
  userId,
) async {
  final api = ApiService.instance;
  final response = await api.getTracksByUserApi(
    userId: userId,
    current: 1,
    pageSize: 100,
  );

  if (!response.isSuccess) {
    throw StateError(response.message);
  }

  return api
      .extractResultList(response)
      .map(HomeTrack.fromJson)
      .where((track) => track.id.isNotEmpty)
      .toList();
});

final profilePlaylistsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      userId,
    ) async {
      final api = ApiService.instance;
      final response = await api.getUserPlaylistsApi(userId);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      return api.extractResultList(response).whereType<Map>().map((item) {
        return Map<String, dynamic>.from(item);
      }).toList();
    });

final _profileEventsProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      artistId,
    ) async {
      final response = await ApiService.instance.getPublicArtistEventsApi(
        artistId: artistId,
        current: 1,
        pageSize: 50,
      );
      return _mapItems(response);
    });

final _profileMembershipProvider =
    FutureProvider.family<_MembershipData, String>((ref, artistId) async {
      final api = ApiService.instance;
      final responses = await Future.wait([
        api.getArtistMembershipPlansApi(artistId),
        api.getArtistMembershipPostsApi(
          artistId: artistId,
          current: 1,
          pageSize: 20,
        ),
      ]);

      return _MembershipData(
        plans: _mapItems(responses[0]),
        posts: _mapItems(responses[1]),
      );
    });

final _profileTicketsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final response = await ApiService.instance.getMyTicketsApi(
    current: 1,
    pageSize: 50,
  );
  return _mapItems(response);
});

final _profileBadgesProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String>((
      ref,
      userId,
    ) async {
      final response = await ApiService.instance.getUserBadgesApi(userId);
      if (!response.isSuccess || response.data is! List) return const [];
      return (response.data as List)
          .whereType<Map>()
          .map(Map<String, dynamic>.from)
          .where((item) {
            final badge = item['badge'];
            return item['active'] != false &&
                badge is Map &&
                badge['active'] != false;
          })
          .toList();
    });

class _MembershipData {
  const _MembershipData({required this.plans, required this.posts});

  final List<Map<String, dynamic>> plans;
  final List<Map<String, dynamic>> posts;
}

List<Map<String, dynamic>> _mapItems(ApiResponse<dynamic> response) {
  if (!response.isSuccess) {
    throw StateError(response.message);
  }

  dynamic raw = response.data;
  if (raw is Map) {
    raw = raw['items'] ?? raw['result'] ?? raw['content'] ?? const [];
  }

  if (raw is! List) {
    return const [];
  }

  return raw.whereType<Map>().map(Map<String, dynamic>.from).toList();
}
