import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soundcloud_mobile/widgets/add_to_playlist_sheet.dart';

import '../../core/utils/app_toast.dart';

import '../../models/track_model.dart';
import '../../providers/player_provider.dart';
import '../../services/track_service.dart';
import '../../widgets/mini_player.dart';
import 'playlists_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  final TrackService _trackService = TrackService();

  bool _isLoading = true;
  String? _errorMessage;

  List<TrackModel> _likedTracks = const [];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLikedTracks();
    });
  }

  // ============================================================
  // LOAD LIKED TRACKS
  // ============================================================

  Future<void> _loadLikedTracks() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final tracks = await _trackService.getLikedTracks();

      if (!mounted) return;

      setState(() {
        _likedTracks = tracks;
      });

      /*
       * Đồng bộ trạng thái tim bên PlayerProvider.
       */
      await context.read<PlayerProvider>().loadLikedTracks(force: true);
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

  Future<void> _playTrack(TrackModel track) async {
    await context.read<PlayerProvider>().playTrack(track, queue: _likedTracks);
  }

  // ============================================================
  // UNLIKE
  // ============================================================

  Future<void> _removeLike(TrackModel track) async {
    final player = context.read<PlayerProvider>();

    /*
     * Nếu bài đang phát thì dùng PlayerProvider.toggleLike()
     * để đảm bảo state tim trên Player/MiniPlayer đồng bộ.
     */
    if (player.currentTrack?.id == track.id) {
      try {
        await player.toggleLike();
      } catch (_) {
        if (!mounted) return;

        _showError('Không thể bỏ thích bài hát');

        return;
      }
    } else {
      try {
        await _trackService.dislikeTrack(track.id);

        await player.loadLikedTracks(force: true);
      } catch (e) {
        if (!mounted) return;

        _showError('Không thể bỏ thích bài hát');

        return;
      }
    }

    if (!mounted) return;

    setState(() {
      _likedTracks = _likedTracks.where((item) => item.id != track.id).toList();
    });

    _showSuccess('Đã xóa khỏi Your likes');
  }

  // ============================================================
  // OPEN PLAYLISTS
  // ============================================================

  void _openPlaylists() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const PlaylistsScreen()));
  }

  // ============================================================
  // PLAY ALL LIKED
  // ============================================================

  Future<void> _playAllLiked() async {
    if (_likedTracks.isEmpty) {
      return;
    }

    await context.read<PlayerProvider>().playTrack(
      _likedTracks.first,
      queue: _likedTracks,
    );
  }

  // ============================================================
  // TOAST
  // ============================================================

  void _showSuccess(String message) {
    AppToast.success(context, message);
  }

  void _showError(String message) {
    AppToast.error(context, message);
  }

  void _showInfo(String message) {
    AppToast.info(context, message);
  }

  void _showComingSoon(String feature) {
    _showInfo('$feature sẽ được làm ở bước tiếp theo');
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      appBar: AppBar(
        backgroundColor: const Color(0xFF101010),
        elevation: 0,

        title: const Text(
          'Library',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
        ),

        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: _isLoading ? null : _loadLikedTracks,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),

      body: SafeArea(
        child: Column(
          children: [
            Expanded(child: _buildBody()),

            /*
             * Player vẫn tồn tại khi chuyển từ Home → Library.
             */
            const MiniPlayer(),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    /*
     * Loading lần đầu.
     */
    if (_isLoading && _likedTracks.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF5500)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadLikedTracks,
      color: const Color(0xFFFF5500),

      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),

        slivers: [
          // =====================================================
          // LIBRARY ITEMS
          // =====================================================
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 0),
              child: Column(
                children: [
                  _LibraryNavigationTile(
                    icon: Icons.favorite_rounded,
                    title: 'Your likes',
                    subtitle:
                        '${_likedTracks.length} ${_likedTracks.length == 1 ? 'track' : 'tracks'}',
                    iconColor: const Color(0xFFFF5500),
                    onTap: () {
                      _showInfo('Danh sách Your likes nằm ngay bên dưới');
                    },
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.queue_music_rounded,
                    title: 'Playlists',
                    subtitle: 'Your playlists',
                    onTap: _openPlaylists,
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.album_outlined,
                    title: 'Albums',
                    subtitle: 'Saved albums',
                    onTap: () => _showComingSoon('Albums'),
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.person_add_alt_1_rounded,
                    title: 'Following',
                    subtitle: 'Artists and users you follow',
                    onTap: () => _showComingSoon('Following'),
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.radio_rounded,
                    title: 'Stations',
                    subtitle: 'Your stations',
                    onTap: () => _showComingSoon('Stations'),
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.insights_rounded,
                    title: 'Your insights',
                    subtitle: 'Your listening and creator insights',
                    onTap: () => _showComingSoon('Your insights'),
                  ),

                  const SizedBox(height: 4),

                  _LibraryNavigationTile(
                    icon: Icons.cloud_upload_outlined,
                    title: 'Your uploads',
                    subtitle: 'Tracks you have uploaded',
                    onTap: () => _showComingSoon('Your uploads'),
                  ),
                ],
              ),
            ),
          ),

          // =====================================================
          // ERROR
          // =====================================================
          if (_errorMessage != null)
            SliverToBoxAdapter(
              child: _LibraryErrorBanner(
                message: _errorMessage!,
                onRetry: _loadLikedTracks,
              ),
            ),

          // =====================================================
          // LIKED HEADER
          // =====================================================
          SliverToBoxAdapter(
            child: _LikedHeader(
              count: _likedTracks.length,
              onPlayAll: _likedTracks.isEmpty ? null : _playAllLiked,
            ),
          ),

          // =====================================================
          // EMPTY LIKED TRACKS
          // =====================================================
          if (_likedTracks.isEmpty)
            const SliverToBoxAdapter(child: _EmptyLikedTracks())
          // =====================================================
          // LIKED TRACK LIST
          // =====================================================
          else
            SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final track = _likedTracks[index];

                return _LikedTrackTile(
                  track: track,

                  onTap: () => _playTrack(track),

                  onRemoveLike: () => _removeLike(track),

                  onAddToPlaylist: () {
                    showAddToPlaylistSheet(context, track: track);
                  },
                );
              }, childCount: _likedTracks.length),
            ),

          const SliverToBoxAdapter(child: SizedBox(height: 30)),
        ],
      ),
    );
  }
}

