import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../features/auth/models/user_model.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/notifications/presentation/notification_bell_button.dart';

// ============================================================================
// COLORS
// ============================================================================

const Color _kHeaderBackground = Color(0xFF101010);
const Color _kPopupBackground = Color(0xFF121212);
const Color _kPopupBorder = Color(0xFF292929);

const Color _kOrange = Color(0xFFFF5500);

const Color _kTextPrimary = Color(0xFFF5F5F5);
const Color _kTextSecondary = Color(0xFFAAAAAA);

const Color _kDanger = Color(0xFFFF6975);

// ============================================================================
// HEADER
// ============================================================================

class SoundCloneHeader extends ConsumerWidget implements PreferredSizeWidget {
  const SoundCloneHeader({
    super.key,
    required this.user,
    this.onSearch,
    this.onNotification,
    this.onProfile,
  });

  final UserModel user;

  final VoidCallback? onSearch;
  final VoidCallback? onNotification;
  final VoidCallback? onProfile;

  @override
  Size get preferredSize => const Size.fromHeight(58);

  // ==========================================================================
  // INITIALS
  // ==========================================================================

  String _getInitials() {
    final name = user.name.trim();
    final email = user.email.trim();

    final value = name.isNotEmpty ? name : email;

    if (value.isEmpty) {
      return 'SC';
    }

    final words = value
        .split(RegExp(r'\s+'))
        .where((word) => word.isNotEmpty)
        .toList();

    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }

    if (value.length >= 2) {
      return value.substring(0, 2).toUpperCase();
    }

