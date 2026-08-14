import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/player_provider.dart';

class PlayerScreen extends StatelessWidget {
  const PlayerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerProvider>(
      builder: (context, player, _) {
        final track = player.currentTrack;

        if (track == null) {
          return const Scaffold(
            body: Center(child: Text('Chưa có bài hát đang phát')),
          );
        }

        return Scaffold(
          backgroundColor: const Color(0xFF111111),

          appBar: AppBar(
            backgroundColor: Colors.transparent,
            elevation: 0,

            leading: IconButton(
              icon: const Icon(Icons.keyboard_arrow_down_rounded, size: 34),
              onPressed: () => Navigator.pop(context),
            ),

            title: const Text('Now playing', style: TextStyle(fontSize: 15)),

            centerTitle: true,

            actions: [
              IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert)),
            ],
          ),

          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 26),

              child: Column(
                children: [
                  const Spacer(),

                  AspectRatio(
                    aspectRatio: 1,
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),

                      child: _Artwork(url: track.imgUrl),
                    ),
                  ),

                  const SizedBox(height: 30),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,

                          children: [
                            Text(
                              track.title,

                              maxLines: 1,

                              overflow: TextOverflow.ellipsis,

                              style: const TextStyle(
                                fontSize: 24,

                                fontWeight: FontWeight.w800,
                              ),
                            ),

                            const SizedBox(height: 7),

                            Text(
                              track.artistName,

                              maxLines: 1,

                              overflow: TextOverflow.ellipsis,

                              style: const TextStyle(
                                color: Colors.white54,

                                fontSize: 17,
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
                                } catch (_) {
                                  if (!context.mounted) {
                                    return;
                                  }

                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Không thể cập nhật Like'),
                                    ),
                                  );
                                }
                              },

                        icon: player.isLikeLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Icon(
                                player.isCurrentTrackLiked
                                    ? Icons.favorite_rounded
                                    : Icons.favorite_border_rounded,

                                size: 28,

                                color: player.isCurrentTrackLiked
                                    ? const Color(0xFFFF5500)
                                    : Colors.white,
                              ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      trackHeight: 3,
                      thumbShape: const RoundSliderThumbShape(
                        enabledThumbRadius: 6,
                      ),
                    ),

                    child: Slider(
                      min: 0,
                      max: 1,

                      value: player.progress,

                      onChanged: player.seekByProgress,
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),

                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,

                      children: [
                        Text(
                          player.formatDuration(player.position),

                          style: const TextStyle(color: Colors.white54),
                        ),

                        Text(
                          player.formatDuration(player.duration),

                          style: const TextStyle(color: Colors.white54),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,

                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.shuffle, size: 25),
                      ),

                      IconButton(
                        onPressed: player.previous,

                        icon: const Icon(Icons.skip_previous_rounded, size: 40),
                      ),

                      Container(
                        width: 72,
                        height: 72,

                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,

                          color: Colors.white,
                        ),

                        child: player.isLoading
                            ? const Padding(
                                padding: EdgeInsets.all(22),

                                child: CircularProgressIndicator(
                                  strokeWidth: 2,

                                  color: Colors.black,
                                ),
                              )
                            : IconButton(
                                onPressed: player.togglePlayPause,

                                icon: Icon(
                                  player.isPlaying
                                      ? Icons.pause_rounded
                                      : Icons.play_arrow_rounded,

                                  color: Colors.black,

                                  size: 42,
                                ),
                              ),
                      ),

                      IconButton(
                        onPressed: player.next,

                        icon: const Icon(Icons.skip_next_rounded, size: 40),
                      ),

                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.repeat, size: 25),
                      ),
                    ],
                  ),

                  const SizedBox(height: 28),

                  const Divider(color: Colors.white12),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,

                    children: [
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.comment_outlined),
                      ),

                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.playlist_add_rounded),
                      ),

                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.share_outlined),
                      ),
                    ],
                  ),

                  const Spacer(),
                ],
              ),
            ),
          ),
        );
      },
    );
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
        size: 80,
        color: Colors.white30,
      ),
    );
  }
}
