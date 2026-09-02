import '../../../core/config/api_config.dart';

class HomeTrack {
  const HomeTrack({
    required this.id,
    required this.title,
    this.slug,
    this.imgUrl,
    this.trackUrl,
    this.description,
    this.category,
    this.uploaderId,
    this.uploaderName,
    this.countPlay = 0,
    this.countLike = 0,
    this.countComment = 0,
    this.durationSeconds,
    this.processingStatus,
    this.licenseReviewStatus,
    this.approvalStatus,
    this.copyrightStatus,
    this.copyrightMessage,
    this.rejectionReason,
    this.audioHash,
    this.isDeleted = false,
    this.createdAt,
  });

  final String id;
  final String title;

  final String? slug;
  final String? imgUrl;
  final String? trackUrl;
  final String? description;
  final String? category;
  final String? uploaderId;
  final String? uploaderName;

  final int countPlay;
  final int countLike;
  final int countComment;
  final double? durationSeconds;
  final String? processingStatus;
  final String? licenseReviewStatus;
  final String? approvalStatus;
  final String? copyrightStatus;
  final String? copyrightMessage;
  final String? rejectionReason;
  final String? audioHash;
  final bool isDeleted;
  final String? createdAt;

  String? get resolvedImageUrl {
    return _resolveMediaUrl(imgUrl, fallbackPath: '/uploads/images/');
  }

  String? get resolvedTrackUrl {
    return _resolveMediaUrl(trackUrl, fallbackPath: '/uploads/audio/');
  }

  String get artistName {
    final name = uploaderName?.trim() ?? '';

    if (name.isNotEmpty) {
      return name;
    }

    return 'Unknown artist';
  }

  bool get canUsePublicTrackActions {
    final processing = processingStatus?.trim().toUpperCase();
    final review = licenseReviewStatus?.trim().toUpperCase();
    final approval = approvalStatus?.trim().toUpperCase();

    final isProcessingReady =
        processing == null ||
        processing.isEmpty ||
        processing == 'COMPLETED' ||
        processing == 'READY';

    final isReviewReady =
        review == null ||
        review.isEmpty ||
        review == 'APPROVED' ||
        review == 'VERIFIED';

    final isApprovalReady =
        approval == null ||
        approval.isEmpty ||
        approval == 'APPROVED' ||
        approval == 'PUBLIC';

    return isProcessingReady && isReviewReady && isApprovalReady;
  }

  factory HomeTrack.fromJson(dynamic value) {
    if (value is! Map) {
      return const HomeTrack(id: '', title: 'Unknown track');
    }

    final json = Map<String, dynamic>.from(value);

    Map<String, dynamic> uploader = {};

    if (json['uploader'] is Map) {
      uploader = Map<String, dynamic>.from(json['uploader']);
    }

    return HomeTrack(
      id: _string(json['id'] ?? json['_id']),
      title: _string(json['title']).isEmpty
          ? 'Unknown track'
          : _string(json['title']),
      slug: _nullableString(json['slug']),
      imgUrl: _nullableString(
        json['imgUrl'] ?? json['image'] ?? json['thumbnail'],
      ),
      trackUrl: _nullableString(
        json['trackUrl'] ?? json['audioUrl'] ?? json['audio'],
      ),
      description: _nullableString(json['description']),
      category: _nullableString(json['category']),
      uploaderId: _nullableString(
        json['uploaderId'] ?? uploader['id'] ?? uploader['_id'],
      ),
      uploaderName: _nullableString(uploader['name'] ?? uploader['username']),
      countPlay: _toInt(json['countPlay']),
      countLike: _toInt(json['countLike']),
      countComment: _toInt(
        json['countComment'] ?? json['commentCount'] ?? json['commentsCount'],
      ),
      durationSeconds: _toDouble(
        json['durationSeconds'] ?? json['duration'] ?? json['audioDuration'],
      ),
      processingStatus: _nullableString(json['processingStatus']),
      licenseReviewStatus: _nullableString(json['licenseReviewStatus']),
      approvalStatus: _nullableString(json['approvalStatus']),
      copyrightStatus: _nullableString(json['copyrightStatus']),
      copyrightMessage: _nullableString(json['copyrightMessage']),
      rejectionReason: _nullableString(json['rejectionReason']),
      audioHash: _nullableString(json['audioHash']),
      isDeleted: json['isDeleted'] == true,
      createdAt: _nullableString(json['createdAt'] ?? json['createdAtDate']),
    );
  }
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

int _toInt(dynamic value) {
  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  return int.tryParse(value?.toString() ?? '') ?? 0;
}

double? _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '');
}

String? _resolveMediaUrl(String? value, {required String fallbackPath}) {
  final raw = value?.trim();

  if (raw == null || raw.isEmpty) {
    return null;
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return raw;
  }

  if (raw.startsWith('/')) {
    return '${ApiConfig.baseUrl}$raw';
  }

  return '${ApiConfig.baseUrl}$fallbackPath$raw';
}
