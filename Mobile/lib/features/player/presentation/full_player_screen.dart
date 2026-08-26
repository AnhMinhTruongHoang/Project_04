import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../library/presentation/add_to_playlist_sheet.dart';
import '../models/player_state.dart';
import '../providers/player_provider.dart';
import '../providers/player_social_provider.dart';

class FullPlayerScreen extends ConsumerStatefulWidget {
  const FullPlayerScreen({super.key});

  @override
  ConsumerState<FullPlayerScreen> createState() => _FullPlayerScreenState();
}

class _FullPlayerScreenState extends ConsumerState<FullPlayerScreen> {
  final TextEditingController _commentController = TextEditingController();
  OverlayEntry? _toastEntry;
  String? _loadedTrackId;
  int _commentCount = 0;
  int _likeCount = 0;
  bool _isSendingComment = false;
  bool _isLiking = false;

  @override
  void dispose() {
    _toastEntry?.remove();
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final player = ref.watch(playerProvider);
    final social = ref.watch(playerSocialProvider);
    final track = player.currentTrack;

    if (track == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF0D0D0D),
        body: Center(
          child: Text(
            'No track is playing',
            style: TextStyle(color: Colors.white),
          ),
        ),
      );
    }

    _syncTrack(track);

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: Stack(
        children: [
          Positioned.fill(
            child: _BlurredArtwork(url: track.resolvedImageUrl),
          ),
          Positioned.fill(
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
                child: Column(
                  children: [
                    _TopBar(
                      title: track.title,
                      artist: track.artistName,
                      isFollowing: social.isArtistFollowed(track),
                      onFollow: () => _followArtist(track),
                      onClose: () {
                        Navigator.of(context).pop();
                      },
                    ),
                    const Spacer(),
                    _CenterControls(player: player),
                    const Spacer(),
                    _ProgressRow(
                      position: player.position,
                      duration: player.duration,
                      value: player.progress,
                      onChanged: (value) {
                        ref
                            .read(playerProvider.notifier)
                            .seekByProgress(value);
                      },
                    ),
                    const SizedBox(height: 28),
                    _CommentBox(
                      controller: _commentController,
                      isSending: _isSendingComment,
                      onSend: () => _sendComment(track.id, player.position),
                    ),
                    const SizedBox(height: 26),
                    _ActionRow(
                      likeCount: _likeCount > social.likeCountFor(track)
                          ? _likeCount
                          : social.likeCountFor(track),
                      commentCount: _commentCount,
                      isLiking: _isLiking,
                      isLiked: social.isTrackLiked(track),
                      onLike: () => _likeTrack(track),
                      onComments: () => _showCommentsSheet(track.id),
                      onShare: () => _shareTrack(track),
                      onPlaylist: () {
                        showAddToPlaylistSheet(
                          context: context,
                          ref: ref,
                          track: track,
                        );
                      },
                      onMore: _showMoreSheet,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _syncTrack(HomeTrack track) {
    if (_loadedTrackId == track.id) {
      return;
    }

    _loadedTrackId = track.id;
    _commentCount = 0;
    _likeCount = track.countLike;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _loadedTrackId == track.id) {
        _loadCommentCount(track.id);
      }
    });
  }

  Future<void> _loadCommentCount(String trackId) async {
    try {
      final response = await ApiService.instance.getTrackCommentsApi(trackId);
      final comments = _commentsFromResponse(response);

      if (!mounted || _loadedTrackId != trackId) {
        return;
      }

      setState(() {
        _commentCount = comments.length;
      });
    } catch (_) {
      if (!mounted || _loadedTrackId != trackId) {
        return;
      }

      setState(() {
        _commentCount = 0;
      });
    }
  }

  Future<void> _likeTrack(HomeTrack track) async {
    if (_isLiking) return;

    setState(() {
      _isLiking = true;
    });

    final wasLiked = ref.read(playerSocialProvider).isTrackLiked(track);
    final result =
        await ref.read(playerSocialProvider.notifier).toggleLike(track);

    if (result.success) {
      if (mounted && result.likeCount != null) {
        setState(() {
          _likeCount = result.likeCount!;
        });
      } else if (mounted && result.isActive && !wasLiked) {
        setState(() {
          _likeCount++;
        });
      } else if (mounted && !result.isActive && wasLiked) {
        setState(() {
          _likeCount = _likeCount > 0 ? _likeCount - 1 : 0;
        });
      }

      if (result.isActive) {
        _showAppToast(
          message: 'Saved to your Library',
          actionLabel: 'Share Track',
          onAction: () {
            final track = ref.read(playerProvider).currentTrack;

            if (track != null) {
              _shareTrack(track);
            }
          },
        );
      } else {
        _showAppToast(message: 'Removed from your Library');
      }
    } else {
      _showAppToast(message: 'Could not like this track.');
    }

    if (mounted) {
      setState(() {
        _isLiking = false;
      });
    }
  }

  Future<void> _followArtist(HomeTrack track) async {
    final uploaderId = track.uploaderId;

    if (uploaderId == null || uploaderId.isEmpty) {
      _showSimpleMessage('This track does not include artist id.');
      return;
    }

    final result =
        await ref.read(playerSocialProvider.notifier).toggleFollow(track);

    if (result.reason == PlayerSocialActionReason.self) {
      _showAppToast(message: 'You cannot follow yourself.');
    } else if (result.success && result.isActive) {
      _showAppToast(message: 'Following ${track.artistName}');
    } else if (result.success) {
      _showAppToast(message: 'Unfollowed ${track.artistName}');
    } else {
      _showAppToast(message: 'Could not follow this artist.');
    }
  }

  Future<void> _shareTrack(HomeTrack track) async {
    final text = [
      '${track.title} - ${track.artistName}',
      if (track.resolvedTrackUrl != null) track.resolvedTrackUrl!,
    ].join('\n');

    await Clipboard.setData(ClipboardData(text: text));
    _showAppToast(message: 'Track link copied');
  }

  Future<void> _sendComment(String trackId, Duration position) async {
    final content = _commentController.text.trim();

    if (content.isEmpty || _isSendingComment) {
      return;
    }

    setState(() {
      _isSendingComment = true;
    });

    try {
      await ApiService.instance.createTrackCommentApi(
        trackId: trackId,
        content: content,
        moment: position.inMilliseconds / 1000,
      );
      _commentController.clear();
      if (mounted) {
        setState(() {
          _commentCount++;
        });
      }
      _showAppToast(message: 'Comment posted');
    } catch (_) {
      _showAppToast(message: 'Could not post comment.');
    } finally {
      if (mounted) {
        setState(() {
          _isSendingComment = false;
        });
      }
    }
  }

  void _showCommentsSheet(String trackId) {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF171717),
      showDragHandle: true,
      isScrollControlled: true,
      builder: (context) {
        return _CommentsSheet(trackId: trackId);
      },
    );
  }

  void _showMoreSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF171717),
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(18, 4, 18, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.favorite_rounded),
                  title: const Text('Like track'),
                  onTap: () {
                    final track = ref.read(playerProvider).currentTrack;
                    Navigator.of(context).pop();

                    if (track != null) {
                      _likeTrack(track);
                    }
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.queue_music_rounded),
                  title: const Text('Add to playlist'),
                  onTap: () {
                    final track = ref.read(playerProvider).currentTrack;
                    Navigator.of(context).pop();

                    if (track == null) return;

                    showAddToPlaylistSheet(
                      context: this.context,
                      ref: ref,
                      track: track,
                    );
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.stop_rounded),
                  title: const Text('Stop playback'),
                  onTap: () {
                    Navigator.of(context).pop();
                    ref.read(playerProvider.notifier).stop();
                    Navigator.of(this.context).maybePop();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showSimpleMessage(String message) {
    _showAppToast(message: message);
  }

  void _showAppToast({
    required String message,
    String? actionLabel,
    VoidCallback? onAction,
  }) {
    if (!mounted) return;

    _toastEntry?.remove();

    final overlay = Overlay.of(context);
    final entry = OverlayEntry(
      builder: (context) {
        return Positioned(
          left: 24,
          right: 24,
          bottom: 138,
          child: _AppToast(
            message: message,
            actionLabel: actionLabel,
            onAction: () {
              _toastEntry?.remove();
              _toastEntry = null;
              onAction?.call();
            },
          ),
        );
      },
    );

    _toastEntry = entry;
    overlay.insert(entry);

    Future<void>.delayed(const Duration(seconds: 3), () {
      if (_toastEntry == entry) {
        _toastEntry?.remove();
        _toastEntry = null;
      }
    });
  }
}

