import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/playlist_model.dart';
import '../../providers/playlist_provider.dart';
import '../../widgets/mini_player.dart';
import 'playlist_detail_screen.dart';

class PlaylistsScreen extends StatefulWidget {
  const PlaylistsScreen({super.key});

  @override
  State<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends State<PlaylistsScreen> {
  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      context.read<PlaylistProvider>().loadMyPlaylists();
    });
  }

  Future<void> _createPlaylist() async {
    final controller = TextEditingController();

    bool isPublic = true;

    final result = await showDialog<bool>(
      context: context,

      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF242424),

              title: const Text('Create playlist'),

              content: Column(
                mainAxisSize: MainAxisSize.min,

                children: [
                  TextField(
                    controller: controller,

                    autofocus: true,

                    decoration: const InputDecoration(
                      labelText: 'Playlist name',

                      hintText: 'Enter playlist name',
                    ),
                  ),

                  const SizedBox(height: 12),

                  SwitchListTile(
                    value: isPublic,

                    onChanged: (value) {
                      setDialogState(() {
                        isPublic = value;
                      });
                    },

                    contentPadding: EdgeInsets.zero,

                    title: const Text('Public playlist'),

                    subtitle: Text(
                      isPublic
                          ? 'Everyone can see this playlist'
                          : 'Only you can see this playlist',
                    ),
                  ),
                ],
              ),

              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),

                  child: const Text('Cancel'),
                ),

                FilledButton(
                  onPressed: () {
                    if (controller.text.trim().isEmpty) {
                      return;
                    }

                    Navigator.pop(dialogContext, true);
                  },

                  child: const Text('Create'),
                ),
              ],
            );
          },
        );
      },
    );

    if (result != true || !mounted) {
      controller.dispose();
      return;
    }

    final provider = context.read<PlaylistProvider>();

    final createdPlaylist = await provider.createPlaylist(
      title: controller.text,
      isPublic: isPublic,
    );

    controller.dispose();

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          createdPlaylist != null
              ? 'Playlist created'
              : 'Cannot create playlist',
        ),
      ),
    );
  }

  Future<void> _deletePlaylist(PlaylistModel playlist) async {
    final confirm = await showDialog<bool>(
      context: context,

      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF242424),

        title: const Text('Delete playlist?'),

        content: Text('Delete "${playlist.title}"?'),

        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),

          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),

            child: const Text(
              'Delete',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) {
      return;
    }

    final success = await context.read<PlaylistProvider>().deletePlaylist(
      playlist.id,
    );

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success ? 'Playlist deleted' : 'Cannot delete playlist'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      appBar: AppBar(
        backgroundColor: const Color(0xFF101010),

        title: const Text(
          'Playlists',
          style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800),
        ),

        actions: [
          IconButton(
            onPressed: _createPlaylist,

            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),

      body: Consumer<PlaylistProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.playlists.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFFF5500)),
            );
          }

          if (provider.errorMessage != null && provider.playlists.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,

                children: [
                  const Icon(
                    Icons.error_outline,

                    size: 45,
                    color: Colors.redAccent,
                  ),

                  const SizedBox(height: 12),

                  const Text('Cannot load playlists'),

                  const SizedBox(height: 12),

                  FilledButton(
                    onPressed: provider.loadMyPlaylists,

                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              Expanded(
                child: provider.playlists.isEmpty
                    ? _EmptyPlaylists(onCreate: _createPlaylist)
                    : RefreshIndicator(
                        onRefresh: provider.loadMyPlaylists,

                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(18, 12, 18, 30),

                          itemCount: provider.playlists.length,

                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 6),

                          itemBuilder: (context, index) {
                            final playlist = provider.playlists[index];

                            return _PlaylistTile(
                              playlist: playlist,

                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => PlaylistDetailScreen(
                                      playlistId: playlist.id,
                                    ),
                                  ),
                                );
                              },

                              onDelete: () => _deletePlaylist(playlist),
                            );
                          },
                        ),
                      ),
              ),

              const MiniPlayer(),
            ],
          );
        },
      ),
    );
  }
}

class _PlaylistTile extends StatelessWidget {
  final PlaylistModel playlist;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _PlaylistTile({
    required this.playlist,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

      borderRadius: BorderRadius.circular(8),

      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),

        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(5),

              child: SizedBox(
                width: 76,
                height: 76,

                child: _PlaylistCover(playlist: playlist),
              ),
            ),

            const SizedBox(width: 14),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  Text(
                    playlist.title,

                    maxLines: 1,

                    overflow: TextOverflow.ellipsis,

                    style: const TextStyle(
                      fontSize: 17,

                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 5),

                  Text(
                    '${playlist.trackCount} tracks',

                    style: const TextStyle(color: Colors.white54),
                  ),

                  const SizedBox(height: 3),

                  Row(
                    children: [
                      Icon(
                        playlist.isPublic ? Icons.public : Icons.lock_outline,

                        size: 14,
                        color: Colors.white38,
                      ),

                      const SizedBox(width: 5),

                      Text(
                        playlist.isPublic ? 'Public' : 'Private',

                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            PopupMenuButton<String>(
              color: const Color(0xFF242424),

              onSelected: (value) {
                if (value == 'delete') {
                  onDelete();
                }
              },

              itemBuilder: (_) => const [
                PopupMenuItem(
                  value: 'delete',

                  child: Row(
                    children: [
                      Icon(Icons.delete_outline, color: Colors.redAccent),

                      SizedBox(width: 10),

                      Text('Delete playlist'),
                    ],
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

class _PlaylistCover extends StatelessWidget {
  final PlaylistModel playlist;

  const _PlaylistCover({required this.playlist});

  @override
  Widget build(BuildContext context) {
    final url = playlist.coverUrl;

    if (url != null) {
      return Image.network(
        url,
        fit: BoxFit.cover,

        errorBuilder: (_, __, ___) => _placeholder(),
      );
    }

    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF292929),

      alignment: Alignment.center,

      child: const Icon(
        Icons.queue_music_rounded,

        size: 38,
        color: Colors.white38,
      ),
    );
  }
}

class _EmptyPlaylists extends StatelessWidget {
  final VoidCallback onCreate;

  const _EmptyPlaylists({required this.onCreate});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,

        children: [
          const Icon(
            Icons.queue_music_rounded,

            size: 70,
            color: Colors.white24,
          ),

          const SizedBox(height: 18),

          const Text(
            'No playlists yet',

            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
          ),

          const SizedBox(height: 8),

          const Text(
            'Create a playlist to organize your favorite tracks.',

            textAlign: TextAlign.center,

            style: TextStyle(color: Colors.white54),
          ),

          const SizedBox(height: 20),

          FilledButton.icon(
            onPressed: onCreate,

            icon: const Icon(Icons.add),

            label: const Text('Create playlist'),
          ),
        ],
      ),
    );
  }
}
