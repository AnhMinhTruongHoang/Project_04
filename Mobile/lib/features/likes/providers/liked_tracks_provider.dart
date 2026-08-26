import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../../services/api/api_service.dart';

final likedTracksProvider = FutureProvider<List<HomeTrack>>((ref) async {
  final api = ApiService.instance;
  final response = await api.getLikedTracksApi();

  if (!response.isSuccess) {
    throw StateError(response.message);
  }

  return api
      .extractResultList(response)
      .map(HomeTrack.fromJson)
      .where((track) => track.id.isNotEmpty)
      .toList();
});
