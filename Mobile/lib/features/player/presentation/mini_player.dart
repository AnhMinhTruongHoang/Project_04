import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'full_player_screen.dart';
import '../../home/models/home_track.dart';
import '../../../shared/presentation/app_toast.dart';
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

  HomeTrack? _transitionTrack;

  bool _animateOffset = false;
  bool _isTransitioning = false;

  // ============================================================
  // RESET DRAG
  // ============================================================

  void _resetDrag() {
    _dragOffset = Offset.zero;
  }

  // ============================================================
  // SWIPE TO CHANGE TRACK
  // ============================================================

  Future<void> _handleSwipe(PlayerState player) async {
    if (_isTransitioning) {
      return;
    }

    final horizontal = _dragOffset.dx;
    final vertical = _dragOffset.dy.abs();

    final isHorizontalSwipe =
        horizontal.abs() >= _swipeDistance && horizontal.abs() > vertical;

    // ------------------------------------------------------------
    // Không đủ khoảng cách để chuyển bài
    // -> trả MiniPlayer về vị trí cũ
    // ------------------------------------------------------------

    if (!isHorizontalSwipe) {
      setState(() {
        _animateOffset = true;
        _dragOffset = Offset.zero;
      });

      return;
    }

    // Vuốt trái -> bài tiếp theo
    // Vuốt phải -> bài trước
    final isNext = horizontal < 0;

    final canChangeTrack = isNext ? player.hasNext : player.hasPrevious;

    // ------------------------------------------------------------
    // Không có bài tiếp theo / trước đó
    // ------------------------------------------------------------

    if (!canChangeTrack) {
      setState(() {
        _animateOffset = true;
        _dragOffset = Offset.zero;
      });

      return;
    }

    final width = MediaQuery.sizeOf(context).width;

    // ------------------------------------------------------------
    // Vị trí bài cũ chạy ra
    // ------------------------------------------------------------

    final exitOffset = isNext ? -width : width;

    // ------------------------------------------------------------
    // Vị trí bài mới bắt đầu xuất hiện
    // ------------------------------------------------------------

    final enterOffset = isNext ? width : -width;

    final targetIndex = player.currentIndex + (isNext ? 1 : -1);

    final targetTrack = player.queue[targetIndex];

    // ============================================================
    // STEP 1
    //
    // Cho bài hiện tại trượt ra khỏi màn hình
    // ============================================================

    setState(() {
      _isTransitioning = true;

      _animateOffset = true;

      _dragOffset = Offset(exitOffset, 0);
    });

    await Future<void>.delayed(_slideDuration);

    if (!mounted) {
      return;
    }

    // ============================================================
    // STEP 2
    //
    // Đổi nội dung MiniPlayer thành bài mới.
    //
    // Quan trọng:
    // Tắt animation để đặt bài mới ở bên ngoài màn hình ngay lập tức.
    // ============================================================

    setState(() {
      _animateOffset = false;

      _transitionTrack = targetTrack;

      _dragOffset = Offset(enterOffset, 0);
    });

    // ============================================================
    // Chờ Flutter render một frame
    //
    // Khi frame này hoàn thành:
    //
    // bài mới đã thực sự nằm ngoài màn hình.
    //
    // Sau đó mới cho nó trượt vào.
    // ============================================================

    await WidgetsBinding.instance.endOfFrame;

    if (!mounted) {
      return;
    }

    // ============================================================
    // STEP 3
    //
    // Cho bài mới trượt từ ngoài màn hình vào giữa
    // ============================================================

    setState(() {
      _animateOffset = true;

      _dragOffset = Offset.zero;
    });

    // ============================================================
    // STEP 4
    //
    // Thực sự đổi bài trong PlayerProvider.
    //
    // Chờ provider cập nhật xong rồi mới clear _transitionTrack,
    // để mini player không bị quay lại bài cũ khi API/history chậm.
    // ============================================================

    if (isNext) {
      await ref.read(playerProvider.notifier).next();
    } else {
      await ref.read(playerProvider.notifier).previous();
    }

    // Đợi animation bài mới chạy vào xong
    await Future<void>.delayed(_slideDuration);

    if (!mounted) {
      return;
    }

    // ============================================================
    // STEP 5
    //
    // Kết thúc transition
    // ============================================================

    setState(() {
      _isTransitioning = false;

      _transitionTrack = null;

      _dragOffset = Offset.zero;
    });
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    final player = ref.watch(playerProvider);

    final social = ref.watch(playerSocialProvider);

    final track = player.currentTrack;

    if (track == null) {
      return const SizedBox.shrink();
    }

    // Trong lúc animation chuyển bài:
    // dùng targetTrack để hiển thị bài mới ngay lập tức.
    //
    // Sau khi animation xong:
    // quay lại dùng track từ PlayerProvider.
    final displayTrack = _transitionTrack ?? track;

    return SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(14, 0, 14, 10),
      child: Material(
        color: Colors.transparent,
        elevation: 10,

        // ========================================================
        // LISTENER
        //
        // Theo dõi thao tác vuốt ngang
        // ========================================================
        child: Listener(
          behavior: HitTestBehavior.translucent,

          // ------------------------------------------------------
          // Người dùng bắt đầu chạm
          // ------------------------------------------------------
          onPointerDown: (_) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              // Khi đang kéo bằng tay
              // không dùng AnimatedContainer animation.
              _animateOffset = false;

              _resetDrag();
            });
          },

          // ------------------------------------------------------
          // Người dùng đang kéo
          // ------------------------------------------------------
          onPointerMove: (event) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              // Chỉ cần lấy horizontal khi render,
              // nhưng vẫn cộng toàn bộ Offset để kiểm tra hướng vuốt.
              _dragOffset += event.delta;
            });
          },

          // ------------------------------------------------------
          // Gesture bị cancel
          // ------------------------------------------------------
          onPointerCancel: (_) {
            if (_isTransitioning) {
              return;
            }

            setState(() {
              _animateOffset = true;

              _resetDrag();
            });
          },

          // ------------------------------------------------------
          // Người dùng thả tay
          // ------------------------------------------------------
          onPointerUp: (_) {
            _handleSwipe(player);
          },

          // ======================================================
          // ANIMATED CONTAINER
          //
          // Đây là animation DUY NHẤT dùng để chuyển bài.
          //
          // Không dùng AnimatedSwitcher nữa.
          // ======================================================
          child: AnimatedContainer(
            duration: _animateOffset ? _slideDuration : Duration.zero,
            curve: Curves.easeOutCubic,

            // Chỉ di chuyển theo chiều ngang.
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
                // ==================================================
                // PROGRESS BAR
                // ==================================================
                LinearProgressIndicator(
                  minHeight: 2,
                  value: player.progress,
                  backgroundColor: Colors.transparent,
                  color: MiniPlayer._orange,
                ),

                // ==================================================
                // MINI PLAYER CONTENT
                // ==================================================
                Expanded(
                  child: Row(
                    key: ValueKey(displayTrack.id),
                    children: [
                      // ============================================
                      // PLAY / PAUSE
                      // ============================================
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

                      // ============================================
                      // TRACK INFO
                      // ============================================
                      Expanded(
                        child: InkWell(
                          onTap: () {
                            if (_isTransitioning) {
                              return;
                            }

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
                                // ----------------------------------
                                // TITLE
                                // ----------------------------------
                                Text(
                                  displayTrack.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),

                                const SizedBox(height: 3),

                                // ----------------------------------
                                // ARTIST
                                // ----------------------------------
                                MouseRegion(
                                  cursor: SystemMouseCursors.click,
                                  child: Tooltip(
                                    message: 'Open artist profile',
                                    child: GestureDetector(
                                      behavior: HitTestBehavior.opaque,
                                      onTap: () {
                                        final uploaderId =
                                            displayTrack.uploaderId;

                                        if (uploaderId == null ||
                                            uploaderId.isEmpty) {
                                          return;
                                        }

                                        context.push('/profile/$uploaderId');
                                      },
                                      child: Text(
                                        displayTrack.artistName,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(
                                          color: Color(0xFFB5B5B5),
                                          fontSize: 13,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      // ============================================
                      // FOLLOW ARTIST
                      // ============================================
                      _MiniSocialButton(
                        tooltip: social.isArtistFollowed(displayTrack)
                            ? 'Following'
                            : 'Follow artist',
                        icon: social.isArtistFollowed(displayTrack)
                            ? Icons.person_rounded
                            : Icons.person_add_alt_1_rounded,
                        isActive: social.isArtistFollowed(displayTrack),
                        onPressed: () async {
                          if (_isTransitioning) {
                            return;
                          }

                          final result = await ref
                              .read(playerSocialProvider.notifier)
                              .toggleFollow(displayTrack);

                          if (!context.mounted) {
                            return;
                          }

                          showAppToast(
                            context,
                            message: _followToastMessage(displayTrack, result),
                          );
                        },
                      ),

                      // ============================================
                      // LIKE
                      // ============================================
                      _MiniSocialButton(
                        tooltip: social.isTrackLiked(displayTrack)
                            ? 'Liked'
                            : 'Like',
                        icon: social.isTrackLiked(displayTrack)
                            ? Icons.favorite_rounded
                            : Icons.favorite_border_rounded,
                        isActive: social.isTrackLiked(displayTrack),
                        onPressed: () async {
                          if (_isTransitioning) {
                            return;
                          }

                          if (!displayTrack.canUsePublicTrackActions) {
                            showAppToast(
                              context,
                              message: 'This track is still being reviewed.',
                            );
                            return;
                          }

                          final result = await ref
                              .read(playerSocialProvider.notifier)
                              .toggleLike(displayTrack);

                          if (!context.mounted) {
                            return;
                          }

                          showAppToast(
                            context,
                            message: _likeToastMessage(result),
                          );
                        },
                      ),

                      IconButton(
                        tooltip: 'Stop playback',
                        color: Colors.white,
                        iconSize: 28,
                        onPressed: () async {
                          if (_isTransitioning) {
                            return;
                          }

                          try {
                            await ref.read(playerProvider.notifier).stop();

                            if (!context.mounted) {
                              return;
                            }

                            showAppToast(context, message: 'Playback stopped');
                          } catch (_) {
                            if (!context.mounted) {
                              return;
                            }

                            showAppToast(
                              context,
                              message: 'Could not stop playback.',
                            );
                          }
                        },
                        icon: const Icon(Icons.close_rounded),
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

  String _likeToastMessage(PlayerSocialActionResult result) {
    if (!result.success) {
      return 'Could not update like.';
    }

    return result.isActive
        ? 'Saved to your Library'
        : 'Removed from your Library';
  }

  String _followToastMessage(HomeTrack track, PlayerSocialActionResult result) {
    if (result.reason == PlayerSocialActionReason.self) {
      return 'You cannot follow yourself.';
    }

    if (!result.success) {
      return 'Could not follow this artist.';
    }

    return result.isActive
        ? 'Following ${track.artistName}'
        : 'Unfollowed ${track.artistName}';
  }
}

// ================================================================
// MINI SOCIAL BUTTON
// ================================================================

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
