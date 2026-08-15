import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/playlist_model.dart';
import '../../models/track_model.dart';
import '../../providers/player_provider.dart';
import '../../providers/playlist_provider.dart';
import '../../services/playlist_service.dart';
import '../../widgets/mini_player.dart';
import '../../widgets/add_to_playlist_sheet.dart';

class PlaylistDetailScreen extends StatefulWidget {
  final String playlistId;

  const PlaylistDetailScreen({
    super.key,
    required this.playlistId,
  });

  @override
  State<PlaylistDetailScreen> createState() =>
      _PlaylistDetailScreenState();
}

class _PlaylistDetailScreenState extends State<PlaylistDetailScreen> {
  final PlaylistService _playlistService = PlaylistService();

  bool _isLoading = true;
  String? _errorMessage;

  PlaylistModel? _playlist;

  @override
  void initState() {
    super.initState();

    _loadPlaylist();
  }

  // ============================================================
  // LOAD PLAYLIST
  // ============================================================

  Future<void> _loadPlaylist() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final playlist =
      await _playlistService.getPlaylistById(
        widget.playlistId,
      );

      if (!mounted) return;

      setState(() {
        _playlist = playlist;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });
    }
  }

  // ============================================================
  // PLAY TRACK
  // ============================================================

  Future<void> _playTrack(
      TrackModel track,
      ) async {
    final playlist = _playlist;

    if (playlist == null) {
      return;
    }

    await context.read<PlayerProvider>().playTrack(
      track,
      queue: playlist.tracks,
    );
  }

  // ============================================================
  // PLAY ALL
  // ============================================================

  Future<void> _playAll() async {
    final playlist = _playlist;

    if (playlist == null ||
        playlist.tracks.isEmpty) {
      return;
    }

    await context.read<PlayerProvider>().playTrack(
      playlist.tracks.first,
      queue: playlist.tracks,
    );
  }

  // ============================================================
  // REMOVE TRACK
  // ============================================================

  Future<void> _removeTrack(
      TrackModel track,
      ) async {
    final playlist = _playlist;

    if (playlist == null) {
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF242424),

          title: const Text(
            'Remove track?',
          ),

          content: Text(
            'Remove "${track.title}" from "${playlist.title}"?',
          ),

          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(
                  dialogContext,
                  false,
                );
              },
              child: const Text(
                'Cancel',
              ),
            ),

            TextButton(
              onPressed: () {
                Navigator.pop(
                  dialogContext,
                  true,
                );
              },
              child: const Text(
                'Remove',
                style: TextStyle(
                  color: Colors.redAccent,
                ),
              ),
            ),
          ],
        );
      },
    );

    if (confirm != true ||
        !mounted) {
      return;
    }

    final success =
    await context
        .read<PlaylistProvider>()
        .removeTrackFromPlaylist(
      playlistId: playlist.id,
      trackId: track.id,
    );

    if (!mounted) return;

    if (success) {
      await _loadPlaylist();

      if (!mounted) return;

      _showMessage(
        'Đã xóa "${track.title}" khỏi playlist',
      );
    } else {
      final message =
          context
              .read<PlaylistProvider>()
              .errorMessage;

      _showMessage(
        message ??
            'Không thể xóa bài hát khỏi playlist',
      );
    }
  }

  // ============================================================
  // ADD TRACK TO OTHER PLAYLIST
  // ============================================================

  void _addToAnotherPlaylist(
      TrackModel track,
      ) {
    showAddToPlaylistSheet(
      context,
      track: track,
    );
  }

  // ============================================================
  // MESSAGE
  // ============================================================

  void _showMessage(
      String message,
      ) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
        ),
      );
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(
      BuildContext context,
      ) {
    return Scaffold(
      backgroundColor:
      const Color(
        0xFF101010,
      ),

      appBar: AppBar(
        backgroundColor:
        const Color(
          0xFF101010,
        ),

        elevation: 0,

        title: const Text(
          'Playlist',
        ),

        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed:
            _isLoading
                ? null
                : _loadPlaylist,
            icon: const Icon(
              Icons.refresh_rounded,
            ),
          ),
        ],
      ),

      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _buildBody(),
            ),

            const MiniPlayer(),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // BODY
  // ============================================================

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child:
        CircularProgressIndicator(
          color:
          Color(
            0xFFFF5500,
          ),
        ),
      );
    }

    if (_errorMessage != null ||
        _playlist == null) {
      return _ErrorState(
        message:
        _errorMessage ??
            'Playlist not found',
        onRetry:
        _loadPlaylist,
      );
    }

    final playlist =
    _playlist!;

    return RefreshIndicator(
      color:
      const Color(
        0xFFFF5500,
      ),

      onRefresh:
      _loadPlaylist,

      child: ListView(
        physics:
        const AlwaysScrollableScrollPhysics(),

        padding:
        const EdgeInsets.fromLTRB(
          20,
          18,
          20,
          30,
        ),

        children: [
          // =====================================================
          // COVER
          // =====================================================

          Center(
            child: SizedBox(
              width: 230,
              height: 230,

              child:
              _DetailCover(
                playlist:
                playlist,
              ),
            ),
          ),

          const SizedBox(
            height: 22,
          ),

          // =====================================================
          // TITLE
          // =====================================================

          Text(
            playlist.title,

            textAlign:
            TextAlign.center,

            style:
            const TextStyle(
              fontSize: 28,
              fontWeight:
              FontWeight.w800,
            ),
          ),

          const SizedBox(
            height: 8,
          ),

          // =====================================================
          // INFO
          // =====================================================

          Row(
            mainAxisAlignment:
            MainAxisAlignment.center,

            children: [
              Icon(
                playlist.isPublic
                    ? Icons.public
                    : Icons.lock_outline,

                size: 15,
                color:
                Colors.white38,
              ),

              const SizedBox(
                width: 5,
              ),

              Text(
                '${playlist.trackCount} '
                    '${playlist.trackCount == 1 ? 'track' : 'tracks'}'
                    ' • '
                    '${playlist.isPublic ? 'Public' : 'Private'}',

                style:
                const TextStyle(
                  color:
                  Colors.white54,
                ),
              ),
            ],
          ),

          const SizedBox(
            height: 24,
          ),

          // =====================================================
          // ACTION BUTTONS
          // =====================================================

          if (playlist
              .tracks
              .isNotEmpty)
            Row(
              children: [
                Expanded(
                  child:
                  FilledButton.icon(
                    onPressed:
                    _playAll,

                    style:
                    FilledButton.styleFrom(
                      backgroundColor:
                      const Color(
                        0xFFFF5500,
                      ),

                      foregroundColor:
                      Colors.white,

                      padding:
                      const EdgeInsets
                          .symmetric(
                        vertical:
                        15,
                      ),
                    ),

                    icon:
                    const Icon(
                      Icons
                          .play_arrow_rounded,
                    ),

                    label:
                    const Text(
                      'Play',
                    ),
                  ),
                ),

                const SizedBox(
                  width: 12,
                ),

                SizedBox(
                  width: 52,
                  height: 52,

                  child:
                  OutlinedButton(
                    onPressed:
                        () {
                      /*
                       * Shuffle để bước sau làm.
                       */
                      _showMessage(
                        'Shuffle sẽ làm ở bước tiếp theo',
                      );
                    },

                    style:
                    OutlinedButton.styleFrom(
                      padding:
                      EdgeInsets.zero,

                      side:
                      const BorderSide(
                        color:
                        Colors.white24,
                      ),

                      shape:
                      const CircleBorder(),
                    ),

                    child:
                    const Icon(
                      Icons
                          .shuffle_rounded,
                    ),
                  ),
                ),
              ],
            ),

          const SizedBox(
            height: 24,
          ),

          // =====================================================
          // TRACKS HEADER
          // =====================================================

          Row(
            children: [
              Expanded(
                child:
                const Text(
                  'Tracks',

                  style:
                  TextStyle(
                    fontSize:
                    21,

                    fontWeight:
                    FontWeight
                        .w800,
                  ),
                ),
              ),

              Text(
                '${playlist.trackCount}',

                style:
                const TextStyle(
                  color:
                  Colors.white38,
                ),
              ),
            ],
          ),

          const SizedBox(
            height: 12,
          ),

          // =====================================================
          // EMPTY
          // =====================================================

          if (playlist
              .tracks
              .isEmpty)
            const _EmptyPlaylist()

          // =====================================================
          // TRACK LIST
          // =====================================================

          else
            ...playlist.tracks.map(
                  (track) {
                return _PlaylistTrackTile(
                  track:
                  track,

                  onTap:
                      () =>
                      _playTrack(
                        track,
                      ),

                  onRemove:
                      () =>
                      _removeTrack(
                        track,
                      ),

                  onAddToPlaylist:
                      () =>
                      _addToAnotherPlaylist(
                        track,
                      ),
                );
              },
            ),
        ],
      ),
    );
  }
}

