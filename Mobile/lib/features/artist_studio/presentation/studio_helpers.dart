part of artist_studio_screen;

List<_StatusBadgeData> _badges(HomeTrack track) {
  final processing = _status(track.processingStatus);
  final license = _status(track.licenseReviewStatus);
  final approval = _status(track.approvalStatus);

  if (approval == 'APPROVED') {
    return const [_StatusBadgeData(label: 'Public', tone: _BadgeTone.success)];
  }

  final badges = <_StatusBadgeData>[];

  if (processing == null || processing == 'PROCESSING') {
    badges.add(
      const _StatusBadgeData(label: 'Processing', tone: _BadgeTone.warning),
    );
  } else if (processing == 'FAILED') {
    badges.add(
      const _StatusBadgeData(
        label: 'Processing failed',
        tone: _BadgeTone.error,
      ),
    );
  } else {
    badges.add(
      const _StatusBadgeData(label: 'Processed', tone: _BadgeTone.success),
    );
  }

  if (license == 'VERIFIED' || license == 'APPROVED') {
    badges.add(
      const _StatusBadgeData(
        label: 'License verified',
        tone: _BadgeTone.success,
      ),
    );
  } else if (license == 'REJECTED') {
    badges.add(
      const _StatusBadgeData(label: 'License rejected', tone: _BadgeTone.error),
    );
  } else {
    badges.add(
      const _StatusBadgeData(label: 'License pending', tone: _BadgeTone.muted),
    );
  }

  if (approval == 'REJECTED') {
    badges.add(
      const _StatusBadgeData(label: 'Rejected', tone: _BadgeTone.error),
    );
  } else {
    badges.add(
      const _StatusBadgeData(label: 'Waiting approval', tone: _BadgeTone.muted),
    );
  }

  return badges;
}

String? _status(String? value) {
  final text = value?.trim().toUpperCase();

  if (text == null || text.isEmpty) {
    return null;
  }

  return text;
}

bool _isPublicTrack(HomeTrack track) {
  return _status(track.approvalStatus) == 'APPROVED' && !track.isDeleted;
}

bool _isRejectedTrack(HomeTrack track) {
  final approval = _status(track.approvalStatus);
  final copyright = _status(track.copyrightStatus);
  final license = _status(track.licenseReviewStatus);

  return approval == 'REJECTED' ||
      license == 'REJECTED' ||
      const {
        'REJECTED',
        'BLOCKED',
        'MATCHED',
        'COPYRIGHT_MATCH',
        'MANUAL_REJECTED',
        'DUPLICATE',
      }.contains(copyright);
}

Future<bool> _hasStoredToken() async {
  final accessToken = await TokenStorage.getAccessToken();
  final refreshToken = await TokenStorage.getRefreshToken();

  return accessToken?.trim().isNotEmpty == true ||
      refreshToken?.trim().isNotEmpty == true;
}

_BadgeTone _statusTone(String? value) {
  final status = _status(value);

  if (status == 'APPROVED' ||
      status == 'CLEAN' ||
      status == 'COMPLETED' ||
      status == 'MANUAL_APPROVED') {
    return _BadgeTone.success;
  }

  if (status == 'REJECTED' ||
      status == 'BLOCKED' ||
      status == 'FAILED' ||
      status == 'MATCHED' ||
      status == 'MANUAL_REJECTED') {
    return _BadgeTone.error;
  }

  return _BadgeTone.warning;
}

String _adminNote(HomeTrack track) {
  final rejectionReason = track.rejectionReason?.trim();

  if (rejectionReason != null && rejectionReason.isNotEmpty) {
    return rejectionReason;
  }

  final copyrightMessage = track.copyrightMessage?.trim();

  if (copyrightMessage != null && copyrightMessage.isNotEmpty) {
    return copyrightMessage;
  }

  final approval = _status(track.approvalStatus);

  if (approval == 'PENDING') {
    return 'Waiting for admin review.';
  }

  if (approval == 'APPROVED') {
    return 'Approved by admin.';
  }

  return 'No admin note.';
}

String _fileName(String? trackUrl) {
  final value = trackUrl?.trim();

  if (value == null || value.isEmpty) {
    return 'Audio file';
  }

  final clean = value.split('?').first.replaceAll('\\', '/');
  final name = clean.split('/').last.trim();

  if (name.isEmpty) {
    return 'Audio file';
  }

  return Uri.decodeComponent(name);
}

String _trackSelectionKey(HomeTrack track) {
  final id = track.id.trim();

  if (id.isNotEmpty) {
    return id;
  }

  return _trackKey(track.title);
}

String _trackKey(String? value) {
  return value?.trim().toLowerCase() ?? '';
}

String _formatDate(String? value) {
  final date = DateTime.tryParse(value ?? '');

  if (date == null) {
    return '--';
  }

  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final year = date.year.toString();

  return '$day/$month/$year';
}

int _createdTime(HomeTrack track) {
  return DateTime.tryParse(track.createdAt ?? '')?.millisecondsSinceEpoch ?? 0;
}

String _string(dynamic value) {
  return value?.toString().trim() ?? '';
}

String? _nullableString(dynamic value) {
  final result = value?.toString().trim();

  if (result == null || result.isEmpty || result == 'null') {
    return null;
  }

  return result;
}

