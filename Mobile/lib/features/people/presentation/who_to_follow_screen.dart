import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';

final _whoToFollowProvider = FutureProvider.autoDispose<List<UserModel>>((
  ref,
) async {
  final response = await ApiService.instance.getWhoToFollowApi(limit: 13);
  if (!response.isSuccess) {
    throw StateError(response.message);
  }

  final currentUserId = ref.read(authProvider).value?.id;
  final unique = <String, UserModel>{};
  for (final item in ApiService.instance.extractResultList(response)) {
    if (item is! Map) continue;
    final user = UserModel.fromJson(Map<String, dynamic>.from(item));
    if (user.id.isEmpty || user.id == currentUserId) continue;
    unique.putIfAbsent(user.id, () => user);
  }

  return unique.values.take(12).toList();
});

class WhoToFollowScreen extends ConsumerWidget {
  const WhoToFollowScreen({super.key});

  static const _background = Color(0xFF111111);
  static const _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final suggestions = ref.watch(_whoToFollowProvider);

    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        backgroundColor: _background,
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: const Text(
          'Who to follow',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(_whoToFollowProvider);
          await ref.read(_whoToFollowProvider.future);
        },
        child: suggestions.when(
          loading: () => const _LoadingGrid(),
          error: (_, _) => _MessageState(
            icon: Icons.cloud_off_rounded,
            title: 'Could not load suggested profiles',
            subtitle: 'Pull down to try again.',
            onRetry: () => ref.invalidate(_whoToFollowProvider),
          ),
          data: (users) {
            if (users.isEmpty) {
              return const _MessageState(
                icon: Icons.person_add_alt_1_rounded,
                title: 'No suggested profiles yet',
                subtitle: 'New artist suggestions will appear here.',
              );
            }

            return LayoutBuilder(
              builder: (context, constraints) {
                final columns = constraints.maxWidth >= 900
                    ? 6
                    : constraints.maxWidth >= 620
                    ? 4
                    : constraints.maxWidth >= 430
                    ? 3
                    : 2;

                return CustomScrollView(
                  physics: const AlwaysScrollableScrollPhysics(
                    parent: BouncingScrollPhysics(),
                  ),
                  slivers: [
                    const SliverPadding(
                      padding: EdgeInsets.fromLTRB(18, 24, 18, 28),
                      sliver: SliverToBoxAdapter(
                        child: Column(
                          children: [
                            Text(
                              'Who to follow',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 25,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.6,
                              ),
                            ),
                            SizedBox(height: 9),
                            Text(
                              'Suggested artist profiles to discover on SoundClone.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFFA4A4A4),
                                fontSize: 14,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 18),
                      sliver: SliverGrid.builder(
                        itemCount: users.length,
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: columns,
                          mainAxisSpacing: 30,
                          crossAxisSpacing: 18,
                          childAspectRatio: 0.72,
                        ),
                        itemBuilder: (context, index) {
                          return _SuggestedProfileCard(user: users[index]);
                        },
                      ),
                    ),
                    const SliverPadding(
                      padding: EdgeInsets.fromLTRB(18, 58, 18, 150),
                      sliver: SliverToBoxAdapter(child: _PeopleFooter()),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
    );
  }
}

class _SuggestedProfileCard extends StatelessWidget {
  const _SuggestedProfileCard({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final avatar = ApiService.instance.getAvatarUrl(user.avatarUrl);
    final displayName = _displayName(user);
    final verified = user.verified || user.isVerify;

    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () => context.push('/profile/${Uri.encodeComponent(user.id)}'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: AspectRatio(
              aspectRatio: 1,
              child: Container(
                clipBehavior: Clip.antiAlias,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF202020),
                  border: Border.all(color: Colors.white10, width: 2),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x52000000),
                      blurRadius: 24,
                      offset: Offset(0, 10),
                    ),
                  ],
                ),
                child: avatar.isEmpty
                    ? Center(
                        child: Text(
                          _initials(displayName, user.email),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 30,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      )
                    : Image.network(
                        avatar,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => Center(
                          child: Text(
                            _initials(displayName, user.email),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                      ),
              ),
            ),
          ),
          const SizedBox(height: 11),
          Row(
            children: [
              Expanded(
                child: Text(
                  displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              if (verified) ...[
                const SizedBox(width: 3),
                const Icon(
                  Icons.verified_rounded,
                  color: Color(0xFF6CA8FF),
                  size: 16,
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(
                Icons.person_rounded,
                color: Color(0xFF9B9B9B),
                size: 15,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  '${_formatFollowers(user.followers)} followers',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF9B9B9B),
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _LoadingGrid extends StatelessWidget {
  const _LoadingGrid();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = (constraints.maxWidth - 54) / 2;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 34, 18, 140),
          children: [
            const Center(
              child: CircularProgressIndicator(color: Color(0xFFFF5500)),
            ),
            const SizedBox(height: 36),
            Wrap(
              spacing: 18,
              runSpacing: 30,
              children: List.generate(
                8,
                (_) => SizedBox(
                  width: width,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AspectRatio(
                        aspectRatio: 1,
                        child: DecoratedBox(
                          decoration: const BoxDecoration(
                            color: Color(0xFF202020),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(height: 14, color: const Color(0xFF242424)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _MessageState extends StatelessWidget {
  const _MessageState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onRetry,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 120, 24, 140),
      children: [
        Icon(icon, color: const Color(0xFFFF5500), size: 48),
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
          style: const TextStyle(color: Color(0xFF999999)),
        ),
        if (onRetry != null) ...[
          const SizedBox(height: 18),
          Center(
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF5500),
              ),
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ),
        ],
      ],
    );
  }
}

class _PeopleFooter extends StatelessWidget {
  const _PeopleFooter();

  static const _links = [
    'Legal',
    'Privacy',
    'Cookie Policy',
    'Artist Resources',
    'Newsroom',
    'Topics',
    'Charts',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const Divider(color: Color(0xFF202020)),
        const SizedBox(height: 25),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 9,
          children: [
            for (final link in _links)
              Text(
                link,
                style: const TextStyle(
                  color: Color(0xFF9B9B9B),
                  fontSize: 12,
                ),
              ),
          ],
        ),
        const SizedBox(height: 24),
        const Text.rich(
          TextSpan(
            text: 'Language: ',
            children: [
              TextSpan(
                text: 'English (US)',
                style: TextStyle(color: Color(0xFF4D9CFF)),
              ),
            ],
          ),
          style: TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

String _displayName(UserModel user) {
  final name = user.name.trim().isNotEmpty
      ? user.name.trim()
      : user.username?.trim().isNotEmpty == true
      ? user.username!.trim()
      : user.email.trim();
  return name.contains('@') ? name.split('@').first : name;
}

String _initials(String name, String email) {
  final source = name.trim().isEmpty ? email.trim() : name.trim();
  final parts = source.split(RegExp(r'\s+')).where((part) => part.isNotEmpty);
  final result = parts.take(2).map((part) => part[0].toUpperCase()).join();
  return result.isEmpty ? '?' : result;
}

String _formatFollowers(int value) {
  final count = value < 0 ? 0 : value;
  if (count >= 1000000) return '${(count / 1000000).toStringAsFixed(1)}M';
  if (count >= 1000) {
    return (count / 1000).toStringAsFixed(count >= 100000 ? 0 : 1) + 'K';
  }
  return '$count';
}
