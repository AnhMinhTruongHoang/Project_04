import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../../../services/api/api_service.dart';
import '../models/notification_item.dart';

enum NotificationFilter { all, unread }

final notificationProvider =
    NotifierProvider<NotificationController, NotificationState>(
  NotificationController.new,
);

class NotificationState {
  const NotificationState({
    this.items = const [],
    this.filter = NotificationFilter.all,
    this.unreadCount = 0,
    this.page = 0,
    this.lastPage = true,
    this.enabled = true,
    this.loading = false,
    this.loadingMore = false,
    this.refreshing = false,
    this.markingAll = false,
    this.clearingRead = false,
    this.errorMessage,
  });

  final List<NotificationItem> items;
  final NotificationFilter filter;
  final int unreadCount;
  final int page;
  final bool lastPage;
  final bool enabled;
  final bool loading;
  final bool loadingMore;
  final bool refreshing;
  final bool markingAll;
  final bool clearingRead;
  final String? errorMessage;

  int get readCount => items.where((item) => item.isRead).length;

  NotificationState copyWith({
    List<NotificationItem>? items,
    NotificationFilter? filter,
    int? unreadCount,
    int? page,
    bool? lastPage,
    bool? enabled,
    bool? loading,
    bool? loadingMore,
    bool? refreshing,
    bool? markingAll,
    bool? clearingRead,
    String? errorMessage,
    bool clearError = false,
  }) {
    return NotificationState(
      items: items ?? this.items,
      filter: filter ?? this.filter,
      unreadCount: unreadCount ?? this.unreadCount,
      page: page ?? this.page,
      lastPage: lastPage ?? this.lastPage,
      enabled: enabled ?? this.enabled,
      loading: loading ?? this.loading,
      loadingMore: loadingMore ?? this.loadingMore,
      refreshing: refreshing ?? this.refreshing,
      markingAll: markingAll ?? this.markingAll,
      clearingRead: clearingRead ?? this.clearingRead,
      errorMessage: clearError ? null : errorMessage ?? this.errorMessage,
    );
  }
}

class NotificationController extends Notifier<NotificationState> {
  static const _enabledKey = 'soundclone_notifications_enabled';
  static const _pageSize = 15;
  static const _previewSize = 5;

  final _storage = const FlutterSecureStorage();
  Timer? _pollTimer;

  @override
  NotificationState build() {
    ref.onDispose(() {
      _pollTimer?.cancel();
    });

    Future.microtask(_bootstrap);

    return const NotificationState();
  }

  Future<void> _bootstrap() async {
    final stored = await _storage.read(key: _enabledKey);
    final enabled = stored == null ? true : stored == 'true';

    state = state.copyWith(enabled: enabled);

    if (!enabled) {
      return;
    }

    await Future.wait([
      refresh(),
      refreshUnreadCount(),
    ]);

    _startPolling();
  }