dynamic _unwrap(dynamic value) {
  if (value is Map && value['data'] != null) {
    return value['data'];
  }

  return value;
}

String? _extractPaymentUrl(dynamic value) {
  final data = _unwrap(value);

  if (data is String) {
    final text = data.trim();
    return _looksLikePaymentUrl(text) ? text : null;
  }

  if (data is! Map) {
    return null;
  }

  final json = Map<String, dynamic>.from(data);
  const directKeys = [
    'paymentUrl',
    'paymentURL',
    'vnpayUrl',
    'vnPayUrl',
    'payUrl',
    'checkoutUrl',
    'checkoutURL',
    'redirectUrl',
    'paymentLink',
    'url',
  ];

  for (final key in directKeys) {
    final candidate = _nullableString(json[key]);

    if (candidate != null && _looksLikePaymentUrl(candidate)) {
      return candidate;
    }
  }

  const nestedKeys = [
    'payment',
    'checkout',
    'vnpay',
    'vnPay',
    'result',
    'data',
  ];

  for (final key in nestedKeys) {
    final nested = json[key];

    if (identical(nested, value)) {
      continue;
    }

    final candidate = _extractPaymentUrl(nested);

    if (candidate != null) {
      return candidate;
    }
  }

  return null;
}

bool _looksLikePaymentUrl(String value) {
  final uri = Uri.tryParse(value.trim());

  return uri != null &&
      (uri.scheme == 'http' || uri.scheme == 'https') &&
      uri.host.isNotEmpty;
}

String? _extractPaymentOrderCode(dynamic value) {
  final data = _unwrap(value);

  if (data is! Map) {
    return null;
  }

  final json = Map<String, dynamic>.from(data);
  const directKeys = [
    'orderCode',
    'orderId',
    'transactionId',
    'paymentCode',
    'txnRef',
    'vnp_TxnRef',
  ];

  for (final key in directKeys) {
    final candidate = _nullableString(json[key]);

    if (candidate != null) {
      return candidate;
    }
  }

  const nestedKeys = [
    'payment',
    'checkout',
    'vnpay',
    'vnPay',
    'result',
    'data',
  ];

  for (final key in nestedKeys) {
    final nested = json[key];

    if (identical(nested, value)) {
      continue;
    }

    final candidate = _extractPaymentOrderCode(nested);

    if (candidate != null) {
      return candidate;
    }
  }

  return null;
}

String _normalizePaymentStatus(dynamic value) {
  final text = _string(value).toUpperCase();

  if (text.isEmpty) {
    return 'PENDING';
  }

  if (text == 'SUCCESS' || text == 'COMPLETED') {
    return 'PAID';
  }

  if (text == 'CANCELLED') {
    return 'CANCELED';
  }

  return text;
}

bool _isFinalPaymentStatus(String status) {
  return const {
    'PAID',
    'FAILED',
    'CANCELED',
    'EXPIRED',
    'INVALID',
  }.contains(status.toUpperCase());
}

class _PendingSubscriptionPayment {
  const _PendingSubscriptionPayment({
    required this.orderCode,
    required this.planCode,
    required this.planName,
    required this.paymentUrl,
    required this.amount,
    this.currency = 'VND',
    this.status = 'PENDING',
    this.createdAt,
  });

  final String orderCode;
  final String planCode;
  final String planName;
  final String paymentUrl;
  final double amount;
  final String currency;
  final String status;
  final String? createdAt;

  _PendingSubscriptionPayment copyWith({String? status}) {
    return _PendingSubscriptionPayment(
      orderCode: orderCode,
      planCode: planCode,
      planName: planName,
      paymentUrl: paymentUrl,
      amount: amount,
      currency: currency,
      status: status ?? this.status,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'orderCode': orderCode,
      'planCode': planCode,
      'planName': planName,
      'paymentUrl': paymentUrl,
      'amount': amount,
      'currency': currency,
      'status': status,
      'createdAt': createdAt,
    };
  }

  factory _PendingSubscriptionPayment.fromJson(dynamic value) {
    if (value is! Map) {
      return const _PendingSubscriptionPayment(
        orderCode: '',
        planCode: '',
        planName: 'Plan',
        paymentUrl: '',
        amount: 0,
      );
    }

    final json = Map<String, dynamic>.from(value);

    return _PendingSubscriptionPayment(
      orderCode: _string(json['orderCode']),
      planCode: _string(json['planCode']),
      planName: _string(json['planName']).isEmpty
          ? _planName(_string(json['planCode']))
          : _string(json['planName']),
      paymentUrl: _string(json['paymentUrl']),
      amount: _toDouble(json['amount']),
      currency: _string(json['currency']).isEmpty
          ? 'VND'
          : _string(json['currency']),
      status: _normalizePaymentStatus(json['status']),
      createdAt: _nullableString(json['createdAt']),
    );
  }

