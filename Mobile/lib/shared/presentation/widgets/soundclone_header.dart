import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../features/auth/models/user_model.dart';
import '../../../features/auth/providers/auth_provider.dart';

class SoundCloneHeader extends ConsumerWidget
    implements PreferredSizeWidget {
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

  String _getInitials() {
    final value = user.name.trim().isNotEmpty
        ? user.name.trim()
        : user.email.trim();

    if (value.isEmpty) {
      return 'SC';
    }

    final words = value.split(
      RegExp(r'\s+'),
    );

    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'
          .toUpperCase();
    }

    if (value.length >= 2) {
      return value.substring(0, 2).toUpperCase();
    }

    return value.substring(0, 1).toUpperCase();
  }

  @override
  Widget build(
      BuildContext context,
      WidgetRef ref,
      ) {
    final avatarUrl = user.avatarUrl;

    return AppBar(
      automaticallyImplyLeading: false,

      elevation: 0,

      scrolledUnderElevation: 0,

      backgroundColor: const Color(0xFF0B0B0B),

      surfaceTintColor: Colors.transparent,

      toolbarHeight: 58,

      titleSpacing: 14,

      // ==========================================================
      // LOGO
      // ==========================================================

      title: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: const Color(0xFFFF5500),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(
              Icons.cloud_rounded,
              color: Colors.white,
              size: 24,
            ),
          ),

          const SizedBox(width: 10),

          const Expanded(
            child: Text(
              'SoundClone',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: Colors.white,
                fontSize: 19,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.5,
              ),
            ),
          ),
        ],
      ),

      // ==========================================================
      // RIGHT ACTIONS
      // ==========================================================

      actions: [
        // SEARCH
        _HeaderIconButton(
          icon: Icons.search_rounded,
          tooltip: 'Search',
          onPressed: onSearch ??
                  () {
                context.go('/search');
              },
        ),

        // NOTIFICATION
        _HeaderIconButton(
          icon: Icons.notifications_none_rounded,
          tooltip: 'Notifications',
          onPressed: onNotification,
        ),

        // ACCOUNT
        Padding(
          padding: const EdgeInsets.only(
            left: 2,
            right: 12,
          ),
          child: PopupMenuButton<String>(
            tooltip: 'Account',

            color: const Color(0xFF1A1A1A),

            surfaceTintColor: Colors.transparent,

            elevation: 12,

            offset: const Offset(
              0,
              48,
            ),

            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
              side: const BorderSide(
                color: Color(0xFF303030),
              ),
            ),

            onSelected: (value) async {
              switch (value) {
                case 'profile':
                  if (onProfile != null) {
                    onProfile!();
                  } else {
                    context.go('/profile');
                  }

                  break;

                case 'logout':
                  await ref
                      .read(authProvider.notifier)
                      .logout();

                  if (context.mounted) {
                    context.go('/login');
                  }

                  break;
              }
            },

            itemBuilder: (context) {
              return [
                PopupMenuItem<String>(
                  enabled: false,
                  child: _UserInfo(
                    user: user,
                    initials: _getInitials(),
                  ),
                ),

                const PopupMenuDivider(),

                const PopupMenuItem<String>(
                  value: 'profile',
                  child: _MenuItem(
                    icon: Icons.person_outline_rounded,
                    text: 'Profile',
                  ),
                ),

                const PopupMenuDivider(),

                const PopupMenuItem<String>(
                  value: 'logout',
                  child: _MenuItem(
                    icon: Icons.logout_rounded,
                    text: 'Log out',
                    danger: true,
                  ),
                ),
              ];
            },

            child: CircleAvatar(
              radius: 17,

              backgroundColor: const Color(0xFFFF5500),

              foregroundImage:
              avatarUrl != null &&
                  avatarUrl.trim().isNotEmpty
                  ? NetworkImage(avatarUrl)
                  : null,

              child: avatarUrl == null ||
                  avatarUrl.trim().isEmpty
                  ? Text(
                _getInitials(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              )
                  : null,
            ),
          ),
        ),
      ],

      bottom: const PreferredSize(
        preferredSize: Size.fromHeight(1),
        child: Divider(
          height: 1,
          thickness: 1,
          color: Color(0xFF181818),
        ),
      ),
    );
  }
}

// =================================================================
// HEADER BUTTON
// =================================================================

class _HeaderIconButton extends StatelessWidget {
  const _HeaderIconButton({
    required this.icon,
    required this.tooltip,
    this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,

      onPressed: onPressed,

      icon: Icon(
        icon,
        color: const Color(0xFFD8D8D8),
        size: 25,
      ),
    );
  }
}

// =================================================================
// USER INFO
// =================================================================

class _UserInfo extends StatelessWidget {
  const _UserInfo({
    required this.user,
    required this.initials,
  });

  final UserModel user;
  final String initials;

  @override
  Widget build(BuildContext context) {
    final avatarUrl = user.avatarUrl;

    final displayName = user.name.trim().isEmpty
        ? user.email
        : user.name;

    return SizedBox(
      width: 220,
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,

            backgroundColor: const Color(0xFFFF5500),

            foregroundImage:
            avatarUrl != null &&
                avatarUrl.trim().isNotEmpty
                ? NetworkImage(avatarUrl)
                : null,

            child: avatarUrl == null ||
                avatarUrl.trim().isEmpty
                ? Text(
              initials,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            )
                : null,
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment:
              CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 3),

                Text(
                  user.email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF8D8D8D),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================================
// MENU ITEM
// =================================================================

class _MenuItem extends StatelessWidget {
  const _MenuItem({
    required this.icon,
    required this.text,
    this.danger = false,
  });

  final IconData icon;
  final String text;
  final bool danger;

  @override
  Widget build(BuildContext context) {
    final color = danger
        ? const Color(0xFFFF6B6B)
        : const Color(0xFFE6E6E6);

    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: color,
        ),

        const SizedBox(width: 12),

        Text(
          text,
          style: TextStyle(
            color: color,
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}