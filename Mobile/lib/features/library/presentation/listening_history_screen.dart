import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';

import '../../player/providers/player_provider.dart';
import '../../../shared/presentation/app_toast.dart';
import '../models/listening_history_item.dart';
import '../providers/library_provider.dart';
import 'add_to_playlist_sheet.dart';

class ListeningHistoryScreen extends ConsumerWidget {
  const ListeningHistoryScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(effectiveListeningHistoryProvider);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(title: const Text('Listening history')),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(listeningHistoryProvider);
          await ref.read(listeningHistoryProvider.future);
        },
        child: history.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _orange),
            );
          },
          error: (_, _) {
            return _MessageState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load history',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return _MessageState(
                icon: Icons.history_rounded,
                title: 'No listening history yet',
                subtitle: 'Play some tracks and they will appear here.',
              );
            }

            final queue = items.map((item) => item.track).toList();

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
              itemCount: items.length,
              separatorBuilder: (_, _) {
                return const Divider(height: 1, color: Color(0xFF222222));
              },
              itemBuilder: (context, index) {
                final item = items[index];

                return _HistoryTile(
                  item: item,
                  onTap: () {
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(item.track, queue: queue);
                  },
                  onAddToPlaylist: () {
                    showAddToPlaylistSheet(
                      context: context,
                      ref: ref,
                      track: item.track,
                    );
                  },
                  onCopyLink: () async {
                    await Clipboard.setData(
                      ClipboardData(text: _shareText(item.track)),
                    );

                    if (!context.mounted) {
                      return;
                    }

                    showAppToast(context, message: 'Track link copied');
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _HistoryTile extends StatelessWidget {
  const _HistoryTile({
    required this.item,
    required this.onTap,
    required this.onAddToPlaylist,
    required this.onCopyLink,
  });

  final ListeningHistoryItem item;
  final VoidCallback onTap;
  final VoidCallback onAddToPlaylist;
  final VoidCallback onCopyLink;

  @override
  Widget build(BuildContext context) {
    final track = item.track;

    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      leading: _Artwork(url: track.resolvedImageUrl),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: _HistorySubtitle(item: item),
      trailing: PopupMenuButton<String>(
        tooltip: 'More',
        color: const Color(0xFF242424),
        icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
        onSelected: (value) {
          if (value == 'play') {
            onTap();
          }

          if (value == 'playlist') {
            onAddToPlaylist();
          }

          if (value == 'share') {
            onCopyLink();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(value: 'play', child: Text('Play')),
            PopupMenuItem(value: 'playlist', child: Text('Add to playlist')),
            PopupMenuItem(value: 'share', child: Text('Copy track link')),
          ];
        },
      ),
      onTap: onTap,
    );
  }
}

class _HistorySubtitle extends StatelessWidget {
  const _HistorySubtitle({required this.item});

  final ListeningHistoryItem item;

  @override
  Widget build(BuildContext context) {
    final track = item.track;
    final progress = (item.progress * 100).clamp(0, 100).round();
    final status = item.completed ? 'Completed' : '$progress% listened';

    return Text(
      '${track.artistName}  •  $status',
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: const TextStyle(color: Color(0xFF999999)),
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
        width: 54,
        height: 54,
        color: const Color(0xFF222222),
        child: url == null
            ? const Icon(Icons.music_note_rounded, color: Color(0xFF777777))
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.music_note_rounded,
                    color: Color(0xFF777777),
                  );
                },
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
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
        Icon(icon, color: const Color(0xFF555555), size: 54),
        const SizedBox(height: 14),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF888888), fontSize: 13),
        ),
      ],
    );
  }
}

String _shareText(dynamic track) {
  return [
    '${track.title} - ${track.artistName}',
    if (track.resolvedTrackUrl != null) track.resolvedTrackUrl!,
  ].join('\n');
}