// ============================================================
// TRACK TILE
// ============================================================

class _PlaylistTrackTile
    extends StatelessWidget {
  final TrackModel track;

  final VoidCallback onTap;

  final VoidCallback onRemove;

  final VoidCallback
  onAddToPlaylist;

  const _PlaylistTrackTile({
    required this.track,
    required this.onTap,
    required this.onRemove,
    required this.onAddToPlaylist,
  });

  @override
  Widget build(
      BuildContext context,
      ) {
    final player =
    context
        .watch<PlayerProvider>();

    final isCurrent =
        player.currentTrack?.id ==
            track.id;

    final isPlaying =
        isCurrent &&
            player.isPlaying;

    return InkWell(
      onTap:
      onTap,

      child: Padding(
        padding:
        const EdgeInsets
            .symmetric(
          vertical: 8,
        ),

        child: Row(
          children: [
            // ===================================================
            // COVER
            // ===================================================

            Stack(
              alignment:
              Alignment.center,

              children: [
                ClipRRect(
                  borderRadius:
                  BorderRadius.circular(
                    5,
                  ),

                  child: SizedBox(
                    width: 62,
                    height: 62,

                    child:
                    _TrackArtwork(
                      url:
                      track.imgUrl,
                    ),
                  ),
                ),

                if (isCurrent)
                  Container(
                    width: 62,
                    height: 62,

                    decoration:
                    BoxDecoration(
                      color:
                      Colors.black
                          .withValues(
                        alpha:
                        0.4,
                      ),

                      borderRadius:
                      BorderRadius
                          .circular(
                        5,
                      ),
                    ),

                    child:
                    Icon(
                      isPlaying
                          ? Icons
                          .equalizer_rounded
                          : Icons
                          .play_arrow_rounded,

                      color:
                      Colors.white,

                      size: 28,
                    ),
                  ),
              ],
            ),

            const SizedBox(
              width: 14,
            ),

            // ===================================================
            // INFO
            // ===================================================

            Expanded(
              child: Column(
                crossAxisAlignment:
                CrossAxisAlignment
                    .start,

                children: [
                  Text(
                    track.title,

                    maxLines: 1,

                    overflow:
                    TextOverflow
                        .ellipsis,

                    style:
                    TextStyle(
                      fontSize:
                      16,

                      fontWeight:
                      FontWeight
                          .w700,

                      color:
                      isCurrent
                          ? const Color(
                        0xFFFF5500,
                      )
                          : Colors.white,
                    ),
                  ),

                  const SizedBox(
                    height: 4,
                  ),

                  Text(
                    track.artistName,

                    maxLines: 1,

                    overflow:
                    TextOverflow
                        .ellipsis,

                    style:
                    const TextStyle(
                      color:
                      Colors.white54,

                      fontSize:
                      13,
                    ),
                  ),

                  const SizedBox(
                    height: 5,
                  ),

                  Row(
                    children: [
                      const Icon(
                        Icons
                            .play_arrow_rounded,

                        size: 15,

                        color:
                        Colors.white38,
                      ),

                      const SizedBox(
                        width: 2,
                      ),

                      Text(
                        _formatCount(
                          track.countPlay,
                        ),

                        style:
                        const TextStyle(
                          color:
                          Colors.white38,

                          fontSize:
                          11,
                        ),
                      ),

                      const SizedBox(
                        width: 10,
                      ),

                      const Icon(
                        Icons.favorite,

                        size: 13,

                        color:
                        Colors.white38,
                      ),

                      const SizedBox(
                        width: 3,
                      ),

                      Text(
                        _formatCount(
                          track.countLike,
                        ),

                        style:
                        const TextStyle(
                          color:
                          Colors.white38,

                          fontSize:
                          11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // ===================================================
            // MENU
            // ===================================================

            PopupMenuButton<String>(
              color:
              const Color(
                0xFF242424,
              ),

              icon:
              const Icon(
                Icons.more_vert,

                color:
                Colors.white70,
              ),

              onSelected:
                  (
                  value,
                  ) {
                switch (value) {
                  case 'play':
                    onTap();
                    break;

                  case 'add':
                    onAddToPlaylist();
                    break;

                  case 'remove':
                    onRemove();
                    break;
                }
              },

              itemBuilder:
                  (
                  context,
                  ) =>
              const [
                PopupMenuItem(
                  value:
                  'play',

                  child:
                  Row(
                    children: [
                      Icon(
                        Icons
                            .play_arrow_rounded,
                      ),

                      SizedBox(
                        width:
                        12,
                      ),

                      Text(
                        'Play',
                      ),
                    ],
                  ),
                ),

                PopupMenuItem(
                  value:
                  'add',

                  child:
                  Row(
                    children: [
                      Icon(
                        Icons
                            .playlist_add_rounded,
                      ),

                      SizedBox(
                        width:
                        12,
                      ),

                      Text(
                        'Add to another playlist',
                      ),
                    ],
                  ),
                ),

                PopupMenuItem(
                  value:
                  'remove',

                  child:
                  Row(
                    children: [
                      Icon(
                        Icons
                            .remove_circle_outline,

                        color:
                        Colors.redAccent,
                      ),

                      SizedBox(
                        width:
                        12,
                      ),

                      Text(
                        'Remove from playlist',
                      ),
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

  static String _formatCount(
      int value,
      ) {
    if (value >= 1000000) {
      return '${(value / 1000000).toStringAsFixed(1)}M';
    }

    if (value >= 1000) {
      return '${(value / 1000).toStringAsFixed(1)}K';
    }

    return value.toString();
  }
}

// ============================================================
// DETAIL COVER
// ============================================================

class _DetailCover
    extends StatelessWidget {
  final PlaylistModel playlist;

  const _DetailCover({
    required this.playlist,
  });

  @override
  Widget build(
      BuildContext context,
      ) {
    final tracks =
        playlist.tracks;

    /*
     * Nếu có >= 4 bài:
     * hiển thị cover dạng 2x2 giống app music.
     */
    if (tracks.length >= 4) {
      return ClipRRect(
        borderRadius:
        BorderRadius.circular(
          6,
        ),

        child: GridView.builder(
          physics:
          const NeverScrollableScrollPhysics(),

          padding:
          EdgeInsets.zero,

          itemCount:
          4,

          gridDelegate:
          const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount:
            2,
          ),

          itemBuilder:
              (
              context,
              index,
              ) {
            return _TrackArtwork(
              url:
              tracks[index]
                  .imgUrl,
            );
          },
        ),
      );
    }

    final url =
        playlist.coverUrl;

    if (url != null &&
        url.trim().isNotEmpty) {
      return ClipRRect(
        borderRadius:
        BorderRadius.circular(
          6,
        ),

        child: Image.network(
          url,

          fit:
          BoxFit.cover,

          errorBuilder:
              (
              _,
              __,
              ___,
              ) =>
              _placeholder(),
        ),
      );
    }

    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      decoration:
      BoxDecoration(
        color:
        const Color(
          0xFF292929,
        ),

        borderRadius:
        BorderRadius.circular(
          6,
        ),
      ),

      alignment:
      Alignment.center,

      child:
      const Icon(
        Icons
            .queue_music_rounded,

        size: 82,

        color:
        Colors.white30,
      ),
    );
  }
}

// ============================================================
// TRACK ARTWORK
// ============================================================

class _TrackArtwork
    extends StatelessWidget {
  final String? url;

  const _TrackArtwork({
    required this.url,
  });

  @override
  Widget build(
      BuildContext context,
      ) {
    if (url == null ||
        url!.trim().isEmpty) {
      return _placeholder();
    }

    return Image.network(
      url!,

      fit:
      BoxFit.cover,

      errorBuilder:
          (
          _,
          __,
          ___,
          ) =>
          _placeholder(),
    );
  }

  Widget _placeholder() {
    return Container(
      color:
      const Color(
        0xFF292929,
      ),

      alignment:
      Alignment.center,

      child:
      const Icon(
        Icons.music_note_rounded,

        color:
        Colors.white30,
      ),
    );
  }
}

// ============================================================
// EMPTY
// ============================================================

class _EmptyPlaylist
    extends StatelessWidget {
  const _EmptyPlaylist();

  @override
  Widget build(
      BuildContext context,
      ) {
    return Padding(
      padding:
      const EdgeInsets
          .symmetric(
        vertical: 45,
      ),

      child: Column(
        children: [
          Container(
            width:
            90,

            height:
            90,

            decoration:
            const BoxDecoration(
              color:
              Color(
                0xFF242424,
              ),

              shape:
              BoxShape.circle,
            ),

            child:
            const Icon(
              Icons
                  .playlist_add_rounded,

              size:
              48,

              color:
              Colors.white30,
            ),
          ),

          const SizedBox(
            height:
            18,
          ),

          const Text(
            'This playlist is empty',

            style:
            TextStyle(
              fontSize:
              20,

              fontWeight:
              FontWeight.w800,
            ),
          ),

          const SizedBox(
            height:
            7,
          ),

          const Text(
            'Add tracks from the player or track menu.',

            textAlign:
            TextAlign.center,

            style:
            TextStyle(
              color:
              Colors.white54,
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// ERROR
// ============================================================

class _ErrorState
    extends StatelessWidget {
  final String message;

  final VoidCallback onRetry;

  const _ErrorState({
    required this.message,
    required this.onRetry,
  });

  @override
  Widget build(
      BuildContext context,
      ) {
    return Center(
      child: Padding(
        padding:
        const EdgeInsets
            .all(
          25,
        ),

        child: Column(
          mainAxisSize:
          MainAxisSize.min,

          children: [
            const Icon(
              Icons
                  .error_outline_rounded,

              size:
              48,

              color:
              Colors.redAccent,
            ),

            const SizedBox(
              height:
              12,
            ),

            const Text(
              'Cannot load playlist',

              style:
              TextStyle(
                fontSize:
                19,

                fontWeight:
                FontWeight.w700,
              ),
            ),

            const SizedBox(
              height:
              8,
            ),

            Text(
              message,

              textAlign:
              TextAlign.center,

              style:
              const TextStyle(
                color:
                Colors.white54,
              ),
            ),

            const SizedBox(
              height:
              18,
            ),

            FilledButton(
              onPressed:
              onRetry,

              child:
              const Text(
                'Retry',
              ),
            ),
          ],
        ),
      ),
    );
  }
}