import 'package:flutter/material.dart';

import '../../../../core/config/api_config.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_text_styles.dart';
import '../../models/track_model.dart';

class HomeTrackCard extends StatelessWidget {
  const HomeTrackCard({
    super.key,
    required this.track,
    this.onTap,
  });

  final TrackModel track;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = _resolveImage(track.imgUrl);
    final artist = track.uploaderName ??
        track.description ??
        track.category ??
        'SoundClone';

    return SizedBox(
      width: 154,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: ColoredBox(
                  color: AppColors.surfaceElevated,
                  child: imageUrl == null
                      ? const Icon(
                          Icons.music_note_rounded,
                          size: 48,
                          color: AppColors.textSecondary,
                        )
                      : Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) {
                            return const Center(
                              child: Icon(
                                Icons.music_note_rounded,
                                size: 48,
                                color: AppColors.textSecondary,
                              ),
                            );
                          },
                        ),
                ),
              ),
            ),
            const SizedBox(height: 9),
            Text(
              track.title.isEmpty ? 'Unknown track' : track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.title,
            ),
            const SizedBox(height: 4),
            Text(
              artist,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.body,
            ),
          ],
        ),
      ),
    );
  }

  String? _resolveImage(String? value) {
    final raw = value?.trim() ?? '';

    if (raw.isEmpty) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    if (raw.startsWith('/')) return '${ApiConfig.baseUrl}$raw';

    return '${ApiConfig.baseUrl}/uploads/images/$raw';
  }
}