class _AppToast extends StatelessWidget {
  const _AppToast({
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(minHeight: 58),
        padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xF22D2D2D),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.28),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                message,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (actionLabel != null) ...[
              const SizedBox(width: 14),
              TextButton(
                onPressed: onAction,
                child: Text(
                  actionLabel!,
                  style: const TextStyle(
                    color: Color(0xFFFF5500),
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _BlurredArtwork extends StatelessWidget {
  const _BlurredArtwork({required this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        if (url != null)
          Image.network(
            url!,
            fit: BoxFit.cover,
            errorBuilder: (_, _, _) => const ColoredBox(
              color: Color(0xFF202020),
            ),
          )
        else
          const ColoredBox(color: Color(0xFF202020)),
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 34, sigmaY: 34),
          child: Container(color: Colors.black.withValues(alpha: 0.42)),
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Color(0x223A1010),
                Color(0x5524272D),
                Color(0xEE0D0D0D),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.title,
    required this.artist,
    required this.isFollowing,
    required this.onFollow,
    required this.onClose,
  });

  final String title;
  final String artist;
  final bool isFollowing;
  final VoidCallback onFollow;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _TextChip(
                text: title,
                fontSize: 27,
                fontWeight: FontWeight.w900,
              ),
              const SizedBox(height: 6),
              _TextChip(
                text: artist,
                fontSize: 21,
                fontWeight: FontWeight.w800,
              ),
            ],
          ),
        ),
        const SizedBox(width: 16),
        Column(
          children: [
            _RoundButton(
              tooltip: 'Close player',
              icon: Icons.keyboard_arrow_down_rounded,
              onPressed: onClose,
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              size: 64,
            ),
            const SizedBox(height: 20),
            _FollowRoundButton(
              isFollowing: isFollowing,
              onPressed: onFollow,
            ),
          ],
        ),
      ],
    );
  }
}

