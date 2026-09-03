import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/config/api_config.dart';
import '../../auth/models/user_model.dart';
import '../../auth/providers/auth_provider.dart';
import '../../home/models/home_track.dart';
import '../../home/providers/home_provider.dart';
import '../../playlists/presentation/playlist_card.dart';
import '../../../services/api/api_service.dart';

part 'profile_providers.dart';
part 'profile_edit_sheet.dart';
part 'profile_hero.dart';
part 'profile_tour_tab.dart';
part 'profile_tickets_tab.dart';
part 'ticket_scanner_sheet.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  static const _background = Color(0xFF0D0D0D);
  static const _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return ColoredBox(
      color: _background,
      child: authState.when(
        loading: () {
          return const Center(child: CircularProgressIndicator(color: _orange));
        },
        error: (error, stackTrace) {
          return _ProfileError(
            onRetry: () {
              ref.invalidate(authProvider);
            },
          );
        },
        data: (user) {
          if (user == null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (context.mounted) {
                context.go('/login');
              }
            });

            return const SizedBox.shrink();
          }

          return _ProfileContent(user: user, isOwner: true);
        },
      ),
    );
  }
}

class PublicProfileScreen extends ConsumerWidget {
  const PublicProfileScreen({
    super.key,
    required this.userId,
  });

  final String userId;

  static const _background = Color(0xFF0D0D0D);
  static const _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(_fullProfileProvider(userId));

    return ColoredBox(
      color: _background,
      child: profile.when(
        loading: () {
          return const Center(child: CircularProgressIndicator(color: _orange));
        },
        error: (_, _) {
          return _ProfileError(
            onRetry: () {
              ref.invalidate(_fullProfileProvider(userId));
            },
          );
        },
        data: (user) {
          return _ProfileContent(user: user, isOwner: false);
        },
      ),
    );
  }
}

// ============================================================
// PROFILE CONTENT
// ============================================================

class _ProfileContent extends ConsumerWidget {
  const _ProfileContent({
    required this.user,
    required this.isOwner,
  });

  final UserModel user;
  final bool isOwner;

  static const _background = Color(0xFF0D0D0D);
  static const _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final fullProfile = ref.watch(_fullProfileProvider(user.id));
    final profileUser = fullProfile.value ?? user;

