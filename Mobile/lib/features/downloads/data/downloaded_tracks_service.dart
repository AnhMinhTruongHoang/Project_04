import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import '../../../core/network/dio_client.dart';
import '../../home/models/home_track.dart';

class DownloadedTrack {
  const DownloadedTrack({required this.track, required this.localPath});

  final HomeTrack track;
  final String localPath;
}

class DownloadedTracksService {
  DownloadedTracksService._();

  static final instance = DownloadedTracksService._();
  Dio get _dio => DioClient.instance;

  Future<Directory> _downloadsDirectory() async {
    final root = await getApplicationDocumentsDirectory();
    final directory = Directory(path.join(root.path, 'downloads'));
    if (!await directory.exists()) await directory.create(recursive: true);
    return directory;
  }

  Future<File> _indexFile() async {
    final directory = await _downloadsDirectory();
    return File(path.join(directory.path, 'tracks.json'));
  }

  Future<List<DownloadedTrack>> getAll() async {
    try {
      final file = await _indexFile();
      if (!await file.exists()) return const [];
      final decoded = jsonDecode(await file.readAsString());
      if (decoded is! List) return const [];

      final downloads = <DownloadedTrack>[];
      for (final value in decoded) {
        if (value is! Map) continue;
        final json = Map<String, dynamic>.from(value);
        final localPath = json['localPath']?.toString() ?? '';
        if (localPath.isEmpty || !await File(localPath).exists()) continue;
        downloads.add(
          DownloadedTrack(
            track: HomeTrack.fromJson(json['track']),
            localPath: localPath,
          ),
        );
      }
      return downloads;
    } catch (_) {
      return const [];
    }
  }

  Future<String?> localPathFor(String trackId) async {
    final item = (await getAll()).where((item) => item.track.id == trackId);
    return item.isEmpty ? null : item.first.localPath;
  }

  Future<DownloadedTrack> download(
    HomeTrack track, {
    void Function(int received, int total)? onProgress,
  }) async {
    final url = track.resolvedTrackUrl;
    if (url == null || url.isEmpty) {
      throw StateError('Track does not have an audio URL.');
    }

    final existing = await localPathFor(track.id);
    if (existing != null) {
      return DownloadedTrack(track: track, localPath: existing);
    }

    final directory = await _downloadsDirectory();
    final uri = Uri.tryParse(url);
    final sourceExtension = path.extension(uri?.path ?? '');
    final extension = sourceExtension.isEmpty ? '.mp3' : sourceExtension;
    final safeId = track.id.replaceAll(RegExp(r'[^a-zA-Z0-9_-]'), '_');
    final destination = path.join(directory.path, '$safeId$extension');

    try {
      await _dio.download(url, destination, onReceiveProgress: onProgress);
      final downloaded = DownloadedTrack(track: track, localPath: destination);
      final items = await getAll();
      await _writeIndex([
        downloaded,
        ...items.where((item) => item.track.id != track.id),
      ]);
      return downloaded;
    } catch (_) {
      final partial = File(destination);
      if (await partial.exists()) await partial.delete();
      rethrow;
    }
  }

  Future<void> remove(String trackId) async {
    final items = await getAll();
    final removed = items.where((item) => item.track.id == trackId);
    for (final item in removed) {
      final file = File(item.localPath);
      if (await file.exists()) await file.delete();
    }
    await _writeIndex(items.where((item) => item.track.id != trackId).toList());
  }

  Future<void> _writeIndex(List<DownloadedTrack> items) async {
    final file = await _indexFile();
    await file.writeAsString(
      jsonEncode(items.map((item) => _toJson(item)).toList()),
      flush: true,
    );
  }

  Map<String, dynamic> _toJson(DownloadedTrack item) => {
    'localPath': item.localPath,
    'track': {
      'id': item.track.id,
      'title': item.track.title,
      'slug': item.track.slug,
      'imgUrl': item.track.imgUrl,
      'trackUrl': item.track.trackUrl,
      'description': item.track.description,
      'category': item.track.category,
      'uploaderId': item.track.uploaderId,
      'uploader': {'name': item.track.uploaderName},
      'countPlay': item.track.countPlay,
      'countLike': item.track.countLike,
      'countComment': item.track.countComment,
      'durationSeconds': item.track.durationSeconds,
      'processingStatus': item.track.processingStatus,
      'licenseReviewStatus': item.track.licenseReviewStatus,
      'approvalStatus': item.track.approvalStatus,
      'createdAt': item.track.createdAt,
    },
  };
}
