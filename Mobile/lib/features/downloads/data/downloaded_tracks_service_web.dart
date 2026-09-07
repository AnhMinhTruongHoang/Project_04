import 'dart:async';
import 'dart:convert';
import 'dart:js_interop';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:web/web.dart' as web;

import '../../../core/config/api_config.dart';
import '../../../core/network/dio_client.dart';
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

/// Persists complete audio Blobs in IndexedDB and exposes short-lived blob URLs
/// to just_audio and Image.network. Browser site-data controls its lifetime.
class DownloadedTracksService {
  DownloadedTracksService(this.accountId, {Dio? dio})
    : _externalDio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 30),
              receiveTimeout: const Duration(seconds: 90),
            ),
          );

  static const _databaseName = 'soundclone_offline_media';
  static const _storeName = 'media';
  final String accountId;
  final Dio _externalDio;
  Future<void> _tail = Future.value();
  Future<web.IDBDatabase>? _databaseFuture;
  final Map<String, String> _audioUrls = {};

  String get _prefix => '${base64Url.encode(utf8.encode(accountId))}:';
  String _key(String trackId, String kind) =>
      '$_prefix${base64Url.encode(utf8.encode(trackId))}:$kind';

  void dispose() {
    for (final url in _audioUrls.values) {
      web.URL.revokeObjectURL(url);
    }
    _audioUrls.clear();
    _databaseFuture?.then((database) => database.close());
  }

  Future<T> _serial<T>(Future<T> Function() action) {
    final result = _tail.then((_) => action());
    _tail = result.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return result;
  }

  Future<web.IDBDatabase> _database() {
    return _databaseFuture ??= _openDatabase();
  }

  Future<web.IDBDatabase> _openDatabase() {
    final completer = Completer<web.IDBDatabase>();
    final request = web.window.indexedDB.open(_databaseName, 1);
    request.onupgradeneeded = ((web.Event _) {
      final database = request.result as web.IDBDatabase;
      if (!database.objectStoreNames.contains(_storeName)) {
        database.createObjectStore(_storeName);
      }
    }).toJS;
    request.onsuccess = ((web.Event _) {
      final database = request.result as web.IDBDatabase;
      database.onversionchange = ((web.Event _) => database.close()).toJS;
      if (!completer.isCompleted) completer.complete(database);
    }).toJS;
    request.onerror = ((web.Event _) {
      if (!completer.isCompleted) {
        completer.completeError(
          StateError(
            request.error?.message ?? 'Could not open browser storage.',
          ),
        );
      }
    }).toJS;
    request.onblocked = ((web.Event _) {
      if (!completer.isCompleted) {
        completer.completeError(
          StateError('Browser storage is blocked by another app tab.'),
        );
      }
    }).toJS;
    return completer.future;
  }

  Future<JSAny?> _get(String key) async {
    final database = await _database();
    final transaction = database.transaction(_storeName.toJS, 'readonly');
    return _request(transaction.objectStore(_storeName).get(key.toJS));
  }

  Future<JSAny?> _request(web.IDBRequest request) {
    final completer = Completer<JSAny?>();
    request.onsuccess = ((web.Event _) {
      if (!completer.isCompleted) completer.complete(request.result);
    }).toJS;
    request.onerror = ((web.Event _) {
      if (!completer.isCompleted) {
        completer.completeError(
          StateError(
            request.error?.message ?? 'Browser storage request failed.',
          ),
        );
      }
    }).toJS;
    return completer.future;
  }

  Future<void> _transactionDone(web.IDBTransaction transaction) {
    final completer = Completer<void>();
    transaction.oncomplete = ((web.Event _) {
      if (!completer.isCompleted) completer.complete();
    }).toJS;
    transaction.onerror = ((web.Event _) {
      if (!completer.isCompleted) {
        completer.completeError(
          StateError(
            transaction.error?.message ?? 'Browser storage write failed.',
          ),
        );
      }
    }).toJS;
    transaction.onabort = ((web.Event _) {
      if (!completer.isCompleted) {
        completer.completeError(
          StateError(
            transaction.error?.message ?? 'Browser storage write was aborted.',
          ),
        );
      }
    }).toJS;
    return completer.future;
  }

  Future<List<String>> _index() async {
    if (accountId.isEmpty) return [];
    final value = await _get('${_prefix}index');
    if (value == null || !value.isA<JSString>()) return [];
    try {
      final decoded = jsonDecode((value as JSString).toDart);
      return decoded is List
          ? decoded.map((item) => item.toString()).toSet().toList()
          : [];
    } catch (_) {
      return [];
    }
  }

  Future<DownloadedTrack?> _read(String trackId) async {
    final metadataValue = await _get(_key(trackId, 'metadata'));
    final audioValue = await _get(_key(trackId, 'audio'));
    if (metadataValue == null ||
        !metadataValue.isA<JSString>() ||
        audioValue == null) {
      return null;
    }
    try {
      final metadata =
          jsonDecode((metadataValue as JSString).toDart)
              as Map<String, dynamic>;
      final blob = audioValue as web.Blob;
      final bytes = metadata['bytes'] as int;
      if (bytes <= 0 || blob.size != bytes) return null;
      final audioUrl = _audioUrls.putIfAbsent(
        trackId,
        () => web.URL.createObjectURL(blob),
      );
      return DownloadedTrack(
        track: HomeTrack.fromJson(metadata['track']),
        localPath: audioUrl,
        // Image.file is not available in Flutter Web. Keep the cover persisted
        // for a future shared artwork widget, while the list uses its fallback.
        artworkPath: null,
        bytes: bytes,
      );
    } catch (_) {
      return null;
    }
  }

  Future<List<DownloadedTrack>> getAll() async {
    final items = <DownloadedTrack>[];
    for (final id in await _index()) {
      final item = await _read(id);
      if (item != null) items.add(item);
    }
    items.sort((a, b) => a.track.title.compareTo(b.track.title));
    return items;
  }

  Future<String?> localPathFor(String trackId) async {
    if (accountId.isEmpty || trackId.isEmpty) return null;
    return (await _read(trackId))?.localPath;
  }

  Future<bool> hasLegacyDownloads() async => false;
  Future<void> importLegacy() async {}

  Future<Response<List<int>>> _fetch(
    String url,
    CancelToken? cancelToken,
    void Function(int, int)? onProgress,
  ) {
    final uri = Uri.parse(url);
    if (uri.scheme != 'http' && uri.scheme != 'https') {
      throw StateError('Invalid media URL.');
    }
    final trusted = uri.origin == Uri.parse(ApiConfig.baseUrl).origin;
    return (trusted ? DioClient.instance : _externalDio).get<List<int>>(
      url,
      cancelToken: cancelToken,
      onReceiveProgress: onProgress,
      options: Options(
        responseType: ResponseType.bytes,
        headers: const {'Accept': '*/*'},
      ),
    );
  }

  Future<web.Blob?> _optionalCover(
    HomeTrack track,
    CancelToken? cancelToken,
  ) async {
    final imageUrl = track.resolvedImageUrl;
    if (imageUrl == null) return null;
    try {
      final response = await _fetch(imageUrl, cancelToken, null);
      final bytes = response.data;
      if (bytes == null || bytes.isEmpty) return null;
      final type = response.headers.value('content-type') ?? 'image/jpeg';
      if (!type.toLowerCase().startsWith('image/')) return null;
      return web.Blob(
        [Uint8List.fromList(bytes).toJS].toJS,
        web.BlobPropertyBag(type: type),
      );
    } on DioException catch (error) {
      if (CancelToken.isCancel(error)) rethrow;
      return null;
    }
  }

  Future<DownloadedTrack> download(
    HomeTrack track, {
    void Function(int received, int total)? onProgress,
    CancelToken? cancelToken,
  }) => _serial(() async {
    if (cancelToken?.isCancelled == true) throw cancelToken!.cancelError!;
    final existing = await _read(track.id);
    if (existing != null) return existing;
    if (accountId.isEmpty || track.id.isEmpty) {
      throw StateError('Missing account or track.');
    }
    final url = track.resolvedTrackUrl;
    if (url == null || url.isEmpty) {
      throw StateError('Track does not have an audio URL.');
    }
    final extension = Uri.parse(url).path.toLowerCase();
    if (extension.endsWith('.m3u8') || extension.endsWith('.mpd')) {
      throw StateError('This stream cannot be stored by the browser.');
    }
    final response = await _fetch(url, cancelToken, onProgress);
    final bytes = response.data;
    if (bytes == null || bytes.isEmpty) {
      throw StateError('Server returned an empty audio file.');
    }
    final type = (response.headers.value('content-type') ?? 'audio/mpeg')
        .toLowerCase();
    if (type.contains('text/') ||
        type.contains('json') ||
        type.contains('mpegurl')) {
      throw StateError('Server did not return an audio file.');
    }
    final audio = web.Blob(
      [Uint8List.fromList(bytes).toJS].toJS,
      web.BlobPropertyBag(type: type),
    );
    final cover = await _optionalCover(track, cancelToken);
    if (cancelToken?.isCancelled == true) throw cancelToken!.cancelError!;

    final ids = await _index();
    if (!ids.contains(track.id)) ids.insert(0, track.id);
    final database = await _database();
    final transaction = database.transaction(_storeName.toJS, 'readwrite');
    final store = transaction.objectStore(_storeName);
    final done = _transactionDone(transaction);
    store.put(audio, _key(track.id, 'audio').toJS);
    store.put(
      jsonEncode({'track': track.toJson(), 'bytes': bytes.length}).toJS,
      _key(track.id, 'metadata').toJS,
    );
    if (cover != null) store.put(cover, _key(track.id, 'cover').toJS);
    store.put(jsonEncode(ids).toJS, '${_prefix}index'.toJS);
    await done;
    return (await _read(track.id))!;
  });

  Future<void> remove(String trackId) => _serial(() async {
    final ids = await _index();
    ids.remove(trackId);
    final database = await _database();
    final transaction = database.transaction(_storeName.toJS, 'readwrite');
    final store = transaction.objectStore(_storeName);
    final done = _transactionDone(transaction);
    for (final kind in ['audio', 'metadata', 'cover']) {
      store.delete(_key(trackId, kind).toJS);
    }
    store.put(jsonEncode(ids).toJS, '${_prefix}index'.toJS);
    await done;
    final audioUrl = _audioUrls.remove(trackId);
    if (audioUrl != null) web.URL.revokeObjectURL(audioUrl);
  });
}