    return SafeArea(
      top: false,
      bottom: false,
      child: RefreshIndicator(
        color: _orange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(_fullProfileProvider(user.id));
          ref.invalidate(profileTracksProvider(user.id));
          ref.invalidate(profilePlaylistsProvider(user.id));
          ref.invalidate(_profileEventsProvider(user.id));
          ref.invalidate(_profileMembershipProvider(user.id));
          ref.invalidate(_profileBadgesProvider(user.id));

          if (isOwner) {
            ref.invalidate(homeFeedProvider);
            ref.invalidate(_profileTicketsProvider);
          }

          try {
            await Future.wait([
              ref.read(profileTracksProvider(user.id).future),
              ref.read(profilePlaylistsProvider(user.id).future),
            ]);
          } catch (_) {}

          if (isOwner) {
            final authNotifier = ref.read(authProvider.notifier);

            // Keep this last: reloadAccount can rebuild/unmount ProfileScreen.
            await authNotifier.reloadAccount();
          }
        },
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          slivers: [
            // ==================================================
            // COVER + APP BAR
            // ==================================================
            SliverAppBar(
              pinned: true,
              stretch: true,
              elevation: 0,
              scrolledUnderElevation: 0,
              expandedHeight: 320,
              backgroundColor: _background,
              surfaceTintColor: Colors.transparent,
              leading: isOwner
                  ? const SizedBox.shrink()
                  : IconButton(
                      tooltip: 'Back',
                      color: Colors.white,
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_rounded),
                    ),
              leadingWidth: isOwner ? 0 : null,
              titleSpacing: 18,
              title: Text(
                isOwner ? 'Profile' : user.name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
              actions: [
                if (isOwner)
                  IconButton(
                    tooltip: 'More',
                    onPressed: () {
                      _showProfileMenu(context, ref);
                    },
                    icon: const Icon(
                      Icons.more_vert_rounded,
                      color: Colors.white,
                    ),
                  ),
                const SizedBox(width: 6),
              ],
              flexibleSpace: FlexibleSpaceBar(
                collapseMode: CollapseMode.parallax,
                background: ProfileMobileHero(
                  user: profileUser,
                  isOwner: isOwner,
                  onUploadCover: () =>
                      _pickAndUpdateCover(context, ref, profileUser),
                ),
              ),
            ),

            // ==================================================
            // PROFILE INFO
            // ==================================================
            SliverToBoxAdapter(
              child: ProfileMobileDetails(
                user: profileUser,
                isOwner: isOwner,
                onEdit: () => _showEditProfile(context, ref, profileUser),
                onShare: () => _shareProfile(context, profileUser),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(18, 0, 18, 18),
                child: _ProfileTabs(user: profileUser, isOwner: isOwner),
              ),
            ),

            // ==================================================
            // LOG OUT
            // ==================================================
            if (isOwner)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(18, 0, 18, 115),
                  child: _LogoutButton(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _showProfileMenu(BuildContext context, WidgetRef ref) async {
    final value = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: const Color(0xFF181818),
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.only(top: 10, bottom: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 42,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF555555),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),

              const SizedBox(height: 14),

              ListTile(
                leading: const Icon(Icons.edit_outlined, color: Colors.white),
                title: const Text(
                  'Edit Profile',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context, 'edit');
                },
              ),

              ListTile(
                leading: const Icon(
                  Icons.settings_outlined,
                  color: Colors.white,
                ),
                title: const Text(
                  'Settings',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context, 'settings');
                },
              ),

              const Divider(color: Color(0xFF303030), height: 1),

              ListTile(
                leading: const Icon(
                  Icons.logout_rounded,
                  color: Color(0xFFFF5C5C),
                ),
                title: const Text(
                  'Log out',
                  style: TextStyle(
                    color: Color(0xFFFF5C5C),
                    fontWeight: FontWeight.w700,
                  ),
                ),
                onTap: () {
                  Navigator.pop(context, 'logout');
                },
              ),
            ],
          ),
        );
      },
    );

    if (!context.mounted) {
      return;
    }

    switch (value) {
      case 'edit':
        await _showEditProfile(context, ref, user);
        break;

      case 'settings':
        _showComingSoon(context, 'Settings');
        break;

      case 'logout':
        await ref.read(authProvider.notifier).logout();

        if (context.mounted) {
          context.go('/login');
        }
        break;
    }
  }
}

// ============================================================
// COVER
// ============================================================

// Legacy widget kept temporarily while the new FE-style hero is stabilized.
// ignore: unused_element
class _ProfileCover extends StatelessWidget {
  const _ProfileCover({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final coverUrl = _resolveMediaUrl(user.coverUrl);

    return Stack(
      fit: StackFit.expand,
      children: [
        // ========================================================
        // REAL USER COVER
        // ========================================================
        if (coverUrl != null)
          Image.network(
            coverUrl,
            fit: BoxFit.cover,
            alignment: Alignment.center,
            gaplessPlayback: true,

            loadingBuilder: (context, child, loadingProgress) {
              if (loadingProgress == null) {
                return child;
              }

              return const ColoredBox(color: Color(0xFF181A1B));
            },

            errorBuilder: (context, error, stackTrace) {
              debugPrint('Profile cover load failed: $coverUrl');

              return _fallbackCover();
            },
          )
        else
          _fallbackCover(),

        // ========================================================
        // OVERLAY
        // FE:
        // linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.35))
        // ========================================================
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x2E000000), Color(0x59000000)],
            ),
          ),
        ),
      ],
    );
  }

  Widget _fallbackCover() {
    return const ColoredBox(
      color: Color(0xFF181A1B),
      child: Center(
        child: Icon(
          Icons.graphic_eq_rounded,
          size: 105,
          color: Color(0x22FFFFFF),
        ),
      ),
    );
  }
}
// ============================================================
// PROFILE INFORMATION
// ============================================================

// Legacy widget kept temporarily while the new FE-style hero is stabilized.
// ignore: unused_element
class _ProfileInformation extends StatelessWidget {
  const _ProfileInformation({required this.user, required this.onEdit});

  final UserModel user;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final displayName = user.name.trim().isNotEmpty
        ? user.name.trim()
        : user.email;

    final avatarUrl = _resolveMediaUrl(user.avatarUrl);