class _FollowRoundButton extends StatelessWidget {
  const _FollowRoundButton({
    required this.isFollowing,
    required this.onPressed,
  });

  final bool isFollowing;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton.filled(
      tooltip: isFollowing ? 'Following' : 'Follow artist',
      style: IconButton.styleFrom(
        fixedSize: const Size.square(64),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
      onPressed: onPressed,
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(
            isFollowing ? Icons.person_rounded : Icons.person_add_rounded,
            size: 31,
          ),
          if (isFollowing)
            const Positioned(
              right: -7,
              top: -5,
              child: Icon(
                Icons.check_circle_rounded,
                size: 17,
                color: Color(0xFFFF5500),
              ),
            ),
        ],
      ),
    );
  }
}

class _CenterControls extends ConsumerWidget {
  const _CenterControls({required this.player});

  final PlayerState player;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _RoundButton(
          key: ValueKey('full-player-${player.isPlaying}'),
          tooltip: player.isPlaying ? 'Pause' : 'Play',
          icon: player.isPlaying
              ? Icons.pause_rounded
              : Icons.play_arrow_rounded,
          onPressed: player.isLoading
              ? null
              : ref.read(playerProvider.notifier).togglePlayPause,
          backgroundColor: const Color(0xE6000000),
          foregroundColor: Colors.white,
          size: 88,
          iconSize: 48,
        ),
        const SizedBox(width: 96),
        _RoundButton(
          tooltip: 'Next',
          icon: Icons.skip_next_rounded,
          onPressed:
              player.hasNext ? ref.read(playerProvider.notifier).next : null,
          backgroundColor: const Color(0xE6000000),
          foregroundColor: Colors.white,
          size: 74,
          iconSize: 42,
        ),
      ],
    );
  }
}

class _ProgressRow extends StatelessWidget {
  const _ProgressRow({
    required this.position,
    required this.duration,
    required this.value,
    required this.onChanged,
  });

  final Duration position;
  final Duration duration;
  final double value;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(
          _formatDuration(position),
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: Text(
            '|',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
        ),
        Text(
          _formatDuration(duration),
          style: const TextStyle(color: Colors.white, fontSize: 15),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 2,
              thumbShape: const RoundSliderThumbShape(
                enabledThumbRadius: 5,
              ),
              overlayShape: const RoundSliderOverlayShape(
                overlayRadius: 14,
              ),
              activeTrackColor: Colors.white,
              inactiveTrackColor: Colors.white38,
              thumbColor: Colors.white,
            ),
            child: Slider(
              value: value.clamp(0, 1),
              onChanged: duration == Duration.zero ? null : onChanged,
            ),
          ),
        ),
      ],
    );
  }
}

class _CommentBox extends StatelessWidget {
  const _CommentBox({
    required this.controller,
    required this.isSending,
    required this.onSend,
  });