    return value.substring(0, 1).toUpperCase();
  }

  // ==========================================================================
  // ADMIN
  // ==========================================================================

  bool _isAdmin() {
    return user.role.toString().toUpperCase() == 'ADMIN';
  }

  // ==========================================================================
  // LOGOUT
  // ==========================================================================

  Future<void> _logout(BuildContext context, WidgetRef ref) async {
    await ref.read(authProvider.notifier).logout();

    if (!context.mounted) {
      return;
    }

    context.go('/login');
  }

  // ==========================================================================
  // NAVIGATION MENU ACTION
  // ==========================================================================

  Future<void> _handleNavigationAction(
    BuildContext context,
    WidgetRef ref,
    String value,
  ) async {
    switch (value) {
      case 'home':
        context.go('/home');
        break;

      case 'news':
        context.go('/news');
        break;

      case 'library':
        context.go('/library');
        break;

      case 'artist-studio':
        context.push('/artist-studio');
        break;

      case 'upload':
        context.push('/track/upload');
        break;

      case 'dashboard':
        context.push('/dashboard');
        break;

      case 'upgrade':
        context.push('/plans');
        break;

      case 'logout':
        await _logout(context, ref);
        break;
    }
  }

  // ==========================================================================
  // USER MENU ACTION
  // ==========================================================================

  Future<void> _handleUserAction(
    BuildContext context,
    WidgetRef ref,
    String value,
  ) async {
    switch (value) {
      case 'profile':
        if (onProfile != null) {
          onProfile!();
        } else {
          context.push('/profile');
        }
        break;

      case 'likes':
        context.push('/like');
        break;

      case 'playlists':
        context.push('/playlist');
        break;

      case 'people':
        context.push('/people');
        break;

      case 'artist-pro':
        context.push('/plans');
        break;

      case 'tracks':
        context.push('/track/upload');
        break;

      case 'insights':
        context.push('/dashboard');
        break;

      case 'dashboard':
        context.push('/dashboard');
        break;

      case 'distribute':
        context.push('/distribute');
        break;

      case 'logout':
        await _logout(context, ref);
        break;
    }
  }

  // ==========================================================================
  // BUILD
  // ==========================================================================

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final avatarUrl = user.avatarUrl?.trim();

    final bool hasAvatar = avatarUrl != null && avatarUrl.isNotEmpty;

    final bool isAdmin = _isAdmin();

    return AppBar(
      automaticallyImplyLeading: false,

      elevation: 0,
      scrolledUnderElevation: 0,

      backgroundColor: _kHeaderBackground,
      surfaceTintColor: Colors.transparent,

      toolbarHeight: 58,
      titleSpacing: 12,

      title: Row(
        children: [
          // ===================================================================
          // SOUNDCLONE LOGO
          // ===================================================================
          Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(20),
              onTap: () {
                context.go('/home');
              },
              child: SizedBox(
                width: 40,
                height: 40,
                child: Center(
                  child: Image.asset(
                    'assets/images/sc_logo.png',
                    width: 38,
                    height: 38,
                    fit: BoxFit.contain,
                    filterQuality: FilterQuality.high,
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // ===================================================================
          // SEARCH
          // ===================================================================
          Expanded(
            child: Material(
              color: const Color(0xFF202124),
              borderRadius: BorderRadius.circular(5),
              child: InkWell(
                borderRadius: BorderRadius.circular(5),

                onTap:
                    onSearch ??
                    () {
                      context.go('/search');
                    },

                child: Container(
                  height: 32,

                  padding: const EdgeInsets.symmetric(horizontal: 10),

                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(5),
                    border: Border.all(color: const Color(0xFF3A3A3A)),
                  ),

                  child: const Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Search',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            color: _kTextSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),

                      Icon(
                        Icons.search_rounded,
                        color: Color(0xFF999999),
                        size: 18,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(width: 5),

          // ===================================================================
          // 3-LINE / HAMBURGER MENU
          // ===================================================================
          PopupMenuButton<String>(
            tooltip: 'Navigation',

            color: _kPopupBackground,
            surfaceTintColor: Colors.transparent,

            elevation: 18,

            offset: const Offset(-185, 43),

            constraints: const BoxConstraints(minWidth: 235, maxWidth: 235),

            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(color: _kPopupBorder),
            ),

            onSelected: (value) async {
              await _handleNavigationAction(context, ref, value);
            },

            itemBuilder: (context) {
              return [
                // -------------------------------------------------------------
                // NAVIGATION
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  enabled: false,
                  height: 32,
                  child: _PopupSectionTitle(text: 'NAVIGATION'),
                ),

                const PopupMenuItem<String>(
                  value: 'home',
                  child: _NavigationMenuItem(text: 'Home'),
                ),

                const PopupMenuItem<String>(
                  value: 'news',
                  child: _NavigationMenuItem(text: 'News'),
                ),

                const PopupMenuItem<String>(
                  value: 'library',
                  child: _NavigationMenuItem(text: 'Library'),
                ),

                const PopupMenuDivider(height: 16),

                // -------------------------------------------------------------
                // CREATOR
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  enabled: false,
                  height: 32,
                  child: _PopupSectionTitle(text: 'CREATOR'),
                ),

                const PopupMenuItem<String>(
                  value: 'artist-studio',
                  child: _NavigationMenuItem(text: 'Artist Studio'),
                ),

                const PopupMenuItem<String>(
                  value: 'upload',
                  child: _NavigationMenuItem(text: 'Upload'),
                ),

                if (isAdmin)
                  const PopupMenuItem<String>(
                    value: 'dashboard',
                    child: _NavigationMenuItem(
                      text: 'Dashboard',
                      selected: true,
                    ),
                  ),

                const PopupMenuDivider(height: 16),

                // -------------------------------------------------------------
                // UPGRADE
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'upgrade',
                  height: 72,
                  child: _UpgradeMenuItem(),
                ),

                const PopupMenuDivider(height: 16),

                // -------------------------------------------------------------
                // LOGOUT
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: _LogoutMenuItem(),
                ),
              ];
            },

            child: const SizedBox(
              width: 36,
              height: 40,
              child: Center(
                child: Icon(
                  Icons.menu_rounded,
                  color: Color(0xFFD8D8D8),
                  size: 27,
                ),
              ),
            ),
          ),

          IconButton(
            tooltip: 'Upload track',
            visualDensity: VisualDensity.compact,
            color: const Color(0xFFD8D8D8),
            hoverColor: _kOrange.withValues(alpha: 0.14),
            onPressed: () {
              context.push('/track/upload');
            },
            icon: const Icon(Icons.upload_rounded, size: 22),
          ),

          // ===================================================================
          // NOTIFICATION
          // ===================================================================
          NotificationBellButton(
            onViewAll:
                onNotification ??
                () {
                  context.push('/notifications');
                },
          ),

          const SizedBox(width: 3),

          // ===================================================================
          // USER AVATAR MENU
          // ===================================================================
          PopupMenuButton<String>(
            tooltip: 'Account',

            color: _kPopupBackground,
            surfaceTintColor: Colors.transparent,

            elevation: 18,

            offset: const Offset(-205, 43),

            constraints: const BoxConstraints(minWidth: 220, maxWidth: 220),

            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(2),
              side: const BorderSide(color: _kPopupBorder),
            ),

            onSelected: (value) async {
              await _handleUserAction(context, ref, value);
            },

            itemBuilder: (context) {
              return [
                // -------------------------------------------------------------
                // PROFILE
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'profile',
                  child: _AccountMenuItem(
                    icon: Icons.person_rounded,
                    text: 'Profile',
                  ),
                ),

                // -------------------------------------------------------------
                // LIKES
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'likes',
                  child: _AccountMenuItem(
                    icon: Icons.favorite_rounded,
                    text: 'Likes',
                  ),
                ),

                // -------------------------------------------------------------
                // PLAYLISTS
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'playlists',
                  child: _AccountMenuItem(
                    icon: Icons.playlist_play_rounded,
                    text: 'Playlists',
                  ),
                ),

                // -------------------------------------------------------------
                // WHO TO FOLLOW
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'people',
                  child: _AccountMenuItem(
                    icon: Icons.groups_rounded,
                    text: 'Who to follow',
                  ),
                ),

                const PopupMenuDivider(height: 1),

                // -------------------------------------------------------------
                // ARTIST PRO
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'artist-pro',
                  child: _AccountMenuItem(
                    icon: Icons.stars_rounded,
                    text: 'Try Artist Pro',
                    iconColor: _kOrange,
                  ),
                ),

                // -------------------------------------------------------------
                // TRACKS
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'tracks',
                  child: _AccountMenuItem(
                    icon: Icons.upload_rounded,
                    text: 'Tracks',
                  ),
                ),

                // -------------------------------------------------------------
                // ADMIN ONLY
                // -------------------------------------------------------------
                if (isAdmin)
                  const PopupMenuItem<String>(
                    value: 'insights',
                    child: _AccountMenuItem(
                      icon: Icons.bar_chart_rounded,
                      text: 'Insights',
                    ),
                  ),

                if (isAdmin)
                  const PopupMenuItem<String>(
                    value: 'dashboard',
                    child: _AccountMenuItem(
                      icon: Icons.dashboard_rounded,
                      text: 'Dashboard',
                    ),
                  ),

                // -------------------------------------------------------------
                // DISTRIBUTE
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'distribute',
                  child: _AccountMenuItem(
                    icon: Icons.cloud_rounded,
                    text: 'Distribute',
                  ),
                ),

                const PopupMenuDivider(height: 1),

                // -------------------------------------------------------------
                // LOGOUT
                // -------------------------------------------------------------
                const PopupMenuItem<String>(
                  value: 'logout',
                  child: _AccountMenuItem(
                    icon: Icons.logout_rounded,
                    text: 'Logout',
                  ),
                ),
              ];
            },

            child: CircleAvatar(
              radius: 16,

              backgroundColor: _kOrange,

              foregroundImage: hasAvatar ? NetworkImage(avatarUrl) : null,

              child: !hasAvatar
                  ? Text(
                      _getInitials(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    )
                  : null,
            ),
          ),

          const SizedBox(width: 9),
        ],
      ),

      // =======================================================================
      // BORDER
      // =======================================================================
      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(height: 1, thickness: 1, color: Color(0xFF222222)),
      ),
    );
  }
}