    final username = user.username?.trim();

    final bio = user.bio?.trim();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 104,
              height: 104,
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Color(0xFF0D0D0D),
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: ColoredBox(
                  color: const Color(0xFFFF5500),
                  child: avatarUrl != null && avatarUrl.isNotEmpty
                      ? Image.network(
                          avatarUrl,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          errorBuilder: (_, __, ___) =>
                              _avatarFallback(displayName),
                        )
                      : _avatarFallback(displayName),
                ),
              ),
            ),

            const Spacer(),

            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton.outlined(
                  tooltip: 'Share profile',
                  onPressed: () => _shareProfile(context, user),
                  style: IconButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF555555)),
                  ),
                  icon: const Icon(Icons.share_outlined, size: 19),
                ),
                const SizedBox(width: 8),
                OutlinedButton(
                  onPressed: onEdit,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF555555)),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 11,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(22),
                    ),
                  ),
                  child: const Text(
                    'Edit',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
              ],
            ),
          ],
        ),

        const SizedBox(height: 14),

        Row(
          children: [
            Flexible(
              child: Text(
                displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 25,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.7,
                ),
              ),
            ),

            if (user.verified || user.isVerify) ...[
              const SizedBox(width: 6),
              const Icon(
                Icons.verified_rounded,
                color: Color(0xFFFF5500),
                size: 20,
              ),
            ],
          ],
        ),

        const SizedBox(height: 4),

        Text(
          username != null && username.isNotEmpty ? '@$username' : user.email,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFF9B9B9B),
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),

        if (bio != null && bio.isNotEmpty) ...[
          const SizedBox(height: 13),

          Text(
            bio,
            style: const TextStyle(
              color: Color(0xFFE5E5E5),
              fontSize: 14,
              height: 1.45,
            ),
          ),
        ],

        if (user.website?.trim().isNotEmpty ?? false) ...[
          const SizedBox(height: 12),

          Wrap(
            spacing: 15,
            runSpacing: 8,
            children: [
              if (user.website?.trim().isNotEmpty ?? false)
                _ProfileMeta(
                  icon: Icons.link_rounded,
                  text: user.website!.trim(),
                  orange: true,
                ),
            ],
          ),
        ],

        const SizedBox(height: 18),

        Row(
          children: [
            _FollowStat(value: user.followers, label: 'Followers'),

            const SizedBox(width: 24),

            _FollowStat(value: user.following, label: 'Following'),
          ],
        ),

        const SizedBox(height: 24),

        Container(height: 1, color: const Color(0xFF242424)),
      ],
    );
  }

  String _initials(String value) {
    final trimmed = value.trim();

    if (trimmed.isEmpty) {
      return 'SC';
    }

    final parts = trimmed
        .split(RegExp(r'\s+'))
        .where((item) => item.isNotEmpty)
        .toList();

    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }

    if (trimmed.length >= 2) {
      return trimmed.substring(0, 2).toUpperCase();
    }

    return trimmed.toUpperCase();
  }

  Widget _avatarFallback(String displayName) {
    return Center(
      child: Text(
        _initials(displayName),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 29,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

// ============================================================
// FOLLOW STAT
// ============================================================

class _FollowStat extends StatelessWidget {
  const _FollowStat({required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          _formatCount(value),
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(width: 5),
        Text(
          label,
          style: const TextStyle(color: Color(0xFF999999), fontSize: 13),
        ),
      ],
    );
  }
}

// ============================================================
// META
// ============================================================

class _ProfileMeta extends StatelessWidget {
  const _ProfileMeta({
    required this.icon,
    required this.text,
    this.orange = false,
  });

  final IconData icon;
  final String text;
  final bool orange;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          icon,
          size: 16,
          color: orange ? const Color(0xFFFF5500) : const Color(0xFF999999),
        ),
        const SizedBox(width: 5),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 240),
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: orange ? const Color(0xFFFF782F) : const Color(0xFFAAAAAA),
              fontSize: 13,
              fontWeight: orange ? FontWeight.w700 : FontWeight.w500,
            ),
          ),
        ),
      ],
    );
  }
}

// ============================================================
// PROFILE TABS (mirrors the web profile navigation)
// ============================================================

