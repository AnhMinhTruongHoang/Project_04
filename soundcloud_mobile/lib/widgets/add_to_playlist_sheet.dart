import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../core/utils/app_toast.dart';
import '../models/playlist_model.dart';
import '../models/track_model.dart';
import '../providers/playlist_provider.dart';

Future<void> showAddToPlaylistSheet(
  BuildContext context, {
  required TrackModel track,
}) async {
  final provider = context.read<PlaylistProvider>();

  await provider.loadMyPlaylists();

  if (!context.mounted) {
    return;
  }

  await showModalBottomSheet<void>(
    context: context,
    backgroundColor: const Color(0xFF202020),
    isScrollControlled: true,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
    ),
    builder: (_) {
      /*
       * Dùng ChangeNotifierProvider.value vì BottomSheet
       * tạo một route/context mới.
       */
      return ChangeNotifierProvider.value(
        value: provider,
        child: _AddToPlaylistSheet(track: track, hostContext: context),
      );
    },
  );
}

class _AddToPlaylistSheet extends StatelessWidget {
  final TrackModel track;
  final BuildContext hostContext;

  const _AddToPlaylistSheet({required this.track, required this.hostContext});

  @override
  Widget build(BuildContext context) {
    return Consumer<PlaylistProvider>(
      builder: (context, provider, _) {
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.70,
          minChildSize: 0.45,
          maxChildSize: 0.92,
          builder: (context, scrollController) {
            return Column(
              children: [
                const SizedBox(height: 10),

                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 18, 12, 12),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Add to playlist',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 23,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),

                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close),
                      ),
                    ],
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(5),
                        child: SizedBox(
                          width: 54,
                          height: 54,
                          child: _TrackCover(url: track.imgUrl),
                        ),
                      ),

                      const SizedBox(width: 12),

                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              track.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              track.artistName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(color: Colors.white54),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 18),

                const Divider(height: 1, color: Colors.white12),

                ListTile(
                  leading: Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF5500),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.add, color: Colors.white),
                  ),
                  title: const Text(
                    'Create new playlist',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  onTap: () => _createAndAdd(context, track),
                ),

                const Divider(height: 1, color: Colors.white12),

                Expanded(
                  child: provider.isLoading && provider.playlists.isEmpty
                      ? const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFFFF5500),
                          ),
                        )
                      : provider.playlists.isEmpty
                      ? const Center(
                          child: Text(
                            'Bạn chưa có playlist nào',
                            style: TextStyle(color: Colors.white54),
                          ),
                        )
                      : ListView.builder(
                          controller: scrollController,
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
                          itemCount: provider.playlists.length,
                          itemBuilder: (context, index) {
                            final playlist = provider.playlists[index];

                            return _PlaylistRow(
                              playlist: playlist,
                              track: track,
                              hostContext: hostContext,
                            );
                          },
                        ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _createAndAdd(BuildContext context, TrackModel track) async {
    final controller = TextEditingController();

    bool isPublic = true;

    final result = await showDialog<_CreatePlaylistResult>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF282828),
              title: const Text('Create playlist'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: controller,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Playlist name',
                    ),
                  ),

                  const SizedBox(height: 10),

                  SwitchListTile(
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Public'),
                    value: isPublic,
                    onChanged: (value) {
                      setDialogState(() {
                        isPublic = value;
                      });
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext),
                  child: const Text('Cancel'),
                ),

                FilledButton(
                  onPressed: () {
                    final name = controller.text.trim();

                    if (name.isEmpty) {
                      return;
                    }

                    Navigator.pop(
                      dialogContext,
                      _CreatePlaylistResult(title: name, isPublic: isPublic),
                    );
                  },
                  child: const Text('Create'),
                ),
              ],
            );
          },
        );
      },
    );

    controller.dispose();

    if (result == null || !context.mounted) {
      return;
    }

    final provider = context.read<PlaylistProvider>();

    final playlist = await provider.createPlaylist(
      title: result.title,
      isPublic: result.isPublic,
    );

    if (playlist == null || !context.mounted) {
      if (hostContext.mounted) {
        AppToast.error(
          hostContext,
          provider.errorMessage ?? 'Không thể tạo playlist',
        );
      }
      return;
    }

    final success = await provider.addTrackToPlaylist(
      playlistId: playlist.id,
      track: track,
    );

    if (!context.mounted) {
      return;
    }

    if (success) {
      Navigator.pop(context);

      if (hostContext.mounted) {
        AppToast.success(hostContext, 'Đã thêm vào ${playlist.title}');
      }
    } else {
      if (hostContext.mounted) {
        AppToast.error(
          hostContext,
          provider.errorMessage ?? 'Không thể thêm vào playlist',
        );
      }
    }
  }
}

class _PlaylistRow extends StatelessWidget {
  final PlaylistModel playlist;
  final TrackModel track;
  final BuildContext hostContext;

  const _PlaylistRow({
    required this.playlist,
    required this.track,
    required this.hostContext,
  });

  @override
  Widget build(BuildContext context) {
    final contains = playlist.tracks.any((item) => item.id == track.id);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),

      leading: ClipRRect(
        borderRadius: BorderRadius.circular(5),
        child: SizedBox(
          width: 54,
          height: 54,
          child: _PlaylistCover(playlist: playlist),
        ),
      ),

      title: Text(playlist.title, maxLines: 1, overflow: TextOverflow.ellipsis),

      subtitle: Text(
        '${playlist.trackCount} tracks • '
        '${playlist.isPublic ? 'Public' : 'Private'}',
        style: const TextStyle(color: Colors.white54),
      ),

      trailing: contains
          ? const Icon(Icons.check_circle, color: Color(0xFFFF5500))
          : const Icon(Icons.add_circle_outline),

      onTap: contains
          ? null
          : () async {
              final provider = context.read<PlaylistProvider>();

              final success = await provider.addTrackToPlaylist(
                playlistId: playlist.id,
                track: track,
              );

              if (!context.mounted) {
                return;
              }

              if (success) {
                Navigator.pop(context);

                if (hostContext.mounted) {
                  AppToast.success(
                    hostContext,
                    'Đã thêm vào ${playlist.title}',
                  );
                }
              } else {
                if (hostContext.mounted) {
                  AppToast.error(
                    hostContext,
                    provider.errorMessage ?? 'Không thể thêm vào playlist',
                  );
                }
              }
            },
    );
  }
}

class _PlaylistCover extends StatelessWidget {
  final PlaylistModel playlist;

  const _PlaylistCover({required this.playlist});

  @override
  Widget build(BuildContext context) {
    final url = playlist.coverUrl;

    if (url == null || url.trim().isEmpty) {
      return _placeholder();
    }

    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF333333),
      alignment: Alignment.center,
      child: const Icon(Icons.queue_music, color: Colors.white38),
    );
  }
}

class _TrackCover extends StatelessWidget {
  final String? url;

  const _TrackCover({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.trim().isEmpty) {
      return _placeholder();
    }

    return Image.network(
      url!,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF333333),
      alignment: Alignment.center,
      child: const Icon(Icons.music_note, color: Colors.white38),
    );
  }
}

class _CreatePlaylistResult {
  final String title;
  final bool isPublic;

  const _CreatePlaylistResult({required this.title, required this.isPublic});
}
