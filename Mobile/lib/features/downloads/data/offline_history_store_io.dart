import 'dart:convert';
import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:path_provider/path_provider.dart';

/// Latest progress per playback session. Failed delivery stays on disk.
class OfflineHistoryStore {
  OfflineHistoryStore(
    this.accountId, {
    Future<Directory> Function()? rootDirectory,
  }) : _root = rootDirectory ?? getApplicationDocumentsDirectory;
  final String accountId;
  final Future<Directory> Function() _root;
  Future<void> _tail = Future.value();
  bool _syncing = false;

  Future<T> _serial<T>(Future<T> Function() action) {
    final next = _tail.then((_) => action());
    _tail = next.then<void>((_) {}, onError: (Object _, StackTrace _) {});
    return next;
  }

  Future<Directory> _directory() async {
    final root = await _root();
    final key = base64Url.encode(utf8.encode(accountId)).replaceAll('=', '');
    return Directory(path.join(root.path, 'offline_history', key));
  }

  Future<void> save(Map<String, dynamic> event) => _serial(() async {
    if (accountId.isEmpty) return;
    final directory = await _directory();
    await directory.create(recursive: true);
    final key = base64Url
        .encode(utf8.encode(event['sessionId'] as String))
        .replaceAll('=', '');
    final file = File(path.join(directory.path, '$key.json'));
    final temp = File('${file.path}.part');
    await temp.writeAsString(jsonEncode(event), flush: true);
    await temp.rename(file.path);
  });

  Future<void> acknowledge(Map<String, dynamic> event) => _serial(() async {
    final directory = await _directory();
    final key = base64Url
        .encode(utf8.encode(event['sessionId'] as String))
        .replaceAll('=', '');
    final file = File(path.join(directory.path, '$key.json'));
    if (await file.exists() && await file.readAsString() == jsonEncode(event)) {
      await file.delete();
    }
  });

  Future<void> sync({
    required bool Function() isCurrentAccount,
    required Future<bool> Function(Map<String, dynamic>) send,
  }) async {
    if (_syncing || accountId.isEmpty || !isCurrentAccount()) return;
    _syncing = true;
    try {
      await _tail;
      final directory = await _directory();
      if (!await directory.exists()) return;
      await for (final entry in directory.list(followLinks: false)) {
        if (entry is! File || !entry.path.endsWith('.json')) continue;
        if (!isCurrentAccount()) return;
        final content = await _serial(() => entry.readAsString());
        final event = jsonDecode(content) as Map<String, dynamic>;
        if (!await send(event)) return;
        await _serial(() async {
          // Do not delete progress written while the request was in flight.
          if (await entry.exists() && await entry.readAsString() == content) {
            await entry.delete();
          }
        });
      }
    } catch (_) {
      // Retry on the next playback tick or app session.
    } finally {
      _syncing = false;
    }
  }
}