  factory _PendingSubscriptionPayment.fromCreateResponse({
    required dynamic response,
    required _StudioPlan plan,
  }) {
    final data = _unwrap(response);
    final json = data is Map ? Map<String, dynamic>.from(data) : {};

    return _PendingSubscriptionPayment(
      orderCode: _extractPaymentOrderCode(data) ?? '',
      planCode: _string(json['planCode']).isEmpty
          ? plan.code
          : _string(json['planCode']),
      planName: _string(json['planName']).isEmpty
          ? plan.name
          : _string(json['planName']),
      paymentUrl: _extractPaymentUrl(data) ?? '',
      amount: _toDouble(json['amount']).toDouble(),
      currency: _string(json['currency']).isEmpty
          ? 'VND'
          : _string(json['currency']),
      status: _normalizePaymentStatus(json['status']),
      createdAt: DateTime.now().toIso8601String(),
    );
  }

  bool get isValid => orderCode.isNotEmpty && paymentUrl.isNotEmpty;
}

class _SubscriptionPaymentStatus {
  const _SubscriptionPaymentStatus({
    required this.orderCode,
    required this.status,
    this.responseCode,
    this.transactionStatus,
    this.subscriptionId,
    this.failureReason,
  });

  final String orderCode;
  final String status;
  final String? responseCode;
  final String? transactionStatus;
  final String? subscriptionId;
  final String? failureReason;

  bool get paid => status == 'PAID';

  factory _SubscriptionPaymentStatus.fromJson(dynamic value) {
    final data = _unwrap(value);
    final json = data is Map ? Map<String, dynamic>.from(data) : {};

    return _SubscriptionPaymentStatus(
      orderCode: _string(json['orderCode']),
      status: _normalizePaymentStatus(json['status']),
      responseCode: _nullableString(json['responseCode']),
      transactionStatus: _nullableString(json['transactionStatus']),
      subscriptionId: _nullableString(json['subscriptionId']),
      failureReason: _nullableString(json['failureReason']),
    );
  }
}

List<dynamic> _resultList(dynamic value) {
  final data = _unwrap(value);

  if (data is List) {
    return data;
  }

  if (data is Map) {
    final result =
        data['result'] ??
        data['comments'] ??
        data['items'] ??
        data['data'] ??
        data['records'];

    if (result is List) {
      return result;
    }
  }

  return const [];
}

int _intFromMap(Map<dynamic, dynamic> data, List<String> keys) {
  for (final key in keys) {
    final value = data[key];

    if (value is int) {
      return value;
    }

    if (value is num) {
      return value.toInt();
    }

    final parsed = int.tryParse(value?.toString() ?? '');

    if (parsed != null) {
      return parsed;
    }
  }

  return 0;
}

List<_StudioComment> _studioCommentsFromResponse(dynamic response) {
  return _resultList(response)
      .map(_StudioComment.fromJson)
      .where((comment) => comment.content.isNotEmpty)
      .toList();
}

int? _resolvedCommentTotal(
  List<_StudioComment>? apiComments,
  List<_StudioComment> notificationComments,
) {
  if (apiComments != null && apiComments.isNotEmpty) {
    return apiComments.length;
  }

  if (notificationComments.isNotEmpty) {
    return notificationComments.length;
  }

  return apiComments?.length;
}

bool _isCommentNotification(NotificationItem item) {
  final text = '${item.type} ${item.title} ${item.message}'.toLowerCase();
  return text.contains('comment');
}

_StudioComment _studioCommentFromNotification(NotificationItem item) {
  final parsed = _parseCommentNotificationMessage(item.message);
  final metadataComment = _notificationCommentContent(item);

  return _StudioComment(
    author: parsed.author ?? 'Someone',
    content: metadataComment ?? parsed.content ?? item.title,
    trackTitle: parsed.trackTitle,
    createdLabel: _formatStudioDateTime(item.createdAt?.toIso8601String()),
  );
}

String? _notificationCommentContent(NotificationItem item) {
  try {
    final metadata = item.metadata();

    return _nullableString(
      metadata['content'] ??
          metadata['comment'] ??
          metadata['commentText'] ??
          metadata['text'] ??
          metadata['body'],
    );
  } catch (_) {
    return null;
  }
}

_ParsedNotificationComment _parseCommentNotificationMessage(String message) {
  final text = message.trim();
  final marker = ' commented on ';
  final markerIndex = text.toLowerCase().indexOf(marker);

  if (markerIndex < 0) {
    return _ParsedNotificationComment(content: text);
  }

  final author = text.substring(0, markerIndex).trim();
  final trackTitle = text.substring(markerIndex + marker.length).trim();

  return _ParsedNotificationComment(
    author: author.isEmpty ? null : author,
    content: 'Commented on ${trackTitle.isEmpty ? 'your track' : trackTitle}',
    trackTitle: trackTitle.isEmpty ? null : trackTitle,
  );
}

String? _formatStudioDateTime(String? value) {
  final date = DateTime.tryParse(value ?? '')?.toLocal();

  if (date == null) {
    return null;
  }

  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  final year = date.year.toString();
  final hour = date.hour.toString().padLeft(2, '0');
  final minute = date.minute.toString().padLeft(2, '0');

  return '$day/$month/$year $hour:$minute';
}

class _ParsedNotificationComment {
  const _ParsedNotificationComment({
    this.author,
    this.content,
    this.trackTitle,
  });

  final String? author;
  final String? content;
  final String? trackTitle;
}

String _formatMoney(num value) {
  if (value <= 0) {
    return 'Free';
  }

  final raw = value.round().toString();
  final buffer = StringBuffer();

  for (var index = 0; index < raw.length; index++) {
    final remaining = raw.length - index;

    buffer.write(raw[index]);

    if (remaining > 1 && remaining % 3 == 1) {
      buffer.write('.');
    }
  }

  return '${buffer.toString()} VND';
}

