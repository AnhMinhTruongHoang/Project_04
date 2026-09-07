import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

import '../../../core/config/api_config.dart';
import '../../../core/network/dio_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../home/models/home_track.dart';

class DownloadedTrack {
  const DownloadedTrack({
    required this.track,
    required this.localPath,
    this.artworkPath,
    this.bytes = 0,
  });
  final HomeTrack track;
  final String localPath;
  final String? artworkPath;
  final int bytes;
}

/// Account-scoped store. Each track has an atomic commit marker; mutations
/// are serialized so concurrent operations cannot overwrite another track.
class DownloadedTracksService {
  DownloadedTracksService(
    this.accountId, {
    Dio? dio,
    Future<Directory> Function()? rootDirectory,
  }) : _dio =
           dio ??
           Dio(
             BaseOptions(
               connectTimeout: const Duration(seconds: 30),
               receiveTimeout: const Duration(seconds: 60),
             ),
           ),
       _authenticatedDio = dio ?? DioClient.instance,
       _rootDirectory = rootDirectory ?? getApplicationDocumentsDirectory;

  final String accountId;
  final Dio _dio;
  final Dio _authenticatedDio;
  final Future<Directory> Function() _rootDirectory;
  Future<void> _tail = Future.value();

  void dispose() {}

  static String _key(String value) =>
      base64Url.encode(utf8.encode(value)).replaceAll('=', '');

  Future<Directory> _directory(String trackId) async {
    if (accountId.isEmpty || trackId.isEmpty) {
      throw StateError('Missing account or track.');
    }
    final root = await _rootDirectory();
    return Directory(
      path.join(root.path, 'offline', _key(accountId), _key(trackId)),
    );
  }

  Future<T> _serial<T>(Future<T> Function() action) {
    final result = _tail.then((_) => action());
    _tail = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return result;
  }

  Future<DownloadedTrack?> _read(Directory directory) async {
    final marker = File(path.join(directory.path, 'track.json'));
    if (!await marker.exists()) return null;
    try {
      final json =
          jsonDecode(await marker.readAsString()) as Map<String, dynamic>;
      final filename = json['audioFile'] as String? ?? 'audio.mp3';
      if (!RegExp(
        r'^audio\.(mp3|m4a|aac|wav|ogg|flac|opus|webm)$',
      ).hasMatch(filename)) {
        return null;
      }
      final audio = File(path.join(directory.path, filename));
      final bytes = json['bytes'] as int;
      if (bytes <= 0 ||
          !await audio.exists() ||
          await audio.length() != bytes) {
        return null;
      }
      final artwork = File(path.join(directory.path, 'cover'));
      return DownloadedTrack(
        track: HomeTrack.fromJson(json['track']),
        localPath: audio.path,
        bytes: bytes,
        artworkPath: await artwork.exists() ? artwork.path : null,
      );
    } on FormatException {
      return null;
    } on TypeError {
      return null;
    }
  }

  Future<List<DownloadedTrack>> getAll() async {
    if (accountId.isEmpty) return [];
    final root = await _rootDirectory();
    final directory = Directory(
      path.join(root.path, 'offline', _key(accountId)),
    );
    if (!await directory.exists()) return [];
    final items = <DownloadedTrack>[];
    await for (final entry in directory.list(followLinks: false)) {
      if (entry is Directory) {
        final item = await _read(entry);
        if (item != null) items.add(item);
      }
    }
    items.sort((a, b) => a.track.title.compareTo(b.track.title));
    return items;
  }

  Future<String?> localPathFor(String trackId) async {
    if (accountId.isEmpty || trackId.isEmpty) return null;
    return (await _read(await _directory(trackId)))?.localPath;
  }

  Future<bool> hasLegacyDownloads() async {
    final root = await _rootDirectory();
    return File(path.join(root.path, 'downloads', 'tracks.json')).exists();
  }

  /// Old files have no owner: import only on user action, keeping originals.
  Future<void> importLegacy() => _serial(() async {
    final root = await _rootDirectory();
    final legacyRoot = path.join(root.path, 'downloads');
    final index = File(path.join(legacyRoot, 'tracks.json'));
    if (!await index.exists()) return;
    final entries = jsonDecode(await index.readAsString());
    if (entries is! List) {
      throw const FormatException('Invalid legacy downloads.');
    }
    for (final entry in entries) {
      if (entry is! Map) continue;
      final track = HomeTrack.fromJson(entry['track']);
      if (track.id.isEmpty) continue;
      final filename = path.basename(entry['localPath']?.toString() ?? '');
      if (filename.isEmpty) continue;
      final source = File(path.join(legacyRoot, filename));
      if (!await source.exists()) continue;
      if (!path.isWithin(
        await Directory(legacyRoot).resolveSymbolicLinks(),
        await source.resolveSymbolicLinks(),
      )) {
        continue;
      }
      final bytes = await source.length();
      if (bytes <= 0) continue;
      final directory = await _directory(track.id);
      if (await _read(directory) != null) continue;
      final extension = path.extension(filename).toLowerCase();
      if (![
        '.mp3',
        '.m4a',
        '.aac',
        '.wav',
        '.ogg',
        '.flac',
        '.opus',
        '.webm',
      ].contains(extension)) {
        continue;
      }
      await directory.create(recursive: true);
      final audioFile = 'audio$extension';
      final partial = await source.copy(
        path.join(directory.path, 'audio.part'),
      );
      await partial.rename(path.join(directory.path, audioFile));
      final marker = File(path.join(directory.path, 'track.json.part'));
      await marker.writeAsString(
        jsonEncode({
          'track': track.toJson(),
          'bytes': bytes,
          'audioFile': audioFile,
        }),
        flush: true,
      );
      await marker.rename(path.join(directory.path, 'track.json'));
    }
  });

