@TestOn('browser')
import 'dart:async';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soundclone_mobile/features/downloads/data/downloaded_tracks_service.dart';
import 'package:soundclone_mobile/features/downloads/data/offline_history_store.dart';
import 'package:soundclone_mobile/features/home/models/home_track.dart';

class _BytesAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromBytes(
      [1, 2, 3, 4],
      200,
      headers: {
        Headers.contentTypeHeader: ['audio/mpeg'],
        Headers.contentLengthHeader: ['4'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('audio Blob survives a new Web store instance', () async {
    final account = 'web-test-${DateTime.now().microsecondsSinceEpoch}';
    final dio = Dio()..httpClientAdapter = _BytesAdapter();
    final first = DownloadedTracksService(account, dio: dio);
    const track = HomeTrack(
      id: 'song',
      title: 'Browser song',
      trackUrl: 'https://media.example/song.mp3',
    );

    final downloaded = await first.download(track);
    expect(downloaded.localPath, startsWith('blob:'));
    expect(downloaded.bytes, 4);

    final reopened = DownloadedTracksService(account, dio: dio);
    final items = await reopened.getAll();
    expect(items, hasLength(1));
    expect(items.single.track.title, 'Browser song');
    expect(items.single.localPath, startsWith('blob:'));

    await reopened.remove(track.id);
    expect(await reopened.getAll(), isEmpty);
    first.dispose();
    reopened.dispose();
  });

  test('Web history remains until server acknowledges it', () async {
    final account = 'history-${DateTime.now().microsecondsSinceEpoch}';
    final store = OfflineHistoryStore(account);
    final event = <String, dynamic>{'sessionId': 'session', 'position': 12};
    await store.save(event);

    await store.sync(isCurrentAccount: () => true, send: (_) async => false);
    var sent = 0;
    await store.sync(
      isCurrentAccount: () => true,
      send: (saved) async {
        sent++;
        expect(saved['position'], 12);
        return true;
      },
    );
    await store.sync(
      isCurrentAccount: () => true,
      send: (_) async {
        sent++;
        return true;
      },
    );
    expect(sent, 1);
  });
}
