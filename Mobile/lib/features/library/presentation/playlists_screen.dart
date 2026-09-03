import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/playlist.dart';
import '../providers/library_provider.dart';
import 'playlist_detail_screen.dart';

class PlaylistsScreen extends ConsumerStatefulWidget {
  const PlaylistsScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  ConsumerState<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends ConsumerState<PlaylistsScreen> {
  final TextEditingController _searchController = TextEditingController();

  _PlaylistFilter _filter = _PlaylistFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final playlists = ref.watch(playlistsProvider);

    return Scaffold(
      backgroundColor: PlaylistsScreen._background,
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
        color: PlaylistsScreen._orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(playlistsProvider);
          await ref.read(playlistsProvider.future);
        },
        child: playlists.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: PlaylistsScreen._orange),
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
              return const _MessageState(
                icon: Icons.queue_music_rounded,
                title: 'No playlists yet',
                subtitle: 'Tap + to create your first playlist.',
              );
            }

            final visibleItems = _filteredPlaylists(items);

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
              children: [
                _PlaylistSearchBar(
                  controller: _searchController,
                  totalCount: items.length,
                  filter: _filter,
                  onChanged: (_) => setState(() {}),
                  onFilter: () => _showFilterSheet(context),
                ),
                const SizedBox(height: 8),
                if (visibleItems.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: _InlinePlaylistMessage(
                      icon: Icons.search_off_rounded,
                      title: 'No playlists found',
                      subtitle: 'Try another keyword or filter.',
                    ),
                  )
                else
                  for (var index = 0; index < visibleItems.length; index++) ...[
                    _PlaylistTile(
                      playlist: visibleItems[index],
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => PlaylistDetailScreen(
                              playlistId: visibleItems[index].id,
                              initialPlaylist: visibleItems[index],
                            ),
                          ),
                        );
                      },
                      onRename: () {
                        _showRenamePlaylistSheet(
                          context,
                          ref,
                          visibleItems[index],
                        );
                      },
                      onDelete: () async {
                        await _deletePlaylist(
                          context: context,
                          ref: ref,
                          playlist: visibleItems[index],
                        );
                      },
                    ),
                    if (index < visibleItems.length - 1)
                      const Divider(height: 1, color: Color(0xFF222222)),
                  ],
              ],
            );
          },
        ),
      ),
    );
  }

  List<Playlist> _filteredPlaylists(List<Playlist> items) {
    final query = _searchController.text.trim().toLowerCase();

    return items.where((playlist) {
      final matchesFilter = switch (_filter) {
        _PlaylistFilter.all => true,
        _PlaylistFilter.publicOnly => playlist.isPublic,
        _PlaylistFilter.privateOnly => !playlist.isPublic,
      };

      if (!matchesFilter) {
        return false;
      }

      if (query.isEmpty) {
        return true;
      }

      return playlist.title.toLowerCase().contains(query) ||
          (playlist.ownerName ?? '').toLowerCase().contains(query);
    }).toList();
  }

  Future<void> _showFilterSheet(BuildContext context) async {
    var selectedFilter = _filter;

    final result = await showModalBottomSheet<_PlaylistFilter>(
      context: context,
      backgroundColor: const Color(0xFF161616),
      showDragHandle: true,
      useRootNavigator: true,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 4, 18, 24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Filter playlists',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: Colors.black,
                          ),
                          onPressed: () {
                            Navigator.of(context).pop(selectedFilter);
                          },
                          child: const Text('Save'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _FilterOptionTile(
                      title: 'All playlists',
                      selected: selectedFilter == _PlaylistFilter.all,
                      onTap: () {
                        setState(() => selectedFilter = _PlaylistFilter.all);
                      },
                    ),
                    _FilterOptionTile(
                      title: 'Public playlists',
                      subtitle: 'Anyone can view these playlists.',
                      selected: selectedFilter == _PlaylistFilter.publicOnly,
                      onTap: () {
                        setState(
                          () => selectedFilter = _PlaylistFilter.publicOnly,
                        );
                      },
                    ),
                    _FilterOptionTile(
                      title: 'Private playlists',
                      subtitle: 'Only you can view these playlists.',
                      selected: selectedFilter == _PlaylistFilter.privateOnly,
                      onTap: () {
                        setState(
                          () => selectedFilter = _PlaylistFilter.privateOnly,
                        );
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );

    if (result == null) {
      return;
    }

    setState(() {
      _filter = result;
    });
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
      await ref.read(playlistsProvider.future);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Playlist deleted'),
          backgroundColor: PlaylistsScreen._orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete playlist.')),
      );
    }
  }

  Future<void> _showRenamePlaylistSheet(
    BuildContext context,
    WidgetRef ref,
    Playlist playlist,
  ) async {
    final titleController = TextEditingController(text: playlist.title);
    var isPublic = playlist.isPublic;

    await showModalBottomSheet<void>(
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
                    controller: titleController,
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
                        backgroundColor: PlaylistsScreen._orange,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () async {
                        final title = titleController.text.trim();

                        if (title.isEmpty) {
                          return;
                        }

                        if (title == playlist.title &&
                            isPublic == playlist.isPublic) {
                          return;
                        }

                        try {
                          await ref
                              .read(libraryServiceProvider)
                              .updatePlaylist(
                                playlistId: playlist.id,
                                title: title,
                                isPublic: isPublic,
                                trackIds: playlist.tracks
                                    .map((track) => track.id)
                                    .toList(),
                              );
                          await Future.wait([
                            ref.refresh(playlistsProvider.future),
                            ref.refresh(
                              playlistDetailProvider(playlist.id).future,
                            ),
                          ]);

                          if (!context.mounted) return;

                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Playlist updated'),
                              backgroundColor: PlaylistsScreen._orange,
                            ),
                          );
                        } catch (_) {
                          if (!context.mounted) return;

                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Could not update playlist.'),
                            ),
                          );
                        }
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

    titleController.dispose();
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
                  const SizedBox(height: 14),
                  _PlaylistVisibilityTile(
                    isPublic: isPublic,
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
                        backgroundColor: PlaylistsScreen._orange,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () async {
                        final title = titleController.text.trim();

                        if (title.isEmpty) return;

                        try {
                          await ref
                              .read(libraryServiceProvider)
                              .createPlaylist(title: title, isPublic: isPublic);
                          ref.invalidate(playlistsProvider);
                          await ref.read(playlistsProvider.future);

                          if (!context.mounted) return;

                          Navigator.of(context).pop();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Playlist created'),
                              backgroundColor: PlaylistsScreen._orange,
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

enum _PlaylistFilter { all, publicOnly, privateOnly }

class _PlaylistSearchBar extends StatelessWidget {
  const _PlaylistSearchBar({
    required this.controller,
    required this.totalCount,
    required this.filter,
    required this.onChanged,
    required this.onFilter,
  });

  final TextEditingController controller;
  final int totalCount;
  final _PlaylistFilter filter;
  final ValueChanged<String> onChanged;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    final filterActive = filter != _PlaylistFilter.all;

    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            decoration: InputDecoration(
              hintText: 'Search $totalCount playlists',
              prefixIcon: const Icon(Icons.search_rounded),
              filled: true,
              fillColor: const Color(0xFF202020),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(30),
                borderSide: BorderSide.none,
              ),
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        const SizedBox(width: 10),
        IconButton(
          tooltip: 'Filter playlists',
          color: filterActive ? PlaylistsScreen._orange : Colors.white,
          onPressed: onFilter,
          icon: const Icon(Icons.tune_rounded),
        ),
      ],
    );
  }
}