class _ProfileTabs extends ConsumerStatefulWidget {
  const _ProfileTabs({
    required this.user,
    required this.isOwner,
  });

  final UserModel user;
  final bool isOwner;

  @override
  ConsumerState<_ProfileTabs> createState() => _ProfileTabsState();
}

class _ProfileTabsState extends ConsumerState<_ProfileTabs> {
  String _selectedTab = 'All';

  List<String> get _tabs {
    final tabs = <String>['All', 'Popular tracks', 'Playlists'];
    final isArtist = (widget.user.type ?? '').trim().toUpperCase() == 'ARTIST';

    if (isArtist) {
      tabs.addAll(['Concerts / Tour', 'Membership']);
    }

    if (widget.isOwner) {
      tabs.add('Tickets');
    }

    return tabs;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 42,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: _tabs.length,
            separatorBuilder: (_, __) => const SizedBox(width: 20),
            itemBuilder: (context, index) {
              final tab = _tabs[index];
              final selected = tab == _selectedTab;

              return InkWell(
                onTap: () => setState(() => _selectedTab = tab),
                child: Container(
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(
                        width: 2,
                        color: selected
                            ? const Color(0xFFFF5500)
                            : Colors.transparent,
                      ),
                    ),
                  ),
                  child: Text(
                    tab,
                    style: TextStyle(
                      color: selected ? Colors.white : const Color(0xFFAAAAAA),
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),
        AnimatedSwitcher(
          duration: const Duration(milliseconds: 180),
          child: KeyedSubtree(
            key: ValueKey(_selectedTab),
            child: _buildSelectedTab(),
          ),
        ),
      ],
    );
  }

  Widget _buildSelectedTab() {
    switch (_selectedTab) {
      case 'All':
        if (widget.isOwner) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _RecentSection(embedded: true),
              const SizedBox(height: 26),
              _AboutCard(user: widget.user),
            ],
          );
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _PopularTracksTab(userId: widget.user.id),
            const SizedBox(height: 26),
            _AboutCard(user: widget.user),
          ],
        );
      case 'Popular tracks':
        return _PopularTracksTab(userId: widget.user.id);
      case 'Playlists':
        return _ProfilePlaylistsTab(userId: widget.user.id);
      case 'Concerts / Tour':
        return ProfileTourTab(artistId: widget.user.id, isOwner: widget.isOwner);
      case 'Membership':
        return _ProfileMembershipTab(artistId: widget.user.id);
      case 'Tickets':
        return const ProfileMobileTicketsTab();
      default:
        return const SizedBox.shrink();
    }
  }
}

class _PopularTracksTab extends ConsumerWidget {
  const _PopularTracksTab({required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref
        .watch(profileTracksProvider(userId))
        .when(
          loading: () => const _RecentLoading(),
          error: (_, __) => const _ProfileEmptyTab(
            icon: Icons.cloud_off_outlined,
            title: 'Couldn\'t load tracks',
            description: 'Pull down to refresh and try again.',
          ),
          data: (profileTracks) {
            final tracks = [...profileTracks]
              ..sort((a, b) => b.countPlay.compareTo(a.countPlay));

            if (tracks.isEmpty) {
              return const _ProfileEmptyTab(
                icon: Icons.music_off_outlined,
                title: 'No tracks yet',
                description: 'Uploaded tracks will appear here.',
              );
            }

            return Container(
              decoration: BoxDecoration(
                color: const Color(0xFF141414),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF262626)),
              ),
              child: Column(
                children: [
                  for (
                    var index = 0;
                    index < tracks.take(10).length;
                    index++
                  ) ...[
                    _RecentTrackTile(index: index + 1, track: tracks[index]),
                    if (index < tracks.take(10).length - 1)
                      const Divider(
                        height: 1,
                        indent: 62,
                        color: Color(0xFF242424),
                      ),
                  ],
                ],
              ),
            );
          },
        );
  }
}

