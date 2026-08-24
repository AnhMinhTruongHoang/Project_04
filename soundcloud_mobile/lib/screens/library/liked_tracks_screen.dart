import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/utils/app_toast.dart';
import '../../models/track_model.dart';
import '../../providers/player_provider.dart';
import '../../services/track_service.dart';
import '../../widgets/add_to_playlist_sheet.dart';
import '../../widgets/mini_player.dart';

class LikedTracksScreen extends StatefulWidget {
  const LikedTracksScreen({super.key});

  @override
  State<LikedTracksScreen> createState() => _LikedTracksScreenState();
}

class _LikedTracksScreenState extends State<LikedTracksScreen> {
  final TrackService _trackService = TrackService();

  bool _isLoading = true;
  String? _errorMessage;
  List<TrackModel> _tracks = const [];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) => _loadLikedTracks());
  }

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
        _tracks = tracks;
      });

      await context.read<PlayerProvider>().loadLikedTracks(force: true);
    } catch (e) {
      if (!mounted) return;

      setState(() {
        _errorMessage = e.toString();
      });

      AppToast.error(context, 'Không thể tải Your likes');
    } finally {
      if (!mounted) return;

      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _playTrack(TrackModel track) async {
    await context.read<PlayerProvider>().playTrack(track, queue: _tracks);
  }

  Future<void> _playAll() async {
    if (_tracks.isEmpty) return;

    await context.read<PlayerProvider>().playTrack(
      _tracks.first,
      queue: _tracks,
    );
  }

  Future<void> _removeLike(TrackModel track) async {
    final player = context.read<PlayerProvider>();

    try {
      if (player.currentTrack?.id == track.id) {
        if (player.isCurrentTrackLiked) {
          await player.toggleLike();
        }
      } else {
        await _trackService.dislikeTrack(track.id);
        await player.loadLikedTracks(force: true);
      }

      if (!mounted) return;

      setState(() {
        _tracks = _tracks.where((item) => item.id != track.id).toList();
      });

      AppToast.success(context, 'Đã xóa ${track.title} khỏi Your likes');
    } catch (e) {
      if (!mounted) return;

      AppToast.error(context, 'Không thể bỏ thích bài hát');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101010),
      appBar: AppBar(
        backgroundColor: const Color(0xFF101010),
        elevation: 0,
        title: const Text(
          'Your likes',
          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
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
            const MiniPlayer(),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _tracks.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF5500)),
      );
    }

    if (_errorMessage != null && _tracks.isEmpty) {
      return _LikedError(onRetry: _loadLikedTracks);
    }

    if (_tracks.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadLikedTracks,
        color: const Color(0xFFFF5500),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: const [SizedBox(height: 100), _EmptyLikes()],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadLikedTracks,
      color: const Color(0xFFFF5500),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 15),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Liked tracks',
                          style: TextStyle(
                            fontSize: 27,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${_tracks.length} ${_tracks.length == 1 ? 'track' : 'tracks'}',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: 52,
                    height: 52,
                    child: FilledButton(
                      onPressed: _playAll,
                      style: FilledButton.styleFrom(
                        padding: EdgeInsets.zero,
                        backgroundColor: const Color(0xFFFF5500),
                        foregroundColor: Colors.white,
                        shape: const CircleBorder(),
                      ),
                      child: const Icon(Icons.play_arrow_rounded, size: 32),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              final track = _tracks[index];

              return _LikedTrackTile(
                track: track,
                onTap: () => _playTrack(track),
                onRemoveLike: () => _removeLike(track),
                onAddToPlaylist: () {
                  showAddToPlaylistSheet(context, track: track);
                },
              );
            }, childCount: _tracks.length),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 30)),
        ],
      ),
    );
  }
}

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

    final isCurrent = player.currentTrack?.id == track.id;
    final isPlaying = isCurrent && player.isPlaying;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: isCurrent ? const Color(0xFF191919) : Colors.transparent,
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
                if (isCurrent)
                  Container(
                    width: 68,
                    height: 68,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.42),
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
                      color: isCurrent ? const Color(0xFFFF5500) : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    track.artistName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white54, fontSize: 14),
                  ),
                  const SizedBox(height: 7),
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
                      const SizedBox(width: 12),
                      const Icon(
                        Icons.favorite_rounded,
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
            IconButton(
              tooltip: 'Remove from Your likes',
              onPressed: onRemoveLike,
              icon: const Icon(
                Icons.favorite_rounded,
                color: Color(0xFFFF5500),
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
                      Text('Remove from Your likes'),
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

class _EmptyLikes extends StatelessWidget {
  const _EmptyLikes();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        children: [
          Icon(Icons.favorite_border_rounded, size: 72, color: Colors.white24),
          SizedBox(height: 18),
          Text(
            'No liked tracks yet',
            style: TextStyle(fontSize: 21, fontWeight: FontWeight.w800),
          ),
          SizedBox(height: 8),
          Text(
            'Tracks you like will appear here.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class _LikedError extends StatelessWidget {
  final VoidCallback onRetry;

  const _LikedError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 52,
            color: Colors.redAccent,
          ),
          const SizedBox(height: 12),
          const Text(
            'Could not load Your likes',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh_rounded),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }
}
