import 'package:flutter/material.dart';

import '../models/track_model.dart';

class TrackCard extends StatelessWidget {
  final TrackModel track;
  final VoidCallback? onTap;
  final bool compact;

  const TrackCard({
    super.key,
    required this.track,
    this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    final width = compact ? 150.0 : 172.0;
    final imageSize = compact ? 150.0 : 172.0;

    return SizedBox(
      width: width,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: Stack(
                children: [
                  SizedBox(
                    width: imageSize,
                    height: imageSize,
                    child: _TrackImage(url: track.imgUrl),
                  ),
                  Positioned(
                    right: 8,
                    bottom: 8,
                    child: Container(
                      width: 38,
                      height: 38,
                      decoration: const BoxDecoration(
                        color: Color(0xFFFF5500),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.play_arrow_rounded,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: Text(
                    track.artistName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  track.formattedDuration,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TrackImage extends StatelessWidget {
  final String? url;

  const _TrackImage({this.url});

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) {
      return _fallback();
    }

    return Image.network(
      url!,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _fallback(),
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Container(
          color: const Color(0xFF242424),
          alignment: Alignment.center,
          child: const SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        );
      },
    );
  }

  Widget _fallback() {
    return Container(
      color: const Color(0xFF242424),
      alignment: Alignment.center,
      child: const Icon(
        Icons.music_note_rounded,
        size: 48,
        color: Colors.white24,
      ),
    );
  }
}
