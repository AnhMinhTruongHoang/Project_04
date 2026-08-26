import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'full_player_screen.dart';
import '../providers/player_provider.dart';
import '../providers/player_social_provider.dart';

class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final social = ref.watch(playerSocialProvider);
    final track = player.currentTrack;

    if (track == null) {
      return const SizedBox.shrink();
    }

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      child: Material(
        color: Colors.transparent,
        elevation: 10,
        child: Container(
          height: 72,
          decoration: BoxDecoration(
            color: const Color(0xF21D1D1D),
            borderRadius: BorderRadius.circular(38),
            border: Border.all(color: const Color(0xFF555555)),
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              LinearProgressIndicator(
                minHeight: 2,
                value: player.progress,
                backgroundColor: Colors.transparent,
                color: _orange,
              ),
              Expanded(
                child: Row(
                children: [
                  IconButton.filled(
                    key: ValueKey('mini-player-${player.isPlaying}'),
                    tooltip: player.isPlaying ? 'Pause' : 'Play',
                    style: IconButton.styleFrom(
                      backgroundColor: _orange,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: const Color(0xFF333333),
                    ),
                    onPressed: player.isLoading
                        ? null
                        : ref.read(playerProvider.notifier).togglePlayPause,
                    icon: player.isLoading
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Icon(
                            player.isPlaying
                                ? Icons.pause_rounded
                                : Icons.play_arrow_rounded,
                          ),
                  ),
                  Expanded(
                    child: InkWell(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => const FullPlayerScreen(),
                          ),
                        );
                      },
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
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
                                fontSize: 15,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              track.artistName,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFFB5B5B5),
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  _MiniSocialButton(
                    tooltip: social.isArtistFollowed(track)
                        ? 'Following'
                        : 'Follow artist',
                    icon: social.isArtistFollowed(track)
                        ? Icons.person_rounded
                        : Icons.person_add_alt_1_rounded,
                    isActive: social.isArtistFollowed(track),
                    onPressed: () {
                      ref
                          .read(playerSocialProvider.notifier)
                          .toggleFollow(track);
                    },
                  ),
                  _MiniSocialButton(
                    tooltip: social.isTrackLiked(track) ? 'Liked' : 'Like',
                    icon: social.isTrackLiked(track)
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    isActive: social.isTrackLiked(track),
                    onPressed: () {
                      ref
                          .read(playerSocialProvider.notifier)
                          .toggleLike(track);
                    },
                  ),
                  const SizedBox(width: 12),
                ],
              ),
            ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MiniSocialButton extends StatelessWidget {
  const _MiniSocialButton({
    required this.tooltip,
    required this.icon,
    required this.isActive,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final bool isActive;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      color: isActive ? MiniPlayer._orange : Colors.white,
      iconSize: 34,
      onPressed: onPressed,
      icon: Icon(icon),
    );
  }
}
