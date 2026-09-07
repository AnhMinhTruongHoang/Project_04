import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../../shared/presentation/app_toast.dart';
import '../models/playlist.dart';
import '../providers/library_provider.dart';
import 'playlist_detail_screen.dart';

class AlbumsScreen extends ConsumerStatefulWidget {
  const AlbumsScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  ConsumerState<AlbumsScreen> createState() => _AlbumsScreenState();
}

class _AlbumsScreenState extends ConsumerState<AlbumsScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final albums = ref.watch(albumsProvider);

    return Scaffold(
      backgroundColor: AlbumsScreen._background,
      appBar: AppBar(
        title: const Text('Albums'),
        actions: [
          IconButton(
            tooltip: 'Create album',
            onPressed: () => _showCreateAlbumSheet(context),
            icon: const Icon(Icons.add_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AlbumsScreen._orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(albumsProvider);
          await ref.read(albumsProvider.future);
        },
        child: albums.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: AlbumsScreen._orange),
            );
          },
          error: (_, _) {
            return const _AlbumsMessage(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load albums',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const _AlbumsMessage(
                icon: Icons.album_rounded,
                title: 'No albums yet',
                subtitle: 'Tap + to create an album from your uploaded tracks.',
              );
            }

            final visibleItems = _filteredAlbums(items);

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
              children: [
                _AlbumsSearchBar(
                  controller: _searchController,
                  totalCount: items.length,
                  onChanged: (_) => setState(() {}),
                ),
                const SizedBox(height: 8),
                if (visibleItems.isEmpty)
                  const Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: _InlineAlbumsMessage(
                      icon: Icons.search_off_rounded,
                      title: 'No albums found',
                      subtitle: 'Try another keyword.',
                    ),
                  )
                else
                  for (var index = 0; index < visibleItems.length; index++) ...[
                    _AlbumTile(
                      album: visibleItems[index],
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
                      onEdit: () => _showEditAlbumSheet(visibleItems[index]),
                      onDelete: () => _deleteAlbum(visibleItems[index]),
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

  List<Playlist> _filteredAlbums(List<Playlist> items) {
    final query = _searchController.text.trim().toLowerCase();

    if (query.isEmpty) {
      return items;
    }

    return items.where((album) {
      return album.title.toLowerCase().contains(query) ||
          (album.ownerName ?? '').toLowerCase().contains(query);
    }).toList();
  }

  Future<void> _showCreateAlbumSheet(BuildContext context) async {
    final request = await showModalBottomSheet<_CreateAlbumRequest>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CreateAlbumSheet(),
    );

    if (request == null) {
      return;
    }

    if (!context.mounted) {
      return;
    }

    showAppToast(context, message: 'Creating album...');

    try {
      await ref
          .read(libraryServiceProvider)
          .createAlbum(
            title: request.title,
            isPublic: request.isPublic,
            trackIds: request.trackIds,
          );

      ref.invalidate(albumsProvider);
      ref.invalidate(playlistsProvider);

      if (!context.mounted) {
        return;
      }

      showAppToast(context, message: 'Album created');
    } catch (_) {
      if (!context.mounted) {
        return;
      }

      showAppToast(context, message: 'Could not create album.');
    }
  }

  Future<void> _showEditAlbumSheet(Playlist album) async {
    final titleController = TextEditingController(text: album.title);
    var isPublic = album.isPublic;

    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF161616),
      isScrollControlled: true,
      showDragHandle: true,
      useRootNavigator: true,
      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                4,
                18,
                MediaQuery.of(sheetContext).viewInsets.bottom + 104,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Edit album',
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
                    decoration: const InputDecoration(labelText: 'Album title'),
                  ),
                  const SizedBox(height: 14),
                  _AlbumPrivacyTile(
                    isPublic: isPublic,
                    onChanged: (value) {
                      setSheetState(() {
                        isPublic = value;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AlbumsScreen._orange,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: () async {
                        final title = titleController.text.trim();

                        if (title.isEmpty) {
                          return;
                        }

                        if (title == album.title &&
                            isPublic == album.isPublic) {
                          return;
                        }

                        try {
                          await ref
                              .read(libraryServiceProvider)
                              .updatePlaylist(
                                playlistId: album.id,
                                title: title,
                                isPublic: isPublic,
                                trackIds: album.tracks
                                    .map((track) => track.id)
                                    .toList(),
                              );
                          ref.invalidate(albumsProvider);
                          ref.invalidate(playlistsProvider);
                          ref.invalidate(playlistDetailProvider(album.id));

                          if (!sheetContext.mounted) {
                            return;
                          }

                          Navigator.of(sheetContext).pop();

                          if (!mounted) {
                            return;
                          }

                          showAppToast(context, message: 'Album updated');
                        } catch (_) {
                          if (!sheetContext.mounted) {
                            return;
                          }

                          showAppToast(
                            sheetContext,
                            message: 'Could not update album.',
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

  Future<void> _deleteAlbum(Playlist album) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete album?'),
          content: Text('Delete "${album.title}" from your library?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    try {
      await ref.read(libraryServiceProvider).deletePlaylist(album.id);
      ref.invalidate(albumsProvider);
      ref.invalidate(playlistsProvider);
      ref.invalidate(playlistDetailProvider(album.id));

      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Album deleted');
    } catch (_) {
      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Could not delete album.');
    }
  }
}

class _CreateAlbumRequest {
  const _CreateAlbumRequest({
    required this.title,
    required this.isPublic,
    required this.trackIds,
  });

  final String title;
  final bool isPublic;
  final List<String> trackIds;
}

class _CreateAlbumSheet extends ConsumerStatefulWidget {
  const _CreateAlbumSheet();

  @override
  ConsumerState<_CreateAlbumSheet> createState() => _CreateAlbumSheetState();
}

class _CreateAlbumSheetState extends ConsumerState<_CreateAlbumSheet> {
  final TextEditingController _titleController = TextEditingController();
  final Set<String> _selectedTrackIds = <String>{};

  bool _isPublic = true;
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final uploads = ref.watch(myUploadsProvider);
    final canSubmit =
        _titleController.text.trim().isNotEmpty &&
        _selectedTrackIds.isNotEmpty &&
        !_isSubmitting;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.58,
      maxChildSize: 0.94,
      builder: (context, scrollController) {
        return DecoratedBox(
          decoration: const BoxDecoration(
            color: Color(0xFF161616),
            borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: EdgeInsets.fromLTRB(
                18,
                12,
                18,
                MediaQuery.of(context).viewInsets.bottom + 18,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFF555555),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Create album',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        tooltip: 'Close',
                        onPressed: _isSubmitting
                            ? null
                            : () => Navigator.of(context).pop(false),
                        icon: const Icon(Icons.close_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _titleController,
                    autofocus: true,
                    textInputAction: TextInputAction.done,
                    onChanged: (_) => setState(() {}),
                    decoration: const InputDecoration(labelText: 'Album title'),
                  ),
                  const SizedBox(height: 12),
                  _AlbumPrivacyTile(
                    isPublic: _isPublic,
                    onChanged: _isSubmitting
                        ? null
                        : (value) => setState(() => _isPublic = value),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Choose tracks',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      Text(
                        '${_selectedTrackIds.length} selected',
                        style: const TextStyle(
                          color: Color(0xFFAAAAAA),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Expanded(
                    child: uploads.when(
                      loading: () {
                        return const Center(
                          child: CircularProgressIndicator(
                            color: AlbumsScreen._orange,
                          ),
                        );
                      },
                      error: (_, _) {
                        return const _InlineAlbumsMessage(
                          icon: Icons.cloud_off_rounded,
                          title: 'Could not load uploads',
                          subtitle: 'Pull down in Library and try again.',
                        );
                      },
                      data: (tracks) {
                        final selectableTracks = tracks.where((track) {
                          return track.id.isNotEmpty && !track.isDeleted;
                        }).toList();

                        if (selectableTracks.isEmpty) {
                          return const _InlineAlbumsMessage(
                            icon: Icons.upload_file_rounded,
                            title: 'No uploaded tracks',
                            subtitle: 'Upload tracks before creating an album.',
                          );
                        }

                        return ListView.separated(
                          controller: scrollController,
                          physics: const BouncingScrollPhysics(),
                          itemCount: selectableTracks.length,
                          separatorBuilder: (_, _) {
                            return const Divider(
                              height: 1,
                              color: Color(0xFF252525),
                            );
                          },
                          itemBuilder: (context, index) {
                            final track = selectableTracks[index];
                            final selected = _selectedTrackIds.contains(
                              track.id,
                            );

                            return _AlbumTrackTile(
                              track: track,
                              selected: selected,
                              disabled: _isSubmitting,
                              onTap: () => _toggleTrack(track.id),
                            );
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 14),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      style: FilledButton.styleFrom(
                        backgroundColor: AlbumsScreen._orange,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFF343434),
                        disabledForegroundColor: const Color(0xFF8A8A8A),
                        minimumSize: const Size.fromHeight(50),
                      ),
                      onPressed: canSubmit ? _submit : null,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(Icons.album_rounded),
                      label: Text(
                        _isSubmitting ? 'Creating...' : 'Create album',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  void _toggleTrack(String trackId) {
    if (_isSubmitting) {
      return;
    }

    setState(() {
      if (_selectedTrackIds.contains(trackId)) {
        _selectedTrackIds.remove(trackId);
      } else {
        _selectedTrackIds.add(trackId);
      }
    });
  }

  void _submit() {
    final title = _titleController.text.trim();

    if (title.isEmpty || _selectedTrackIds.isEmpty || _isSubmitting) {
      return;
    }

    setState(() => _isSubmitting = true);

    Navigator.of(context).pop(
      _CreateAlbumRequest(
        title: title,
        isPublic: _isPublic,
        trackIds: _selectedTrackIds.toList(),
      ),
    );
  }
}

class _AlbumPrivacyTile extends StatelessWidget {
  const _AlbumPrivacyTile({required this.isPublic, required this.onChanged});

  final bool isPublic;
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14),
        value: isPublic,
        activeThumbColor: AlbumsScreen._orange,
        title: Text(
          isPublic ? 'Public album' : 'Private album',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text(
          isPublic
              ? 'Listeners can find and play this album.'
              : 'Only you can view this album.',
          style: const TextStyle(color: Color(0xFFAAAAAA), fontSize: 13),
        ),
        onChanged: onChanged,
      ),
    );
  }
}

class _AlbumTrackTile extends StatelessWidget {
  const _AlbumTrackTile({
    required this.track,
    required this.selected,
    required this.disabled,
    required this.onTap,
  });

  final HomeTrack track;
  final bool selected;
  final bool disabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final image = track.resolvedImageUrl;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 6),
      enabled: !disabled,
      onTap: onTap,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(7),
        child: Container(
          width: 50,
          height: 50,
          color: const Color(0xFF242424),
          child: image == null
              ? const Icon(Icons.music_note_rounded, color: Colors.white54)
              : Image.network(
                  image,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) {
                    return const Icon(
                      Icons.music_note_rounded,
                      color: Colors.white54,
                    );
                  },
                ),
        ),
      ),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Text(
        track.artistName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Color(0xFF999999),
          fontWeight: FontWeight.w700,
        ),
      ),
      trailing: Checkbox(
        value: selected,
        activeColor: AlbumsScreen._orange,
        onChanged: disabled ? null : (_) => onTap(),
      ),
    );
  }
}

class _AlbumsSearchBar extends StatelessWidget {
  const _AlbumsSearchBar({
    required this.controller,
    required this.totalCount,
    required this.onChanged,
  });

  final TextEditingController controller;
  final int totalCount;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: 'Search $totalCount albums',
        prefixIcon: const Icon(Icons.search_rounded),
        filled: true,
        fillColor: const Color(0xFF202020),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide.none,
        ),
        contentPadding: EdgeInsets.zero,
      ),
    );
  }
}

class _AlbumTile extends StatelessWidget {
  const _AlbumTile({
    required this.album,
    required this.onTap,
    required this.onEdit,
    required this.onDelete,
  });

  final Playlist album;
  final VoidCallback onTap;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final image = album.tracks.isEmpty
        ? null
        : album.tracks.first.resolvedImageUrl;

    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Container(
          width: 58,
          height: 58,
          color: const Color(0xFF222222),
          child: image == null
              ? const Icon(Icons.album_rounded, color: AlbumsScreen._orange)
              : Image.network(
                  image,
                  fit: BoxFit.cover,
                  errorBuilder: (_, _, _) {
                    return const Icon(
                      Icons.album_rounded,
                      color: AlbumsScreen._orange,
                    );
                  },
                ),
        ),
      ),
      title: Text(
        album.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Padding(
        padding: const EdgeInsets.only(top: 5),
        child: Wrap(
          spacing: 8,
          runSpacing: 5,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            _AlbumVisibilityBadge(isPublic: album.isPublic),
            Text(
              '${album.trackCount} tracks',
              style: const TextStyle(color: Color(0xFF999999)),
            ),
            if (album.ownerName?.isNotEmpty == true)
              Text(
                album.ownerName!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Color(0xFF777777)),
              ),
          ],
        ),
      ),
      trailing: PopupMenuButton<String>(
        tooltip: 'More',
        color: const Color(0xFF242424),
        icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
        onSelected: (value) {
          if (value == 'edit') {
            onEdit();
          }

          if (value == 'delete') {
            onDelete();
          }
        },
        itemBuilder: (_) {
          return const [
            PopupMenuItem(value: 'edit', child: Text('Edit album')),
            PopupMenuItem(value: 'delete', child: Text('Delete album')),
          ];
        },
      ),
      onTap: onTap,
    );
  }
}

class _AlbumVisibilityBadge extends StatelessWidget {
  const _AlbumVisibilityBadge({required this.isPublic});

  final bool isPublic;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isPublic
            ? AlbumsScreen._orange.withValues(alpha: 0.15)
            : const Color(0xFF2B2B2B),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        isPublic ? 'Public' : 'Private',
        style: TextStyle(
          color: isPublic ? AlbumsScreen._orange : const Color(0xFFAAAAAA),
          fontSize: 11,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _AlbumsMessage extends StatelessWidget {
  const _AlbumsMessage({
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
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.22),
        Icon(icon, color: const Color(0xFF555555), size: 58),
        const SizedBox(height: 14),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFF888888),
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _InlineAlbumsMessage extends StatelessWidget {
  const _InlineAlbumsMessage({
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
        Icon(icon, color: const Color(0xFF555555), size: 42),
        const SizedBox(height: 10),
        Text(
          title,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF888888), fontSize: 13),
        ),
      ],
    );
  }
}
