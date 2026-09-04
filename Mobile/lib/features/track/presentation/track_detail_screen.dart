import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../../shared/presentation/app_toast.dart';
import '../../home/models/home_track.dart';
import '../../library/presentation/add_to_playlist_sheet.dart';
import '../../player/providers/player_provider.dart';
import '../../player/providers/player_social_provider.dart';

class TrackDetailScreen extends ConsumerStatefulWidget {
  const TrackDetailScreen({
    super.key,
    required this.trackId,
    this.initialTrack,
  });

  final String trackId;
  final HomeTrack? initialTrack;

  @override
  ConsumerState<TrackDetailScreen> createState() => _TrackDetailScreenState();
}

class _TrackDetailScreenState extends ConsumerState<TrackDetailScreen> {
  late Future<HomeTrack?> _trackFuture;
  late Future<List<_TrackComment>> _commentsFuture;
  final TextEditingController _commentController = TextEditingController();
  bool _isSendingComment = false;
  bool _isLiking = false;

  static const _background = Color(0xFF0D0D0D);
  static const _panel = Color(0xFF181818);
  static const _orange = Color(0xFFFF5500);

  @override
  void initState() {
    super.initState();
    _trackFuture = _loadTrack();
    _commentsFuture = _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<HomeTrack?>(
      future: _trackFuture,
      builder: (context, snapshot) {
        final track = snapshot.data ?? widget.initialTrack;
        final isLoading = snapshot.connectionState == ConnectionState.waiting;

        if (track == null && isLoading) {
          return const Scaffold(
            backgroundColor: _background,
            body: Center(child: CircularProgressIndicator(color: _orange)),
          );
        }

        if (track == null) {
          return Scaffold(
            backgroundColor: _background,
            appBar: AppBar(title: const Text('Track')),
            body: const _StateMessage(
              icon: Icons.music_off_rounded,
              title: 'Track unavailable',
              subtitle: 'Could not load this track.',
            ),
          );
        }

        final player = ref.watch(playerProvider);
        final social = ref.watch(playerSocialProvider);
        final isCurrent = player.currentTrack?.id == track.id;

        return Scaffold(
          backgroundColor: _background,
          body: Stack(
            children: [
              Positioned.fill(
                child: _BlurredArtwork(url: track.resolvedImageUrl),
              ),
              SafeArea(
                top: false,
                bottom: false,
                child: RefreshIndicator(
                  color: _orange,
                  backgroundColor: _panel,
                  onRefresh: () async {
                    setState(() {
                      _trackFuture = _loadTrack();
                      _commentsFuture = _loadComments();
                    });
                    await Future.wait([_trackFuture, _commentsFuture]);
                  },
                  child: ListView(
                    physics: const AlwaysScrollableScrollPhysics(
                      parent: BouncingScrollPhysics(),
                    ),
                    padding: const EdgeInsets.fromLTRB(18, 18, 18, 150),
                    children: [
                      _TopBar(
                        onBack: () {
                          if (context.canPop()) {
                            context.pop();
                          } else {
                            context.go('/home');
                          }
                        },
                        onShare: () => _shareTrack(track),
                      ),
                      const SizedBox(height: 24),
                      _HeroSection(
                        track: track,
                        isPlaying: isCurrent && player.isPlaying,
                        onPlay: () {
                          ref.read(playerProvider.notifier).playTrack(track);
                        },
                        onArtistTap: () => _openArtist(track),
                      ),
                      const SizedBox(height: 24),
                      _ActionRow(
                        likeCount: social.likeCountFor(track),
                        playCount: track.countPlay,
                        commentFuture: _commentsFuture,
                        isLiked: social.isTrackLiked(track),
                        isLiking: _isLiking,
                        onLike: () => _toggleLike(track),
                        onPlaylist: () {
                          showAddToPlaylistSheet(
                            context: context,
                            ref: ref,
                            track: track,
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      if ((track.description ?? '').trim().isNotEmpty) ...[
                        _InfoPanel(
                          title: 'About',
                          child: Text(
                            track.description!.trim(),
                            style: const TextStyle(
                              color: Color(0xFFD6D6D6),
                              fontSize: 15,
                              height: 1.45,
                            ),
                          ),
                        ),
                        const SizedBox(height: 18),
                      ],
                      _MetaPanel(track: track),
                      const SizedBox(height: 18),
                      _CommentComposer(
                        controller: _commentController,
                        isSending: _isSendingComment,
                        onSend: () => _sendComment(track),
                      ),
                      const SizedBox(height: 18),
                      _CommentsPanel(future: _commentsFuture),
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

  Future<HomeTrack?> _loadTrack() async {
    if (widget.initialTrack != null &&
        !widget.initialTrack!.canUsePublicTrackActions) {
      return widget.initialTrack;
    }

    try {
      final response = await ApiService.instance.getTrackBySlugOrIdApi(
        widget.trackId,
      );

      if (!response.isSuccess) {
        return widget.initialTrack;
      }

      final data = _unwrap(response.data);
      final trackData = data is Map && data['result'] != null
          ? data['result']
          : data is Map && data['track'] != null
          ? data['track']
          : data;

      final track = HomeTrack.fromJson(trackData);
      if (track.id.isEmpty) {
        return widget.initialTrack;
      }

      return track;
    } catch (_) {
      return widget.initialTrack;
    }
  }

  Future<List<_TrackComment>> _loadComments() async {
    if (widget.initialTrack != null &&
        !widget.initialTrack!.canUsePublicTrackActions) {
      return const [];
    }

    final id = widget.initialTrack?.id.isNotEmpty == true
        ? widget.initialTrack!.id
        : widget.trackId;

    try {
      final response = await ApiService.instance.getTrackCommentsApi(id);
      if (!response.isSuccess) {
        return const [];
      }

      return _commentsFromResponse(response);
    } catch (_) {
      return const [];
    }
  }

  Future<void> _toggleLike(HomeTrack track) async {
    if (_isLiking) return;

    if (!track.canUsePublicTrackActions) {
      showAppToast(context, message: 'This track is still being reviewed.');
      return;
    }

    setState(() {
      _isLiking = true;
    });

    final result = await ref
        .read(playerSocialProvider.notifier)
        .toggleLike(track);

    if (mounted) {
      showAppToast(
        context,
        message: result.success
            ? result.isActive
                  ? 'Saved to your Library'
                  : 'Removed from your Library'
            : 'Could not update like.',
      );

      setState(() {
        _isLiking = false;
      });
    }
  }

  Future<void> _sendComment(HomeTrack track) async {
    final content = _commentController.text.trim();

    if (content.isEmpty || _isSendingComment) return;

    if (!track.canUsePublicTrackActions) {
      showAppToast(context, message: 'This track is still being reviewed.');
      return;
    }

    setState(() {
      _isSendingComment = true;
    });

    try {
      final response = await ApiService.instance.createTrackCommentApi(
        trackId: track.id,
        content: content,
      );

      if (!response.isSuccess) {
        if (!mounted) return;
        showAppToast(context, message: 'Could not post comment.');
        return;
      }

      _commentController.clear();
      setState(() {
        _commentsFuture = _loadComments();
      });

      if (!mounted) return;
      showAppToast(context, message: 'Comment posted');
    } catch (_) {
      if (!mounted) return;
      showAppToast(context, message: 'Could not post comment.');
    } finally {
      if (mounted) {
        setState(() {
          _isSendingComment = false;
        });
      }
    }
  }

  Future<void> _shareTrack(HomeTrack track) async {
    final text = [
      '${track.title} - ${track.artistName}',
      if (track.resolvedTrackUrl != null) track.resolvedTrackUrl!,
    ].join('\n');

    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    showAppToast(context, message: 'Track link copied');
  }

  void _openArtist(HomeTrack track) {
    final uploaderId = track.uploaderId;

    if (uploaderId == null || uploaderId.isEmpty) {
      showAppToast(context, message: 'This artist profile is unavailable.');
      return;
    }

    context.push('/profile/$uploaderId');
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.onBack, required this.onShare});

  final VoidCallback onBack;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _CircleButton(
          tooltip: 'Back',
          icon: Icons.arrow_back_rounded,
          onPressed: onBack,
        ),
        const Spacer(),
        _CircleButton(
          tooltip: 'Share',
          icon: Icons.ios_share_rounded,
          onPressed: onShare,
        ),
      ],
    );
  }
}

class _HeroSection extends StatelessWidget {
  const _HeroSection({
    required this.track,
    required this.isPlaying,
    required this.onPlay,
    required this.onArtistTap,
  });

  final HomeTrack track;
  final bool isPlaying;
  final VoidCallback onPlay;
  final VoidCallback onArtistTap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _Artwork(url: track.resolvedImageUrl, size: 245),
        const SizedBox(height: 22),
        Text(
          track.title,
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        MouseRegion(
          cursor: SystemMouseCursors.click,
          child: GestureDetector(
            onTap: onArtistTap,
            child: Text(
              track.artistName,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFFBDBDBD),
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ),
        const SizedBox(height: 22),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: _TrackDetailScreenState._orange,
            foregroundColor: Colors.white,
            minimumSize: const Size(188, 54),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(28),
            ),
          ),
          onPressed: onPlay,
          icon: Icon(
            isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
            size: 30,
          ),
          label: Text(
            isPlaying ? 'Playing' : 'Play',
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
          ),
        ),
      ],
    );
  }
}

class _ActionRow extends StatelessWidget {
  const _ActionRow({
    required this.likeCount,
    required this.playCount,
    required this.commentFuture,
    required this.isLiked,
    required this.isLiking,
    required this.onLike,
    required this.onPlaylist,
  });

  final int likeCount;
  final int playCount;
  final Future<List<_TrackComment>> commentFuture;
  final bool isLiked;
  final bool isLiking;
  final VoidCallback onLike;
  final VoidCallback onPlaylist;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: _TrackDetailScreenState._panel.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Row(
        children: [
          _Metric(
            icon: Icons.play_arrow_rounded,
            text: _compactCount(playCount),
          ),
          const SizedBox(width: 14),
          _Metric(
            icon: Icons.mode_comment_outlined,
            text: '',
            future: commentFuture,
          ),
          const Spacer(),
          IconButton(
            tooltip: isLiked ? 'Unlike' : 'Like',
            color: isLiked ? _TrackDetailScreenState._orange : Colors.white,
            onPressed: isLiking ? null : onLike,
            icon: Icon(
              isLiked ? Icons.favorite_rounded : Icons.favorite_border,
            ),
          ),
          Text(
            _compactCount(likeCount),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: 'Add to playlist',
            color: Colors.white,
            onPressed: onPlaylist,
            icon: const Icon(Icons.playlist_add_rounded),
          ),
        ],
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.text, this.future});

  final IconData icon;
  final String text;
  final Future<List<_TrackComment>>? future;

  @override
  Widget build(BuildContext context) {
    Widget label = Text(
      text,
      style: const TextStyle(
        color: Color(0xFFCFCFCF),
        fontWeight: FontWeight.w800,
      ),
    );

    if (future != null) {
      label = FutureBuilder<List<_TrackComment>>(
        future: future,
        builder: (context, snapshot) {
          return Text(
            _compactCount(snapshot.data?.length ?? 0),
            style: const TextStyle(
              color: Color(0xFFCFCFCF),
              fontWeight: FontWeight.w800,
            ),
          );
        },
      );
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: const Color(0xFFCFCFCF), size: 20),
        const SizedBox(width: 5),
        label,
      ],
    );
  }
}

class _MetaPanel extends StatelessWidget {
  const _MetaPanel({required this.track});

  final HomeTrack track;

  @override
  Widget build(BuildContext context) {
    final items = <String>[
      if ((track.category ?? '').trim().isNotEmpty) track.category!.trim(),
      if (track.durationSeconds != null)
        _formatDuration(
          Duration(milliseconds: (track.durationSeconds! * 1000).round()),
        ),
    ];

    if (items.isEmpty) {
      return const SizedBox.shrink();
    }

    return _InfoPanel(
      title: 'Details',
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [for (final item in items) _ChipLabel(text: item)],
      ),
    );
  }
}

class _CommentComposer extends StatelessWidget {
  const _CommentComposer({
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
      padding: const EdgeInsets.fromLTRB(14, 8, 8, 8),
      decoration: BoxDecoration(
        color: _TrackDetailScreenState._panel,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              minLines: 1,
              maxLines: 3,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: 'Comment...',
                hintStyle: TextStyle(color: Color(0xFF888888)),
              ),
            ),
          ),
          IconButton(
            tooltip: 'Post comment',
            color: _TrackDetailScreenState._orange,
            onPressed: isSending ? null : onSend,
            icon: isSending
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: _TrackDetailScreenState._orange,
                    ),
                  )
                : const Icon(Icons.send_rounded),
          ),
        ],
      ),
    );
  }
}

