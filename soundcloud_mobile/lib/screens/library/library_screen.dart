import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soundcloud_mobile/widgets/add_to_playlist_sheet.dart';

import '../../core/utils/app_toast.dart';

import '../../models/track_model.dart';
import '../../providers/player_provider.dart';
import '../../services/track_service.dart';
import '../../widgets/mini_player.dart';
import 'playlists_screen.dart';
import 'following_screen.dart';
import 'liked_tracks_screen.dart';

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
  List<ListeningHistoryItem> _recentlyPlayed = const [];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadLibraryData();
    });
  }

  // ============================================================
  // LOAD LIBRARY DATA
  // ============================================================

  Future<void> _loadLibraryData() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _trackService.getLikedTracks(),
        _trackService.getHomeListeningHistory(limit: 20),
      ]);

      final likedTracks = results[0] as List<TrackModel>;
      final history = results[1] as HomeListeningHistory;

      if (!mounted) return;

      setState(() {
        _likedTracks = likedTracks;
        _recentlyPlayed = history.recentlyPlayed;
      });

      await context.read<PlayerProvider>().loadLikedTracks(force: true);
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _errorMessage = e.toString();
      });

      AppToast.error(context, 'Không thể tải dữ liệu Library');
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
    TrackModel track, {
    required List<TrackModel> queue,
  }) async {
    await context.read<PlayerProvider>().playTrack(track, queue: queue);
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

  void _openFollowing() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const FollowingScreen()));
  }

  Future<void> _refreshLikedTracksOnly() async {
    try {
      final tracks = await _trackService.getLikedTracks();

      if (!mounted) return;

      setState(() {
        _likedTracks = tracks;
      });
    } catch (e) {
      debugPrint('Refresh liked tracks error: $e');
    }
  }

  Future<void> _openLikedTracks() async {
    await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const LikedTracksScreen()));

    if (!mounted) return;

    await _refreshLikedTracksOnly();
  }

  // ============================================================
  // PLAY ALL RECENT
  // ============================================================

  Future<void> _playAllRecent() async {
    final tracks = _recentlyPlayed.map((item) => item.track).toList();

    if (tracks.isEmpty) {
      return;
    }

    await context.read<PlayerProvider>().playTrack(tracks.first, queue: tracks);
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
            onPressed: _isLoading ? null : _loadLibraryData,
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
    if (_isLoading && _likedTracks.isEmpty && _recentlyPlayed.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF5500)),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadLibraryData,
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
                    onTap: _openLikedTracks,
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
                    onTap: _openFollowing,
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
                onRetry: _loadLibraryData,
              ),
            ),

          // =====================================================
          // RECENTLY PLAYED HEADER
          // =====================================================
          SliverToBoxAdapter(
            child: _RecentHeader(
              count: _recentlyPlayed.length,
              onPlayAll: _recentlyPlayed.isEmpty ? null : _playAllRecent,
            ),
          ),

          // =====================================================
          // EMPTY HISTORY
          // =====================================================
          if (_recentlyPlayed.isEmpty)
            const SliverToBoxAdapter(child: _EmptyRecentlyPlayed())
          else
            SliverList(
              delegate: SliverChildBuilderDelegate((context, index) {
                final item = _recentlyPlayed[index];
                final track = item.track;
                final queue = _recentlyPlayed
                    .map((history) => history.track)
                    .toList();

                return _RecentTrackTile(
                  item: item,
                  onTap: () => _playTrack(track, queue: queue),
                  onAddToPlaylist: () {
                    showAddToPlaylistSheet(context, track: track);
                  },
                );
              }, childCount: _recentlyPlayed.length),
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
// RECENTLY PLAYED HEADER
// ============================================================

class _RecentHeader extends StatelessWidget {
  final int count;
  final VoidCallback? onPlayAll;

  const _RecentHeader({required this.count, required this.onPlayAll});

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
                  'Recently played',
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
// RECENTLY PLAYED TRACK TILE
// ============================================================

class _RecentTrackTile extends StatelessWidget {
  final ListeningHistoryItem item;
  final VoidCallback onTap;
  final VoidCallback onAddToPlaylist;

  const _RecentTrackTile({
    required this.item,
    required this.onTap,
    required this.onAddToPlaylist,
  });

  @override
  Widget build(BuildContext context) {
    final track = item.track;
    final player = context.watch<PlayerProvider>();

    final isCurrentTrack = player.currentTrack?.id == track.id;

    final isPlaying = isCurrentTrack && player.isPlaying;

    final progress = item.duration > 0
        ? (item.lastPosition / item.duration).clamp(0.0, 1.0)
        : item.progress.clamp(0.0, 1.0);

    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 9),
        child: Row(
          children: [
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
                  const SizedBox(height: 8),

                  Row(
                    children: [
                      Icon(
                        item.completed
                            ? Icons.check_circle_outline_rounded
                            : Icons.history_rounded,
                        size: 15,
                        color: item.completed
                            ? const Color(0xFFFF5500)
                            : Colors.white38,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        item.completed
                            ? 'Completed'
                            : '${_formatDuration(item.lastPosition)} / ${_formatDuration(item.duration)}',
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),

                  if (!item.completed) ...[
                    const SizedBox(height: 7),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 3,
                        backgroundColor: Colors.white12,
                        color: const Color(0xFFFF5500),
                      ),
                    ),
                  ],
                ],
              ),
            ),

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
              ],
            ),
          ],
        ),
      ),
    );
  }

  static String _formatDuration(double seconds) {
    if (seconds <= 0) {
      return '0:00';
    }

    final total = seconds.round();
    final minutes = total ~/ 60;
    final remaining = total % 60;

    return '$minutes:${remaining.toString().padLeft(2, '0')}';
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
// EMPTY RECENTLY PLAYED
// ============================================================

class _EmptyRecentlyPlayed extends StatelessWidget {
  const _EmptyRecentlyPlayed();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(30, 35, 30, 50),
      child: Column(
        children: [
          Icon(Icons.history_rounded, size: 70, color: Colors.white24),
          SizedBox(height: 18),
          Text(
            'No listening history yet',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 7),
          Text(
            'Tracks you play will appear here.',
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
