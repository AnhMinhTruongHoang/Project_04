import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notification_item.dart';
import '../providers/notification_provider.dart';
import 'notification_ui_helpers.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationProvider);
    final controller = ref.read(notificationProvider.notifier);

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: SafeArea(
        child: RefreshIndicator(
          color: notificationOrange,
          backgroundColor: const Color(0xFF181818),
          onRefresh: () async {
            await Future.wait([
              controller.refresh(),
              controller.refreshUnreadCount(),
            ]);
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(18, 18, 18, 10),
                sliver: SliverToBoxAdapter(
                  child: _NotificationsHeader(
                    unreadCount: state.unreadCount,
                    readCount: state.readCount,
                    refreshing: state.loading || state.refreshing,
                    markingAll: state.markingAll,
                    clearingRead: state.clearingRead,
                    onRefresh: () {
                      controller.refresh();
                    },
                    onMarkAllRead: () {
                      controller.markAllAsRead();
                    },
                    onClearRead: () {
                      controller.clearRead();
                    },
                  ),
                ),
              ),
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 18),
                sliver: SliverToBoxAdapter(
                  child: _FilterTabs(
                    filter: state.filter,
                    onChanged: (filter) {
                      controller.setFilter(filter);
                    },
                  ),
                ),
              ),
              if (state.errorMessage != null)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
                  sliver: SliverToBoxAdapter(
                    child: _ErrorBanner(message: state.errorMessage!),
                  ),
                ),
              if (state.loading)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: CircularProgressIndicator(
                      color: notificationOrange,
                    ),
                  ),
                )
              else if (!state.enabled)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(
                    title: 'Notifications are off',
                    subtitle: 'Turn notifications on from the bell menu.',
                  ),
                )
              else if (state.items.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(
                    title: state.filter == NotificationFilter.unread
                        ? 'No unread notifications'
                        : 'No notifications yet',
                    subtitle: state.filter == NotificationFilter.unread
                        ? 'You have read all of your notifications.'
                        : 'New likes, comments and follows will appear here.',
                  ),
                )
              else ...[
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 12, 18, 0),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        if (index.isOdd) {
                          return const Divider(
                            height: 1,
                            color: Color(0xFF242424),
                          );
                        }

                        final notification = state.items[index ~/ 2];

                        return _NotificationTile(
                          notification: notification,
                          onTap: () async {
                          await openNotificationTarget(
                            context: context,
                            notification: notification,
                            markAsRead: controller.markAsRead,
                          );
                          },
                          onDelete: () async {
                            await _deleteNotification(
                              context: context,
                              controller: controller,
                              notification: notification,
                            );
                          },
                        );
                      },
                      childCount: state.items.length * 2 - 1,
                    ),
                  ),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(18, 14, 18, 110),
                  sliver: SliverToBoxAdapter(
                    child: _LoadMoreButton(
                      visible: !state.lastPage,
                      loading: state.loadingMore,
                      onPressed: () {
                        controller.loadMore();
                      },
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _deleteNotification({
    required BuildContext context,
    required NotificationController controller,
    required NotificationItem notification,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: const Text(
            'Delete notification?',
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          content: Text(
            'Delete "${notification.title}" from your notifications?',
            style: const TextStyle(color: Color(0xFFBDBDBD)),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(false);
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF6975),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(dialogContext).pop(true);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      await controller.deleteNotification(notification);

      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Notification deleted')),
      );
    } catch (_) {
      if (!context.mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete notification.')),
      );
    }
  }
}

class _NotificationsHeader extends StatelessWidget {
  const _NotificationsHeader({
    required this.unreadCount,
    required this.readCount,
    required this.refreshing,
    required this.markingAll,
    required this.clearingRead,
    required this.onRefresh,
    required this.onMarkAllRead,
    required this.onClearRead,
  });

  final int unreadCount;
  final int readCount;
  final bool refreshing;
  final bool markingAll;
  final bool clearingRead;
  final VoidCallback onRefresh;
  final VoidCallback onMarkAllRead;
  final VoidCallback onClearRead;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final compact = constraints.maxWidth < 700;
        final title = Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Notifications',
              style: TextStyle(
                color: Colors.white,
                fontSize: 32,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              unreadCount > 0
                  ? '$unreadCount unread notifications'
                  : "You're all caught up",
              style: const TextStyle(
                color: Color(0xFFAAAAAA),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        );
        final actions = Wrap(
          spacing: 8,
          runSpacing: 8,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _HeaderIconButton(
              tooltip: 'Refresh',
              icon: refreshing ? null : Icons.refresh_rounded,
              onPressed: refreshing ? null : onRefresh,
              child: refreshing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: notificationOrange,
                      ),
                    )
                  : null,
            ),
            _HeaderActionButton(
              icon: Icons.done_all_rounded,
              label: markingAll ? 'Updating...' : 'Mark all read',
              enabled: unreadCount > 0 && !markingAll,
              onPressed: onMarkAllRead,
            ),
            _HeaderActionButton(
              icon: Icons.cleaning_services_rounded,
              label: clearingRead ? 'Clearing...' : 'Clear read',
              enabled: readCount > 0 && !clearingRead,
              onPressed: onClearRead,
            ),
          ],
        );

        if (compact) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              title,
              const SizedBox(height: 14),
              actions,
            ],
          );
        }

        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: title),
            actions,
          ],
        );
      },
    );
  }
}