class _CommentsPanel extends StatelessWidget {
  const _CommentsPanel({required this.future});

  final Future<List<_TrackComment>> future;

  @override
  Widget build(BuildContext context) {
    return _InfoPanel(
      title: 'Comments',
      child: FutureBuilder<List<_TrackComment>>(
        future: future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(
                child: CircularProgressIndicator(
                  color: _TrackDetailScreenState._orange,
                ),
              ),
            );
          }

          final comments = snapshot.data ?? const [];

          if (comments.isEmpty) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 18),
              child: Text(
                'No comments yet',
                style: TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontWeight: FontWeight.w700,
                ),
              ),
            );
          }

          return Column(
            children: [
              for (var index = 0; index < comments.length; index++) ...[
                _CommentTile(comment: comments[index]),
                if (index != comments.length - 1)
                  const Divider(height: 1, color: Color(0xFF2A2A2A)),
              ],
            ],
          );
        },
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

class _InfoPanel extends StatelessWidget {
  const _InfoPanel({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _TrackDetailScreenState._panel.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _ChipLabel extends StatelessWidget {
  const _ChipLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF242424),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFD6D6D6),
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _Artwork extends StatelessWidget {
  const _Artwork({required this.url, required this.size});

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: size,
        height: size,
        color: const Color(0xFF202020),
        child: url == null
            ? const Icon(
                Icons.music_note_rounded,
                color: Colors.white70,
                size: 58,
              )
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.music_note_rounded,
                    color: Colors.white70,
                    size: 58,
                  );
                },
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
            errorBuilder: (_, _, _) =>
                const ColoredBox(color: Color(0xFF111111)),
          )
        else
          const ColoredBox(color: Color(0xFF111111)),
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(color: Colors.black.withValues(alpha: 0.62)),
        ),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x66000000), Color(0xCC0D0D0D), Color(0xFF0D0D0D)],
            ),
          ),
        ),
      ],
    );
  }
}