int _remainingDays(String? value) {
  final date = DateTime.tryParse(value ?? '');

  if (date == null) {
    return 0;
  }

  final diff = date.difference(DateTime.now());

  if (diff.isNegative) {
    return 0;
  }

  return diff.inDays + (diff.inHours.remainder(24) > 0 ? 1 : 0);
}

List<_PlanFeatureData> _subscriptionFeatures(_StudioPlan plan) {
  return [
    _PlanFeatureData(
      label: 'Upload allowance',
      enabled: true,
      value: plan.unlimitedUploads
          ? 'Unlimited uploads'
          : '${plan.uploadMinutesLimit.toStringAsFixed(0)} minutes per period',
    ),
    _PlanFeatureData(
      label: 'Distribution',
      enabled: plan.canDistribute,
      value: plan.canDistribute ? 'Available' : 'Not included',
    ),
    _PlanFeatureData(
      label: 'Monetization',
      enabled: plan.canMonetize,
      value: plan.canMonetize ? 'Available' : 'Not included',
    ),
    _PlanFeatureData(
      label: 'Scheduled releases',
      enabled: plan.canScheduleRelease,
      value: plan.canScheduleRelease ? 'Available' : 'Not included',
    ),
    _PlanFeatureData(
      label: 'Advanced insights',
      enabled: plan.advancedInsightsDays > 0,
      value: plan.advancedInsightsDays > 0
          ? '${plan.advancedInsightsDays} days'
          : 'Not included',
    ),
    _PlanFeatureData(
      label: 'Membership benefits',
      enabled: plan.hasMembershipBenefits,
      value: plan.hasMembershipBenefits ? 'Available' : 'Not included',
    ),
  ];
}

class _StudioSubscriptionData {
  const _StudioSubscriptionData({
    required this.plan,
    required this.subscription,
    required this.usage,
  });

  final _StudioPlan plan;
  final _UserSubscription subscription;
  final _SubscriptionUsage usage;

  factory _StudioSubscriptionData.fromJson(dynamic value) {
    if (value is! Map) {
      return const _StudioSubscriptionData(
        plan: _StudioPlan(),
        subscription: _UserSubscription(),
        usage: _SubscriptionUsage(),
      );
    }

    final json = Map<String, dynamic>.from(value);

    return _StudioSubscriptionData(
      plan: _StudioPlan.fromJson(json['plan']),
      subscription: _UserSubscription.fromJson(json['subscription']),
      usage: _SubscriptionUsage.fromJson(json['usage'], json['plan']),
    );
  }
}

class _StudioPlan {
  const _StudioPlan({
    this.code = 'BASIC',
    this.name = 'Basic',
    this.description = '',
    this.monthlyPrice = 0,
    this.uploadMinutesLimit = 180,
    this.unlimitedUploads = false,
    this.advancedInsightsDays = 7,
    this.canDistribute = false,
    this.canMonetize = false,
    this.canScheduleRelease = false,
    this.hasMembershipBenefits = false,
    this.sortOrder = 0,
  });

  final String code;
  final String name;
  final String description;
  final double monthlyPrice;
  final double uploadMinutesLimit;
  final bool unlimitedUploads;
  final int advancedInsightsDays;
  final bool canDistribute;
  final bool canMonetize;
  final bool canScheduleRelease;
  final bool hasMembershipBenefits;
  final int sortOrder;

  factory _StudioPlan.fromJson(dynamic value) {
    if (value is! Map) {
      return const _StudioPlan();
    }

    final json = Map<String, dynamic>.from(value);
    final code = _string(json['code']).isEmpty
        ? 'BASIC'
        : _string(json['code']);

    return _StudioPlan(
      code: code,
      name: _string(json['name']).isEmpty
          ? _planName(code)
          : _string(json['name']),
      description: _string(json['description']),
      monthlyPrice: _toDouble(json['monthlyPrice'] ?? json['price']),
      uploadMinutesLimit: _toDouble(
        json['uploadMinutesLimit'] ?? json['limitMinutes'],
      ).clamp(0, 1000000),
      unlimitedUploads: json['unlimitedUploads'] == true,
      advancedInsightsDays: _toInt(json['advancedInsightsDays']),
      canDistribute: json['canDistribute'] == true,
      canMonetize: json['canMonetize'] == true,
      canScheduleRelease: json['canScheduleRelease'] == true,
      hasMembershipBenefits: json['hasMembershipBenefits'] == true,
      sortOrder: _toInt(json['sortOrder']),
    );
  }
}

class _UserSubscription {
  const _UserSubscription({
    this.status = 'ACTIVE',
    this.startedAt,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.cancelAtPeriodEnd = false,
  });

  final String status;
  final String? startedAt;
  final String? currentPeriodStart;
  final String? currentPeriodEnd;
  final bool cancelAtPeriodEnd;

  bool get isActive => status.toUpperCase() == 'ACTIVE';

