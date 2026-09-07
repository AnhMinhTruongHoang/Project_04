import 'dart:async';
import 'dart:convert';

import 'package:web/web.dart' as web;

/// Listening progress is small JSON, so localStorage is sufficient on Web.
class OfflineHistoryStore {
  OfflineHistoryStore(this.accountId);

  final String accountId;
  bool _syncing = false;
  String get _prefix => 'soundclone_history:$accountId:';
  String _key(Map<String, dynamic> event) =>
      '$_prefix${event['sessionId'] as String}';

  Future<void> save(Map<String, dynamic> event) async {
    if (accountId.isNotEmpty) {
      web.window.localStorage.setItem(_key(event), jsonEncode(event));
    }
  }

  Future<void> acknowledge(Map<String, dynamic> event) async {
    final key = _key(event);
    if (web.window.localStorage.getItem(key) == jsonEncode(event)) {
      web.window.localStorage.removeItem(key);
    }
  }

  Future<void> sync({
    required bool Function() isCurrentAccount,
    required Future<bool> Function(Map<String, dynamic>) send,
  }) async {
    if (_syncing || accountId.isEmpty || !isCurrentAccount()) return;
    _syncing = true;
    try {
      final storage = web.window.localStorage;
      final keys = <String>[];
      for (var index = 0; index < storage.length; index++) {
        final key = storage.key(index);
        if (key != null && key.startsWith(_prefix)) keys.add(key);
      }
      for (final key in keys) {
        if (!isCurrentAccount()) return;
        final content = storage.getItem(key);
        if (content == null) continue;
        final event = jsonDecode(content) as Map<String, dynamic>;
        if (!await send(event)) return;
        if (storage.getItem(key) == content) storage.removeItem(key);
      }
    } catch (_) {
      // Retry when connectivity returns.
    } finally {
      _syncing = false;
    }
  }
}
