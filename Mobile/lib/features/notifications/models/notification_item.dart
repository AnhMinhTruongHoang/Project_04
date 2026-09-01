import 'dart:convert';

class NotificationItem {
  const NotificationItem({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.recipientId = '',
    this.actorId,
    this.entityType,
    this.entityId,
    this.redirectUrl,
    this.metadataJson,
    this.readAt,
  });

  final String id;
  final String recipientId;
  final String? actorId;
  final String type;
  final String title;
  final String message;
  final String? entityType;
  final String? entityId;
  final String? redirectUrl;
  final String? metadataJson;
  final bool isRead;
  final String? readAt;
  final DateTime? createdAt;

  factory NotificationItem.fromJson(dynamic value) {
    final json = value is Map
        ? Map<String, dynamic>.from(value)
        : <String, dynamic>{};

    return NotificationItem(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      recipientId: (json['recipientId'] ?? '').toString(),
      actorId: _nullableString(json['actorId']),
      type: (json['type'] ?? 'SYSTEM').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      message: (json['message'] ?? '').toString(),
      entityType: _nullableString(json['entityType']),
      entityId: _nullableString(json['entityId']),
      redirectUrl: _nullableString(json['redirectUrl']),
      metadataJson: _nullableString(json['metadataJson']),
      isRead: json['isRead'] == true,
      readAt: _nullableString(json['readAt']),
      createdAt: DateTime.tryParse((json['createdAt'] ?? '').toString()),
    );
  }

  NotificationItem copyWith({
    bool? isRead,
    String? readAt,
  }) {
    return NotificationItem(
      id: id,
      recipientId: recipientId,
      actorId: actorId,
      type: type,
      title: title,
      message: message,
      entityType: entityType,
      entityId: entityId,
      redirectUrl: redirectUrl,
      metadataJson: metadataJson,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> metadata() {
    final raw = metadataJson;

    if (raw == null || raw.trim().isEmpty) {
      return const {};
    }

    final decoded = jsonDecode(raw);

    if (decoded is Map) {
      return Map<String, dynamic>.from(decoded);
    }

    return const {};
  }

  static String? _nullableString(dynamic value) {
    final text = value?.toString().trim();
    return text == null || text.isEmpty ? null : text;
  }
}