  factory _UserSubscription.fromJson(dynamic value) {
    if (value is! Map) {
      return const _UserSubscription();
    }

    final json = Map<String, dynamic>.from(value);

    return _UserSubscription(
      status: _string(json['status']).isEmpty
          ? 'ACTIVE'
          : _string(json['status']).toUpperCase(),
      startedAt: _nullableString(json['startedAt']),
      currentPeriodStart: _nullableString(json['currentPeriodStart']),
      currentPeriodEnd: _nullableString(json['currentPeriodEnd']),
      cancelAtPeriodEnd: json['cancelAtPeriodEnd'] == true,
    );
  }
}

class _SubscriptionUsage {
  const _SubscriptionUsage({
    this.uploadedMinutes = 0,
    this.limitMinutes = 180,
    this.remainingMinutes = 180,
    this.percentage = 0,
    this.unlimited = false,
  });

  final double uploadedMinutes;
  final double limitMinutes;
  final double remainingMinutes;
  final double percentage;
  final bool unlimited;

  factory _SubscriptionUsage.fromJson(dynamic value, dynamic planValue) {
    final plan = planValue is Map ? Map<String, dynamic>.from(planValue) : {};

    if (value is! Map) {
      final limit = _toDouble(plan['uploadMinutesLimit']);

      return _SubscriptionUsage(
        limitMinutes: limit > 0 ? limit : 180,
        remainingMinutes: limit > 0 ? limit : 180,
        unlimited: plan['unlimitedUploads'] == true,
      );
    }

    final json = Map<String, dynamic>.from(value);
    final limit = _toDouble(json['limitMinutes'] ?? plan['uploadMinutesLimit']);
    final uploaded = _toDouble(json['uploadedMinutes']);
    final remaining = _toDouble(json['remainingMinutes']);
    final percentage = _toDouble(json['percentage']).clamp(0, 100);
    final unlimited =
        json['unlimited'] == true || plan['unlimitedUploads'] == true;

    return _SubscriptionUsage(
      uploadedMinutes: uploaded,
      limitMinutes: limit > 0 ? limit : 180,
      remainingMinutes: remaining > 0
          ? remaining
          : (limit > 0 ? (limit - uploaded).clamp(0, limit).toDouble() : 180),
      percentage: percentage > 0
          ? percentage.toDouble()
          : (limit > 0
                ? ((uploaded / limit) * 100).clamp(0, 100).toDouble()
                : 0),
      unlimited: unlimited,
    );
  }
}

class _PlanFeatureData {
  const _PlanFeatureData({
    required this.label,
    required this.enabled,
    required this.value,
  });

  final String label;
  final bool enabled;
  final String value;
}

class _ArtistBenefit {
  const _ArtistBenefit({
    this.id,
    required this.title,
    this.description = '',
    this.imageUrl,
    this.saveLabel,
    this.sortOrder = 0,
  });

  final String? id;
  final String title;
  final String description;
  final String? imageUrl;
  final String? saveLabel;
  final int sortOrder;

  String? get resolvedImageUrl {
    final raw = imageUrl?.trim();

    if (raw == null || raw.isEmpty) {
      return null;
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw;
    }

    if (raw.startsWith('/')) {
      return '${ApiConfig.baseUrl}$raw';
    }

    return '${ApiConfig.baseUrl}/$raw';
  }

  factory _ArtistBenefit.fromJson(dynamic value) {
    if (value is! Map) {
      return const _ArtistBenefit(title: '');
    }

    final json = Map<String, dynamic>.from(value);

    return _ArtistBenefit(
      id: _nullableString(json['id'] ?? json['_id']),
      title: _string(json['title'] ?? json['name']),
      description: _string(json['description'] ?? json['subtitle']),
      imageUrl: _nullableString(json['imageUrl'] ?? json['image']),
      saveLabel: _nullableString(
        json['saveLabel'] ?? json['badge'] ?? json['savingLabel'],
      ),
      sortOrder: _toInt(json['sortOrder'] ?? json['order']),
    );
  }
}

class _ArtistWallet {
  const _ArtistWallet({
    this.pendingBalance = 0,
    this.availableBalance = 0,
    this.reservedBalance = 0,
    this.withdrawnBalance = 0,
    this.lifetimeEarnings = 0,
    this.currency = 'VND',
    this.status = 'UNKNOWN',
  });

  final double pendingBalance;
  final double availableBalance;
  final double reservedBalance;
  final double withdrawnBalance;
  final double lifetimeEarnings;
  final String currency;
  final String status;

  factory _ArtistWallet.fromJson(dynamic value) {
    if (value is! Map) {
      return const _ArtistWallet();
    }

    final json = Map<String, dynamic>.from(value);

    return _ArtistWallet(
      pendingBalance: _toDouble(json['pendingBalance']),
      availableBalance: _toDouble(json['availableBalance']),
      reservedBalance: _toDouble(json['reservedBalance']),
      withdrawnBalance: _toDouble(json['withdrawnBalance']),
      lifetimeEarnings: _toDouble(json['lifetimeEarnings']),
      currency: _string(json['currency']).isEmpty
          ? 'VND'
          : _string(json['currency']),
      status: _string(json['status']).isEmpty
          ? 'UNKNOWN'
          : _string(json['status']).toUpperCase(),
    );
  }
}

class _EarningHistoryPage {
  const _EarningHistoryPage({
    this.items = const [],
    this.currentPage = 1,
    this.totalItems = 0,
    this.totalPages = 1,
  });

