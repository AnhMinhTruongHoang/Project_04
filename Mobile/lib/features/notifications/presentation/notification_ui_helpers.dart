import 'package:flutter/material.dart';

import '../models/notification_item.dart';

const notificationOrange = Color(0xFFFF5500);

IconData notificationIcon(String type) {
  switch (type) {
    case 'TRACK_LIKE':
      return Icons.favorite_rounded;
    case 'TRACK_COMMENT':
      return Icons.comment_rounded;
    case 'NEW_FOLLOW':
      return Icons.person_add_alt_1_rounded;
    case 'TRACK_APPROVED':
    case 'TRACK_REJECTED':
    case 'COPYRIGHT_APPROVED':
    case 'COPYRIGHT_REJECTED':
    case 'TRACK_PROCESSING_COMPLETED':
      return Icons.library_music_rounded;
    case 'PAYMENT_PAID':
      return Icons.payment_rounded;
    case 'PAYMENT_FAILED':
      return Icons.error_outline_rounded;
    case 'PAYMENT_CANCELED':
    case 'PAYOUT_REJECTED':
    case 'PAYOUT_CANCELED':
      return Icons.cancel_rounded;
    case 'PAYMENT_EXPIRED':
      return Icons.schedule_rounded;
    case 'SUBSCRIPTION_ACTIVATED':
    case 'SUBSCRIPTION_CHANGED':
    case 'SUBSCRIPTION_CANCEL_SCHEDULED':
    case 'SUBSCRIPTION_RENEWED':
    case 'SUBSCRIPTION_EXPIRING':
    case 'SUBSCRIPTION_EXPIRED':
    case 'UPLOAD_QUOTA_WARNING':
    case 'UPLOAD_QUOTA_EXCEEDED':
      return Icons.workspace_premium_rounded;
    case 'EARNING_AVAILABLE':
      return Icons.paid_rounded;
    case 'PAYOUT_REQUESTED':
      return Icons.account_balance_wallet_rounded;
    case 'PAYOUT_APPROVED':
    case 'PAYOUT_PAID':
      return Icons.check_circle_rounded;
    default:
      return Icons.info_rounded;
  }
}

String formatNotificationTime(DateTime? value, {bool short = false}) {
  if (value == null) {
    return '';
  }

  final diff = DateTime.now().difference(value);

  if (diff.inMinutes < 1) {
    return 'Just now';
  }

  if (diff.inMinutes < 60) {
    return short ? '${diff.inMinutes}m' : '${diff.inMinutes} minutes ago';
  }

  if (diff.inHours < 24) {
    return short ? '${diff.inHours}h' : '${diff.inHours} hours ago';
  }

  if (diff.inDays < 7) {
    return short ? '${diff.inDays}d' : '${diff.inDays} days ago';
  }

  final day = value.day.toString().padLeft(2, '0');
  final month = value.month.toString().padLeft(2, '0');
  final year = value.year.toString();

  return short ? '$day/$month' : '$day/$month/$year';
}

Future<void> openNotificationTarget({
  required BuildContext context,
  required NotificationItem notification,
  required Future<void> Function(NotificationItem notification) markAsRead,
}) async {
  if (!notification.isRead) {
    await markAsRead(notification);
  }
}
