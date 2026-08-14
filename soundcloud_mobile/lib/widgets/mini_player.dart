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

          child: InkWell(
            onTap: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const PlayerScreen()));
            },

            child: Column(
              mainAxisSize: MainAxisSize.min,

              children: [
                LinearProgressIndicator(
                  value: player.progress,

                  minHeight: 2,

                  backgroundColor: Colors.white10,

                  color: const Color(0xFFFF5500),
                ),

                SizedBox(
                  height: 64,

                  child: Row(
                    children: [
                      SizedBox(
                        width: 64,
                        height: 64,

                        child: _MiniArtwork(url: track.imgUrl),
                      ),

                      const SizedBox(width: 12),

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
                                fontWeight: FontWeight.w700,
                              ),
                            ),

                            const SizedBox(height: 3),

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

                      IconButton(
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

                          size: 23,

                          color: player.isCurrentTrackLiked
                              ? const Color(0xFFFF5500)
                              : Colors.white70,
                        ),
                      ),

                      IconButton(
                        onPressed: player.previous,

                        icon: const Icon(Icons.skip_previous_rounded),
                      ),

                      IconButton(
                        onPressed: player.togglePlayPause,

                        icon: Icon(
                          player.isPlaying
                              ? Icons.pause_rounded
                              : Icons.play_arrow_rounded,

                          size: 30,
                        ),
                      ),

                      IconButton(
                        onPressed: player.next,

                        icon: const Icon(Icons.skip_next_rounded),
                      ),

                      const SizedBox(width: 4),
                    ],
                  ),
                ),
              ],
            ),
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