  final List<_EarningItem> items;
  final int currentPage;
  final int totalItems;
  final int totalPages;

  factory _EarningHistoryPage.fromJson(dynamic value) {
    if (value is! Map) {
      return _EarningHistoryPage(
        items: _resultList(value).map(_EarningItem.fromJson).toList(),
      );
    }

    final json = Map<String, dynamic>.from(value);
    final items = _resultList(json).map(_EarningItem.fromJson).toList();

    return _EarningHistoryPage(
      items: items,
      currentPage: (_toInt(json['current'] ?? json['page']) <= 0)
          ? 1
          : _toInt(json['current'] ?? json['page']),
      totalItems: _toInt(json['totalItems'] ?? json['totalElements']),
      totalPages: (_toInt(json['totalPages']) <= 0)
          ? 1
          : _toInt(json['totalPages']),
    );
  }
}

class _EarningItem {
  const _EarningItem({
    this.id,
    this.trackId,
    this.amount = 0,
    this.currency = 'VND',
    this.status = 'PENDING',
    this.earningDate,
    this.qualifiedAt,
    this.availableAt,
    this.rejectionReason,
  });

  final String? id;
  final String? trackId;
  final double amount;
  final String currency;
  final String status;
  final String? earningDate;
  final String? qualifiedAt;
  final String? availableAt;
  final String? rejectionReason;

  factory _EarningItem.fromJson(dynamic value) {
    if (value is! Map) {
      return const _EarningItem();
    }

    final json = Map<String, dynamic>.from(value);

    return _EarningItem(
      id: _nullableString(json['id'] ?? json['_id']),
      trackId: _nullableString(json['trackId'] ?? json['track_id']),
      amount: _toDouble(json['amount']),
      currency: _string(json['currency']).isEmpty
          ? 'VND'
          : _string(json['currency']),
      status: _string(json['status']).isEmpty
          ? 'PENDING'
          : _string(json['status']).toUpperCase(),
      earningDate: _nullableString(json['earningDate'] ?? json['createdAt']),
      qualifiedAt: _nullableString(json['qualifiedAt']),
      availableAt: _nullableString(json['availableAt']),
      rejectionReason: _nullableString(json['rejectionReason']),
    );
  }
}

class _PayoutHistoryPage {
  const _PayoutHistoryPage({
    this.items = const [],
    this.currentPage = 1,
    this.totalItems = 0,
    this.totalPages = 1,
  });

  final List<_PayoutItem> items;
  final int currentPage;
  final int totalItems;
  final int totalPages;

  factory _PayoutHistoryPage.fromJson(dynamic value) {
    if (value is! Map) {
      return _PayoutHistoryPage(
        items: _resultList(value).map(_PayoutItem.fromJson).toList(),
      );
    }

    final json = Map<String, dynamic>.from(value);
    final items = _resultList(json).map(_PayoutItem.fromJson).toList();

    return _PayoutHistoryPage(
      items: items,
      currentPage: (_toInt(json['current'] ?? json['page']) <= 0)
          ? 1
          : _toInt(json['current'] ?? json['page']),
      totalItems: _toInt(json['totalItems'] ?? json['totalElements']),
      totalPages: (_toInt(json['totalPages']) <= 0)
          ? 1
          : _toInt(json['totalPages']),
    );
  }
}

class _PayoutItem {
  const _PayoutItem({
    this.id,
    this.amount = 0,
    this.currency = 'VND',
    this.status = 'PENDING',
    this.bankName,
    this.accountNumber,
    this.accountHolderName,
    this.artistNote,
    this.adminNote,
    this.transactionReference,
    this.requestedAt,
  });

  final String? id;
  final double amount;
  final String currency;
  final String status;
  final String? bankName;
  final String? accountNumber;
  final String? accountHolderName;
  final String? artistNote;
  final String? adminNote;
  final String? transactionReference;
  final String? requestedAt;

  bool get canCancel => id?.trim().isNotEmpty == true && status == 'PENDING';

  factory _PayoutItem.fromJson(dynamic value) {
    if (value is! Map) {
      return const _PayoutItem();
    }

    final json = Map<String, dynamic>.from(value);

    return _PayoutItem(
      id: _nullableString(json['id'] ?? json['_id']),
      amount: _toDouble(json['amount']),
      currency: _string(json['currency']).isEmpty
          ? 'VND'
          : _string(json['currency']),
      status: _string(json['status']).isEmpty
          ? 'PENDING'
          : _string(json['status']).toUpperCase(),
      bankName: _nullableString(json['bankName'] ?? json['bankCode']),
      accountNumber: _nullableString(json['accountNumber']),
      accountHolderName: _nullableString(json['accountHolderName']),
      artistNote: _nullableString(json['artistNote']),
      adminNote: _nullableString(json['adminNote']),
      transactionReference: _nullableString(json['transactionReference']),
      requestedAt: _nullableString(json['requestedAt'] ?? json['createdAt']),
    );
  }
}

class _HistoryQuery {
  const _HistoryQuery({required this.status, required this.page});

  final String? status;
  final int page;

  @override
  bool operator ==(Object other) {
    return other is _HistoryQuery &&
        other.status == status &&
        other.page == page;
  }

