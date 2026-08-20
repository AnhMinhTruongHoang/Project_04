import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/home_service.dart';
import '../models/home_feed.dart';

final homeServiceProvider =
Provider<HomeService>((ref) {
  return HomeService();
});

final homeFeedProvider =
FutureProvider<HomeFeed>((ref) async {
  final service =
  ref.read(homeServiceProvider);

  return service.getHome();
});