class _ProfilePlaylistsTab extends ConsumerWidget {
  const _ProfilePlaylistsTab({required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref
        .watch(profilePlaylistsProvider(userId))
        .when(
          loading: () => const _RecentLoading(),
          error: (_, __) => const _ProfileEmptyTab(
            icon: Icons.cloud_off_outlined,
            title: 'Playlist unavailable',
            description: 'Pull down to refresh and try again.',
          ),
          data: (playlists) {
            if (playlists.isEmpty) {
              return const _ProfileEmptyTab(
                icon: Icons.queue_music_rounded,
                title: 'No playlists yet',
                description: 'Your public playlists will appear here.',
              );
            }

            return Column(
              children: playlists.map((playlist) {
                return ProfilePlaylistCard(
                  playlist: playlist,
                  onManage: () => context.push('/playlist'),
                );
              }).toList(),
            );
          },
        );
  }
}

class _ProfileMembershipTab extends ConsumerWidget {
  const _ProfileMembershipTab({required this.artistId});

  final String artistId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ref
        .watch(_profileMembershipProvider(artistId))
        .when(
          loading: () => const _RecentLoading(),
          error: (_, __) => const _ProfileEmptyTab(
            icon: Icons.cloud_off_outlined,
            title: 'Membership unavailable',
            description: 'Pull down to refresh and try again.',
          ),
          data: (data) {
            if (data.plans.isEmpty && data.posts.isEmpty) {
              return const _ProfileEmptyTab(
                icon: Icons.workspace_premium_outlined,
                title: 'No membership content yet',
                description:
                    'Plans and exclusive artist posts will appear here.',
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data.plans.isNotEmpty) ...[
                  const _TabSectionTitle('Membership plans'),
                  ...data.plans.map((plan) {
                    final name = _firstText(plan, ['name', 'title']);
                    final price = plan['price'] ?? plan['monthlyPrice'];
                    return _ProfileDataCard(
                      icon: Icons.workspace_premium_rounded,
                      title: name.isEmpty ? 'Membership plan' : name,
                      subtitle: _firstText(plan, ['description']),
                      trailing: _formatMoney(price),
                    );
                  }),
                ],
                if (data.posts.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  const _TabSectionTitle('Community'),
                  ...data.posts.map((post) {
                    final title = _firstText(post, [
                      'title',
                      'content',
                      'caption',
                    ]);
                    return _ProfileDataCard(
                      icon: Icons.article_outlined,
                      title: title.isEmpty ? 'Exclusive post' : title,
                      subtitle: _firstText(post, [
                        'visibility',
                        'postType',
                        'type',
                      ]),
                      trailing: _readableDate(
                        _firstText(post, ['publishedAt', 'createdAt']),
                      ),
                    );
                  }),
                ],
              ],
            );
          },
        );
  }
}

class _TabSectionTitle extends StatelessWidget {
  const _TabSectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _ProfileDataCard extends StatelessWidget {
  const _ProfileDataCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF292929)),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 58,
              height: 58,
              color: const Color(0xFF242424),
              child: Icon(icon, color: const Color(0xFFFF5500)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (subtitle.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    subtitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF999999),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing.isNotEmpty) ...[
            const SizedBox(width: 8),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 90),
              child: Text(
                trailing,
                textAlign: TextAlign.end,
                style: const TextStyle(
                  color: Color(0xFFFF782F),
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProfileEmptyTab extends StatelessWidget {
  const _ProfileEmptyTab({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      constraints: const BoxConstraints(minHeight: 230),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: const Color(0xFF111314),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF343434)),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: const Color(0xFFFF5500)),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF999999), height: 1.4),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// RECENT SECTION
// ============================================================

class _RecentSection extends ConsumerWidget {
  const _RecentSection({this.embedded = false});

  final bool embedded;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final home = ref.watch(homeFeedProvider);

