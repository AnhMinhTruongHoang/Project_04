import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../library/providers/library_provider.dart';
import '../../player/providers/player_social_provider.dart';

class PeopleScreen extends ConsumerWidget {
  const PeopleScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final people = ref.watch(whoToFollowProvider);
    final currentUserId = ref.watch(authProvider).asData?.value?.id ?? '';
    final followingIds = ref
        .watch(followingProvider)
        .maybeWhen(
          data: (items) => items.map((user) => user.id).toSet(),
          orElse: () => <String>{},
        );

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(title: const Text('Who to follow')),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(whoToFollowProvider);
          await ref.read(whoToFollowProvider.future);
        },
        child: people.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _orange),
            );
          },
          error: (_, _) {
            return const _PeopleMessage(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load suggestions',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            final suggestions = items.where((user) {
              return user.id.isNotEmpty && user.id != currentUserId;
            }).toList();

            if (suggestions.isEmpty) {
              return const _PeopleMessage(
                icon: Icons.person_search_rounded,
                title: 'No suggestions yet',
                subtitle:
                    'New artists and listeners you can follow will appear here.',
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 128),
              itemCount: suggestions.length + 1,
              separatorBuilder: (_, index) {
                if (index == 0) {
                  return const SizedBox(height: 10);
                }

                return const Divider(height: 1, color: Color(0xFF222222));
              },
              itemBuilder: (context, index) {
                if (index == 0) {
                  return const _PeopleHeader();
                }

                final user = suggestions[index - 1];

                return _PeopleTile(
                  key: ValueKey(user.id),
                  user: user,
                  initiallyFollowing: followingIds.contains(user.id),
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _PeopleHeader extends StatelessWidget {
  const _PeopleHeader();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Discover creators',
            style: TextStyle(
              color: Colors.white,
              fontSize: 26,
              fontWeight: FontWeight.w900,
            ),
          ),
          SizedBox(height: 6),
          Text(
            'Follow artists and listeners to keep their music close.',
            style: TextStyle(
              color: Color(0xFFAAAAAA),
              fontSize: 14,
              fontWeight: FontWeight.w700,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _PeopleTile extends ConsumerStatefulWidget {
  const _PeopleTile({
    super.key,
    required this.user,
    required this.initiallyFollowing,
  });

  final UserModel user;
  final bool initiallyFollowing;

  @override
  ConsumerState<_PeopleTile> createState() => _PeopleTileState();
}

class _PeopleTileState extends ConsumerState<_PeopleTile> {
  late bool _following;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _following = widget.initiallyFollowing;
  }

  @override
  void didUpdateWidget(covariant _PeopleTile oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.user.id != widget.user.id ||
        oldWidget.initiallyFollowing != widget.initiallyFollowing) {
      _following = widget.initiallyFollowing;
    }
  }

  @override
  Widget build(BuildContext context) {
    final avatar = ApiService.instance.getAvatarUrl(widget.user.avatarUrl);
    final subtitle = widget.user.username == null
        ? '${widget.user.followers} followers'
        : '@${widget.user.username} • ${widget.user.followers} followers';

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(vertical: 8),
      leading: CircleAvatar(
        radius: 30,
        backgroundColor: const Color(0xFF2A2A2A),
        backgroundImage: avatar.isEmpty ? null : NetworkImage(avatar),
        child: avatar.isEmpty
            ? Text(
                widget.user.name.isEmpty
                    ? '?'
                    : widget.user.name.substring(0, 1).toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              )
            : null,
      ),
      title: Text(
        widget.user.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w900,
        ),
      ),
      subtitle: Text(
        subtitle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Color(0xFFAAAAAA),
          fontWeight: FontWeight.w600,
        ),
      ),
      trailing: SizedBox(
        width: 112,
        child: FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: _following
                ? const Color(0xFF2B2B2B)
                : PeopleScreen._orange,
            foregroundColor: Colors.white,
            disabledBackgroundColor: const Color(0xFF333333),
            minimumSize: const Size.fromHeight(38),
            padding: const EdgeInsets.symmetric(horizontal: 10),
          ),
          onPressed: _loading ? null : _toggleFollow,
          child: _loading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(_following ? 'Following' : 'Follow'),
        ),
      ),
      onTap: () {
        context.push('/profile/${widget.user.id}');
      },
    );
  }

  Future<void> _toggleFollow() async {
    if (_loading) {
      return;
    }

    setState(() {
      _loading = true;
    });

    try {
      final response = _following
          ? await ApiService.instance.unfollowUserApi(widget.user.id)
          : await ApiService.instance.followUserApi(widget.user.id);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      if (!mounted) {
        return;
      }

      setState(() {
        _following = !_following;
      });

      if (_following) {
        ref.read(playerSocialProvider.notifier).markUsersFollowed([
          widget.user,
        ]);
      } else {
        ref
            .read(playerSocialProvider.notifier)
            .markUserUnfollowed(widget.user.id);
      }

      ref.invalidate(followingProvider);
      ref.invalidate(whoToFollowProvider);
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not update follow status.')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }
}

class _PeopleMessage extends StatelessWidget {
  const _PeopleMessage({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 24),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.22),
        Icon(icon, color: const Color(0xFF555555), size: 58),
        const SizedBox(height: 14),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFF888888),
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
