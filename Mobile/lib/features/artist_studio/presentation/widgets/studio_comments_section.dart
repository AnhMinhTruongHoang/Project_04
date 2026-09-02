part of artist_studio_screen;

class _CommentsOverview extends ConsumerStatefulWidget {
  const _CommentsOverview({
    required this.notificationComments,
    required this.tracks,
  });

  final List<_StudioComment> notificationComments;
  final List<HomeTrack> tracks;

  @override
  ConsumerState<_CommentsOverview> createState() => _CommentsOverviewState();
}

class _CommentsOverviewState extends ConsumerState<_CommentsOverview> {
  String? _selectedTrackKey;
  bool _deleting = false;

  @override
  Widget build(BuildContext context) {
    final selectedTrack = _selectedTrack();
    final selectedTrackId = selectedTrack?.id.trim();
    final trackComments = selectedTrackId == null || selectedTrackId.isEmpty
        ? null
        : ref.watch(artistStudioTrackCommentsProvider(selectedTrackId));
    final loadedComments = _selectedTrackKey == null
        ? widget.notificationComments
        : trackComments?.asData?.value;

    if (_selectedTrackKey != null &&
        trackComments?.isLoading == true &&
        loadedComments == null) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 42),
        child: Center(child: CircularProgressIndicator(color: _studioOrange)),
      );
    }

    if (loadedComments != null) {
      if (loadedComments.isEmpty) {
        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFF121212),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF282828)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12),
                child: _TrackCommentFilter(
                  selectedTrackKey: _selectedTrackKey,
                  tracks: widget.tracks,
                  onChanged: _changeTrack,
                ),
              ),
              const Divider(height: 1, color: Color(0xFF252525)),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 42, horizontal: 16),
                child: _StudioMessage(
                  icon: Icons.mode_comment_outlined,
                  title: 'No comments yet',
                  subtitle: 'Track comments will appear here.',
                ),
              ),
            ],
          ),
        );
      }

      final filteredComments = _selectedTrackKey == null
          ? loadedComments
          : loadedComments.where(_matchesSelectedTrack).toList();

      return Container(
        decoration: BoxDecoration(
          color: const Color(0xFF121212),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF282828)),
        ),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(12),
              child: _TrackCommentFilter(
                selectedTrackKey: _selectedTrackKey,
                tracks: widget.tracks,
                onChanged: _changeTrack,
              ),
            ),
            const Divider(height: 1, color: Color(0xFF252525)),
            if (filteredComments.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 42, horizontal: 16),
                child: _StudioMessage(
                  icon: Icons.filter_alt_off_rounded,
                  title: 'No comments for this track',
                  subtitle: 'Choose another track.',
                ),
              )
            else
              for (var index = 0; index < filteredComments.length; index++) ...[
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: _studioOrange,
                    child: Text(
                      filteredComments[index].authorInitial,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  title: Row(
                    children: [
                      Expanded(
                        child: Text(
                          filteredComments[index].author,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      if (filteredComments[index].createdLabel != null)
                        Text(
                          filteredComments[index].createdLabel!,
                          style: const TextStyle(
                            color: Color(0xFF777777),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                    ],
                  ),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          filteredComments[index].content,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFFE0E0E0),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (filteredComments[index].trackTitle != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            filteredComments[index].trackTitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Color(0xFF9A9A9A),
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  trailing: filteredComments[index].canDelete
                      ? TextButton.icon(
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFFFF8A94),
                            disabledForegroundColor: const Color(0xFF666666),
                          ),
                          onPressed: _deleting
                              ? null
                              : () => _confirmDelete(filteredComments[index]),
                          icon: const Icon(Icons.delete_outline_rounded),
                          label: const Text('Delete'),
                        )
                      : null,
                ),
                if (index != filteredComments.length - 1)
                  const Divider(height: 1, color: Color(0xFF252525)),
              ],
          ],
        ),
      );
    }

    final commentedTracks =
        widget.tracks.where((track) => track.countComment > 0).toList()..sort(
          (first, second) => second.countComment.compareTo(first.countComment),
        );

    if (commentedTracks.isEmpty) {
      return const _StudioMessage(
        icon: Icons.mode_comment_outlined,
        title: 'No comments yet',
        subtitle: 'Track comments will appear here.',
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF121212),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF282828)),
      ),
      child: Column(
        children: [
          for (var index = 0; index < commentedTracks.length; index++) ...[
            ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 6,
              ),
              leading: _Artwork(url: commentedTracks[index].resolvedImageUrl),
              title: Text(
                commentedTracks[index].title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
              subtitle: Text(
                commentedTracks[index].artistName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Color(0xFF9A9A9A),
                  fontWeight: FontWeight.w700,
                ),
              ),
              trailing: _StatusBadge(
                label: '${commentedTracks[index].countComment}',
                tone: _BadgeTone.muted,
              ),
            ),
            if (index != commentedTracks.length - 1)
              const Divider(height: 1, color: Color(0xFF252525)),
          ],
        ],
      ),
    );
  }

  bool _matchesSelectedTrack(_StudioComment comment) {
    final key = _selectedTrackKey;

    if (key == null) {
      return true;
    }

    HomeTrack? selectedTrack;

    for (final track in widget.tracks) {
      if (_trackSelectionKey(track) == key) {
        selectedTrack = track;
        break;
      }
    }

    final selectedTitleKey = _trackKey(selectedTrack?.title);

    return comment.trackId == key ||
        _trackKey(comment.trackTitle) == key ||
        (selectedTitleKey.isNotEmpty &&
            _trackKey(comment.trackTitle) == selectedTitleKey);
  }

  HomeTrack? _selectedTrack() {
    final key = _selectedTrackKey;

    if (key == null) {
      return null;
    }

    for (final track in widget.tracks) {
      if (_trackSelectionKey(track) == key) {
        return track;
      }
    }

    return null;
  }

  void _changeTrack(String? value) {
    setState(() {
      _selectedTrackKey = value;
    });
  }

  Future<void> _confirmDelete(_StudioComment comment) async {
    final id = comment.id;

    if (id == null || id.isEmpty) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: const Text(
            'Delete comment?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: Text(
            'Delete this comment from "${comment.trackTitle ?? 'this track'}"?',
            style: const TextStyle(color: Color(0xFFBDBDBD)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF6975),
                foregroundColor: Colors.white,
              ),
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

    setState(() {
      _deleting = true;
    });

    try {
      final response = await ApiService.instance.deleteCommentApi(id);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final selectedTrackId = _selectedTrack()?.id.trim();

      if (selectedTrackId != null && selectedTrackId.isNotEmpty) {
        ref.invalidate(artistStudioTrackCommentsProvider(selectedTrackId));
        await ref.read(
          artistStudioTrackCommentsProvider(selectedTrackId).future,
        );
      }

      await ref.read(notificationProvider.notifier).refresh(preview: true);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Comment deleted')));
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not delete comment.')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _deleting = false;
        });
      }
    }
  }
}

class _TrackCommentFilter extends StatelessWidget {
  const _TrackCommentFilter({
    required this.selectedTrackKey,
    required this.tracks,
    required this.onChanged,
  });

  final String? selectedTrackKey;
  final List<HomeTrack> tracks;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final seen = <String>{};
    final items = <DropdownMenuItem<String?>>[
      const DropdownMenuItem(value: null, child: Text('All tracks')),
    ];

    for (final track in tracks) {
      final key = _trackSelectionKey(track);

      if (key.isEmpty || !seen.add(key)) {
        continue;
      }

      items.add(
        DropdownMenuItem(
          value: key,
          child: Text(
            track.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      );
    }

    return DropdownButtonFormField<String?>(
      value: selectedTrackKey,
      isExpanded: true,
      dropdownColor: const Color(0xFF202020),
      iconEnabledColor: Colors.white70,
      decoration: InputDecoration(
        labelText: 'Filter by track',
        prefixIcon: const Icon(Icons.music_note_rounded),
        filled: true,
        fillColor: const Color(0xFF181818),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF303030)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF303030)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: _studioOrange),
        ),
      ),
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
      items: items,
      onChanged: onChanged,
    );
  }
}
