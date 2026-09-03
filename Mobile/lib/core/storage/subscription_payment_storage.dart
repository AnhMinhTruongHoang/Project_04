import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SubscriptionPaymentStorage {
  SubscriptionPaymentStorage._();

  static const FlutterSecureStorage _storage = FlutterSecureStorage();
  static const String _pendingPaymentKey = 'pending_subscription_payment';

  static Future<void> savePendingPayment(Map<String, dynamic> data) async {
    await _storage.write(key: _pendingPaymentKey, value: jsonEncode(data));
  }

  static Future<Map<String, dynamic>?> getPendingPayment() async {
    final raw = await _storage.read(key: _pendingPaymentKey);

    if (raw == null || raw.trim().isEmpty) {
      return null;
    }

    try {
      final decoded = jsonDecode(raw);

      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
    } catch (_) {
      await clearPendingPayment();
    }

    return null;
  }

  static Future<void> clearPendingPayment() async {
    await _storage.delete(key: _pendingPaymentKey);
  }
}
