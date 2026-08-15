import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/player_provider.dart';
import '../screens/player/player_screen.dart';

class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerProvider>(
      builder: (context, player, _) {
        final track = player.currentTrack;

        if (track == null) {
          return const SizedBox.shrink();
        }

        return Material(
          color: const Color(0xFF242424),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ==================================================
              // PROGRESS
              // ==================================================
              LinearProgressIndicator(
                value: player.progress,
                minHeight: 2,
                backgroundColor: Colors.white10,
                color: const Color(0xFFFF5500),
              ),

              // ==================================================
              // MINI PLAYER
              // ==================================================
              InkWell(
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const PlayerScreen()),
                  );
                },
                child: SizedBox(
                  height: 68,
                  child: Row(
                    children: [
                      // ==========================================
                      // COVER
                      // ==========================================
                      SizedBox(
                        width: 68,
                        height: 68,
                        child: _MiniArtwork(url: track.imgUrl),
                      ),

                      const SizedBox(width: 12),

                      // ==========================================
                      // INFO
                      // ==========================================
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              track.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),

                            const SizedBox(height: 4),

                            Text(
                              track.artistName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white54,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // ==========================================
                      // LIKE
                      // ==========================================
                      IconButton(
                        tooltip: player.isCurrentTrackLiked ? 'Unlike' : 'Like',
                        onPressed: player.isLikeLoading
                            ? null
                            : () async {
                                try {
                                  await player.toggleLike();
                                } catch (_) {}
                              },
                        icon: Icon(
                          player.isCurrentTrackLiked
                              ? Icons.favorite
                              : Icons.favorite_border,
                          size: 22,
                          color: player.isCurrentTrackLiked
                              ? const Color(0xFFFF5500)
                              : Colors.white70,
                        ),
                      ),

                      // ==========================================
                      // PREVIOUS
                      // ==========================================
                      IconButton(
                        tooltip: 'Previous',
                        onPressed: player.isLoading
                            ? null
                            : () async {
                                await player.previous();
                              },
                        icon: Icon(
                          Icons.skip_previous_rounded,
                          color: player.isLoading
                              ? Colors.white24
                              : Colors.white,
                        ),
                      ),

                      // ==========================================
                      // PLAY / PAUSE
                      // ==========================================
                      SizedBox(
                        width: 44,
                        height: 44,
                        child: player.isLoading
                            ? const Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : IconButton(
                                tooltip: player.isPlaying ? 'Pause' : 'Play',
                                onPressed: () async {
                                  await player.togglePlayPause();
                                },
                                icon: Icon(
                                  player.isPlaying
                                      ? Icons.pause_rounded
                                      : Icons.play_arrow_rounded,
                                  size: 30,
                                ),
                              ),
                      ),

                      // ==========================================
                      // NEXT
                      // ==========================================
                      IconButton(
                        tooltip: 'Next',
                        onPressed: player.hasNext && !player.isLoading
                            ? () async {
                                debugPrint(
                                  'MINI NEXT -> '
                                  'index=${player.currentIndex}, '
                                  'queue=${player.queue.length}',
                                );

                                await player.next();
                              }
                            : null,
                        icon: Icon(
                          Icons.skip_next_rounded,
                          color: player.hasNext && !player.isLoading
                              ? Colors.white
                              : Colors.white24,
                        ),
                      ),

                      const SizedBox(width: 4),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MiniArtwork extends StatelessWidget {
  final String? url;

  const _MiniArtwork({required this.url});

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
      child: const Icon(Icons.music_note, color: Colors.white30),
    );
  }
}
