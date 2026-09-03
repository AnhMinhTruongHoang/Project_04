import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../data/downloaded_tracks_service.dart';

final downloadsProvider =
    AsyncNotifierProvider<DownloadsController, List<DownloadedTrack>>(
      DownloadsController.new,
    );

class DownloadsController extends AsyncNotifier<List<DownloadedTrack>> {
  @override
  Future<List<DownloadedTrack>> build() {
    return DownloadedTracksService.instance.getAll();
  }

  Future<void> download(HomeTrack track) async {
    state = const AsyncLoading<List<DownloadedTrack>>();
    state = await AsyncValue.guard(() async {
      await DownloadedTracksService.instance.download(track);
      return DownloadedTracksService.instance.getAll();
    });
  }

  Future<void> remove(String trackId) async {
    await DownloadedTracksService.instance.remove(trackId);
    state = AsyncData(await DownloadedTracksService.instance.getAll());
  }
}