// ============================================================================
// POPUP SECTION TITLE
// ============================================================================

class _PopupSectionTitle extends StatelessWidget {
  const _PopupSectionTitle({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFF686D75),
          fontSize: 9,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
        ),
      ),
    );
  }
}

// ============================================================================
// NAVIGATION MENU ITEM
// ============================================================================

class _NavigationMenuItem extends StatelessWidget {
  const _NavigationMenuItem({required this.text, this.selected = false});

  final String text;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 38,

      decoration: BoxDecoration(
        color: selected ? const Color(0xFF242424) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),

      padding: const EdgeInsets.symmetric(horizontal: 8),

      alignment: Alignment.centerLeft,

      child: Text(
        text,
        style: const TextStyle(
          color: _kTextPrimary,
          fontSize: 13,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

// ============================================================================
// UPGRADE PLAN
// ============================================================================

class _UpgradeMenuItem extends StatelessWidget {
  const _UpgradeMenuItem();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 54,

      decoration: BoxDecoration(
        color: _kOrange,
        borderRadius: BorderRadius.circular(9),
        boxShadow: const [
          BoxShadow(
            color: Color(0x44FF5500),
            blurRadius: 18,
            offset: Offset(0, 5),
          ),
        ],
      ),

      padding: const EdgeInsets.symmetric(horizontal: 12),

      child: Row(
        children: [
          const Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Upgrade plan',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),

                SizedBox(height: 2),

                Text(
                  'Unlock more creator features',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Color(0xFFFFD8C5),
                    fontSize: 8.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          Container(
            width: 7,
            height: 7,

            decoration: const BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              boxShadow: [BoxShadow(color: Colors.white, blurRadius: 8)],
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// LOGOUT MENU ITEM
// ============================================================================

class _LogoutMenuItem extends StatelessWidget {
  const _LogoutMenuItem();

  @override
  Widget build(BuildContext context) {
    return const SizedBox(
      height: 38,
      child: Row(
        children: [
          Icon(Icons.logout_rounded, color: _kDanger, size: 19),

          SizedBox(width: 12),

          Text(
            'Logout',
            style: TextStyle(
              color: _kDanger,
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// ACCOUNT MENU ITEM
// ============================================================================

class _AccountMenuItem extends StatelessWidget {
  const _AccountMenuItem({
    required this.icon,
    required this.text,
    this.iconColor,
    this.highlighted = false,
  });

  final IconData icon;
  final String text;

  final Color? iconColor;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 41,

      decoration: BoxDecoration(
        color: highlighted ? const Color(0xFF242424) : Colors.transparent,
      ),

      padding: const EdgeInsets.symmetric(horizontal: 2),

      child: Row(
        children: [
          SizedBox(
            width: 26,
            child: Icon(icon, size: 18, color: iconColor ?? Colors.white),
          ),

          const SizedBox(width: 7),

          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: _kTextPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