  void _startPolling() {
    _pollTimer?.cancel();

    if (!state.enabled) {
      return;
    }

    _pollTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      unawaited(refreshUnreadCount());
    });
  }

  Future<void> toggleEnabled(bool enabled) async {
    await _storage.write(key: _enabledKey, value: enabled.toString());

    state = state.copyWith(
      enabled: enabled,
      items: enabled ? state.items : const [],
      unreadCount: enabled ? state.unreadCount : 0,
      clearError: true,
    );

    if (!enabled) {
      _pollTimer?.cancel();
      return;
    }

    _startPolling();

    await Future.wait([
      refresh(),
      refreshUnreadCount(),
    ]);
  }

  Future<void> setFilter(NotificationFilter filter) async {
    if (state.filter == filter) {
      return;
    }

    state = state.copyWith(
      filter: filter,
      page: 0,
      lastPage: true,
      items: const [],
      clearError: true,
    );

    await refresh();
  }

  Future<void> refresh({bool preview = false}) async {
    if (!state.enabled) {
      state = state.copyWith(items: const [], unreadCount: 0);
      return;
    }

    state = state.copyWith(
      loading: !preview,
      refreshing: preview,
      clearError: true,
    );

    await _loadPage(
      requestedPage: 0,
      append: false,
      size: preview ? _previewSize : _pageSize,
    );
  }

  Future<void> loadMore() async {
    if (state.loadingMore || state.lastPage || !state.enabled) {
      return;
    }

    state = state.copyWith(loadingMore: true, clearError: true);

    await _loadPage(
      requestedPage: state.page + 1,
      append: true,
      size: _pageSize,
    );
  }

  Future<void> refreshUnreadCount() async {
    if (!state.enabled) {
      state = state.copyWith(unreadCount: 0);
      return;
    }

    final response = await ApiService.instance.getUnreadNotificationCountApi();

    if (!response.isSuccess) {
      return;
    }

    state = state.copyWith(unreadCount: _extractUnreadCount(response.data));
  }

  Future<void> _loadPage({
    required int requestedPage,
    required bool append,
    required int size,
  }) async {
    try {
      final status =
          state.filter == NotificationFilter.unread ? 'unread' : 'all';

      final response = await ApiService.instance.getNotificationsApi(
        page: requestedPage,
        size: size,
        status: status,
      );

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final pageData = _unwrap(response.data);
      final nextItems = _extractItems(pageData);
      final merged = append ? _mergeItems(state.items, nextItems) : nextItems;

      state = state.copyWith(
        items: merged,
        page: requestedPage,
        lastPage: _extractLastPage(pageData, nextItems, size),
        loading: false,
        loadingMore: false,
        refreshing: false,
        clearError: true,
      );
    } catch (error) {
      state = state.copyWith(
        items: append ? state.items : const [],
        loading: false,
        loadingMore: false,
        refreshing: false,
        errorMessage: error.toString().replaceFirst('Bad state: ', ''),
      );
    }
  }

  Future<void> markAsRead(NotificationItem notification) async {
    if (notification.isRead) {
      return;
    }

    final response = await ApiService.instance.markNotificationAsReadApi(
      notification.id,
    );

    if (!response.isSuccess) {
      throw StateError(response.message);
    }

    final now = DateTime.now().toIso8601String();
    final nextUnread = (state.unreadCount - 1).clamp(0, 1 << 31).toInt();

    final items = state.items
        .map((item) {
          if (item.id != notification.id) {
            return item;
          }

          return item.copyWith(isRead: true, readAt: now);
        })
        .where((item) {
          return state.filter != NotificationFilter.unread || !item.isRead;
        })
        .toList();

    state = state.copyWith(items: items, unreadCount: nextUnread);
  }

  Future<void> markAllAsRead() async {
    if (state.unreadCount <= 0 || state.markingAll) {
      return;
    }

    state = state.copyWith(markingAll: true, clearError: true);

    try {
      final response = await ApiService.instance.markAllNotificationsAsReadApi();

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final now = DateTime.now().toIso8601String();

      state = state.copyWith(
        unreadCount: 0,
        items: state.filter == NotificationFilter.unread
            ? const []
            : state.items
                .map((item) => item.copyWith(isRead: true, readAt: now))
                .toList(),
        markingAll: false,
      );
    } catch (error) {
      state = state.copyWith(
        markingAll: false,
        errorMessage: error.toString().replaceFirst('Bad state: ', ''),
      );
    }
  }

  Future<void> deleteNotification(NotificationItem notification) async {
    final response = await ApiService.instance.deleteNotificationApi(
      notification.id,
    );

    if (!response.isSuccess) {
      throw StateError(response.message);
    }

    state = state.copyWith(
      items: state.items.where((item) => item.id != notification.id).toList(),
      unreadCount: notification.isRead
          ? state.unreadCount
          : (state.unreadCount - 1).clamp(0, 1 << 31).toInt(),
    );
  }

  Future<void> clearRead() async {
    if (state.readCount <= 0 || state.clearingRead) {
      return;
    }

    state = state.copyWith(clearingRead: true, clearError: true);

    try {
      final response = await ApiService.instance.clearReadNotificationsApi();

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      state = state.copyWith(
        items: state.items.where((item) => !item.isRead).toList(),
        clearingRead: false,
      );
    } catch (error) {
      state = state.copyWith(
        clearingRead: false,
        errorMessage: error.toString().replaceFirst('Bad state: ', ''),
      );
    }
  }

  dynamic _unwrap(dynamic value) {
    if (value is Map && value['data'] != null) {
      return value['data'];
    }

    return value;
  }

  List<NotificationItem> _extractItems(dynamic value) {
    final data = _unwrap(value);

    if (data is List) {
      return data
          .map(NotificationItem.fromJson)
          .where((item) => item.id.isNotEmpty)
          .toList();
    }

    if (data is Map) {
      final content = data['content'] ?? data['items'] ?? data['result'];

      if (content is List) {
        return content
            .map(NotificationItem.fromJson)
            .where((item) => item.id.isNotEmpty)
            .toList();
      }
    }

    return const [];
  }

  int _extractUnreadCount(dynamic value) {
    final data = _unwrap(value);

    if (data is Map) {
      return int.tryParse(
            (data['unreadCount'] ?? data['count'] ?? 0).toString(),
          ) ??
          0;
    }

    return int.tryParse((data ?? 0).toString()) ?? 0;
  }

  bool _extractLastPage(dynamic value, List<NotificationItem> items, int size) {
    final data = _unwrap(value);

    if (data is Map && data['last'] is bool) {
      return data['last'] as bool;
    }

    return items.length < size;
  }

  List<NotificationItem> _mergeItems(
    List<NotificationItem> current,
    List<NotificationItem> incoming,
  ) {
    final ids = current.map((item) => item.id).toSet();
    final merged = [...current];

    for (final item in incoming) {
      if (ids.add(item.id)) {
        merged.add(item);
      }
    }

    return merged;
  }
}
