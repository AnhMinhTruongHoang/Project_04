import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';
import '../../player/providers/player_social_provider.dart';
import '../providers/library_provider.dart';
import 'add_to_playlist_sheet.dart';

class LikedTracksScreen extends ConsumerWidget {
  const LikedTracksScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final likedTracks = ref.watch(likedTracksProvider);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(title: const Text('Your likes')),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(likedTracksProvider);
          await ref.read(likedTracksProvider.future);
        },
        child: likedTracks.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _orange),
            );
          },
          error: (_, _) {
            return _MessageState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load likes',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (tracks) {
            if (tracks.isEmpty) {
              return _MessageState(
                icon: Icons.favorite_border_rounded,
                title: 'No liked tracks yet',
                subtitle: 'Tracks you like will show up here.',
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
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
                  onTap: () {
                    ref
                        .read(playerSocialProvider.notifier)
                        .markTracksLiked(tracks);
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(track, queue: tracks);
                  },
                  onAddToPlaylist: () {
                    showAddToPlaylistSheet(
                      context: context,
                      ref: ref,
                      track: track,
                    );
                  },
                  onUnlike: () async {
                    await _unlikeTrack(
                      context: context,
                      ref: ref,
                      track: track,
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _unlikeTrack({
    required BuildContext context,
    required WidgetRef ref,
    required HomeTrack track,
  }) async {
    try {
      await ref.read(libraryServiceProvider).unlikeTrack(track.id);
      ref.read(playerSocialProvider.notifier).markTrackUnliked(track);
      ref.invalidate(likedTracksProvider);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Removed from your likes'),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not unlike this track.')),
      );
    }
  }
}

class _TrackTile extends StatelessWidget {
  const _TrackTile({
    required this.track,
    required this.onTap,
    required this.onAddToPlaylist,
    required this.onUnlike,
  });

  final HomeTrack track;
  final VoidCallback onTap;
  final VoidCallback onAddToPlaylist;
  final VoidCallback onUnlike;

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
          if (value == 'playlist') {
            onAddToPlaylist();
            return;
          }

          if (value == 'unlike') {
            onUnlike();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(
              value: 'playlist',
              child: Text('Add to playlist'),
            ),
            PopupMenuItem(
              value: 'unlike',
              child: Text('Remove like'),
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
        width: 54,
        height: 54,
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
          style: const TextStyle(
            color: Color(0xFF888888),
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