  @override
  int get hashCode => Object.hash(status, page);
}

String _formatCurrency(num amount, [String currency = 'VND']) {
  final normalized = currency.trim().isEmpty ? 'VND' : currency.trim();

  if (normalized.toUpperCase() != 'VND') {
    return '${amount.toStringAsFixed(amount % 1 == 0 ? 0 : 2)} $normalized';
  }

  return '${_formatMoney(amount)}';
}

String _shortId(String? value) {
  final text = value?.trim();

  if (text == null || text.isEmpty) {
    return '--';
  }

  if (text.length <= 14) {
    return text;
  }

  return '${text.substring(0, 7)}...${text.substring(text.length - 5)}';
}

String _maskAccount(String? value) {
  final text = value?.replaceAll(RegExp(r'\s+'), '').trim();

  if (text == null || text.isEmpty) {
    return '--';
  }

  if (text.length <= 4) {
    return text;
  }

  return '${List.filled(text.length - 4, '*').join()}${text.substring(text.length - 4)}';
}

class _InfoRowData {
  const _InfoRowData(this.label, this.value);

  final String label;
  final String value;
}

String _planName(String code) {
  switch (code.toUpperCase()) {
    case 'ARTIST_PRO':
    case 'ARTIST_PRO_DEMO':
      return 'Artist Pro';
    case 'ARTIST':
      return 'Artist';
    default:
      return 'Basic';
  }
}

List<_StudioPlan> _fallbackPlans() {
  return const [
    _StudioPlan(
      code: 'BASIC',
      name: 'Basic',
      description: 'Start uploading and tracking your SoundClone music.',
      monthlyPrice: 0,
      uploadMinutesLimit: 180,
      advancedInsightsDays: 7,
      sortOrder: 0,
    ),
    _StudioPlan(
      code: 'ARTIST',
      name: 'Artist',
      description: 'Grow with more upload time and distribution access.',
      monthlyPrice: 49000,
      uploadMinutesLimit: 600,
      advancedInsightsDays: 30,
      canDistribute: true,
      canScheduleRelease: true,
      sortOrder: 1,
    ),
    _StudioPlan(
      code: 'ARTIST_PRO',
      name: 'Artist Pro',
      description: 'Unlock unlimited uploads, monetization and benefits.',
      monthlyPrice: 99000,
      uploadMinutesLimit: 0,
      unlimitedUploads: true,
      advancedInsightsDays: 365,
      canDistribute: true,
      canMonetize: true,
      canScheduleRelease: true,
      hasMembershipBenefits: true,
      sortOrder: 2,
    ),
  ];
}

int _toInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '') ?? 0;
}

class _ArtistStudioStats {
  const _ArtistStudioStats({
    this.plays = 0,
    this.likes = 0,
    this.comments = 0,
    this.planName = 'Basic',
    this.uploadMinutesUsed = 0,
    this.uploadMinutesLimit = 180,
  });

  final int plays;
  final int likes;
  final int comments;
  final String planName;
  final int uploadMinutesUsed;
  final int uploadMinutesLimit;

  factory _ArtistStudioStats.fromJson(dynamic value) {
    if (value is! Map) {
      return const _ArtistStudioStats();
    }

    final data = Map<String, dynamic>.from(value);

    final rawPlan =
        data['planName'] ??
        data['currentPlan'] ??
        data['studioPlan'] ??
        data['plan'];
    var planName = 'Basic';

    if (rawPlan is Map) {
      planName = rawPlan['name']?.toString().trim().isNotEmpty == true
          ? rawPlan['name'].toString().trim()
          : planName;
    } else if (rawPlan?.toString().trim().isNotEmpty == true) {
      planName = rawPlan.toString().trim();
    }

    final uploadMinutesLimit = _intFromMap(data, [
      'uploadMinutesLimit',
      'uploadMinuteLimit',
      'minutesLimit',
      'totalUploadMinutes',
    ]);

    return _ArtistStudioStats(
      plays: _intFromMap(data, [
        'totalPlays',
        'totalPlay',
        'plays',
        'countPlay',
      ]),
      likes: _intFromMap(data, [
        'totalLikes',
        'totalLike',
        'likes',
        'countLike',
      ]),
      comments: _intFromMap(data, [
        'totalComments',
        'totalComment',
        'comments',
        'commentCount',
        'countComment',
      ]),
      planName: planName,
      uploadMinutesUsed: _intFromMap(data, [
        'uploadMinutesUsed',
        'minutesUsed',
        'usedMinutes',
        'totalUploadMinutesUsed',
      ]),
      uploadMinutesLimit: uploadMinutesLimit > 0 ? uploadMinutesLimit : 180,
    );
  }
}

class _StudioComment {
  const _StudioComment({
    required this.author,
    required this.content,
    this.id,
    this.trackId,
    this.trackTitle,
    this.createdLabel,
  });

  final String? id;
  final String? trackId;
  final String author;
  final String content;
  final String? trackTitle;
  final String? createdLabel;

  bool get canDelete => id?.trim().isNotEmpty == true;

  String get actionLabel {
    final title = trackTitle?.trim();

    if (title != null && title.isNotEmpty) {
      return 'Commented on $title';
    }

    return content;
  }

