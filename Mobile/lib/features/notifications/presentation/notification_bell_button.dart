import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/notification_item.dart';
import '../providers/notification_provider.dart';
import 'notification_ui_helpers.dart';

class NotificationBellButton extends ConsumerStatefulWidget {
  const NotificationBellButton({
    super.key,
    required this.onViewAll,
  });

  final VoidCallback onViewAll;

  @override
  ConsumerState<NotificationBellButton> createState() =>
      _NotificationBellButtonState();
}

class _NotificationBellButtonState
    extends ConsumerState<NotificationBellButton> {
  final _buttonKey = GlobalKey();

  Future<void> _showPopover() async {
    ref.read(notificationProvider.notifier).refresh(preview: true);
    ref.read(notificationProvider.notifier).refreshUnreadCount();

    if (!mounted) {
      return;
    }

    final renderBox =
        _buttonKey.currentContext?.findRenderObject() as RenderBox?;
    final position = renderBox?.localToGlobal(Offset.zero) ?? Offset.zero;
    final size = renderBox?.size ?? Size.zero;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final right = math.max(12.0, screenWidth - position.dx - size.width);
    final width = math.min(400.0, screenWidth - 24.0);

    await showGeneralDialog<void>(
      context: context,
      barrierColor: Colors.transparent,
      barrierDismissible: true,
      barrierLabel: 'Notifications',
      pageBuilder: (dialogContext, _, _) {
        return Stack(
          children: [
            Positioned(
              top: position.dy + size.height + 8,
              right: right,
              width: width,
              child: _NotificationPopover(
                onViewAll: () {
                  Navigator.of(dialogContext).pop();
                  widget.onViewAll();
                },
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(notificationProvider);
    final unreadCount = state.enabled ? state.unreadCount : 0;

    return SizedBox(
      key: _buttonKey,
      width: 35,
      height: 40,
      child: IconButton(
        tooltip: 'Notifications',
        padding: EdgeInsets.zero,
        hoverColor: const Color(0x1AFF5500),
        onPressed: _showPopover,
        icon: Badge(
          isLabelVisible: unreadCount > 0,
          backgroundColor: notificationOrange,
          label: Text(
            unreadCount > 99 ? '99+' : unreadCount.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 9,
              fontWeight: FontWeight.w900,
            ),
          ),
          child: const Icon(
            Icons.notifications_none_rounded,
            color: Color(0xFFD8D8D8),
            size: 23,
          ),
        ),
      ),
    );
  }
}

class _NotificationPopover extends ConsumerWidget {
  const _NotificationPopover({
    required this.onViewAll,
  });

  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(notificationProvider);
    final controller = ref.read(notificationProvider.notifier);

    return Material(
      color: const Color(0xFF111111),
      elevation: 18,
      borderRadius: BorderRadius.circular(8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF303030)),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(14, 8, 12, 4),
                child: Row(
                  children: [
                    Text(
                      state.enabled ? 'On' : 'Off',
                      style: TextStyle(
                        color: state.enabled ? Colors.white : Colors.white54,
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    Switch(
                      value: state.enabled,
                      activeThumbColor: notificationOrange,
                      onChanged: (value) {
                        controller.toggleEnabled(value);
                      },
                    ),
                    const Spacer(),
                    _PopoverActionButton(
                      label: state.markingAll
                          ? 'Updating...'
                          : 'Mark all as read',
                      enabled: state.unreadCount > 0 && !state.markingAll,
                      onPressed: () {
                        controller.markAllAsRead();
                      },
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFF282828)),
              SizedBox(
                height: 320,
                child: _PopoverList(
                  items: state.items.take(5).toList(),
                  loading: state.refreshing,
                  enabled: state.enabled,
                  markAsRead: controller.markAsRead,
                  onViewAll: onViewAll,
                ),
              ),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: TextButton(
                  onPressed: onViewAll,
                  style: TextButton.styleFrom(
                    foregroundColor: notificationOrange,
                    textStyle: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  child: const Text('View all notifications'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PopoverActionButton extends StatefulWidget {
  const _PopoverActionButton({
    required this.label,
    required this.enabled,
    required this.onPressed,
  });

  final String label;
  final bool enabled;
  final VoidCallback onPressed;

  @override
  State<_PopoverActionButton> createState() => _PopoverActionButtonState();
}

class _PopoverActionButtonState extends State<_PopoverActionButton> {
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
          borderRadius: BorderRadius.circular(18),
          boxShadow: activeHover
              ? [
                  BoxShadow(
                    color: notificationOrange.withValues(alpha: 0.32),
                    blurRadius: 16,
                    spreadRadius: 1,
                  ),
                ]
              : const [],
        ),
        child: TextButton(
          onPressed: widget.enabled ? widget.onPressed : null,
          style: TextButton.styleFrom(
            backgroundColor:
                activeHover ? const Color(0x22FF5500) : Colors.transparent,
            foregroundColor: activeHover ? notificationOrange : Colors.white70,
            disabledForegroundColor: const Color(0xFF555555),
          ),
          child: Text(widget.label),
        ),
      ),
    );
  }
}

class _PopoverList extends StatelessWidget {
  const _PopoverList({
    required this.items,
    required this.loading,
    required this.enabled,
    required this.markAsRead,
    required this.onViewAll,
  });

  final List<NotificationItem> items;
  final bool loading;
  final bool enabled;
  final Future<void> Function(NotificationItem notification) markAsRead;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    if (!enabled) {
      return const _PopoverMessage(text: 'Notifications are off');
    }

    if (loading) {
      return const Center(
        child: CircularProgressIndicator(color: notificationOrange),
      );
    }

    if (items.isEmpty) {
      return const _PopoverMessage(text: 'No notifications');
    }

    return ListView.separated(
      padding: EdgeInsets.zero,
      itemCount: items.length,
      separatorBuilder: (_, _) {
        return const Divider(height: 1, color: Color(0xFF202020));
      },
      itemBuilder: (context, index) {
        final item = items[index];

        return _NotificationPreviewTile(
          notification: item,
          onTap: () async {
            await openNotificationTarget(
              context: context,
              notification: item,
              markAsRead: markAsRead,
            );

            if (!context.mounted) {
              return;
            }

            onViewAll();
          },
        );
      },
    );
  }
}

class _PopoverMessage extends StatelessWidget {
  const _PopoverMessage({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF9DA5AF),
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _NotificationPreviewTile extends StatelessWidget {
  const _NotificationPreviewTile({
    required this.notification,
    required this.onTap,
  });

  final NotificationItem notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      tileColor:
          notification.isRead ? Colors.transparent : const Color(0x14FF5500),
      leading: CircleAvatar(
        radius: 18,
        backgroundColor:
            notification.isRead ? const Color(0xFF242424) : notificationOrange,
        child: Icon(
          notificationIcon(notification.type),
          color: notification.isRead ? const Color(0xFF9DA5AF) : Colors.white,
          size: 18,
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: Text(
              notification.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight:
                    notification.isRead ? FontWeight.w700 : FontWeight.w900,
              ),
            ),
          ),
          Text(
            formatNotificationTime(notification.createdAt, short: true),
            style: const TextStyle(
              color: Color(0xFF707780),
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      subtitle: Text(
        notification.message,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Color(0xFF9DA5AF),
          fontSize: 12,
          height: 1.35,
        ),
      ),
      trailing: notification.isRead
          ? null
          : const Icon(Icons.circle, color: notificationOrange, size: 8),
    );
  }
}
