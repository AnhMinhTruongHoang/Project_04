import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';
import '../models/playlist.dart';
import '../providers/library_provider.dart';

class PlaylistDetailScreen extends ConsumerStatefulWidget {
  const PlaylistDetailScreen({
    super.key,
    required this.playlistId,
    this.initialPlaylist,
  });

  final String playlistId;
  final Playlist? initialPlaylist;

  @override
  ConsumerState<PlaylistDetailScreen> createState() =>
      _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends ConsumerState<PlaylistDetailScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _query = '';

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final playlistAsync = ref.watch(
      playlistDetailProvider(widget.playlistId),
    );

    return Scaffold(
      backgroundColor: _background,
      body: playlistAsync.when(
        loading: () {
          final playlist = widget.initialPlaylist;

          if (playlist != null) {
            return _PlaylistBody(
              playlist: playlist,
              query: _query,
              searchController: _searchController,
              onQueryChanged: _setQuery,
            );
          }

          return const Center(
            child: CircularProgressIndicator(color: _orange),
          );
        },
        error: (_, _) {
          return _ErrorState(
            onRetry: () {
              ref.invalidate(playlistDetailProvider(widget.playlistId));
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

          return _PlaylistBody(
            playlist: playlist,
            query: _query,
            searchController: _searchController,
            onQueryChanged: _setQuery,
          );
        },
      ),
    );
  }

  void _setQuery(String value) {
    setState(() {
      _query = value;
    });
  }
}

class _PlaylistBody extends ConsumerWidget {
  const _PlaylistBody({
    required this.playlist,
    required this.query,
    required this.searchController,
    required this.onQueryChanged,
  });

