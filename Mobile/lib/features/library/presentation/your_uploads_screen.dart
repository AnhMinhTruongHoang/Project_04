import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';
import '../providers/library_provider.dart';

const _uploadsOrange = Color(0xFFFF5500);

class YourUploadsScreen extends ConsumerStatefulWidget {
  const YourUploadsScreen({super.key});

  static const _background = Color(0xFF0D0D0D);
  static const _orange = _uploadsOrange;

  @override
  ConsumerState<YourUploadsScreen> createState() => _YourUploadsScreenState();
}

class _YourUploadsScreenState extends ConsumerState<YourUploadsScreen> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }

      ref.invalidate(myUploadsProvider);
    });
  }

  @override
  Widget build(BuildContext context) {
    final uploads = ref.watch(myUploadsProvider);

    return Scaffold(
      backgroundColor: YourUploadsScreen._background,
      appBar: AppBar(title: const Text('Your uploads')),
      body: RefreshIndicator(
        color: YourUploadsScreen._orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(myUploadsProvider);
          await ref.read(myUploadsProvider.future);
        },
        child: uploads.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(
                color: YourUploadsScreen._orange,
              ),
            );
          },
          error: (_, _) {
            return _MessageState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load uploads',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (tracks) {
            if (tracks.isEmpty) {
              return _MessageState(
                icon: Icons.cloud_upload_outlined,
                title: 'No uploads yet',
                subtitle: 'Tracks you upload will appear here first.',
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 130),
              itemCount: tracks.length,
              separatorBuilder: (_, _) {
                return const Divider(height: 1, color: Color(0xFF222222));
              },
              itemBuilder: (context, index) {
                final track = tracks[index];

                return _UploadTrackTile(
                  track: track,
                  onTap: () => _openTrackDetail(context, track),
                  onPlay: track.resolvedTrackUrl == null
                      ? null
                      : () {
                          ref
                              .read(playerProvider.notifier)
                              .playTrack(track, queue: tracks);
                        },
                );
              },
            );
          },
        ),
      ),
    );
  }

  void _openTrackDetail(BuildContext context, HomeTrack track) {
    final key = track.slug?.trim().isNotEmpty == true ? track.slug! : track.id;

    if (key.isEmpty) {
      return;
    }

    context.push('/track/$key', extra: track);
  }
}

class _UploadTrackTile extends StatelessWidget {
  const _UploadTrackTile({
    required this.track,
    required this.onTap,
    required this.onPlay,
  });

  final HomeTrack track;
  final VoidCallback onTap;
  final VoidCallback? onPlay;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minVerticalPadding: 12,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      leading: _Artwork(url: track.resolvedImageUrl),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Wrap(
          spacing: 7,
          runSpacing: 7,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              track.artistName,
              style: const TextStyle(
                color: Color(0xFFAAAAAA),
                fontWeight: FontWeight.w600,
              ),
            ),
            for (final badge in _statusBadges(track))
              _StatusBadge(label: badge.label, tone: badge.tone),
          ],
        ),
      ),
      trailing: IconButton(
        tooltip: onPlay == null ? 'Audio is processing' : 'Play',
        color: onPlay == null ? const Color(0xFF777777) : _uploadsOrange,
        onPressed: onPlay,
        icon: Icon(
          onPlay == null
              ? Icons.hourglass_bottom_rounded
              : Icons.play_circle_fill_rounded,
        ),
      ),
      onTap: onTap,
    );
  }
}

class _Artwork extends StatelessWidget {
  const _Artwork({required this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 60,
        height: 60,
        color: const Color(0xFF242424),
        child: url == null
            ? const Icon(Icons.music_note_rounded, color: Colors.white70)
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.music_note_rounded,
                    color: Colors.white70,
                  );
                },
              ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.tone});

  final String label;
  final _BadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final style = _badgeStyle(tone);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: style.border),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: style.foreground,
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _MessageState extends StatelessWidget {
  const _MessageState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(
        parent: BouncingScrollPhysics(),
      ),
      padding: const EdgeInsets.fromLTRB(28, 80, 28, 130),
      children: [
        Icon(icon, color: const Color(0xFF666666), size: 54),
        const SizedBox(height: 16),
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
          style: const TextStyle(color: Color(0xFF9A9A9A)),
        ),
      ],
    );
  }
}

List<_StatusBadgeData> _statusBadges(HomeTrack track) {
  final processing = _normalizedStatus(track.processingStatus);
  final license = _normalizedStatus(track.licenseReviewStatus);
  final approval = _normalizedStatus(track.approvalStatus);

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
  } else if (processing == 'COMPLETED' || processing == 'READY') {
    badges.add(
      const _StatusBadgeData(label: 'Processed', tone: _BadgeTone.success),
    );
  } else {
    badges.add(
      _StatusBadgeData(
        label: _readableStatus(processing),
        tone: _BadgeTone.info,
      ),
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

String? _normalizedStatus(String? value) {
  final status = value?.trim().toUpperCase();

  if (status == null || status.isEmpty) {
    return null;
  }

  return status;
}

String _readableStatus(String value) {
  return value
      .split(RegExp(r'[_\s-]+'))
      .where((part) => part.isNotEmpty)
      .map((part) {
        final lower = part.toLowerCase();
        return '${lower[0].toUpperCase()}${lower.substring(1)}';
      })
      .join(' ');
}

class _StatusBadgeData {
  const _StatusBadgeData({required this.label, required this.tone});

  final String label;
  final _BadgeTone tone;
}

enum _BadgeTone { success, warning, error, info, muted }

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
        foreground: _uploadsOrange,
        background: Color(0x29FF5500),
        border: Color(0x66FF5500),
      );
    case _BadgeTone.error:
      return const _BadgeStyle(
        foreground: Color(0xFFFF7B7B),
        background: Color(0x1FFF7B7B),
        border: Color(0x52FF7B7B),
      );
    case _BadgeTone.info:
      return const _BadgeStyle(
        foreground: Color(0xFF93C5FD),
        background: Color(0x1F93C5FD),
        border: Color(0x4493C5FD),
      );
    case _BadgeTone.muted:
      return const _BadgeStyle(
        foreground: Color(0xFFBBBBBB),
        background: Color(0xFF2A2A2A),
        border: Color(0xFF3A3A3A),
      );
  }
}
