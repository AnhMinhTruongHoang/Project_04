import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:soundclone_mobile/core/network/dio_client.dart';
import 'package:soundclone_mobile/core/config/api_config.dart';
import 'package:soundclone_mobile/core/storage/token_storage.dart';
import 'package:soundclone_mobile/features/auth/models/user_model.dart';
import 'package:soundclone_mobile/features/auth/providers/auth_provider.dart';
import 'package:soundclone_mobile/features/downloads/data/downloaded_tracks_service.dart';
import 'package:soundclone_mobile/features/downloads/data/offline_history_store.dart';
import 'package:soundclone_mobile/features/downloads/providers/downloads_provider.dart';
import 'package:soundclone_mobile/features/home/models/home_track.dart';

class FakeAdapter implements HttpClientAdapter {
  final requests = <RequestOptions>[];
  int status = 200;
  bool fail = false;
  String contentType = 'audio/mpeg';
  bool redirect = false;
  Completer<void>? gate;
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    if (gate != null) await gate!.future;
    if (redirect && options.uri.origin == Uri.parse(ApiConfig.baseUrl).origin) {
      return ResponseBody.fromBytes(
        [],
        302,
        headers: {
          'location': ['https://media.example/audio.mp3'],
        },
      );
    }
    if (fail) {
      throw DioException(
        requestOptions: options,
        type: DioExceptionType.connectionError,
      );
    }
    return ResponseBody.fromBytes(
      [1, 2, 3, 4],
      status,
      headers: {
        Headers.contentLengthHeader: ['4'],
        Headers.contentTypeHeader: [contentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late Directory root;
  late FakeAdapter adapter;
  late DownloadedTracksService service;
  const track = HomeTrack(
    id: 'one',
    title: 'One',
    trackUrl: 'https://media.example/one.m4a',
  );
  setUp(() async {
    FlutterSecureStorage.setMockInitialValues({});
    root = await Directory.systemTemp.createTemp('offline_test_');
    adapter = FakeAdapter();
    service = DownloadedTracksService(
      'account-a',
      dio: Dio()..httpClientAdapter = adapter,
      rootDirectory: () async => root,
    );
  });
  tearDown(() async {
    await root.delete(recursive: true);
  });

  test('download survives a new service instance and retains format', () async {
    final result = await service.download(track);
    expect(result.localPath, endsWith('.m4a'));
    final restarted = DownloadedTracksService(
      'account-a',
      rootDirectory: () async => root,
    );
    expect(await restarted.localPathFor(track.id), result.localPath);
    expect((await restarted.getAll()).single.track.title, 'One');
  });
  test(
    'concurrent duplicate and distinct downloads never lose entries',
    () async {
      await Future.wait([
        service.download(track),
        service.download(track),
        service.download(
          const HomeTrack(
            id: 'two',
            title: 'Two',
            trackUrl: 'https://media.example/two.mp3',
          ),
        ),
      ]);
      expect(await service.getAll(), hasLength(2));
      expect(adapter.requests, hasLength(2));
    },
  );
  test(
    'account boundaries prevent access to another account downloads',
    () async {
      await service.download(track);
      final other = DownloadedTracksService(
        'account-b',
        rootDirectory: () async => root,
      );
      expect(await other.getAll(), isEmpty);
      expect(await other.localPathFor(track.id), isNull);
      await other.remove(track.id);
      expect(await service.localPathFor(track.id), isNotNull);
    },
  );
  test(
    'failed download preserves other completed tracks and supports retry',
    () async {
      await service.download(track);
      adapter.fail = true;
      const second = HomeTrack(
        id: 'two',
        title: 'Two',
        trackUrl: 'https://media.example/two.mp3',
      );
      await expectLater(service.download(second), throwsA(isA<DioException>()));
      expect(await service.getAll(), hasLength(1));
      adapter.fail = false;
      await service.download(second);
      expect(await service.getAll(), hasLength(2));
    },
  );
  test('cancelled queued download is never committed', () async {
    final token = CancelToken()..cancel();
    await expectLater(
      service.download(track, cancelToken: token),
      throwsA(isA<DioException>()),
    );
    expect(await service.getAll(), isEmpty);
  });
  test('missing or truncated file is not considered downloaded', () async {
    final result = await service.download(track);
    await File(result.localPath).writeAsBytes([1]);
    expect(await service.localPathFor(track.id), isNull);
    await service.download(track);
    expect(await service.localPathFor(track.id), isNotNull);
    await File(result.localPath).delete();
    expect(await service.localPathFor(track.id), isNull);
  });
  test('external media never receives the API access token', () async {
    FlutterSecureStorage.setMockInitialValues({
      'access_token': 'private-token',
    });
    await service.download(track);
    expect(adapter.requests.single.headers['Authorization'], isNull);
  });
  test(
    'redirect from API host strips its token at the external host',
    () async {
      FlutterSecureStorage.setMockInitialValues({
        'access_token': 'private-token',
      });
      adapter.redirect = true;
      await service.download(
        HomeTrack(
          id: 'redirect',
          title: 'Redirect',
          trackUrl: '${ApiConfig.baseUrl}/audio.mp3',
        ),
      );
      expect(
        adapter.requests.first.headers['Authorization'],
        'Bearer private-token',
      );
      expect(adapter.requests.last.headers['Authorization'], isNull);
    },
  );
  test(
    'legacy import is explicit, idempotent and preserves originals',
    () async {
      final legacy = Directory('${root.path}/downloads');
      await legacy.create();
      final original = File('${legacy.path}/one.mp3');
      await original.writeAsBytes([1, 2, 3]);
      await File('${legacy.path}/tracks.json').writeAsString(
        jsonEncode([
          {'track': track.toJson(), 'localPath': original.path},
        ]),
      );
      expect(await service.getAll(), isEmpty);
      expect(await service.hasLegacyDownloads(), isTrue);
      await service.importLegacy();
      await service.importLegacy();
      expect(await service.getAll(), hasLength(1));
      expect(await original.readAsBytes(), [1, 2, 3]);
    },
  );
  test('provider preserves downloaded list on a failed new download', () async {
    await service.download(track);
    final container = ProviderContainer(
      overrides: [downloadedTracksServiceProvider.overrideWithValue(service)],
    );
    final subscription = container.listen(downloadsProvider, (_, _) {});
    try {
      await container.read(downloadsProvider.future);
      adapter.fail = true;
      final error = await container
          .read(downloadsProvider.notifier)
          .download(
            const HomeTrack(
              id: 'bad',
              title: 'Bad',
              trackUrl: 'https://media.example/bad.mp3',
            ),
          );
      expect(error, isNotNull);
      expect(container.read(downloadsProvider).requireValue, hasLength(1));
      expect(container.read(downloadJobsProvider)['bad']?.error, isNotNull);
    } finally {
      subscription.close();
      container.dispose();
    }
  });
  test('HTML success response is rejected instead of saved as music', () async {
    adapter.contentType = 'text/html';
    await expectLater(service.download(track), throwsStateError);
    expect(await service.getAll(), isEmpty);
  });
  test('artwork failure does not prevent offline audio', () async {
    final dio = Dio()..httpClientAdapter = adapter;
    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          if (options.path.endsWith('.jpg')) {
            handler.reject(DioException(requestOptions: options));
          } else {
            handler.next(options);
          }
        },
      ),
    );
    final store = DownloadedTracksService(
      'account-a',
      dio: dio,
      rootDirectory: () async => root,
    );
    final result = await store.download(
      const HomeTrack(
        id: 'cover',
        title: 'Cover',
        trackUrl: 'https://media.example/song.mp3',
        imgUrl: 'https://media.example/cover.jpg',
      ),
    );
    expect(result.artworkPath, isNull);
    expect(await store.localPathFor('cover'), isNotNull);
  });
  test(
    'delete removes audio and metadata without affecting other tracks',
    () async {
      final result = await service.download(track);
      await service.remove(track.id);
      expect(await File(result.localPath).exists(), isFalse);
      expect(await service.getAll(), isEmpty);
    },
  );
  test(
    'offline history persists failures and removes acknowledged events',
    () async {
      final store = OfflineHistoryStore('a', rootDirectory: () async => root);
      await store.save({'sessionId': 's', 'position': 10});
      await store.sync(isCurrentAccount: () => true, send: (_) async => false);
      final restarted = OfflineHistoryStore(
        'a',
        rootDirectory: () async => root,
      );
      var sent = 0;
      await restarted.sync(
        isCurrentAccount: () => true,
        send: (event) async {
          sent++;
          expect(event['position'], 10);
          return true;
        },
      );
      await restarted.sync(
        isCurrentAccount: () => true,
        send: (_) async {
          sent++;
          return true;
        },
      );
      expect(sent, 1);
    },
  );
  test(
    'sync cannot erase progress saved while a request is in flight',
    () async {
      final store = OfflineHistoryStore('a', rootDirectory: () async => root);
      await store.save({'sessionId': 's', 'position': 10});
      await store.sync(
        isCurrentAccount: () => true,
        send: (_) async {
          await store.save({'sessionId': 's', 'position': 20});
          return true;
        },
      );
      await store.sync(
        isCurrentAccount: () => true,
        send: (event) async {
          expect(event['position'], 20);
          return true;
        },
      );
    },
  );
  test('cached account starts offline without clearing tokens', () async {
    const user = UserModel(
      id: 'a',
      email: 'a@example.com',
      name: 'A',
      role: 'USER',
    );
    FlutterSecureStorage.setMockInitialValues({
      'access_token': 'token',
      'refresh_token': 'refresh',
      'offline_account': jsonEncode(user.toJson()),
    });
    final oldAdapter = DioClient.instance.httpClientAdapter;
    DioClient.instance.httpClientAdapter = adapter..fail = true;
    final container = ProviderContainer();
    final subscription = container.listen(authProvider, (_, _) {});
    try {
      expect((await container.read(authProvider.future))?.id, 'a');
      await Future<void>.delayed(const Duration(milliseconds: 30));
      expect(container.read(authProvider).value?.id, 'a');
      expect(await TokenStorage.getAccessToken(), 'token');
      await container.read(authProvider.notifier).logout();
      expect(container.read(authProvider).value, isNull);
      expect(await TokenStorage.getOfflineAccount(), isNull);
      expect(await TokenStorage.getAccessToken(), isNull);
    } finally {
      subscription.close();
      container.dispose();
      DioClient.instance.httpClientAdapter = oldAdapter;
    }
  });
  test('changing account cancels pending work and clears its jobs', () async {
    adapter.gate = Completer<void>();
    final container = ProviderContainer(
      overrides: [downloadedTracksServiceProvider.overrideWithValue(service)],
    );
    final subscription = container.listen(downloadsProvider, (_, _) {});
    try {
      await container.read(downloadsProvider.future);
      final pending = container
          .read(downloadsProvider.notifier)
          .download(track);
      await Future<void>.delayed(const Duration(milliseconds: 20));
      final other = DownloadedTracksService(
        'account-b',
        rootDirectory: () async => root,
      );
      container.updateOverrides([
        downloadedTracksServiceProvider.overrideWithValue(other),
      ]);
      await container.pump();
      adapter.gate!.complete();
      await pending;
      expect(await container.read(downloadsProvider.future), isEmpty);
      expect(container.read(downloadJobsProvider), isEmpty);
    } finally {
      subscription.close();
      container.dispose();
    }
  });
}