  final Playlist playlist;
  final String query;
  final TextEditingController searchController;
  final ValueChanged<String> onQueryChanged;

  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracks = playlist.tracks;
    final filteredTracks = _filterTracks(tracks, query);
    final suggested = ref.watch(suggestedTracksProvider);
    final coverUrl = tracks.isEmpty ? null : tracks.first.resolvedImageUrl;

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        SliverToBoxAdapter(
          child: _PlaylistHeader(
            playlist: playlist,
            coverUrl: coverUrl,
            searchController: searchController,
            onQueryChanged: onQueryChanged,
            onPlay: tracks.isEmpty
                ? null
                : () {
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(tracks.first, queue: tracks);
                  },
            onShuffle: tracks.length < 2
                ? null
                : () {
                    final shuffled = [...tracks]..shuffle(Random());
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(shuffled.first, queue: shuffled);
                  },
            onRename: () => _renamePlaylist(context, ref),
            onDelete: () => _deletePlaylist(context, ref),
          ),
        ),
        if (filteredTracks.isEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 22),
              child: _InlineEmpty(
                text: tracks.isEmpty
                    ? 'No tracks yet. Add tracks from suggestions below.'
                    : 'No tracks match your search.',
              ),
            ),
          )
        else
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 18),
            sliver: SliverList.separated(
              itemCount: filteredTracks.length,
              separatorBuilder: (_, _) {
                return const Divider(
                  height: 1,
                  color: Color(0xFF222222),
                );
              },
              itemBuilder: (context, index) {
                final track = filteredTracks[index];

                return _TrackTile(
                  track: track,
                  onTap: () {
                    ref
                        .read(playerProvider.notifier)
                        .playTrack(track, queue: tracks);
                  },
                  onRemove: () => _removeTrack(context, ref, track),
                );
              },
            ),
          ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
            child: Text(
              'Suggested for you',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
            ),
          ),
        ),
        suggested.when(
          loading: () {
            return const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(
                  child: CircularProgressIndicator(color: _orange),
                ),
              ),
            );
          },
          error: (_, _) {
            return const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(18, 0, 18, 130),
                child: _InlineEmpty(text: 'Could not load suggestions.'),
              ),
            );
          },
          data: (items) {
            final trackIds = tracks.map((track) => track.id).toSet();
            final candidates = items
                .where((track) => !trackIds.contains(track.id))
                .take(8)
                .toList();

            if (candidates.isEmpty) {
              return const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(18, 0, 18, 130),
                  child: _InlineEmpty(text: 'No suggestions right now.'),
                ),
              );
            }

            return SliverPadding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 130),
              sliver: SliverList.separated(
                itemCount: candidates.length,
                separatorBuilder: (_, _) {
                  return const Divider(
                    height: 1,
                    color: Color(0xFF222222),
                  );
                },
                itemBuilder: (context, index) {
                  final track = candidates[index];

                  return _SuggestedTrackTile(
                    track: track,
                    onAdd: () => _addSuggestedTrack(context, ref, track),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  Future<void> _renamePlaylist(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController(text: playlist.title);
    var isPublic = playlist.isPublic;

    final result = await showModalBottomSheet<_PlaylistEditResult>(
      context: context,
      backgroundColor: const Color(0xFF161616),
      isScrollControlled: true,
      showDragHandle: true,
      useRootNavigator: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                4,
                18,
                MediaQuery.of(context).viewInsets.bottom + 104,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Edit playlist',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: controller,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Playlist title',
                    ),
                  ),
                  const SizedBox(height: 14),
                  _PlaylistVisibilityTile(
                    isPublic: isPublic,
                    onChanged: (value) {
                      setState(() {
                        isPublic = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: _orange,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () {
                        Navigator.of(context).pop(
                          _PlaylistEditResult(
                            title: controller.text.trim(),
                            isPublic: isPublic,
                          ),
                        );
                      },
                      child: const Text('Save'),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );

    controller.dispose();

    if (result == null || result.title.isEmpty) {
      return;
    }

    if (result.title == playlist.title && result.isPublic == playlist.isPublic) {
      return;
    }

    try {
      await ref.read(libraryServiceProvider).updatePlaylist(
            playlistId: playlist.id,
            title: result.title,
            isPublic: result.isPublic,
            trackIds: playlist.tracks.map((track) => track.id).toList(),
          );

      _refreshPlaylist(ref);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Playlist updated'),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update playlist.')),
      );
    }
  }

  Future<void> _deletePlaylist(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Delete playlist?'),
          content: Text('Delete "${playlist.title}" from your library?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
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

      Navigator.of(context).pop();
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

  Future<void> _removeTrack(
    BuildContext context,
    WidgetRef ref,
    HomeTrack track,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Remove track?'),
          content: Text('Remove "${track.title}" from this playlist?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Remove'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    final trackIds = playlist.tracks
        .where((item) => item.id != track.id)
        .map((item) => item.id)
        .toList();

    await _saveTrackIds(
      context: context,
      ref: ref,
      trackIds: trackIds,
      successMessage: 'Track removed',
      errorMessage: 'Could not remove this track.',
    );
  }

  Future<void> _addSuggestedTrack(
    BuildContext context,
    WidgetRef ref,
    HomeTrack track,
  ) async {
    final trackIds = {
      ...playlist.tracks.map((item) => item.id),
      track.id,
    }.toList();

    await _saveTrackIds(
      context: context,
      ref: ref,
      trackIds: trackIds,
      successMessage: 'Added to playlist',
      errorMessage: 'Could not add this track.',
    );
  }

  Future<void> _saveTrackIds({
    required BuildContext context,
    required WidgetRef ref,
    required List<String> trackIds,
    required String successMessage,
    required String errorMessage,
  }) async {
    try {
      await ref.read(libraryServiceProvider).updatePlaylist(
            playlistId: playlist.id,
            title: playlist.title,
            isPublic: playlist.isPublic,
            trackIds: trackIds,
          );

      _refreshPlaylist(ref);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(successMessage),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMessage)),
      );
    }
  }

  void _refreshPlaylist(WidgetRef ref) {
    ref.invalidate(playlistDetailProvider(playlist.id));
    ref.invalidate(playlistsProvider);
  }
}

class _PlaylistEditResult {
  const _PlaylistEditResult({
    required this.title,
    required this.isPublic,
  });

  final String title;
  final bool isPublic;
}

class _PlaylistVisibilityTile extends StatelessWidget {
  const _PlaylistVisibilityTile({
    required this.isPublic,
    required this.onChanged,
  });

  final bool isPublic;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14),
        value: isPublic,
        activeThumbColor: const Color(0xFFFF5500),
        title: Text(
          isPublic ? 'Public playlist' : 'Private playlist',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text(
          isPublic
              ? 'Anyone can view this playlist.'
              : 'Only you can view this playlist.',
          style: const TextStyle(
            color: Color(0xFFAAAAAA),
            fontSize: 13,
          ),
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _PlaylistHeader extends StatelessWidget {
  const _PlaylistHeader({
    required this.playlist,
    required this.coverUrl,
    required this.searchController,
    required this.onQueryChanged,
    required this.onPlay,
    required this.onShuffle,
    required this.onRename,
    required this.onDelete,
  });

  final Playlist playlist;
  final String? coverUrl;
  final TextEditingController searchController;
  final ValueChanged<String> onQueryChanged;
  final VoidCallback? onPlay;
  final VoidCallback? onShuffle;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Positioned.fill(
          child: _HeaderBackground(url: coverUrl),
        ),
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 14, 18, 26),
            child: Column(
              children: [
                Row(
                  children: [
                    IconButton.filled(
                      tooltip: 'Back',
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF2A2A2A),
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        controller: searchController,
                        onChanged: onQueryChanged,
                        decoration: InputDecoration(
                          hintText: 'Search in ${playlist.title}',
                          prefixIcon: const Icon(Icons.search_rounded),
                          filled: true,
                          fillColor: const Color(0xFF2C2C2C),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(30),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      tooltip: 'Edit',
                      color: Colors.white,
                      onPressed: onRename,
                      icon: const Icon(Icons.tune_rounded),
                    ),
                  ],
                ),
                const SizedBox(height: 28),
                _Cover(url: coverUrl, size: 170),
                const SizedBox(height: 18),
                Text(
                  playlist.title,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Playlist · ${playlist.trackCount} Tracks · ${_durationLabel(playlist.tracks)}',
                  style: const TextStyle(
                    color: Color(0xFFD0D0D0),
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 28),
                Row(
                  children: [
                    IconButton(
                      tooltip: 'More',
                      color: Colors.white,
                      onPressed: () => _showHeaderMenu(context),
                      icon: const Icon(Icons.more_vert_rounded),
                    ),
                    const Spacer(),
                    IconButton(
                      tooltip: 'Shuffle',
                      color: Colors.white,
                      iconSize: 34,
                      onPressed: onShuffle,
                      icon: const Icon(Icons.shuffle_rounded),
                    ),
                    const SizedBox(width: 20),
                    IconButton.filled(
                      tooltip: 'Play playlist',
                      style: IconButton.styleFrom(
                        fixedSize: const Size.square(78),
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black,
                        disabledBackgroundColor: const Color(0xFF333333),
                        disabledForegroundColor: const Color(0xFF888888),
                      ),
                      onPressed: onPlay,
                      icon: const Icon(
                        Icons.play_arrow_rounded,
                        size: 48,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showHeaderMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF171717),
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.edit_rounded),
                  title: const Text('Edit playlist'),
                  onTap: () {
                    Navigator.of(context).pop();
                    onRename();
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.delete_rounded),
                  title: const Text('Delete playlist'),
                  onTap: () {
                    Navigator.of(context).pop();
                    onDelete();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
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
      leading: _Cover(url: track.resolvedImageUrl, size: 62),
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
        '${track.artistName} · ${_compactCount(track.countPlay)} · ${_trackDuration(track)}',
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

class _SuggestedTrackTile extends StatelessWidget {
  const _SuggestedTrackTile({
    required this.track,
    required this.onAdd,
  });

  final HomeTrack track;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      leading: _Cover(url: track.resolvedImageUrl, size: 58),
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
      trailing: IconButton(
        tooltip: 'Add to playlist',
        color: Colors.white,
        iconSize: 32,
        onPressed: onAdd,
        icon: const Icon(Icons.add_box_outlined),
      ),
    );
  }
}

class _HeaderBackground extends StatelessWidget {
  const _HeaderBackground({required this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (url != null)
          Image.network(
            url!,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) {
              return const ColoredBox(color: Color(0xFF1E1E1E));
            },
          )
        else
          const ColoredBox(color: Color(0xFF1E1E1E)),
        Container(color: Colors.black.withValues(alpha: 0.58)),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0xAA000000),
                Color(0x33000000),
                Color(0xFF0D0D0D),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _Cover extends StatelessWidget {
  const _Cover({
    required this.url,
    required this.size,
  });

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: size,
        height: size,
        color: const Color(0xFF222222),
        child: url == null
            ? const Icon(
                Icons.queue_music_rounded,
                color: Color(0xFF777777),
              )
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.queue_music_rounded,
                    color: Color(0xFF777777),
                  );
                },
              ),
      ),
    );
  }
}

class _InlineEmpty extends StatelessWidget {
  const _InlineEmpty({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        color: Color(0xFF999999),
        fontSize: 14,
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
              color: Color(0xFFFF5500),
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

List<HomeTrack> _filterTracks(List<HomeTrack> tracks, String query) {
  final normalized = query.trim().toLowerCase();

  if (normalized.isEmpty) {
    return tracks;
  }

  return tracks.where((track) {
    return track.title.toLowerCase().contains(normalized) ||
        track.artistName.toLowerCase().contains(normalized);
  }).toList();
}

String _durationLabel(List<HomeTrack> tracks) {
  final seconds = tracks.fold<double>(
    0,
    (sum, track) => sum + (track.durationSeconds ?? 0),
  );

  if (seconds <= 0) {
    return '--:--';
  }

  return _formatDuration(seconds.round());
}

String _trackDuration(HomeTrack track) {
  final seconds = track.durationSeconds;

  if (seconds == null || seconds <= 0) {
    return '--:--';
  }

  return _formatDuration(seconds.round());
}

String _formatDuration(int totalSeconds) {
  final minutes = totalSeconds ~/ 60;
  final seconds = totalSeconds % 60;

  return '$minutes:${seconds.toString().padLeft(2, '0')}';
}

String _compactCount(int value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  }

  if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(1)}K';
  }

  return value.toString();
}
