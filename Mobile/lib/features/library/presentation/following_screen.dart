import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../../auth/models/user_model.dart';
import '../providers/library_provider.dart';

class FollowingScreen extends ConsumerWidget {
  const FollowingScreen({super.key});

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final following = ref.watch(followingProvider);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(title: const Text('Following')),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(followingProvider);
          await ref.read(followingProvider.future);
        },
        child: following.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _orange),
            );
          },
          error: (_, _) {
            return const _MessageState(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load following',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const _MessageState(
                icon: Icons.person_add_alt_1_rounded,
                title: 'No following yet',
                subtitle: 'Artists you follow will show up here.',
              );
            }

            return ListView.separated(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 120),
              itemCount: items.length,
              separatorBuilder: (_, _) {
                return const Divider(
                  height: 1,
                  color: Color(0xFF222222),
                );
              },
              itemBuilder: (context, index) {
                final user = items[index];

                return _FollowingTile(
                  user: user,
                  onUnfollow: () async {
                    await _unfollowUser(
                      context: context,
                      ref: ref,
                      user: user,
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  Future<void> _unfollowUser({
    required BuildContext context,
    required WidgetRef ref,
    required UserModel user,
  }) async {
    try {
      final response = await ApiService.instance.unfollowUserApi(user.id);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      ref.invalidate(followingProvider);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Unfollowed ${user.name}'),
          backgroundColor: _orange,
        ),
      );
    } catch (_) {
      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not unfollow this user.')),
      );
    }
  }
}

class _FollowingTile extends StatelessWidget {
  const _FollowingTile({
    required this.user,
    required this.onUnfollow,
  });

  final UserModel user;
  final VoidCallback onUnfollow;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      minVerticalPadding: 10,
      contentPadding: const EdgeInsets.symmetric(horizontal: 6),
      leading: _Avatar(user: user),
      title: Text(
        user.name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: Text(
        user.username == null ? '${user.followers} followers' : '@${user.username}',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: IconButton(
        tooltip: 'Unfollow',
        color: FollowingScreen._orange,
        onPressed: onUnfollow,
        icon: const Icon(Icons.person_remove_rounded),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final avatarUrl = user.avatarUrl;

    return CircleAvatar(
      radius: 27,
      backgroundColor: const Color(0xFF262626),
      backgroundImage: avatarUrl == null ? null : NetworkImage(avatarUrl),
      child: avatarUrl == null
          ? Text(
              user.name.isEmpty ? '?' : user.name.substring(0, 1).toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            )
          : null,
    );
  }
}

class _MessageState extends StatelessWidget {
  const _MessageState({
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
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.2),
        Icon(icon, color: const Color(0xFF555555), size: 54),
        const SizedBox(height: 14),
        Text(
          title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Color(0xFF888888),
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
