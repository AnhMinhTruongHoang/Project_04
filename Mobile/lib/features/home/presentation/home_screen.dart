import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/home_provider.dart';
import 'widgets/home_section.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    required this.user,
  });

  final UserModel user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final homeState = ref.watch(homeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surfaceElevated,
        onRefresh: () async {
          ref.invalidate(homeProvider);
          await ref.read(homeProvider.future);
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            SliverAppBar(
              pinned: true,
              floating: false,
              toolbarHeight: 64,
              backgroundColor: AppColors.background.withValues(alpha: 0.96),
              surfaceTintColor: Colors.transparent,
              titleSpacing: 16,
              title: Row(
                children: [
                  _Avatar(user: user),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'SoundClone',
                      style: TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 21,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.4,
                      ),
                    ),
                  ),
                ],
              ),
              actions: [
                IconButton(
                  tooltip: 'Notifications',
                  onPressed: () {},
                  icon: const Icon(Icons.notifications_none_rounded),
                ),
                IconButton(
                  tooltip: 'Settings',
                  onPressed: () {},
                  icon: const Icon(Icons.settings_outlined),
                ),
                const SizedBox(width: 6),
              ],
            ),
            SliverToBoxAdapter(
              child: _Greeting(user: user),
            ),
            homeState.when(
              loading: () => const SliverToBoxAdapter(
                child: _HomeLoading(),
              ),
              error: (error, _) => SliverToBoxAdapter(
                child: _HomeError(
                  message: error.toString(),
                  onRetry: () => ref.invalidate(homeProvider),
                ),
              ),
              data: (data) {
                if (data.sections.isEmpty) {
                  return const SliverToBoxAdapter(
                    child: _EmptyHome(),
                  );
                }

                return SliverList.builder(
                  itemCount: data.sections.length,
                  itemBuilder: (context, index) {
                    return HomeSection(section: data.sections[index]);
                  },
                );
              },
            ),
            const SliverToBoxAdapter(
              child: SizedBox(height: 24),
            ),
          ],
        ),
      ),
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final name = user.name.trim().isEmpty ? user.email : user.name.trim();
    final firstName = name.split(RegExp(r'\s+')).first;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            _greeting(),
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            firstName.isEmpty ? 'Discover music' : firstName,
            style: AppTextStyles.display,
          ),
          const SizedBox(height: 18),
          const Row(
            children: [
              _QuickChip(label: 'Music'),
              SizedBox(width: 8),
              _QuickChip(label: 'Podcasts'),
              SizedBox(width: 8),
              _QuickChip(label: 'Following'),
            ],
          ),
        ],
      ),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;

    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}

class _QuickChip extends StatelessWidget {
  const _QuickChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.surfaceElevated,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 8,
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppColors.textPrimary,
            fontSize: 12,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final name = user.name.trim().isEmpty ? user.email : user.name.trim();
    final avatarUrl = user.avatarUrl?.trim();

    return CircleAvatar(
      radius: 18,
      backgroundColor: AppColors.primary,
      backgroundImage: avatarUrl != null && avatarUrl.isNotEmpty
          ? NetworkImage(avatarUrl)
          : null,
      child: avatarUrl == null || avatarUrl.isEmpty
          ? Text(
              name.isEmpty ? 'S' : name[0].toUpperCase(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            )
          : null,
    );
  }
}

class _HomeLoading extends StatelessWidget {
  const _HomeLoading();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: List.generate(
          3,
          (_) => Padding(
            padding: const EdgeInsets.only(bottom: 28),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 180,
                  height: 24,
                  decoration: BoxDecoration(
                    color: AppColors.surfaceElevated,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: List.generate(
                    2,
                    (index) => Container(
                      width: 154,
                      height: 190,
                      margin: EdgeInsets.only(right: index == 0 ? 14 : 0),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceSoft,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
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

class _HomeError extends StatelessWidget {
  const _HomeError({
    required this.message,
    required this.onRetry,
  });

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(
            Icons.cloud_off_rounded,
            color: AppColors.textSecondary,
            size: 42,
          ),
          const SizedBox(height: 12),
          const Text(
            'Cannot load your home feed',
            style: AppTextStyles.sectionTitle,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: AppTextStyles.body,
          ),
          const SizedBox(height: 18),
          FilledButton(
            onPressed: onRetry,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.textPrimary,
              foregroundColor: AppColors.background,
            ),
            child: const Text(
              'Try again',
              style: TextStyle(fontWeight: FontWeight.w800),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyHome extends StatelessWidget {
  const _EmptyHome();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.all(24),
      child: Text(
        'No recommendations yet. Start listening and SoundClone will personalize this screen for you.',
        style: AppTextStyles.body,
      ),
    );
  }
}