  String? get commentPreview {
    final text = content.trim();

    if (text.isEmpty || text.toLowerCase().startsWith('commented on ')) {
      return null;
    }

    return text;
  }

  String get authorInitial {
    final trimmed = author.trim();

    if (trimmed.isEmpty) {
      return '?';
    }

    return trimmed.characters.first.toUpperCase();
  }

  factory _StudioComment.fromJson(dynamic value) {
    if (value is! Map) {
      return const _StudioComment(author: 'Someone', content: '');
    }

    final json = Map<String, dynamic>.from(value);
    final user = json['user'] is Map
        ? Map<String, dynamic>.from(json['user'])
        : json['account'] is Map
        ? Map<String, dynamic>.from(json['account'])
        : json['author'] is Map
        ? Map<String, dynamic>.from(json['author'])
        : <String, dynamic>{};
    final track = json['track'] is Map
        ? Map<String, dynamic>.from(json['track'])
        : json['trackId'] is Map
        ? Map<String, dynamic>.from(json['trackId'])
        : <String, dynamic>{};

    return _StudioComment(
      id: _nullableString(json['id'] ?? json['_id']),
      trackId: _nullableString(
        track['id'] ?? track['_id'] ?? json['trackId'] ?? json['track_id'],
      ),
      author: _string(
        user['name'] ??
            user['username'] ??
            json['authorName'] ??
            json['username'] ??
            'Someone',
      ),
      content: _string(
        json['content'] ?? json['comment'] ?? json['text'] ?? '',
      ),
      trackTitle: _nullableString(
        track['title'] ?? json['trackTitle'] ?? json['songTitle'],
      ),
      createdLabel: _formatStudioDateTime(
        _nullableString(json['createdAt'] ?? json['updatedAt']),
      ),
    );
  }
}

class _StudioSummary {
  const _StudioSummary({
    required this.total,
    required this.publicTracks,
    required this.pendingTracks,
    required this.rejectedTracks,
    required this.plays,
    required this.likes,
    required this.comments,
  });

  final int total;
  final int publicTracks;
  final int pendingTracks;
  final int rejectedTracks;
  final int plays;
  final int likes;
  final int comments;

  factory _StudioSummary.fromTracks(List<HomeTrack> tracks) {
    var publicTracks = 0;
    var pendingTracks = 0;
    var rejectedTracks = 0;
    var plays = 0;
    var likes = 0;
    var comments = 0;

    for (final track in tracks) {
      final approval = _status(track.approvalStatus);
      final license = _status(track.licenseReviewStatus);

      plays += track.countPlay;
      likes += track.countLike;
      comments += track.countComment;

      if (approval == 'APPROVED') {
        publicTracks++;
      } else if (approval == 'REJECTED' || license == 'REJECTED') {
        rejectedTracks++;
      } else {
        pendingTracks++;
      }
    }

    return _StudioSummary(
      total: tracks.length,
      publicTracks: publicTracks,
      pendingTracks: pendingTracks,
      rejectedTracks: rejectedTracks,
      plays: plays,
      likes: likes,
      comments: comments,
    );
  }
}

class _StatCardData {
  const _StatCardData({
    required this.label,
    required this.value,
    required this.icon,
    this.locked = false,
  });

  final String label;
  final String value;
  final IconData icon;
  final bool locked;
}

class _StatusBadgeData {
  const _StatusBadgeData({required this.label, required this.tone});

  final String label;
  final _BadgeTone tone;
}

enum _StudioFilter {
  all('All'),
  public('Public'),
  private('Private'),
  rejected('Rejected');

  const _StudioFilter(this.label);

  final String label;
}

enum _StudioSection {
  tracks('SoundClone Tracks', false, ''),
  distribution('Distribution', true, 'Artist plan required'),
  vinyl('Vinyl Records', true, 'Artist plan required'),
  comments('Comments', false, ''),
  earnings('Earnings', true, 'Artist Pro required'),
  subscription('Subscription', true, 'Upgrade your Studio plan'),
  benefits('Benefits', true, 'Upgrade to unlock benefits');

  const _StudioSection(this.label, this.locked, this.upgradeHint);

  final String label;
  final bool locked;
  final String upgradeHint;
}

enum _BadgeTone { success, warning, error, muted }

class _BadgeStyle {
  const _BadgeStyle({
    required this.foreground,
    required this.background,
    required this.border,
  });

  final Color foreground;
  final Color background;
  final Color border;
}

_BadgeStyle _badgeStyle(_BadgeTone tone) {
  switch (tone) {
    case _BadgeTone.success:
      return const _BadgeStyle(
        foreground: Color(0xFF63E6A6),
        background: Color(0x1A63E6A6),
        border: Color(0x4463E6A6),
      );
    case _BadgeTone.warning:
      return const _BadgeStyle(
        foreground: _studioOrange,
        background: Color(0x29FF5500),
        border: Color(0x66FF5500),
      );
    case _BadgeTone.error:
      return const _BadgeStyle(
        foreground: Color(0xFFFF7B7B),
        background: Color(0x1FFF7B7B),
        border: Color(0x52FF7B7B),
      );
    case _BadgeTone.muted:
      return const _BadgeStyle(
        foreground: Color(0xFFBBBBBB),
        background: Color(0xFF2A2A2A),
        border: Color(0xFF3A3A3A),
      );
  }
}
