class CommentModel {
  final String id;
  final String content;
  final double? moment;

  final String? userId;
  final String userName;
  final String? username;
  final String? avatarUrl;

  final DateTime? createdAt;

  const CommentModel({
    required this.id,
    required this.content,
    this.moment,
    this.userId,
    this.userName = 'User',
    this.username,
    this.avatarUrl,
    this.createdAt,
  });

  factory CommentModel.fromJson(
      Map<String, dynamic> json,
      ) {
    final userJson = json['user'];

    final user = userJson is Map
        ? Map<String, dynamic>.from(userJson)
        : <String, dynamic>{};

    return CommentModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),

      content: (json['content'] ?? '').toString(),

      moment: _double(json['moment']),

      userId: (user['id'] ??
          user['_id'] ??
          json['userId'])
          ?.toString(),

      userName: (user['name'] ??
          user['username'] ??
          'User')
          .toString(),

      username: user['username']?.toString(),

      avatarUrl:
      (user['avatarUrl'] ?? user['avatar'])
          ?.toString(),

      createdAt:
      DateTime.tryParse(
        json['createdAt']?.toString() ?? '',
      ),
    );
  }

  static double? _double(
      dynamic value,
      ) {
    if (value == null) return null;

    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(
      value.toString(),
    );
  }
}