  final TextEditingController controller;
  final bool isSending;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 58,
      decoration: BoxDecoration(
        color: const Color(0xE6101010),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white38),
      ),
      child: Row(
        children: [
          const SizedBox(width: 22),
          Expanded(
            child: TextField(
              controller: controller,
              minLines: 1,
              maxLines: 1,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Comment...',
                hintStyle: TextStyle(color: Colors.white),
                border: InputBorder.none,
              ),
              onSubmitted: (_) => onSend(),
            ),
          ),
          IconButton(
            tooltip: 'Fire',
            onPressed: () {
              controller.text = '${controller.text} 🔥';
              controller.selection = TextSelection.collapsed(
                offset: controller.text.length,
              );
            },
            icon: const Text('🔥', style: TextStyle(fontSize: 24)),
          ),
          IconButton(
            tooltip: 'Clap',
            onPressed: () {
              controller.text = '${controller.text} 👏';
              controller.selection = TextSelection.collapsed(
                offset: controller.text.length,
              );
            },
            icon: const Text('👏', style: TextStyle(fontSize: 24)),
          ),
          IconButton(
            tooltip: 'Send comment',
            onPressed: isSending ? null : onSend,
            icon: isSending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.send_rounded),
          ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.likeCount,
    required this.commentCount,
    required this.isLiking,
    required this.isLiked,
    required this.onLike,
    required this.onComments,
    required this.onShare,
    required this.onPlaylist,
    required this.onMore,
  });

  final int likeCount;
  final int commentCount;
  final bool isLiking;
  final bool isLiked;
  final VoidCallback onLike;
  final VoidCallback onComments;
  final VoidCallback onShare;
  final VoidCallback onPlaylist;
  final VoidCallback onMore;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _BottomAction(
          icon: isLiked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          label: _compactCount(likeCount),
          color: isLiked ? const Color(0xFFFF5500) : Colors.white,
          onPressed: isLiking ? null : onLike,
        ),
        _BottomAction(
          icon: Icons.mode_comment_outlined,
          label: _compactCount(commentCount),
          color: Colors.white,
          onPressed: onComments,
        ),
        const Spacer(),
        _IconOnlyAction(
          icon: Icons.share_rounded,
          onPressed: onShare,
          tooltip: 'Share',
        ),
        _IconOnlyAction(
          icon: Icons.playlist_play_rounded,
          onPressed: onPlaylist,
          tooltip: 'Add to playlist',
        ),
        _IconOnlyAction(
          icon: Icons.more_vert_rounded,
          onPressed: onMore,
          tooltip: 'More',
        ),
      ],
    );
  }
}

class _TextChip extends StatelessWidget {
  const _TextChip({
    required this.text,
    required this.fontSize,
    required this.fontWeight,
  });

  final String text;
  final double fontSize;
  final FontWeight fontWeight;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: Color(0xD8000000)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Text(
          text,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            color: Colors.white,
            fontSize: fontSize,
            fontWeight: fontWeight,
          ),
        ),
      ),
    );
  }
}

class _RoundButton extends StatelessWidget {
  const _RoundButton({
    super.key,
    required this.tooltip,
    required this.icon,
    required this.onPressed,
    required this.backgroundColor,
    required this.foregroundColor,
    required this.size,
    this.iconSize = 34,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback? onPressed;
  final Color backgroundColor;
  final Color foregroundColor;
  final double size;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    return IconButton.filled(
      tooltip: tooltip,
      style: IconButton.styleFrom(
        fixedSize: Size.square(size),
        backgroundColor: backgroundColor,
        foregroundColor: foregroundColor,
        disabledBackgroundColor: backgroundColor.withValues(alpha: 0.42),
        disabledForegroundColor: foregroundColor.withValues(alpha: 0.42),
      ),
      onPressed: onPressed,
      icon: Icon(icon, size: iconSize),
    );
  }
}

class _BottomAction extends StatelessWidget {
  const _BottomAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      style: TextButton.styleFrom(
        foregroundColor: color,
        padding: const EdgeInsets.symmetric(horizontal: 6),
      ),
      onPressed: onPressed,
      icon: Icon(icon, size: 34),
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _IconOnlyAction extends StatelessWidget {
  const _IconOnlyAction({
    required this.icon,
    required this.onPressed,
    required this.tooltip,
  });

  final IconData icon;
  final VoidCallback onPressed;
  final String tooltip;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      color: Colors.white,
      iconSize: 34,
      onPressed: onPressed,
      icon: Icon(icon),
    );
  }
}