class _FilterOptionTile extends StatelessWidget {
  const _FilterOptionTile({
    required this.title,
    required this.selected,
    required this.onTap,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: subtitle == null
          ? null
          : Text(subtitle!, style: const TextStyle(color: Color(0xFF999999))),
      trailing: selected
          ? const Icon(Icons.check_circle_rounded, color: Colors.white)
          : null,
      onTap: onTap,
    );
  }
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
        activeThumbColor: PlaylistsScreen._orange,
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
          style: const TextStyle(color: Color(0xFFAAAAAA), fontSize: 13),
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _PlaylistTile extends StatelessWidget {
  const _PlaylistTile({
    required this.playlist,
    required this.onTap,
    required this.onRename,
    required this.onDelete,
  });

  final Playlist playlist;
  final VoidCallback onTap;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 56,
          height: 56,
          color: const Color(0xFF222222),
          child:
              playlist.tracks.isEmpty ||
                  playlist.tracks.first.resolvedImageUrl == null
              ? const Icon(
                  Icons.queue_music_rounded,
                  color: PlaylistsScreen._orange,
                )
              : Image.network(
                  playlist.tracks.first.resolvedImageUrl!,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) {
                    return const Icon(
                      Icons.queue_music_rounded,
                      color: PlaylistsScreen._orange,
                    );
                  },
                ),
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
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Wrap(
          spacing: 8,
          runSpacing: 5,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _VisibilityBadge(isPublic: playlist.isPublic),
            Text(
              '${playlist.trackCount} tracks',
              style: const TextStyle(color: Color(0xFF999999)),
            ),
          ],
        ),
      ),
      trailing: PopupMenuButton<String>(
        tooltip: 'More',
        color: const Color(0xFF242424),
        icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
        onSelected: (value) {
          if (value == 'rename') {
            onRename();
          }

          if (value == 'delete') {
            onDelete();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(value: 'rename', child: Text('Edit playlist')),
            PopupMenuItem(value: 'delete', child: Text('Delete playlist')),
          ];
        },
      ),
      onTap: onTap,
    );
  }
}

class _VisibilityBadge extends StatelessWidget {
  const _VisibilityBadge({required this.isPublic});

  final bool isPublic;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: isPublic ? const Color(0x22FF5500) : const Color(0x223F8CFF),
        borderRadius: BorderRadius.circular(5),
        border: Border.all(
          color: isPublic ? PlaylistsScreen._orange : const Color(0xFF3F8CFF),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isPublic ? Icons.public_rounded : Icons.lock_rounded,
              size: 12,
              color: isPublic
                  ? PlaylistsScreen._orange
                  : const Color(0xFF7DB1FF),
            ),
            const SizedBox(width: 4),
            Text(
              isPublic ? 'Public' : 'Private',
              style: TextStyle(
                color: isPublic
                    ? PlaylistsScreen._orange
                    : const Color(0xFF7DB1FF),
                fontSize: 11,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
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

class _InlinePlaylistMessage extends StatelessWidget {
  const _InlinePlaylistMessage({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: const Color(0xFF555555), size: 48),
        const SizedBox(height: 12),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 7),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF888888), fontSize: 13),
        ),
      ],
    );
  }
}
