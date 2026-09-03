import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../models/playlist.dart';
import '../providers/library_provider.dart';

Future<void> showAddToPlaylistSheet({
  required BuildContext context,
  required WidgetRef ref,
  required HomeTrack track,
}) async {
  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xFF161616),
    showDragHandle: true,
    useRootNavigator: true,
    builder: (context) {
      return _AddToPlaylistSheet(track: track);
    },
  );
}

class _AddToPlaylistSheet extends ConsumerWidget {
  const _AddToPlaylistSheet({required this.track});

  final HomeTrack track;

  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(playlistsProvider);

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 4, 18, 18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Add to playlist',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 12),
            playlists.when(
              loading: () {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 22),
                  child: Center(
                    child: CircularProgressIndicator(color: _orange),
                  ),
                );
              },
              error: (_, _) {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 18),
                  child: Text(
                    'Could not load playlists.',
                    style: TextStyle(color: Color(0xFF999999)),
                  ),
                );
              },
              data: (items) {
                if (items.isEmpty) {
                  return const Padding(
                    padding: EdgeInsets.symmetric(vertical: 18),
                    child: Text(
                      'Create a playlist first, then add this track.',
                      style: TextStyle(color: Color(0xFF999999)),
                    ),
                  );
                }

                return Flexible(
                  child: ListView.separated(
                    shrinkWrap: true,
                    itemCount: items.length,
                    separatorBuilder: (_, _) {
                      return const Divider(height: 1, color: Color(0xFF242424));
                    },
                    itemBuilder: (context, index) {
                      final playlist = items[index];

                      return _PlaylistOption(
                        playlist: playlist,
                        onTap: () async {
                          await _addTrack(
                            context: context,
                            ref: ref,
                            playlist: playlist,
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _addTrack({
    required BuildContext context,
    required WidgetRef ref,
    required Playlist playlist,
  }) async {
    final alreadyAdded = playlist.tracks.any((item) => item.id == track.id);

    if (alreadyAdded) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${track.title} is already in ${playlist.title}'),
        ),
      );

      return;
    }

    try {
      await ref
          .read(libraryServiceProvider)
          .addTrackToPlaylist(playlist: playlist, track: track);
      await Future.wait([
        ref.refresh(playlistsProvider.future),
        ref.refresh(playlistDetailProvider(playlist.id).future),
      ]);

      if (!context.mounted) return;

      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Added to ${playlist.title}'),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not add this track.')),
      );
    }
  }
}

class _PlaylistOption extends StatelessWidget {
  const _PlaylistOption({required this.playlist, required this.onTap});

  final Playlist playlist;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: const Color(0xFF252525),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(
          Icons.queue_music_rounded,
          color: _AddToPlaylistSheet._orange,
        ),
      ),
      title: Text(
        playlist.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: Text(
        '${playlist.trackCount} tracks',
        style: const TextStyle(color: Color(0xFF999999)),
      ),
      onTap: onTap,
    );
  }
}