  Future<Response<dynamic>> _fetch(
    String url,
    String destination,
    CancelToken? cancelToken,
    void Function(int, int)? onProgress,
  ) async {
    var uri = Uri.parse(url);
    for (var redirects = 0; redirects < 6; redirects++) {
      if (uri.scheme != 'http' && uri.scheme != 'https') {
        throw StateError('Invalid media URL.');
      }
      final trusted = uri.origin == Uri.parse(ApiConfig.baseUrl).origin;
      final token = trusted ? await TokenStorage.getAccessToken() : null;
      final response = await (trusted ? _authenticatedDio : _dio).download(
        uri.toString(),
        destination,
        cancelToken: cancelToken,
        onReceiveProgress: onProgress,
        options: Options(
          followRedirects: false,
          validateStatus: (status) =>
              status != null && status >= 200 && status < 400,
          headers: {
            'Accept': '*/*',
            if (token != null && token.isNotEmpty)
              'Authorization': 'Bearer $token',
          },
        ),
      );
      if ((response.statusCode ?? 0) < 300) return response;
      final location = response.headers.value('location');
      if (location == null) {
        throw StateError('Missing media redirect location.');
      }
      uri = uri.resolve(location);
    }
    throw StateError('Too many media redirects.');
  }

  Future<DownloadedTrack> download(
    HomeTrack track, {
    void Function(int received, int total)? onProgress,
    CancelToken? cancelToken,
  }) => _serial(() async {
    if (cancelToken?.isCancelled == true) throw cancelToken!.cancelError!;
    final directory = await _directory(track.id);
    final existing = await _read(directory);
    if (existing != null) return existing;
    final url = track.resolvedTrackUrl;
    if (url == null || url.isEmpty) {
      throw StateError('Track does not have an audio URL.');
    }
    final extension = path.extension(Uri.parse(url).path).toLowerCase();
    if (extension == '.m3u8' || extension == '.mpd') {
      throw StateError('This stream requires a downloadable audio file.');
    }
    final audioFile =
        'audio${['.mp3', '.m4a', '.aac', '.wav', '.ogg', '.flac', '.opus', '.webm'].contains(extension) ? extension : '.mp3'}';
    await directory.create(recursive: true);
    final partial = File(path.join(directory.path, 'audio.part'));
    final marker = File(path.join(directory.path, 'track.json'));
    if (await marker.exists()) await marker.delete();
    try {
      var expected = -1;
      final response = await _fetch(url, partial.path, cancelToken, (
        received,
        total,
      ) {
        expected = total;
        onProgress?.call(received, total);
      });
      final contentType = response.headers.value('content-type') ?? '';
      if (contentType.contains('text/') ||
          contentType.contains('json') ||
          contentType.contains('mpegurl')) {
        throw StateError('Server did not return an audio file.');
      }
      final bytes = await partial.length();
      if (bytes == 0 || (expected > 0 && bytes != expected)) {
        throw StateError('Incomplete audio download.');
      }
      if (cancelToken?.isCancelled == true) throw cancelToken!.cancelError!;
      await partial.rename(path.join(directory.path, audioFile));
      final cover = File(path.join(directory.path, 'cover.part'));
      final imageUrl = track.resolvedImageUrl;
      if (imageUrl != null) {
        try {
          await _fetch(imageUrl, cover.path, cancelToken, null);
          if (await cover.length() > 0) {
            await cover.rename(path.join(directory.path, 'cover'));
          }
        } on DioException catch (e) {
          if (CancelToken.isCancel(e)) rethrow;
          // A cover failure must not discard valid audio.
        } finally {
          if (await cover.exists()) await cover.delete();
        }
      }
      if (cancelToken?.isCancelled == true) throw cancelToken!.cancelError!;
      final temp = File(path.join(directory.path, 'track.json.part'));
      await temp.writeAsString(
        jsonEncode({
          'track': track.toJson(),
          'bytes': bytes,
          'audioFile': audioFile,
        }),
        flush: true,
      );
      await temp.rename(marker.path);
      return (await _read(directory))!;
    } finally {
      if (await partial.exists()) await partial.delete();
      if (!await marker.exists()) {
        for (final name in [audioFile, 'cover', 'track.json.part']) {
          final uncommitted = File(path.join(directory.path, name));
          if (await uncommitted.exists()) await uncommitted.delete();
        }
      }
    }
  });

  Future<void> remove(String trackId) => _serial(() async {
    final directory = await _directory(trackId);
    // Fixed filenames only; no recursive deletion of computed paths.
    for (final name in [
      'track.json',
      'track.json.part',
      'audio.mp3',
      'audio.m4a',
      'audio.aac',
      'audio.wav',
      'audio.ogg',
      'audio.flac',
      'audio.opus',
      'audio.webm',
      'audio.part',
      'cover',
      'cover.part',
    ]) {
      final file = File(path.join(directory.path, name));
      if (await file.exists()) await file.delete();
    }
  });
}
