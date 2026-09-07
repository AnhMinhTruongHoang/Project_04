import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/providers/auth_provider.dart';
import '../../home/models/home_track.dart';
import '../providers/downloads_provider.dart';

/// The same action and state on every track surface. Nested taps are handled
/// here so downloading never triggers the parent card's play/navigation action.
class TrackDownloadButton extends ConsumerWidget {
  const TrackDownloadButton({
    super.key,
    required this.track,
    this.onCover = false,
  });

  final HomeTrack track;
  final bool onCover;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final downloads = ref.watch(downloadsProvider);
    final downloaded =
        downloads.value?.any((item) => item.track.id == track.id) ?? false;
    final job = ref.watch(
      downloadJobsProvider.select((jobs) => jobs[track.id]),
    );
    final running = job != null && job.error == null;
    final available =
        track.id.isNotEmpty &&
        !track.isDeleted &&
        track.resolvedTrackUrl != null;
    final tooltip = running
        ? 'Cancel download'
        : downloaded
        ? 'Downloaded'
        : downloads.isLoading
        ? 'Checking downloads'
        : !available
        ? 'Download unavailable'
        : job?.error != null
        ? 'Retry download'
        : 'Download';

    return SizedBox(
      width: 40,
      height: 40,
      child: IconButton(
        tooltip: tooltip,
        padding: EdgeInsets.zero,
        style: IconButton.styleFrom(
          backgroundColor: onCover ? const Color(0xCC111111) : null,
          foregroundColor: downloaded || running
              ? const Color(0xFFFF5500)
              : Colors.white,
          disabledForegroundColor: const Color(0xFF777777),
        ),
        onPressed:
            auth.isLoading ||
                downloads.isLoading ||
                (!available && !downloaded && !running)
            ? null
            : () async {
                if (ref.read(authProvider).value == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Log in to download music.')),
                  );
                  return;
                }
                if (running) {
                  ref.read(downloadsProvider.notifier).cancel(track.id);
                  return;
                }
                if (downloaded) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Already saved in Profile > Downloads.'),
                    ),
                  );
                  return;
                }
                final accountId = ref.read(authProvider).value?.id;
                final error = await ref
                    .read(downloadsProvider.notifier)
                    .download(track);
                if (!context.mounted ||
                    ref.read(authProvider).value?.id != accountId) {
                  return;
                }
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(error ?? 'Downloaded ${track.title}.'),
                  ),
                );
              },
        icon: running
            ? Stack(
                alignment: Alignment.center,
                children: [
                  SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      value: job.progress,
                      strokeWidth: 2,
                      color: const Color(0xFFFF5500),
                    ),
                  ),
                  const Icon(Icons.close_rounded, size: 16),
                ],
              )
            : Icon(
                downloaded
                    ? Icons.download_done_rounded
                    : job?.error != null
                    ? Icons.refresh_rounded
                    : Icons.download_rounded,
                size: 22,
              ),
      ),
    );
  }
}
