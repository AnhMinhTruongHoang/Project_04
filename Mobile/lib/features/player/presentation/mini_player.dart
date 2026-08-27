import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'full_player_screen.dart';
import '../models/player_state.dart';
import '../providers/player_provider.dart';
import '../providers/player_social_provider.dart';

class MiniPlayer extends ConsumerStatefulWidget {
  const MiniPlayer({super.key});

  static const Color _orange = Color(0xFFFF5500);

  @override
  ConsumerState<MiniPlayer> createState() => _MiniPlayerState();
}

class _MiniPlayerState extends ConsumerState<MiniPlayer> {
  static const double _swipeDistance = 46;
  static const Duration _slideDuration = Duration(milliseconds: 180);

  Offset _dragOffset = Offset.zero;
  bool _animateOffset = false;
  bool _isTransitioning = false;

  void _resetDrag() {
    _dragOffset = Offset.zero;
  }

  Future<void> _handleSwipe(PlayerState player) async {
    if (_isTransitioning) {
      return;
    }

    final horizontal = _dragOffset.dx;
    final vertical = _dragOffset.dy.abs();
    final isHorizontalSwipe =
        horizontal.abs() >= _swipeDistance && horizontal.abs() > vertical;

    if (!isHorizontalSwipe) {
      setState(() {
        _animateOffset = true;
        _dragOffset = Offset.zero;
      });
      return;
    }

    final isNext = horizontal < 0;
    final canChangeTrack = isNext ? player.hasNext : player.hasPrevious;

    if (!canChangeTrack) {
      setState(() {
        _animateOffset = true;
        _dragOffset = Offset.zero;
      });
      return;
    }

    final width = MediaQuery.sizeOf(context).width;
    final exitOffset = isNext ? -width : width;
    final enterOffset = isNext ? width : -width;

    setState(() {
      _isTransitioning = true;
      _animateOffset = true;
      _dragOffset = Offset(exitOffset, 0);
    });

    await Future<void>.delayed(_slideDuration);

    if (!mounted) {
      return;
    }

    if (isNext) {
      unawaited(ref.read(playerProvider.notifier).next());
    } else {
      unawaited(ref.read(playerProvider.notifier).previous());
    }

    setState(() {
      _animateOffset = false;
      _dragOffset = Offset(enterOffset, 0);
    });

    await Future<void>.delayed(const Duration(milliseconds: 16));

    if (!mounted) {
      return;
    }

    setState(() {
      _animateOffset = true;
      _dragOffset = Offset.zero;
    });

    await Future<void>.delayed(_slideDuration);

    if (!mounted) {
      return;
    }

    setState(() {
      _isTransitioning = false;
    });
  }

  @override
  Widget build(BuildContext context) {
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
        child: Listener(
          behavior: HitTestBehavior.translucent,
          onPointerDown: (_) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              _animateOffset = false;
              _resetDrag();
            });
          },
          onPointerMove: (event) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              _dragOffset += event.delta;
            });
          },
          onPointerCancel: (_) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              _animateOffset = true;
              _resetDrag();
            });
          },
          onPointerUp: (_) {
            _handleSwipe(player);
          },
          child: AnimatedContainer(
            duration: _animateOffset ? _slideDuration : Duration.zero,
            curve: Curves.easeOutCubic,
            transform: Matrix4.translationValues(_dragOffset.dx, 0, 0),
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
                  color: MiniPlayer._orange,
                ),
                Expanded(
                  child: Row(
                children: [
                  IconButton.filled(
                    key: ValueKey('mini-player-${player.isPlaying}'),
                    tooltip: player.isPlaying ? 'Pause' : 'Play',
                    style: IconButton.styleFrom(
                      backgroundColor: MiniPlayer._orange,
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
