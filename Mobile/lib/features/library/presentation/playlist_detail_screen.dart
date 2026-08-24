import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';
import '../models/playlist.dart';
import '../providers/library_provider.dart';

class PlaylistDetailScreen extends ConsumerWidget {
  const PlaylistDetailScreen({
    super.key,
    required this.playlistId,
    this.initialPlaylist,
  });

  final String playlistId;
  final Playlist? initialPlaylist;

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlistAsync = ref.watch(playlistDetailProvider(playlistId));

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        title: Text(initialPlaylist?.title ?? 'Playlist'),
      ),
      body: playlistAsync.when(
        loading: () {
          final playlist = initialPlaylist;

          if (playlist != null) {
            return _PlaylistBody(playlist: playlist);
          }

          return const Center(
            child: CircularProgressIndicator(color: _orange),
          );
        },
        error: (_, _) {
          return _ErrorState(
            onRetry: () {
              ref.invalidate(playlistDetailProvider(playlistId));
            },
          );
        },
        data: (playlist) {
          if (playlist == null) {
            return const _EmptyState(
              title: 'Playlist not found',
              subtitle: 'It may have been removed.',
            );
          }

          return _PlaylistBody(playlist: playlist);
        },
      ),
    );
  }
}

class _PlaylistBody extends ConsumerWidget {
  const _PlaylistBody({required this.playlist});

  final Playlist playlist;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracks = playlist.tracks;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 20, 18, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 118,
                  height: 118,
                  decoration: BoxDecoration(
                    color: const Color(0xFF222222),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.queue_music_rounded,
                    color: PlaylistDetailScreen._orange,
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  playlist.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '${playlist.trackCount} tracks',
                  style: const TextStyle(
                    color: Color(0xFF999999),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 18),
                FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: PlaylistDetailScreen._orange,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: tracks.isEmpty
                      ? null
                      : () {
                          ref
                              .read(playerProvider.notifier)
                              .playTrack(tracks.first, queue: tracks);
                        },
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Play'),
                ),
              ],
            ),
          ),
        ),
        if (tracks.isEmpty)
          const SliverFillRemaining(
            hasScrollBody: false,
            child: _EmptyState(
              title: 'No tracks',
              subtitle: 'Add tracks from a track menu later.',
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 110),
            sliver: SliverList.separated(
              itemCount: tracks.length,
              separatorBuilder: (_, _) {
                return const Divider(
                  height: 1,
                  color: Color(0xFF222222),
                );
              },
              itemBuilder: (context, index) {
                final track = tracks[index];

                return _TrackTile(
                  track: track,
                  onRemove: () async {
                    await _removeTrack(
                      context: context,
                      ref: ref,
                      track: track,
                    );
                  },
                  onTap: () {
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(track, queue: tracks);
                  },
                );
              },
            ),
          ),
      ],
    );
  }

  Future<void> _removeTrack({
    required BuildContext context,
    required WidgetRef ref,
    required HomeTrack track,
  }) async {
    try {
      final trackIds = playlist.tracks
          .where((item) => item.id != track.id)
          .map((item) => item.id)
          .toList();

      await ref.read(libraryServiceProvider).updatePlaylist(
            playlistId: playlist.id,
            title: playlist.title,
            isPublic: playlist.isPublic,
            trackIds: trackIds,
          );

      ref.invalidate(playlistDetailProvider(playlist.id));
      ref.invalidate(playlistsProvider);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Track removed'),
          backgroundColor: PlaylistDetailScreen._orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not remove this track.')),
      );
    }
  }
}

class _TrackTile extends StatelessWidget {
  const _TrackTile({
    required this.track,
    required this.onTap,
    required this.onRemove,
  });

  final HomeTrack track;
  final VoidCallback onTap;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
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
      subtitle: Text(
        track.artistName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: PopupMenuButton<String>(
        tooltip: 'More',
        color: const Color(0xFF242424),
        icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
        onSelected: (value) {
          if (value == 'remove') {
            onRemove();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(
              value: 'remove',
              child: Text('Remove from playlist'),
            ),
          ];
        },
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
        width: 52,
        height: 52,
        color: const Color(0xFF222222),
        child: url == null
            ? const Icon(
                Icons.music_note_rounded,
                color: Color(0xFF777777),
              )
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

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: PlaylistDetailScreen._orange,
              size: 48,
            ),
            const SizedBox(height: 14),
            const Text(
              'Could not load playlist',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onRetry,
              child: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.queue_music_rounded,
              color: Color(0xFF555555),
              size: 52,
            ),
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
              style: const TextStyle(
                color: Color(0xFF888888),
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