// ============================================================
// LIBRARY NAVIGATION TILE
// ============================================================

class _LibraryNavigationTile extends StatelessWidget {
  final IconData icon;

  final String title;
  final String subtitle;

  final Color? iconColor;

  final VoidCallback onTap;

  const _LibraryNavigationTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

      borderRadius: BorderRadius.circular(10),

      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 9),

        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,

              decoration: BoxDecoration(
                color: const Color(0xFF242424),

                borderRadius: BorderRadius.circular(7),
              ),

              child: Icon(icon, size: 29, color: iconColor ?? Colors.white),
            ),

            const SizedBox(width: 15),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  Text(
                    title,

                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    subtitle,

                    style: const TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ],
              ),
            ),

            const Icon(
              Icons.chevron_right_rounded,
              color: Colors.white38,
              size: 26,
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// LIKED HEADER
// ============================================================

class _LikedHeader extends StatelessWidget {
  final int count;

  final VoidCallback? onPlayAll;

  const _LikedHeader({required this.count, required this.onPlayAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 12),

      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,

              children: [
                const Text(
                  'Your likes',

                  style: TextStyle(fontSize: 25, fontWeight: FontWeight.w800),
                ),

                const SizedBox(height: 4),

                Text(
                  '$count ${count == 1 ? 'track' : 'tracks'}',

                  style: const TextStyle(color: Colors.white54, fontSize: 13),
                ),
              ],
            ),
          ),

          if (onPlayAll != null)
            SizedBox(
              width: 48,
              height: 48,

              child: FilledButton(
                onPressed: onPlayAll,

                style: FilledButton.styleFrom(
                  padding: EdgeInsets.zero,

                  backgroundColor: const Color(0xFFFF5500),

                  foregroundColor: Colors.white,

                  shape: const CircleBorder(),
                ),

                child: const Icon(Icons.play_arrow_rounded, size: 30),
              ),
            ),
        ],
      ),
    );
  }
}

// ============================================================
// LIKED TRACK TILE
// ============================================================

class _LikedTrackTile extends StatelessWidget {
  final TrackModel track;

  final VoidCallback onTap;

  final VoidCallback onRemoveLike;

  final VoidCallback onAddToPlaylist;

  const _LikedTrackTile({
    required this.track,
    required this.onTap,
    required this.onRemoveLike,
    required this.onAddToPlaylist,
  });