    return Padding(
      padding: embedded
          ? EdgeInsets.zero
          : const EdgeInsets.symmetric(horizontal: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Recent',
            style: TextStyle(
              color: Colors.white,
              fontSize: 21,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.4,
            ),
          ),

          const SizedBox(height: 14),

          home.when(
            loading: () {
              return const _RecentLoading();
            },
            error: (error, stackTrace) {
              return _RecentEmpty(
                icon: Icons.cloud_off_outlined,
                title: 'Couldn\'t load recent tracks',
                description: 'Pull down to try again.',
              );
            },
            data: (data) {
              final tracks = data.historyTracks.take(5).toList();

              if (tracks.isEmpty) {
                return const _RecentEmpty(
                  icon: Icons.history_rounded,
                  title: 'No listening history yet',
                  description:
                      'Your five most recently played tracks will appear here.',
                );
              }

              return Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF141414),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFF262626)),
                ),
                child: Column(
                  children: [
                    for (int index = 0; index < tracks.length; index++) ...[
                      _RecentTrackTile(index: index + 1, track: tracks[index]),

                      if (index != tracks.length - 1)
                        const Divider(
                          height: 1,
                          indent: 62,
                          color: Color(0xFF242424),
                        ),
                    ],
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

// ============================================================
// RECENT TRACK
// ============================================================

class _RecentTrackTile extends StatelessWidget {
  const _RecentTrackTile({required this.index, required this.track});

  final int index;
  final HomeTrack track;

  @override
  Widget build(BuildContext context) {
    final imageUrl = _resolveMediaUrl(track.imgUrl);

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Opening ${track.title}'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        child: Row(
          children: [
            SizedBox(
              width: 22,
              child: Text(
                '$index',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF888888),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),

            const SizedBox(width: 8),

            ClipRRect(
              borderRadius: BorderRadius.circular(5),
              child: Container(
                width: 46,
                height: 46,
                color: const Color(0xFF262626),
                child: imageUrl == null || imageUrl.isEmpty
                    ? const Icon(
                        Icons.music_note_rounded,
                        color: Color(0xFF777777),
                      )
                    : Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(
                            Icons.music_note_rounded,
                            color: Color(0xFF777777),
                          );
                        },
                      ),
              ),
            ),

            const SizedBox(width: 12),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),

                  const SizedBox(height: 4),

                  Text(
                    track.artistName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF8E8E8E),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            IconButton(
              tooltip: 'More',
              visualDensity: VisualDensity.compact,
              onPressed: () {},
              icon: const Icon(
                Icons.more_vert_rounded,
                color: Color(0xFF999999),
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// RECENT LOADING
// ============================================================

class _RecentLoading extends StatelessWidget {
  const _RecentLoading();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 110,
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF262626)),
      ),
      child: const Center(
        child: CircularProgressIndicator(
          color: Color(0xFFFF5500),
          strokeWidth: 2.5,
        ),
      ),
    );
  }
}

// ============================================================
// RECENT EMPTY
// ============================================================

class _RecentEmpty extends StatelessWidget {
  const _RecentEmpty({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 32),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF262626)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 38, color: const Color(0xFFFF5500)),
          const SizedBox(height: 11),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF888888),
              fontSize: 12,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// ABOUT
// ============================================================

class _AboutCard extends StatelessWidget {
  const _AboutCard({required this.user});

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final createdAt = user.createdAt;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'About',
          style: TextStyle(
            color: Colors.white,
            fontSize: 21,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.4,
          ),
        ),

        const SizedBox(height: 14),

        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF141414),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF262626)),
          ),
          child: Column(
            children: [
              _AboutRow(
                icon: Icons.email_outlined,
                label: 'Email',
                value: user.email,
              ),

              const _AboutDivider(),

              _AboutRow(
                icon: Icons.verified_user_outlined,
                label: 'Account',
                value: user.isVerify ? 'Verified' : 'Not verified',
                valueColor: user.isVerify ? const Color(0xFFFF782F) : null,
              ),

              if (user.role.trim().isNotEmpty) ...[
                const _AboutDivider(),

                _AboutRow(
                  icon: Icons.person_outline_rounded,
                  label: 'Role',
                  value: _formatRole(user.role),
                ),
              ],

              if (createdAt != null) ...[
                const _AboutDivider(),

                _AboutRow(
                  icon: Icons.calendar_today_outlined,
                  label: 'Member since',
                  value: _formatDate(createdAt),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

// ============================================================
// ABOUT ROW
// ============================================================

class _AboutRow extends StatelessWidget {
  const _AboutRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF999999), size: 20),

        const SizedBox(width: 13),

        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Color(0xFF777777),
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),

              const SizedBox(height: 3),

              Text(
                value,
                style: TextStyle(
                  color: valueColor ?? Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _AboutDivider extends StatelessWidget {
  const _AboutDivider();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 14),
      child: Divider(color: Color(0xFF262626), height: 1),
    );
  }
}

// ============================================================
// LOG OUT
// ============================================================

class _LogoutButton extends ConsumerWidget {
  const _LogoutButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: () async {
          final shouldLogout = await _confirmLogout(context);

          if (!shouldLogout) {
            return;
          }

          await ref.read(authProvider.notifier).logout();

          if (context.mounted) {
            context.go('/login');
          }
        },
        icon: const Icon(Icons.logout_rounded, size: 19),
        label: const Text('Log out'),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFFF5C5C),
          side: const BorderSide(color: Color(0xFF512828)),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
        ),
      ),
    );
  }

  Future<bool> _confirmLogout(BuildContext context) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF1B1B1B),
              surfaceTintColor: Colors.transparent,
              title: const Text(
                'Log out?',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
              content: const Text(
                'Are you sure you want to log out of SoundClone?',
                style: TextStyle(color: Color(0xFFB0B0B0)),
              ),
              actions: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context, false);
                  },
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context, true);
                  },
                  child: const Text(
                    'Log out',
                    style: TextStyle(
                      color: Color(0xFFFF5C5C),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            );
          },
        ) ??
        false;
  }
}

