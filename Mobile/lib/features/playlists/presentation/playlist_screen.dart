import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../providers/playlist_provider.dart';
import 'playlist_card.dart';

class PlaylistScreen extends ConsumerWidget {
  const PlaylistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(playlistPageProvider);
    return ColoredBox(
      color: const Color(0xFF181A1B),
      child: SafeArea(
        top: false,
        child: state.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: Color(0xFFFF5500)),
          ),
          error: (error, _) => _PlaylistError(
            onRetry: () => ref.invalidate(playlistPageProvider),
          ),
          data: (data) => RefreshIndicator(
            color: const Color(0xFFFF5500),
            onRefresh: () async {
              ref.invalidate(playlistPageProvider);
              await ref.read(playlistPageProvider.future);
            },
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(14, 22, 14, 110),
              children: [
                _PlaylistHeader(
                  onCreate: () => _showCreate(context, ref),
                  onAddTrack: data.playlists.isEmpty
                      ? null
                      : () => _showAddTrack(context, ref, data),
                ),
                const SizedBox(height: 16),
                if (data.playlists.isEmpty)
                  const _EmptyPlaylist()
                else
                  ...data.playlists.map(
                    (playlist) => _ManagePlaylistTile(
                      playlist: playlist,
                      onDelete: () => _delete(context, ref, playlist),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _showCreate(BuildContext context, WidgetRef ref) async {
    final controller = TextEditingController();
    var isPublic = true;
    final created = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: const Color(0xFF181A1B),
          title: const Text(
            'Create playlist',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(labelText: 'Playlist title'),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                activeThumbColor: const Color(0xFFFF5500),
                value: isPublic,
                onChanged: (value) => setState(() => isPublic = value),
                title: Text(
                  isPublic ? 'Public playlist' : 'Private playlist',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
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
              onPressed: () async {
                if (controller.text.trim().isEmpty) {
                  return;
                }
                final response = await ApiService.instance
                    .createEmptyPlaylistApi(
                      title: controller.text,
                      isPublic: isPublic,
                    );
                if (dialogContext.mounted) {
                  Navigator.pop(dialogContext, response.isSuccess);
                }
              },
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF5500),
              ),
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
    controller.dispose();
    if (created == true) ref.invalidate(playlistPageProvider);
  }

  Future<void> _showAddTrack(
    BuildContext context,
    WidgetRef ref,
    PlaylistPageData data,
  ) async {
    String selectedPlaylist = playlistId(data.playlists.first);
    final selectedTracks = <String>{};
    var saving = false;
    String? errorMessage;
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: const Color(0xFF181A1B),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setState) {
          final chosenPlaylist = data.playlists.firstWhere(
            (item) => playlistId(item) == selectedPlaylist,
          );
          final existingIds = playlistTracks(
            chosenPlaylist,
          ).map((track) => track.id).toSet();
          final availableTracks = data.tracks
              .where((track) => !existingIds.contains(track.id))
              .toList();

          return Padding(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 24),
            child: Column(
              children: [
                const Text(
                  'Add tracks to playlist',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 15),
                DropdownButtonFormField<String>(
                  initialValue: selectedPlaylist,
                  dropdownColor: const Color(0xFF252525),
                  style: const TextStyle(color: Colors.white),
                  items: data.playlists
                      .map(
                        (item) => DropdownMenuItem(
                          value: playlistId(item),
                          child: Text((item['title'] ?? 'Playlist').toString()),
                        ),
                      )
                      .toList(),
                  onChanged: saving
                      ? null
                      : (value) {
                          if (value == null || value == selectedPlaylist) {
                            return;
                          }
                          setState(() {
                            selectedPlaylist = value;
                            selectedTracks.clear();
                            errorMessage = null;
                          });
                        },
                ),
                const SizedBox(height: 12),
                Expanded(
                  child: availableTracks.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Text(
                              data.tracks.isEmpty
                                  ? 'No tracks are available.'
                                  : 'All available tracks are already in this playlist.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(
                                color: Color(0xFF999999),
                                fontSize: 14,
                              ),
                            ),
                          ),
                        )
                      : ListView.builder(
                          itemCount: availableTracks.length,
                          itemBuilder: (context, index) {
                            final track = availableTracks[index];
                            return CheckboxListTile(
                              activeColor: const Color(0xFFFF5500),
                              value: selectedTracks.contains(track.id),
                              onChanged: saving
                                  ? null
                                  : (checked) => setState(
                                      () => checked == true
                                          ? selectedTracks.add(track.id)
                                          : selectedTracks.remove(track.id),
                                    ),
                              title: Text(
                                track.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                track.artistName,
                                style: const TextStyle(
                                  color: Color(0xFF999999),
                                ),
                              ),
                            );
                          },
                        ),
                ),
                if (errorMessage != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Color(0xFFFF6B6B)),
                  ),
                ],
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: selectedTracks.isEmpty || saving
                        ? null
                        : () async {
                            setState(() {
                              saving = true;
                              errorMessage = null;
                            });

                            final mergedTrackIds = {
                              ...existingIds,
                              ...selectedTracks,
                            }.toList();
                            final response = await ApiService.instance
                                .updatePlaylistApi(
                                  playlistId: selectedPlaylist,
                                  payload: {
                                    'title': chosenPlaylist['title'],
                                    'isPublic':
                                        chosenPlaylist['isPublic'] != false,
                                    'tracks': mergedTrackIds,
                                  },
                                );

                            if (!response.isSuccess) {
                              setState(() {
                                saving = false;
                                errorMessage = response.message.isEmpty
                                    ? 'Could not add tracks to this playlist.'
                                    : response.message;
                              });
                              return;
                            }

                            if (sheetContext.mounted) {
                              Navigator.pop(sheetContext, true);
                            }
                          },
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFFF5500),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    icon: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.playlist_add_rounded),
                    label: Text(
                      saving
                          ? 'Adding tracks...'
                          : 'Add ${selectedTracks.length} selected track${selectedTracks.length == 1 ? '' : 's'}',
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
    if (saved == true) {
      try {
        final refreshedData = await ref.refresh(playlistPageProvider.future);
        if (refreshedData.playlists.isEmpty && data.playlists.isNotEmpty) {
          ref.invalidate(playlistPageProvider);
        }
      } catch (_) {
        // The update itself succeeded. Keep the screen usable and let pull to
        // refresh retry if the follow-up fetch temporarily fails.
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(content: Text('Tracks added successfully.')),
          );
      }
    }
  }

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> playlist,
  ) async {
    final confirmed =
        await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            backgroundColor: const Color(0xFF181A1B),
            title: const Text(
              'Delete playlist?',
              style: TextStyle(color: Colors.white),
            ),
            content: Text(
              'Delete "${playlist['title']}" permanently?',
              style: const TextStyle(color: Color(0xFFBBBBBB)),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context, true),
                child: const Text(
                  'Delete',
                  style: TextStyle(color: Color(0xFFFF5C5C)),
                ),
              ),
            ],
          ),
        ) ??
        false;
    if (!confirmed) return;
    final response = await ApiService.instance.deletePlaylistApi(
      playlistId(playlist),
    );
    if (response.isSuccess) ref.invalidate(playlistPageProvider);
  }
}