class _CircleButton extends StatelessWidget {
  const _CircleButton({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      color: Colors.white,
      style: IconButton.styleFrom(
        backgroundColor: Colors.white.withValues(alpha: 0.12),
        hoverColor: _TrackDetailScreenState._orange.withValues(alpha: 0.18),
      ),
      onPressed: onPressed,
      icon: Icon(icon),
    );
  }
}

class _StateMessage extends StatelessWidget {
  const _StateMessage({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 54, color: const Color(0xFF666666)),
            const SizedBox(height: 14),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF9A9A9A)),
            ),
          ],
        ),
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
    if (trimmed.isEmpty) return '?';
    return trimmed.substring(0, 1).toUpperCase();
  }

  String? get momentLabel {
    final seconds = moment;
    if (seconds == null || seconds <= 0) return null;
    return _formatDuration(Duration(milliseconds: (seconds * 1000).round()));
  }

  factory _TrackComment.fromJson(dynamic value) {
    if (value is! Map) {
      return const _TrackComment(author: 'Someone', content: '');
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
        json['content'] ?? json['comment'] ?? json['text'] ?? '',
      ),
      moment: _toDouble(json['moment'] ?? json['position']),
    );
  }
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

String _string(dynamic value) {
  return value?.toString().trim() ?? '';
}

double? _toDouble(dynamic value) {
  if (value is num) {
    return value.toDouble();
  }

  return double.tryParse(value?.toString() ?? '');
}