  @override
  Widget build(BuildContext context) {
    final player = context.watch<PlayerProvider>();

    final isCurrentTrack = player.currentTrack?.id == track.id;

    final isPlaying = isCurrentTrack && player.isPlaying;

    return InkWell(
      onTap: onTap,

      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),

        child: Row(
          children: [
            // ===================================================
            // COVER
            // ===================================================
            Stack(
              alignment: Alignment.center,

              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(5),

                  child: SizedBox(
                    width: 68,
                    height: 68,

                    child: _Artwork(url: track.imgUrl),
                  ),
                ),

                if (isCurrentTrack)
                  Container(
                    width: 68,
                    height: 68,

                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.40),

                      borderRadius: BorderRadius.circular(5),
                    ),

                    alignment: Alignment.center,

                    child: Icon(
                      isPlaying
                          ? Icons.equalizer_rounded
                          : Icons.play_arrow_rounded,

                      color: Colors.white,
                      size: 30,
                    ),
                  ),
              ],
            ),

            const SizedBox(width: 14),

            // ===================================================
            // TRACK INFO
            // ===================================================
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  Text(
                    track.title,

                    maxLines: 1,

                    overflow: TextOverflow.ellipsis,

                    style: TextStyle(
                      fontSize: 16,

                      fontWeight: FontWeight.w700,

                      color: isCurrentTrack
                          ? const Color(0xFFFF5500)
                          : Colors.white,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    track.artistName,

                    maxLines: 1,

                    overflow: TextOverflow.ellipsis,

                    style: const TextStyle(color: Colors.white54, fontSize: 14),
                  ),

                  const SizedBox(height: 6),

                  Row(
                    children: [
                      const Icon(
                        Icons.play_arrow_rounded,

                        size: 16,

                        color: Colors.white38,
                      ),

                      const SizedBox(width: 2),

                      Text(
                        _formatCount(track.countPlay),

                        style: const TextStyle(
                          color: Colors.white38,

                          fontSize: 12,
                        ),
                      ),

                      const SizedBox(width: 11),

                      const Icon(
                        Icons.favorite,

                        size: 14,

                        color: Color(0xFFFF5500),
                      ),

                      const SizedBox(width: 4),

                      Text(
                        _formatCount(track.countLike),

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

            // ===================================================
            // UNLIKE
            // ===================================================
            IconButton(
              tooltip: 'Remove from liked tracks',

              onPressed: onRemoveLike,

              icon: const Icon(
                Icons.favorite,

                color: Color(0xFFFF5500),

                size: 23,
              ),
            ),

            // ===================================================
            // MENU
            // ===================================================
            PopupMenuButton<String>(
              color: const Color(0xFF242424),

              icon: const Icon(Icons.more_vert, color: Colors.white70),

              onSelected: (value) {
                switch (value) {
                  case 'play':
                    onTap();
                    break;

                  case 'playlist':
                    onAddToPlaylist();
                    break;

                  case 'unlike':
                    onRemoveLike();
                    break;
                }
              },

              itemBuilder: (context) => const [
                PopupMenuItem(
                  value: 'play',
                  child: Row(
                    children: [
                      Icon(Icons.play_arrow_rounded),
                      SizedBox(width: 12),
                      Text('Play'),
                    ],
                  ),
                ),

                PopupMenuItem(
                  value: 'playlist',
                  child: Row(
                    children: [
                      Icon(Icons.playlist_add_rounded),
                      SizedBox(width: 12),
                      Text('Add to playlist'),
                    ],
                  ),
                ),

                PopupMenuItem(
                  value: 'unlike',
                  child: Row(
                    children: [
                      Icon(Icons.heart_broken_outlined),
                      SizedBox(width: 12),
                      Text('Remove from liked tracks'),
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

  static String _formatCount(int value) {
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
// IMAGE
// ============================================================

class _Artwork extends StatelessWidget {
  final String? url;

  const _Artwork({required this.url});

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
      color: const Color(0xFF292929),

      alignment: Alignment.center,

      child: const Icon(
        Icons.music_note_rounded,

        size: 34,

        color: Colors.white30,
      ),
    );
  }
}

// ============================================================
// EMPTY LIKED TRACKS
// ============================================================

class _EmptyLikedTracks extends StatelessWidget {
  const _EmptyLikedTracks();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(30, 35, 30, 50),

      child: Column(
        children: [
          Container(
            width: 92,
            height: 92,

            decoration: const BoxDecoration(
              color: Color(0xFF242424),

              shape: BoxShape.circle,
            ),

            child: const Icon(
              Icons.favorite_border_rounded,

              size: 48,

              color: Colors.white38,
            ),
          ),

          const SizedBox(height: 20),

          const Text(
            'No liked tracks yet',

            style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
          ),

          const SizedBox(height: 7),

          const Text(
            'Tracks you like will appear here.',

            textAlign: TextAlign.center,

            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// ERROR BANNER
// ============================================================

class _LibraryErrorBanner extends StatelessWidget {
  final String message;

  final VoidCallback onRetry;

  const _LibraryErrorBanner({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 18, 20, 0),

      padding: const EdgeInsets.all(13),

      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.10),

        borderRadius: BorderRadius.circular(8),

        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.25)),
      ),

      child: Row(
        children: [
          const Icon(Icons.error_outline_rounded, color: Colors.redAccent),

          const SizedBox(width: 10),

          Expanded(
            child: Text(
              message,

              maxLines: 2,

              overflow: TextOverflow.ellipsis,

              style: const TextStyle(color: Colors.white70, fontSize: 12),
            ),
          ),

          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
