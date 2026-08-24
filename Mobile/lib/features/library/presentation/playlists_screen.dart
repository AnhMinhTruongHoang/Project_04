import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/playlist.dart';
import '../providers/library_provider.dart';
import 'playlist_detail_screen.dart';

class PlaylistsScreen extends ConsumerWidget {
  const PlaylistsScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(playlistsProvider);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        title: const Text('Playlists'),
        actions: [
          IconButton(
            tooltip: 'Create playlist',
            onPressed: () {
              _showCreatePlaylistSheet(context, ref);
            },
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(playlistsProvider);
          await ref.read(playlistsProvider.future);
        },
        child: playlists.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _orange),
            );
          },
          error: (_, _) {
            return _MessageState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load playlists',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return _MessageState(
                icon: Icons.queue_music_rounded,
                title: 'No playlists yet',
                subtitle: 'Tap + to create your first playlist.',
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
              itemCount: items.length,
              separatorBuilder: (_, _) {
                return const Divider(
                  height: 1,
                  color: Color(0xFF222222),
                );
              },
              itemBuilder: (context, index) {
                final playlist = items[index];

                return _PlaylistTile(
                  playlist: playlist,
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => PlaylistDetailScreen(
                          playlistId: playlist.id,
                          initialPlaylist: playlist,
                        ),
                      ),
                    );
                  },
                  onDelete: () async {
                    await _deletePlaylist(
                      context: context,
                      ref: ref,
                      playlist: playlist,
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

  Future<void> _deletePlaylist({
    required BuildContext context,
    required WidgetRef ref,
    required Playlist playlist,
  }) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete playlist?'),
          content: Text('Delete "${playlist.title}" from your library?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop(false);
              },
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                Navigator.of(context).pop(true);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) return;

    try {
      await ref.read(libraryServiceProvider).deletePlaylist(playlist.id);
      ref.invalidate(playlistsProvider);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Playlist deleted'),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete playlist.')),
      );
    }
  }

  Future<void> _showCreatePlaylistSheet(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final titleController = TextEditingController();
    var isPublic = true;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF161616),
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                4,
                18,
                MediaQuery.of(context).viewInsets.bottom + 18,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Create playlist',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: titleController,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Playlist title',
                    ),
                  ),
                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    value: isPublic,
                    activeThumbColor: _orange,
                    title: const Text(
                      'Public',
                      style: TextStyle(color: Colors.white),
                    ),
                    onChanged: (value) {
                      setState(() {
                        isPublic = value;
                      });
                    },
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: _orange,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () async {
                        final title = titleController.text.trim();

                        if (title.isEmpty) return;

                        try {
                          await ref.read(libraryServiceProvider).createPlaylist(
                                title: title,
                                isPublic: isPublic,
                              );
                          ref.invalidate(playlistsProvider);

                          if (!context.mounted) return;

                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Playlist created'),
                              backgroundColor: _orange,
                            ),
                          );
                        } catch (_) {
                          if (!context.mounted) return;

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Could not create playlist.'),
                            ),
                          );
                        }
                      },
                      child: const Text('Create'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    titleController.dispose();
  }
}

class _PlaylistTile extends StatelessWidget {
  const _PlaylistTile({
    required this.playlist,
    required this.onTap,
    required this.onDelete,
  });

  final Playlist playlist;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      leading: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: const Color(0xFF222222),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Icon(
          Icons.queue_music_rounded,
          color: PlaylistsScreen._orange,
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
      trailing: PopupMenuButton<String>(
        tooltip: 'More',
        color: const Color(0xFF242424),
        icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
        onSelected: (value) {
          if (value == 'delete') {
            onDelete();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(
              value: 'delete',
              child: Text('Delete playlist'),
            ),
          ];
        },
      ),
      onTap: onTap,
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
