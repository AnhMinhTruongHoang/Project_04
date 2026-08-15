import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/utils/app_toast.dart';
import '../../models/comment_model.dart';
import '../../models/track_model.dart';
import '../../providers/player_provider.dart';
import '../../services/comment_service.dart';
import '../../services/follow_service.dart';
import '../../widgets/add_to_playlist_sheet.dart';

class PlayerScreen extends StatefulWidget {
  const PlayerScreen({super.key});

  @override
  State<PlayerScreen> createState() => _PlayerScreenState();
}

class _PlayerScreenState extends State<PlayerScreen> {
  final CommentService _commentService = CommentService();

  final FollowService _followService = FollowService();

  final TextEditingController _commentController = TextEditingController();

  final FocusNode _commentFocusNode = FocusNode();

  // ============================================================
  // COMMENTS
  // ============================================================

  List<CommentModel> _comments = const [];

  bool _isCommentsLoading = false;

  bool _isSendingComment = false;

  String? _commentsTrackId;

  // ============================================================
  // FOLLOW
  // ============================================================

  bool _isFollowing = false;

  bool _isFollowLoading = false;

  int _followers = 0;

  String? _followUserId;

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      final player = context.read<PlayerProvider>();

      final track = player.currentTrack;

      if (track != null) {
        _loadTrackExtras(track);
      }
    });
  }

  @override
  void dispose() {
    _commentController.dispose();

    _commentFocusNode.dispose();

    super.dispose();
  }

  // ============================================================
  // LOAD TRACK EXTRAS
  // ============================================================

  Future<void> _loadTrackExtras(TrackModel track) async {
    /*
     * Nếu đổi bài thì load lại:
     *
     * comments
     * follow status
     */
    if (_commentsTrackId != track.id) {
      _commentsTrackId = track.id;

      await _loadComments(track.id);
    }

    final uploaderId = track.uploader?.id;

    if (uploaderId != null &&
        uploaderId.trim().isNotEmpty &&
        _followUserId != uploaderId) {
      _followUserId = uploaderId;

      await _loadFollowStatus(uploaderId);
    }
  }

  // ============================================================
  // COMMENTS
  // ============================================================

  Future<void> _loadComments(String trackId) async {
    if (!mounted) return;

    setState(() {
      _isCommentsLoading = true;
    });

    try {
      final comments = await _commentService.getTrackComments(trackId);

      if (!mounted) return;

      /*
       * Nếu lúc API trả về mà người dùng
       * đã chuyển bài thì bỏ kết quả cũ.
       */
      if (_commentsTrackId != trackId) {
        return;
      }

      setState(() {
        _comments = comments;
      });
    } catch (e) {
      debugPrint('Load comments error: $e');
    } finally {
      if (!mounted) return;

      if (_commentsTrackId == trackId) {
        setState(() {
          _isCommentsLoading = false;
        });
      }
    }
  }

  Future<void> _sendComment(TrackModel track, {String? quickReaction}) async {
    if (_isSendingComment) {
      return;
    }

    final content = (quickReaction ?? _commentController.text).trim();

    if (content.isEmpty) {
      return;
    }

    setState(() {
      _isSendingComment = true;
    });

    try {
      final created = await _commentService.createComment(
        trackId: track.id,
        content: content,
      );

      if (!mounted) return;

      if (created != null) {
        setState(() {
          _comments = [created, ..._comments];
        });
      } else {
        /*
         * Một số BE có thể trả data khác.
         * Reload lại đảm bảo UI đúng.
         */
        await _loadComments(track.id);
      }

      _commentController.clear();

      _commentFocusNode.unfocus();

      if (!mounted) return;

      AppToast.success(context, 'Comment posted');
    } catch (e) {
      if (!mounted) return;

      AppToast.error(context, 'Không thể gửi comment');
    } finally {
      if (!mounted) return;

      setState(() {
        _isSendingComment = false;
      });
    }
  }

  // ============================================================
  // FOLLOW
  // ============================================================

  Future<void> _loadFollowStatus(String userId) async {
    if (!mounted) return;

    setState(() {
      _isFollowLoading = true;
    });

    try {
      final status = await _followService.getFollowStatus(userId);

      if (!mounted) return;

      if (_followUserId != userId) {
        return;
      }

      setState(() {
        _isFollowing = status.following;

        _followers = status.targetFollowers;
      });
    } catch (e) {
      debugPrint('Load follow status error: $e');
    } finally {
      if (!mounted) return;

      if (_followUserId == userId) {
        setState(() {
          _isFollowLoading = false;
        });
      }
    }
  }

  Future<void> _toggleFollow(TrackModel track) async {
    final uploaderId = track.uploader?.id;

    if (uploaderId == null || uploaderId.trim().isEmpty || _isFollowLoading) {
      return;
    }

    final oldFollowing = _isFollowing;

    final oldFollowers = _followers;

    /*
     * Optimistic UI.
     */
    setState(() {
      _isFollowLoading = true;

      _isFollowing = !oldFollowing;

      _followers = oldFollowing
          ? (oldFollowers - 1).clamp(0, 1 << 31)
          : oldFollowers + 1;
    });

    try {
      final status = oldFollowing
          ? await _followService.unfollow(uploaderId)
          : await _followService.follow(uploaderId);

      if (!mounted) return;

      setState(() {
        _isFollowing = status.following;

        _followers = status.targetFollowers;
      });

      AppToast.success(
        context,
        status.following
            ? 'Đã follow ${track.artistName}'
            : 'Đã unfollow ${track.artistName}',
      );
    } catch (e) {
      if (!mounted) return;

      /*
       * Rollback.
       */
      setState(() {
        _isFollowing = oldFollowing;

        _followers = oldFollowers;
      });

      AppToast.error(
        context,
        oldFollowing ? 'Không thể unfollow' : 'Không thể follow',
      );
    } finally {
      if (!mounted) return;

      setState(() {
        _isFollowLoading = false;
      });
    }
  }

  // ============================================================
  // SHOW COMMENTS
  // ============================================================

  void _openComments(TrackModel track) {
    showModalBottomSheet<void>(
      context: context,

      backgroundColor: const Color(0xFF1D1D1D),

      isScrollControlled: true,

      useSafeArea: true,

      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),

      builder: (sheetContext) {
        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            /*
             * _comments thay đổi ở parent,
             * nhưng bottom sheet không tự rebuild
             * ngay trong mọi tình huống.
             *
             * Với flow hiện tại, sheet chủ yếu dùng
             * để xem danh sách hiện có.
             */
            return FractionallySizedBox(
              heightFactor: 0.78,

              child: Column(
                children: [
                  const SizedBox(height: 10),

                  Container(
                    width: 40,

                    height: 4,

                    decoration: BoxDecoration(
                      color: Colors.white24,

                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 18, 12, 10),

                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${_comments.length} comments',

                            style: const TextStyle(
                              fontSize: 22,

                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),

                        IconButton(
                          onPressed: () => Navigator.pop(sheetContext),

                          icon: const Icon(Icons.close),
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1, color: Colors.white12),

                  Expanded(
                    child: _isCommentsLoading
                        ? const Center(
                            child: CircularProgressIndicator(
                              color: Color(0xFFFF5500),
                            ),
                          )
                        : _comments.isEmpty
                        ? const _EmptyComments()
                        : ListView.separated(
                            padding: const EdgeInsets.fromLTRB(18, 14, 18, 20),

                            itemCount: _comments.length,

                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 16),

                            itemBuilder: (context, index) {
                              return _CommentTile(comment: _comments[index]);
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ============================================================
  // MORE MENU
  // ============================================================

  void _openMoreMenu(TrackModel track) {
    showModalBottomSheet<void>(
      context: context,

      backgroundColor: const Color(0xFF202020),

      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),

      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(10, 12, 10, 20),

            child: Column(
              mainAxisSize: MainAxisSize.min,

              children: [
                Container(
                  width: 40,

                  height: 4,

                  margin: const EdgeInsets.only(bottom: 12),

                  decoration: BoxDecoration(
                    color: Colors.white24,

                    borderRadius: BorderRadius.circular(20),
                  ),
                ),

                ListTile(
                  leading: const Icon(Icons.playlist_add_rounded),

                  title: const Text('Add to playlist'),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    showAddToPlaylistSheet(context, track: track);
                  },
                ),

                ListTile(
                  leading: const Icon(Icons.comment_outlined),

                  title: const Text('View comments'),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    _openComments(track);
                  },
                ),

                ListTile(
                  leading: const Icon(Icons.share_outlined),

                  title: const Text('Share'),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    AppToast.info(context, 'Share sẽ làm ở bước tiếp theo');
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ============================================================
  // MESSAGE
  // ============================================================

  void _showMessage(String message) {
    AppToast.info(context, message);
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Consumer<PlayerProvider>(
      builder: (context, player, _) {
        final track = player.currentTrack;

        if (track == null) {
          return const Scaffold(
            backgroundColor: Color(0xFF101010),

            body: Center(child: Text('Chưa có bài hát đang phát')),
          );
        }

        /*
         * Khi Next/Previous đổi currentTrack,
         * PlayerScreen vẫn tồn tại.
         *
         * Phải tự load lại comment/follow
         * cho track mới.
         */
        if (_commentsTrackId != track.id ||
            _followUserId != track.uploader?.id) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (!mounted) {
              return;
            }

            _loadTrackExtras(track);
          });
        }

        return Scaffold(
          backgroundColor: const Color(0xFF101010),

          body: Stack(
            children: [
              // ==================================================
              // BACKGROUND
              // ==================================================
              Positioned.fill(child: _PlayerBackground(url: track.imgUrl)),

              // ==================================================
              // DARK OVERLAY
              // ==================================================
              Positioned.fill(
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,

                      end: Alignment.bottomCenter,

                      colors: [
                        Color(0xAA000000),
                        Color(0x55000000),
                        Color(0xCC101010),
                        Color(0xFF101010),
                      ],

                      stops: [0.0, 0.42, 0.78, 1.0],
                    ),
                  ),
                ),
              ),

              // ==================================================
              // PLAYER CONTENT
              // ==================================================
              SafeArea(
                child: Column(
                  children: [
                    // ==============================================
                    // HEADER
                    // ==============================================
                    Padding(
                      padding: const EdgeInsets.fromLTRB(18, 8, 12, 0),

                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,

                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,

                              children: [
                                Container(
                                  color: Colors.black87,

                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,

                                    vertical: 6,
                                  ),

                                  child: Text(
                                    track.title,

                                    maxLines: 1,

                                    overflow: TextOverflow.ellipsis,

                                    style: const TextStyle(
                                      color: Colors.white,

                                      fontSize: 20,

                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),

                                const SizedBox(height: 4),

                                Container(
                                  color: Colors.black87,

                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,

                                    vertical: 5,
                                  ),

                                  child: Text(
                                    track.artistName,

                                    maxLines: 1,

                                    overflow: TextOverflow.ellipsis,

                                    style: const TextStyle(
                                      color: Colors.white70,

                                      fontSize: 16,

                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 12),

                          Column(
                            children: [
                              _CircleActionButton(
                                icon: Icons.keyboard_arrow_down_rounded,

                                backgroundColor: Colors.white,

                                foregroundColor: Colors.black,

                                size: 52,

                                onTap: () => Navigator.pop(context),
                              ),

                              const SizedBox(height: 12),

                              if (track.uploader?.id != null)
                                _FollowCircleButton(
                                  loading: _isFollowLoading,

                                  following: _isFollowing,

                                  onTap: () => _toggleFollow(track),
                                ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ==============================================
                    // CENTER CONTROLS
                    // ==============================================
                    Expanded(
                      child: Stack(
                        alignment: Alignment.center,

                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,

                            children: [
                              _PlayerControlButton(
                                icon: Icons.skip_previous_rounded,

                                size: 64,

                                iconSize: 35,

                                onTap: player.isLoading
                                    ? null
                                    : player.previous,
                              ),

                              const SizedBox(width: 28),

                              _PlayerControlButton(
                                icon: player.isPlaying
                                    ? Icons.pause_rounded
                                    : Icons.play_arrow_rounded,

                                size: 82,

                                iconSize: 46,

                                loading: player.isLoading,

                                onTap: player.isLoading
                                    ? null
                                    : player.togglePlayPause,
                              ),

                              const SizedBox(width: 28),

                              _PlayerControlButton(
                                icon: Icons.skip_next_rounded,

                                size: 64,

                                iconSize: 37,

                                onTap: player.hasNext && !player.isLoading
                                    ? player.next
                                    : null,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // ==============================================
                    // PROGRESS
                    // ==============================================
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),

                      child: Column(
                        children: [
                          SliderTheme(
                            data: SliderTheme.of(context).copyWith(
                              trackHeight: 3,

                              activeTrackColor: const Color(0xFFFF5500),

                              inactiveTrackColor: Colors.white38,

                              thumbColor: Colors.white,

                              overlayColor: Colors.white12,

                              thumbShape: const RoundSliderThumbShape(
                                enabledThumbRadius: 5,
                              ),
                            ),

                            child: Slider(
                              min: 0,

                              max: 1,

                              value: player.progress,

                              onChanged: player.seekByProgress,
                            ),
                          ),

                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,

                            children: [
                              Text(
                                player.formatDuration(player.position),

                                style: const TextStyle(
                                  color: Colors.white,

                                  fontSize: 16,

                                  fontWeight: FontWeight.w600,
                                ),
                              ),

                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 9),

                                child: Text(
                                  '|',

                                  style: TextStyle(
                                    color: Colors.white70,

                                    fontSize: 17,
                                  ),
                                ),
                              ),

                              Text(
                                player.formatDuration(player.duration),

                                style: const TextStyle(
                                  color: Colors.white,

                                  fontSize: 16,

                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 22),

                    // ==============================================
                    // COMMENT BAR
                    // ==============================================
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),

                      child: Container(
                        height: 62,

                        padding: const EdgeInsets.fromLTRB(18, 0, 8, 0),

                        decoration: BoxDecoration(
                          color: const Color(0xE61A1A1A),

                          borderRadius: BorderRadius.circular(34),

                          border: Border.all(color: Colors.white54, width: 1.2),
                        ),

                        child: Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _commentController,

                                focusNode: _commentFocusNode,

                                textInputAction: TextInputAction.send,

                                onSubmitted: (_) => _sendComment(track),

                                style: const TextStyle(
                                  color: Colors.white,

                                  fontSize: 15,
                                ),

                                decoration: const InputDecoration(
                                  hintText: 'Comment...',

                                  hintStyle: TextStyle(color: Colors.white70),

                                  border: InputBorder.none,

                                  enabledBorder: InputBorder.none,

                                  focusedBorder: InputBorder.none,

                                  isCollapsed: true,
                                ),
                              ),
                            ),

                            _ReactionButton(
                              emoji: '🔥',

                              onTap: () =>
                                  _sendComment(track, quickReaction: '🔥'),
                            ),

                            _ReactionButton(
                              emoji: '👏',

                              onTap: () =>
                                  _sendComment(track, quickReaction: '👏'),
                            ),

                            _ReactionButton(
                              emoji: '🥹',
                              onTap: () =>
                                  _sendComment(track, quickReaction: '🥹'),
                            ),

                            const SizedBox(width: 4),

                            if (_isSendingComment)
                              const Padding(
                                padding: EdgeInsets.symmetric(horizontal: 10),
                                child: SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Color(0xFFFF5500),
                                  ),
                                ),
                              )
                            else
                              IconButton(
                                tooltip: 'Post comment',
                                onPressed: () {
                                  final content = _commentController.text
                                      .trim();

                                  if (content.isEmpty) {
                                    return;
                                  }

                                  _sendComment(track);
                                },
                                icon: const Icon(
                                  Icons.send_rounded,
                                  color: Color(0xFFFF5500),
                                  size: 25,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ==============================================
                    // BOTTOM ACTIONS
                    // ==============================================
                    Container(
                      color: const Color(0xEE101010),

                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 18),

                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,

                        children: [
                          // LIKE
                          _BottomAction(
                            icon: player.isCurrentTrackLiked
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,

                            color: player.isCurrentTrackLiked
                                ? const Color(0xFFFF5500)
                                : Colors.white,

                            text: _formatCount(player.currentLikeCount),

                            loading: player.isLikeLoading,

                            onTap: player.isLikeLoading
                                ? null
                                : () async {
                                    try {
                                      await player.toggleLike();
                                    } catch (_) {
                                      if (!mounted) {
                                        return;
                                      }

                                      AppToast.error(
                                        context,
                                        'Không thể cập nhật Like',
                                      );
                                    }
                                  },
                          ),

                          // COMMENTS
                          _BottomAction(
                            icon: Icons.chat_bubble_outline_rounded,

                            text: '${_comments.length}',

                            onTap: () => _openComments(track),
                          ),

                          // SHARE
                          _BottomAction(
                            icon: Icons.share_outlined,

                            onTap: () =>
                                _showMessage('Share sẽ làm ở bước tiếp theo'),
                          ),

                          // ADD PLAYLIST
                          _BottomAction(
                            icon: Icons.playlist_add_rounded,

                            onTap: () {
                              showAddToPlaylistSheet(context, track: track);
                            },
                          ),

                          // MORE
                          _BottomAction(
                            icon: Icons.more_vert_rounded,

                            onTap: () => _openMoreMenu(track),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ============================================================
  // COUNT FORMAT
  // ============================================================

  String _formatCount(int value) {
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
// BACKGROUND
// ============================================================

class _PlayerBackground extends StatelessWidget {
  final String? url;

  const _PlayerBackground({required this.url});

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
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,

          end: Alignment.bottomRight,

          colors: [Color(0xFF5F667A), Color(0xFF59445F), Color(0xFF252733)],
        ),
      ),
    );
  }
}

// ============================================================
// CIRCLE ACTION BUTTON
// ============================================================

class _CircleActionButton extends StatelessWidget {
  final IconData icon;

  final Color backgroundColor;
  final Color foregroundColor;

  final double size;

  final VoidCallback? onTap;

  const _CircleActionButton({
    required this.icon,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.size,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: backgroundColor,

      shape: const CircleBorder(),

      child: InkWell(
        customBorder: const CircleBorder(),

        onTap: onTap,

        child: SizedBox(
          width: size,

          height: size,

          child: Icon(icon, color: foregroundColor, size: size * 0.58),
        ),
      ),
    );
  }
}

// ============================================================
// FOLLOW BUTTON
// ============================================================

class _FollowCircleButton extends StatelessWidget {
  final bool loading;
  final bool following;

  final VoidCallback onTap;

  const _FollowCircleButton({
    required this.loading,
    required this.following,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: following ? const Color(0xFFFF5500) : Colors.white,

      shape: const CircleBorder(),

      child: InkWell(
        customBorder: const CircleBorder(),

        onTap: loading ? null : onTap,

        child: SizedBox(
          width: 52,

          height: 52,

          child: loading
              ? const Padding(
                  padding: EdgeInsets.all(16),

                  child: CircularProgressIndicator(
                    strokeWidth: 2,

                    color: Colors.black,
                  ),
                )
              : Icon(
                  following
                      ? Icons.person_remove_alt_1_rounded
                      : Icons.person_add_alt_1_rounded,

                  color: following ? Colors.white : Colors.black,

                  size: 28,
                ),
        ),
      ),
    );
  }
}

// ============================================================
// PLAYER CONTROL
// ============================================================

class _PlayerControlButton extends StatelessWidget {
  final IconData icon;

  final double size;
  final double iconSize;

  final bool loading;

  final Future<void> Function()? onTap;

  const _PlayerControlButton({
    required this.icon,
    required this.size,
    required this.iconSize,
    required this.onTap,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = onTap != null;

    return Material(
      color: enabled ? const Color(0xEE111111) : const Color(0x77111111),

      shape: const CircleBorder(),

      child: InkWell(
        customBorder: const CircleBorder(),

        onTap: enabled
            ? () {
                onTap!();
              }
            : null,

        child: SizedBox(
          width: size,

          height: size,

          child: loading
              ? Padding(
                  padding: EdgeInsets.all(size * 0.30),

                  child: const CircularProgressIndicator(
                    strokeWidth: 2,

                    color: Colors.white,
                  ),
                )
              : Icon(
                  icon,

                  color: enabled ? Colors.white : Colors.white24,

                  size: iconSize,
                ),
        ),
      ),
    );
  }
}

// ============================================================
// REACTION
// ============================================================

class _ReactionButton extends StatelessWidget {
  final String emoji;

  final VoidCallback onTap;

  const _ReactionButton({required this.emoji, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

      borderRadius: BorderRadius.circular(20),

      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 10),

        child: Text(emoji, style: const TextStyle(fontSize: 23)),
      ),
    );
  }
}

// ============================================================
// BOTTOM ACTION
// ============================================================

class _BottomAction extends StatelessWidget {
  final IconData icon;

  final String? text;

  final Color color;

  final bool loading;

  final VoidCallback? onTap;

  const _BottomAction({
    required this.icon,
    required this.onTap,
    this.text,
    this.color = Colors.white,
    this.loading = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: loading ? null : onTap,

      borderRadius: BorderRadius.circular(30),

      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),

        child: Row(
          mainAxisSize: MainAxisSize.min,

          children: [
            if (loading)
              const SizedBox(
                width: 22,

                height: 22,

                child: CircularProgressIndicator(
                  strokeWidth: 2,

                  color: Colors.white,
                ),
              )
            else
              Icon(icon, color: color, size: 27),

            if (text != null) ...[
              const SizedBox(width: 6),

              Text(
                text!,

                style: TextStyle(
                  color: color,

                  fontSize: 14,

                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================
// COMMENT TILE
// ============================================================

class _CommentTile extends StatelessWidget {
  final CommentModel comment;

  const _CommentTile({required this.comment});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,

      children: [
        _CommentAvatar(url: comment.avatarUrl),

        const SizedBox(width: 12),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,

            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      comment.userName,

                      maxLines: 1,

                      overflow: TextOverflow.ellipsis,

                      style: const TextStyle(
                        color: Colors.white,

                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),

                  if (comment.createdAt != null)
                    Text(
                      _formatTime(comment.createdAt!),

                      style: const TextStyle(
                        color: Colors.white38,

                        fontSize: 11,
                      ),
                    ),
                ],
              ),

              const SizedBox(height: 5),

              Text(
                comment.content,

                style: const TextStyle(
                  color: Colors.white70,

                  fontSize: 14,

                  height: 1.35,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  static String _formatTime(DateTime date) {
    final difference = DateTime.now().difference(date.toLocal());

    if (difference.inSeconds < 60) {
      return 'now';
    }

    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    }

    if (difference.inHours < 24) {
      return '${difference.inHours}h';
    }

    if (difference.inDays < 7) {
      return '${difference.inDays}d';
    }

    return '${date.day}/${date.month}';
  }
}

// ============================================================
// COMMENT AVATAR
// ============================================================

class _CommentAvatar extends StatelessWidget {
  final String? url;

  const _CommentAvatar({required this.url});

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: SizedBox(
        width: 40,

        height: 40,

        child: url != null && url!.trim().isNotEmpty
            ? Image.network(
                url!,

                fit: BoxFit.cover,

                errorBuilder: (_, __, ___) => _placeholder(),
              )
            : _placeholder(),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF333333),

      alignment: Alignment.center,

      child: const Icon(Icons.person_rounded, color: Colors.white54, size: 23),
    );
  }
}

// ============================================================
// EMPTY COMMENTS
// ============================================================

class _EmptyComments extends StatelessWidget {
  const _EmptyComments();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,

        children: [
          Icon(
            Icons.chat_bubble_outline_rounded,

            size: 52,

            color: Colors.white24,
          ),

          SizedBox(height: 12),

          Text(
            'No comments yet',

            style: TextStyle(
              color: Colors.white,

              fontSize: 18,

              fontWeight: FontWeight.w700,
            ),
          ),

          SizedBox(height: 5),

          Text(
            'Be the first to comment.',

            style: TextStyle(color: Colors.white54),
          ),
        ],
      ),
    );
  }
}