// ============================================================
// ERROR
// ============================================================

class _ProfileError extends StatelessWidget {
  const _ProfileError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.account_circle_outlined,
                color: Color(0xFFFF5500),
                size: 58,
              ),

              const SizedBox(height: 16),

              const Text(
                'Couldn\'t load profile',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),

              const SizedBox(height: 8),

              const Text(
                'Please check your connection and try again.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF999999)),
              ),

              const SizedBox(height: 22),

              FilledButton(
                onPressed: onRetry,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFFF5500),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ============================================================
// HELPERS
// ============================================================

String _formatCount(int value) {
  if (value >= 1000000) {
    final number = value / 1000000;

    return '${number.toStringAsFixed(number >= 10 ? 0 : 1)}M';
  }

  if (value >= 1000) {
    final number = value / 1000;

    return '${number.toStringAsFixed(number >= 100 ? 0 : 1)}K';
  }

  return value.toString();
}

String _formatRole(String role) {
  if (role.trim().isEmpty) {
    return 'User';
  }

  final normalized = role.trim().toLowerCase();

  return normalized
      .split('_')
      .map(
        (word) =>
            word.isEmpty ? '' : '${word[0].toUpperCase()}${word.substring(1)}',
      )
      .join(' ');
}

String _formatDate(DateTime date) {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return '${months[date.month - 1]} ${date.year}';
}

String _firstText(Map<String, dynamic> source, List<String> keys) {
  for (final key in keys) {
    final value = source[key]?.toString().trim();
    if (value != null && value.isNotEmpty && value != 'null') {
      return value;
    }
  }
  return '';
}

String _readableDate(String value) {
  final date = DateTime.tryParse(value)?.toLocal();
  if (date == null) {
    return '';
  }

  String twoDigits(int number) => number.toString().padLeft(2, '0');
  return '${twoDigits(date.day)}/${twoDigits(date.month)}/${date.year} '
      '${twoDigits(date.hour)}:${twoDigits(date.minute)}';
}

String _formatMoney(dynamic value) {
  final amount = num.tryParse(value?.toString() ?? '');
  if (amount == null) {
    return '';
  }

  final digits = amount.round().toString();
  final buffer = StringBuffer();
  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) {
      buffer.write('.');
    }
    buffer.write(digits[index]);
  }
  return '${buffer.toString()} ₫';
}

void _showComingSoon(BuildContext context, String feature) {
  ScaffoldMessenger.of(context).hideCurrentSnackBar();

  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      behavior: SnackBarBehavior.floating,
      backgroundColor: const Color(0xFF262626),
      content: Text(
        '$feature will be added next.',
        style: const TextStyle(color: Colors.white),
      ),
    ),
  );
}

Future<void> _shareProfile(BuildContext context, UserModel user) async {
  final profileUrl = '${ApiConfig.frontendUrl}/profile/${user.id}';
  await Clipboard.setData(ClipboardData(text: profileUrl));

  if (!context.mounted) {
    return;
  }

  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      const SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: Color(0xFF262626),
        content: Text(
          'Profile link copied.',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
}

String? _resolveMediaUrl(String? value) {
  final raw = value?.trim();
  if (raw == null || raw.isEmpty || raw == 'null') {
    return null;
  }
  return ApiService.instance.getImageUrl(raw);
}
