import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/home_service.dart';
import '../models/home_data.dart';

final homeProvider = FutureProvider.autoDispose<HomeData>((ref) async {
  return HomeService().loadHome();
});