class _CommentsSheet extends StatelessWidget {
  const _CommentsSheet({required this.trackId});

  final String trackId;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.58,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 4, 18, 18),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Comments',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 12),
              Expanded(
                child: FutureBuilder<dynamic>(
                  future: ApiService.instance.getTrackCommentsApi(trackId),
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(
                        child: CircularProgressIndicator(
                          color: Color(0xFFFF5500),
                        ),
                      );
                    }

                    if (snapshot.hasError) {
                      return const _SheetMessage(
                        icon: Icons.cloud_off_rounded,
                        title: 'Could not load comments',
                      );
                    }

                    final comments = _commentsFromResponse(snapshot.data);

                    if (comments.isEmpty) {
                      return const _SheetMessage(
                        icon: Icons.mode_comment_outlined,
                        title: 'No comments yet',
                      );
                    }

                    return ListView.separated(
                      physics: const BouncingScrollPhysics(),
                      itemCount: comments.length,
                      separatorBuilder: (_, _) {
                        return const Divider(
                          height: 1,
                          color: Color(0xFF2A2A2A),
                        );
                      },
                      itemBuilder: (context, index) {
                        return _CommentTile(comment: comments[index]);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CommentTile extends StatelessWidget {
  const _CommentTile({required this.comment});

  final _TrackComment comment;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: CircleAvatar(
        backgroundColor: const Color(0xFF2A2A2A),
        child: Text(
          comment.authorInitial,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
      title: Text(
        comment.author,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: Text(
        comment.content,
        style: const TextStyle(color: Color(0xFFBDBDBD)),
      ),
      trailing: comment.momentLabel == null
          ? null
          : Text(
              comment.momentLabel!,
              style: const TextStyle(color: Color(0xFF8A8A8A)),
            ),
    );
  }
}

class _SheetMessage extends StatelessWidget {
  const _SheetMessage({
    required this.icon,
    required this.title,
  });

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF666666), size: 48),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _TrackComment {
  const _TrackComment({
    required this.author,
    required this.content,
    this.moment,
  });

  final String author;
  final String content;
  final double? moment;

  String get authorInitial {
    final trimmed = author.trim();

    if (trimmed.isEmpty) {
      return '?';
    }

    return trimmed.substring(0, 1).toUpperCase();
  }

  String? get momentLabel {
    final seconds = moment;

    if (seconds == null || seconds <= 0) {
      return null;
    }

    return _formatDuration(Duration(milliseconds: (seconds * 1000).round()));
  }

  factory _TrackComment.fromJson(dynamic value) {
    if (value is! Map) {
      return const _TrackComment(
        author: 'Someone',
        content: '',
      );
    }

    final json = Map<String, dynamic>.from(value);
    final user = json['user'] is Map
        ? Map<String, dynamic>.from(json['user'])
        : json['account'] is Map
            ? Map<String, dynamic>.from(json['account'])
            : <String, dynamic>{};

    return _TrackComment(
      author: _string(
        user['name'] ??
            user['username'] ??
            json['authorName'] ??
            json['username'] ??
            'Someone',
      ),
      content: _string(
        json['content'] ??
            json['comment'] ??
            json['text'] ??
            '',
      ),
      moment: _toDouble(json['moment'] ?? json['position']),
    );
  }
}

String _formatDuration(Duration duration) {
  final minutes = duration.inMinutes.remainder(60).toString();
  final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');

  return '$minutes:$seconds';
}

String _compactCount(int value) {
  if (value >= 1000000) {
    return '${(value / 1000000).toStringAsFixed(1)}M';
  }

  if (value >= 1000) {
    return '${(value / 1000).toStringAsFixed(1)}K';
  }

  return value.toString();
}

List<_TrackComment> _commentsFromResponse(dynamic response) {
  final data = _unwrap(response?.data ?? response);
  final source = _resultList(data);

  return source
      .map(_TrackComment.fromJson)
      .where((comment) => comment.content.isNotEmpty)
      .toList();
}

dynamic _unwrap(dynamic value) {
  if (value is Map && value['data'] != null) {
    return value['data'];
  }

  return value;
}

List<dynamic> _resultList(dynamic value) {
  final data = _unwrap(value);

  if (data is List) {
    return data;
  }

  if (data is Map) {
    final result = data['result'] ?? data['comments'];

    if (result is List) {
      return result;
    }
  }

  return const [];
}

String _string(dynamic value) {
  return value?.toString().trim() ?? '';
}

double? _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '');
}