class _PlaylistHeader extends StatelessWidget {
  const _PlaylistHeader({required this.onCreate, this.onAddTrack});
  final VoidCallback onCreate;
  final VoidCallback? onAddTrack;
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(18),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        colors: [Color(0xFF352016), Color(0xFF111314)],
      ),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFF353535)),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            CircleAvatar(
              backgroundColor: Color(0xFFFF5500),
              child: Icon(Icons.queue_music_rounded, color: Colors.white),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Playlist',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 25,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    'Manage playlists and add tracks.',
                    style: TextStyle(color: Color(0xFFAAAAAA), fontSize: 13),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),
        Wrap(
          spacing: 9,
          runSpacing: 9,
          children: [
            OutlinedButton.icon(
              onPressed: onCreate,
              icon: const Icon(Icons.add),
              label: const Text('New playlist'),
            ),
            FilledButton.icon(
              onPressed: onAddTrack,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF5500),
              ),
              icon: const Icon(Icons.playlist_add),
              label: const Text('Add tracks'),
            ),
          ],
        ),
      ],
    ),
  );
}

class _ManagePlaylistTile extends StatelessWidget {
  const _ManagePlaylistTile({required this.playlist, required this.onDelete});
  final Map<String, dynamic> playlist;
  final VoidCallback onDelete;
  @override
  Widget build(BuildContext context) {
    final tracks = playlistTracks(playlist);
    return Card(
      color: const Color(0xFF111314),
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        iconColor: Colors.white,
        collapsedIconColor: Colors.white,
        title: Text(
          (playlist['title'] ?? 'Untitled playlist').toString(),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 17,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Text(
          '${playlist['isPublic'] != false ? 'Public' : 'Private'} playlist',
          style: const TextStyle(color: Color(0xFF999999)),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0x22FF5500),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '${tracks.length} tracks',
                style: const TextStyle(
                  color: Color(0xFFFF5500),
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            IconButton(
              onPressed: onDelete,
              icon: const Icon(
                Icons.delete_outline_rounded,
                color: Color(0xFFFF6666),
                size: 21,
              ),
            ),
          ],
        ),
        children: tracks.isEmpty
            ? const [
                Padding(
                  padding: EdgeInsets.all(24),
                  child: Text(
                    'No data.',
                    style: TextStyle(color: Color(0xFF999999)),
                  ),
                ),
              ]
            : tracks
                  .asMap()
                  .entries
                  .map(
                    (entry) => ListTile(
                      leading: Text(
                        '${entry.key + 1}',
                        style: const TextStyle(color: Color(0xFF999999)),
                      ),
                      title: Text(
                        entry.value.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      subtitle: Text(
                        entry.value.artistName,
                        style: const TextStyle(color: Color(0xFF888888)),
                      ),
                      trailing: const Icon(
                        Icons.play_arrow_rounded,
                        color: Color(0xFFFF5500),
                      ),
                    ),
                  )
                  .toList(),
      ),
    );
  }
}

class _EmptyPlaylist extends StatelessWidget {
  const _EmptyPlaylist();
  @override
  Widget build(BuildContext context) => Container(
    height: 230,
    decoration: BoxDecoration(
      color: const Color(0xFF111314),
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: const Color(0xFF3A3A3A)),
    ),
    child: const Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.queue_music_rounded, color: Color(0xFFFF5500), size: 54),
        SizedBox(height: 10),
        Text(
          'No playlists yet',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        SizedBox(height: 6),
        Text(
          'Create a new playlist to save your favorite tracks.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF999999)),
        ),
      ],
    ),
  );
}

class _PlaylistError extends StatelessWidget {
  const _PlaylistError({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Center(
    child: FilledButton.icon(
      onPressed: onRetry,
      style: FilledButton.styleFrom(backgroundColor: const Color(0xFFFF5500)),
      icon: const Icon(Icons.refresh),
      label: const Text('Retry playlists'),
    ),
  );
}