class _FilterTabs extends StatelessWidget {
  const _FilterTabs({
    required this.filter,
    required this.onChanged,
  });

  final NotificationFilter filter;
  final ValueChanged<NotificationFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF292929)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(10),
        child: Row(
          children: [
            _FilterPill(
              label: 'All',
              selected: filter == NotificationFilter.all,
              onTap: () => onChanged(NotificationFilter.all),
            ),
            const SizedBox(width: 10),
            _FilterPill(
              label: 'Unread',
              selected: filter == NotificationFilter.unread,
              onTap: () => onChanged(NotificationFilter.unread),
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterPill extends StatelessWidget {
  const _FilterPill({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? notificationOrange : Colors.transparent,
      borderRadius: BorderRadius.circular(24),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        hoverColor: const Color(0x22FF5500),
        mouseCursor: SystemMouseCursors.click,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 12),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? Colors.white : const Color(0xFFAAAAAA),
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.onTap,
    required this.onDelete,
  });

  final NotificationItem notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Material(
      color:
          notification.isRead ? Colors.transparent : const Color(0x14FF5500),
      child: ListTile(
        minVerticalPadding: 14,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        hoverColor: const Color(0x1AFF5500),
        mouseCursor: SystemMouseCursors.click,
        onTap: onTap,
        leading: CircleAvatar(
          radius: 24,
          backgroundColor: notification.isRead
              ? const Color(0xFF242424)
              : notificationOrange,
          child: Icon(
            notificationIcon(notification.type),
            color:
                notification.isRead ? const Color(0xFF9DA5AF) : Colors.white,
          ),
        ),
        title: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                notification.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: Colors.white,
                  fontWeight:
                      notification.isRead ? FontWeight.w700 : FontWeight.w900,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              formatNotificationTime(notification.createdAt),
              style: const TextStyle(
                color: Color(0xFF777777),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 5),
          child: Text(
            notification.message,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF9DA5AF),
              height: 1.45,
            ),
          ),
        ),
        trailing: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          children: [
            if (!notification.isRead)
              const Icon(Icons.circle, color: notificationOrange, size: 8),
            IconButton(
              tooltip: 'Delete',
              color: const Color(0xFFAAAAAA),
              hoverColor: const Color(0x22FF6975),
              onPressed: onDelete,
              icon: const Icon(Icons.delete_outline_rounded),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadMoreButton extends StatelessWidget {
  const _LoadMoreButton({
    required this.visible,
    required this.loading,
    required this.onPressed,
  });

  final bool visible;
  final bool loading;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    if (!visible) {
      return const SizedBox.shrink();
    }

    return OutlinedButton(
      onPressed: loading ? null : onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        side: const BorderSide(color: Color(0xFF333333)),
      ),
      child: loading
          ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: notificationOrange,
              ),
            )
          : const Text('Load more'),
    );
  }
}

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
    this.child,
  });

  final String tooltip;
  final IconData? icon;
  final VoidCallback? onPressed;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      color: Colors.white,
      hoverColor: const Color(0x1AFF5500),
      onPressed: onPressed,
      icon: child ?? Icon(icon ?? Icons.refresh_rounded),
    );
  }
}

class _HeaderActionButton extends StatefulWidget {
  const _HeaderActionButton({
    required this.icon,
    required this.label,
    required this.enabled,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  State<_HeaderActionButton> createState() => _HeaderActionButtonState();
}

class _HeaderActionButtonState extends State<_HeaderActionButton> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final activeHover = widget.enabled && _hovered;

    return MouseRegion(
      cursor: widget.enabled ? SystemMouseCursors.click : MouseCursor.defer,
      onEnter: (_) {
        setState(() {
          _hovered = true;
        });
      },
      onExit: (_) {
        setState(() {
          _hovered = false;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        curve: Curves.easeOut,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          boxShadow: activeHover
              ? [
                  BoxShadow(
                    color: notificationOrange.withValues(alpha: 0.34),
                    blurRadius: 18,
                    spreadRadius: 1,
                  ),
                ]
              : const [],
        ),
        child: OutlinedButton.icon(
          onPressed: widget.enabled ? widget.onPressed : null,
          icon: Icon(widget.icon, size: 18),
          label: Text(widget.label),
          style: OutlinedButton.styleFrom(
            backgroundColor:
                activeHover ? const Color(0x22FF5500) : Colors.transparent,
            foregroundColor: Colors.white,
            disabledForegroundColor: const Color(0xFF555555),
            side: BorderSide(
              color: activeHover
                  ? notificationOrange
                  : widget.enabled
                      ? const Color(0xFF333333)
                      : const Color(0xFF1D1D1D),
            ),
            textStyle: const TextStyle(fontWeight: FontWeight.w800),
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0x22FF6975),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0x55FF6975)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(
          message,
          style: const TextStyle(
            color: Color(0xFFFFB4BA),
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 46,
              backgroundColor: Color(0x33FF5500),
              child: Icon(
                Icons.notifications_none_rounded,
                color: notificationOrange,
                size: 40,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF999999),
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
