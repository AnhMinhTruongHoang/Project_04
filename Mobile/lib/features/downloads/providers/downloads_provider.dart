import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../home/models/home_track.dart';
import '../data/downloaded_tracks_service.dart';
import '../data/offline_history_store.dart';
import '../../../services/api/api_service.dart';

final offlineHistoryProvider = Provider<OfflineHistoryStore>((ref) {
  final id = ref.watch(authProvider.select((state) => state.value?.id ?? ''));
  final store = OfflineHistoryStore(id);
  Future<void> sync() => store.sync(
    isCurrentAccount: () =>
        ref.mounted && ref.read(authProvider).value?.id == id,
    send: (event) async {
      final response = await ApiService.instance.saveListeningProgressApi(
        trackId: event['trackId'] as String,
        position: (event['position'] as num).toDouble(),
        duration: (event['duration'] as num).toDouble(),
        completed: event['completed'] == true,
        playing: false,
        // Replayed history must not be interpreted as a live earnings heartbeat.
      );
      return response.isSuccess;
    },
  );
  final timer = Timer.periodic(
    const Duration(seconds: 30),
    (_) => unawaited(sync()),
  );
  ref.onDispose(timer.cancel);
  unawaited(Future<void>.microtask(sync));
  return store;
});

final downloadedTracksServiceProvider = Provider<DownloadedTracksService>((
  ref,
) {
  final id = ref.watch(authProvider.select((state) => state.value?.id ?? ''));
  final service = DownloadedTracksService(id);
  ref.onDispose(service.dispose);
  return service;
});

final legacyDownloadsProvider = FutureProvider<bool>(
  (ref) => ref.watch(downloadedTracksServiceProvider).hasLegacyDownloads(),
);

class DownloadJob {
  const DownloadJob(this.track, {this.progress, this.error});
  final HomeTrack track;
  final double? progress;
  final String? error;
}

final downloadJobsProvider =
    NotifierProvider<DownloadJobs, Map<String, DownloadJob>>(DownloadJobs.new);

class DownloadJobs extends Notifier<Map<String, DownloadJob>> {
  @override
  Map<String, DownloadJob> build() {
    ref.watch(downloadedTracksServiceProvider);
    return {};
  }

  void put(DownloadJob job) => state = {...state, job.track.id: job};
  void remove(String id) => state = {...state}..remove(id);
}

final downloadsProvider =
    AsyncNotifierProvider<DownloadsController, List<DownloadedTrack>>(
      DownloadsController.new,
    );

class DownloadsController extends AsyncNotifier<List<DownloadedTrack>> {
  final _tokens = <String, CancelToken>{};
  @override
  Future<List<DownloadedTrack>> build() {
    final service = ref.watch(downloadedTracksServiceProvider);
    ref.onDispose(() {
      for (final token in _tokens.values) {
        token.cancel();
      }
      _tokens.clear();
    });
    return service.getAll();
  }

  Future<String?> download(HomeTrack track) async {
    if (_tokens.containsKey(track.id)) return 'This track is already queued.';
    final service = ref.read(downloadedTracksServiceProvider);
    final jobs = ref.read(downloadJobsProvider.notifier);
    final token = CancelToken();
    _tokens[track.id] = token;
    jobs.put(DownloadJob(track));
    bool current() =>
        ref.mounted &&
        identical(ref.read(downloadedTracksServiceProvider), service);
    try {
      await service.download(
        track,
        cancelToken: token,
        onProgress: (received, total) {
          if (current()) {
            jobs.put(
              DownloadJob(track, progress: total > 0 ? received / total : null),
            );
          }
        },
      );
      final items = await service.getAll();
      if (current()) {
        state = AsyncData(items);
        jobs.remove(track.id);
      }
      return null;
    } catch (error) {
      final cancelled = error is DioException && CancelToken.isCancel(error);
      final message = _downloadError(error, cancelled: cancelled);
      if (current()) {
        if (cancelled) {
          jobs.remove(track.id);
        } else {
          jobs.put(DownloadJob(track, error: message));
        }
      }
      return message;
    } finally {
      if (identical(_tokens[track.id], token)) _tokens.remove(track.id);
    }
  }

  String _downloadError(Object error, {required bool cancelled}) {
    if (cancelled) return 'Download cancelled.';
    if (error is DioException) {
      final status = error.response?.statusCode;
      if (status == 401 || status == 403) {
        return 'You do not have permission to download this track.';
      }
      if (status == 404) return 'The audio file was not found on the server.';
      if (kIsWeb &&
          (error.type == DioExceptionType.connectionError ||
              error.type == DioExceptionType.unknown)) {
        return 'Chrome could not access the audio file. Check the server CORS policy and URL.';
      }
      if (error.type == DioExceptionType.connectionTimeout ||
          error.type == DioExceptionType.receiveTimeout) {
        return 'The download timed out. Please retry.';
      }
    }
    final detail = error.toString().toLowerCase();
    if (detail.contains('quota')) {
      return 'Browser storage is full. Free site storage and retry.';
    }
    if (detail.contains('blocked')) {
      return 'Browser storage is blocked. Close other app tabs and retry.';
    }
    if (detail.contains('audio file') || detail.contains('stream')) {
      return error.toString().replaceFirst('Bad state: ', '');
    }
    return 'Could not save this track for offline playback.';
  }

  void cancel(String id) => _tokens[id]?.cancel();

  Future<void> importLegacy() async {
    final service = ref.read(downloadedTracksServiceProvider);
    await service.importLegacy();
    final items = await service.getAll();
    if (ref.mounted &&
        identical(ref.read(downloadedTracksServiceProvider), service)) {
      state = AsyncData(items);
    }
  }

  Future<void> remove(String trackId) async {
    final service = ref.read(downloadedTracksServiceProvider);
    await service.remove(trackId);
    final items = await service.getAll();
    if (ref.mounted &&
        identical(ref.read(downloadedTracksServiceProvider), service)) {
      state = AsyncData(items);
    }
  }
}
