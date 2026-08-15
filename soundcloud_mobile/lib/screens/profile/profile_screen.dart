import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/mini_player.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    final user = auth.currentUser;

    if (user == null) {
      return const Scaffold(
        backgroundColor: Color(0xFF101010),
        body: Center(
          child: Text(
            'Không tìm thấy thông tin người dùng',
            style: TextStyle(color: Colors.white70),
          ),
        ),
      );
    }

    final name = user.name?.trim().isNotEmpty == true
        ? user.name!.trim()
        : 'User';

    final username = user.username?.trim().isNotEmpty == true
        ? user.username!.trim()
        : null;

    final bio = user.bio?.trim().isNotEmpty == true ? user.bio!.trim() : null;

    final website = user.website?.trim().isNotEmpty == true
        ? user.website!.trim()
        : null;

    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: CustomScrollView(
                slivers: [
                  // ==================================================
                  // APP BAR
                  // ==================================================
                  SliverAppBar(
                    pinned: true,
                    expandedHeight: 300,

                    backgroundColor: const Color(0xFF101010),

                    leading: IconButton(
                      onPressed: () {
                        Navigator.pop(context);
                      },
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                    ),

                    actions: [
                      IconButton(
                        tooltip: 'More',
                        onPressed: () {
                          _showProfileMenu(context);
                        },
                        icon: const Icon(Icons.more_vert),
                      ),
                    ],

                    flexibleSpace: FlexibleSpaceBar(
                      background: _ProfileHeader(
                        coverUrl: user.coverUrl,

                        avatarUrl: user.avatarUrl,

                        name: name,

                        username: username,

                        verified: user.isVerify == true,
                      ),
                    ),
                  ),

                  // ==================================================
                  // CONTENT
                  // ==================================================
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),

                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,

                        children: [
                          // ==========================================
                          // ACTIONS
                          // ==========================================
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    _showComingSoon(context, 'Edit profile');
                                  },

                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.white,

                                    side: const BorderSide(
                                      color: Colors.white24,
                                    ),

                                    padding: const EdgeInsets.symmetric(
                                      vertical: 14,
                                    ),

                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(24),
                                    ),
                                  ),

                                  icon: const Icon(Icons.edit_outlined),

                                  label: const Text(
                                    'Edit profile',

                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),

                              const SizedBox(width: 12),

                              SizedBox(
                                width: 50,
                                height: 50,

                                child: OutlinedButton(
                                  onPressed: () {
                                    _showComingSoon(context, 'Share profile');
                                  },

                                  style: OutlinedButton.styleFrom(
                                    padding: EdgeInsets.zero,

                                    foregroundColor: Colors.white,

                                    side: const BorderSide(
                                      color: Colors.white24,
                                    ),

                                    shape: const CircleBorder(),
                                  ),

                                  child: const Icon(Icons.share_outlined),
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 24),

                          // ==========================================
                          // FOLLOW STATS
                          // ==========================================
                          Row(
                            children: [
                              _StatItem(
                                value: user.followers ?? 0,

                                label: 'Followers',

                                onTap: () {
                                  _showComingSoon(context, 'Followers');
                                },
                              ),

                              const SizedBox(width: 30),

                              _StatItem(
                                value: user.following ?? 0,

                                label: 'Following',

                                onTap: () {
                                  _showComingSoon(context, 'Following');
                                },
                              ),
                            ],
                          ),

                          if (bio != null) ...[
                            const SizedBox(height: 24),

                            Text(
                              bio,

                              style: const TextStyle(
                                color: Colors.white70,

                                fontSize: 15,

                                height: 1.5,
                              ),
                            ),
                          ],

                          if (website != null) ...[
                            const SizedBox(height: 16),

                            Row(
                              children: [
                                const Icon(
                                  Icons.link_rounded,

                                  color: Colors.white54,

                                  size: 19,
                                ),

                                const SizedBox(width: 8),

                                Expanded(
                                  child: Text(
                                    website,

                                    maxLines: 1,

                                    overflow: TextOverflow.ellipsis,

                                    style: const TextStyle(
                                      color: Color(0xFF69A7FF),

                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],

                          const SizedBox(height: 26),

                          const Divider(color: Colors.white12),

                          const SizedBox(height: 18),

                          // ==========================================
                          // PROFILE SECTIONS
                          // ==========================================
                          const Text(
                            'Your profile',

                            style: TextStyle(
                              color: Colors.white,

                              fontSize: 23,

                              fontWeight: FontWeight.w800,
                            ),
                          ),

                          const SizedBox(height: 14),

                          _ProfileMenuTile(
                            icon: Icons.music_note_rounded,

                            title: 'Your tracks',

                            subtitle: 'Tracks you have uploaded',

                            onTap: () {
                              _showComingSoon(context, 'Your tracks');
                            },
                          ),

                          _ProfileMenuTile(
                            icon: Icons.queue_music_rounded,

                            title: 'Playlists',

                            subtitle: 'Your public and private playlists',

                            onTap: () {
                              _showComingSoon(context, 'Profile playlists');
                            },
                          ),

                          _ProfileMenuTile(
                            icon: Icons.favorite_border_rounded,

                            title: 'Likes',

                            subtitle: 'Tracks you have liked',

                            onTap: () {
                              _showComingSoon(context, 'Profile likes');
                            },
                          ),

                          _ProfileMenuTile(
                            icon: Icons.history_rounded,

                            title: 'Listening history',

                            subtitle: 'Recently played tracks',

                            onTap: () {
                              _showComingSoon(context, 'Listening history');
                            },
                          ),

                          const SizedBox(height: 25),

                          // ==========================================
                          // ACCOUNT INFORMATION
                          // ==========================================
                          const Text(
                            'Account',

                            style: TextStyle(
                              color: Colors.white,

                              fontSize: 21,

                              fontWeight: FontWeight.w800,
                            ),
                          ),

                          const SizedBox(height: 12),

                          _InfoRow(
                            icon: Icons.mail_outline_rounded,

                            title: 'Email',

                            value: user.email ?? '-',
                          ),

                          if (user.type != null)
                            _InfoRow(
                              icon: Icons.account_circle_outlined,

                              title: 'Account type',

                              value: user.type!,
                            ),

                          if (user.role != null)
                            _InfoRow(
                              icon: Icons.badge_outlined,

                              title: 'Role',

                              value: user.role!,
                            ),

                          const SizedBox(height: 50),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            /*
             * Khi đang phát nhạc ở Home, vào Profile
             * thì MiniPlayer vẫn tồn tại.
             */
            const MiniPlayer(),
          ],
        ),
      ),
    );
  }

  // ============================================================
  // PROFILE MENU
  // ============================================================

  static void _showProfileMenu(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,

      backgroundColor: const Color(0xFF202020),

      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),

      builder: (sheetContext) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 22),

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
                  leading: const Icon(Icons.edit_outlined),

                  title: const Text('Edit profile'),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    _showComingSoon(context, 'Edit profile');
                  },
                ),

                ListTile(
                  leading: const Icon(Icons.share_outlined),

                  title: const Text('Share profile'),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    _showComingSoon(context, 'Share profile');
                  },
                ),

                ListTile(
                  leading: const Icon(
                    Icons.workspace_premium_outlined,

                    color: Color(0xFFFF5500),
                  ),

                  title: const Text(
                    'GET PRO',

                    style: TextStyle(
                      color: Color(0xFFFF5500),

                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  onTap: () {
                    Navigator.pop(sheetContext);

                    _showComingSoon(context, 'GET PRO');
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
  // COMING SOON
  // ============================================================

  static void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text('$feature sẽ được làm ở bước tiếp theo')),
      );
  }
}

// ============================================================
// PROFILE HEADER
// ============================================================

class _ProfileHeader extends StatelessWidget {
  final String? coverUrl;
  final String? avatarUrl;

  final String name;
  final String? username;

  final bool verified;

  const _ProfileHeader({
    required this.coverUrl,
    required this.avatarUrl,
    required this.name,
    required this.username,
    required this.verified,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // ========================================================
        // COVER
        // ========================================================
        _CoverImage(url: coverUrl),

        // ========================================================
        // DARK GRADIENT
        // ========================================================
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,

              end: Alignment.bottomCenter,

              colors: [
                Colors.transparent,

                Color(0x44000000),

                Color(0xEE101010),
              ],

              stops: [0.15, 0.58, 1.0],
            ),
          ),
        ),

        // ========================================================
        // USER
        // ========================================================
        Positioned(
          left: 20,
          right: 20,
          bottom: 18,

          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,

            children: [
              _ProfileAvatar(url: avatarUrl),

              const SizedBox(width: 16),

              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 5),

                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              name,

                              maxLines: 1,

                              overflow: TextOverflow.ellipsis,

                              style: const TextStyle(
                                color: Colors.white,

                                fontSize: 26,

                                fontWeight: FontWeight.w900,

                                shadows: [
                                  Shadow(color: Colors.black54, blurRadius: 8),
                                ],
                              ),
                            ),
                          ),

                          if (verified) ...[
                            const SizedBox(width: 6),

                            const Icon(
                              Icons.verified,

                              color: Color(0xFF69A7FF),

                              size: 20,
                            ),
                          ],
                        ],
                      ),

                      if (username != null) ...[
                        const SizedBox(height: 4),

                        Text(
                          '@$username',

                          maxLines: 1,

                          overflow: TextOverflow.ellipsis,

                          style: const TextStyle(
                            color: Colors.white70,

                            fontSize: 14,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ============================================================
// PROFILE AVATAR
// ============================================================

class _ProfileAvatar extends StatelessWidget {
  final String? url;

  const _ProfileAvatar({required this.url});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 104,
      height: 104,

      decoration: BoxDecoration(
        shape: BoxShape.circle,

        border: Border.all(color: Colors.white, width: 3),

        boxShadow: const [
          BoxShadow(
            color: Colors.black54,

            blurRadius: 16,

            offset: Offset(0, 5),
          ),
        ],
      ),

      child: ClipOval(
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
      color: const Color(0xFF292929),

      alignment: Alignment.center,

      child: const Icon(Icons.person_rounded, size: 58, color: Colors.white54),
    );
  }
}

// ============================================================
// COVER
// ============================================================

class _CoverImage extends StatelessWidget {
  final String? url;

  const _CoverImage({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.trim().isNotEmpty) {
      return Image.network(
        url!,

        fit: BoxFit.cover,

        errorBuilder: (_, __, ___) => _fallback(),
      );
    }

    return _fallback();
  }

  Widget _fallback() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,

          end: Alignment.bottomRight,

          colors: [Color(0xFFFF5500), Color(0xFF8D2A00), Color(0xFF151515)],
        ),
      ),
    );
  }
}

// ============================================================
// STAT
// ============================================================

class _StatItem extends StatelessWidget {
  final int value;
  final String label;

  final VoidCallback onTap;

  const _StatItem({
    required this.value,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

      borderRadius: BorderRadius.circular(6),

      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            Text(
              _formatCount(value),

              style: const TextStyle(
                color: Colors.white,

                fontSize: 18,

                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 2),

            Text(
              label,

              style: const TextStyle(color: Colors.white54, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }

  static String _formatCount(int value) {
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
// PROFILE MENU TILE
// ============================================================

class _ProfileMenuTile extends StatelessWidget {
  final IconData icon;

  final String title;
  final String subtitle;

  final VoidCallback onTap;

  const _ProfileMenuTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,

      onTap: onTap,

      leading: Container(
        width: 50,

        height: 50,

        decoration: BoxDecoration(
          color: const Color(0xFF242424),

          borderRadius: BorderRadius.circular(7),
        ),

        alignment: Alignment.center,

        child: Icon(icon, color: Colors.white, size: 25),
      ),

      title: Text(
        title,

        style: const TextStyle(
          color: Colors.white,

          fontWeight: FontWeight.w700,
        ),
      ),

      subtitle: Text(
        subtitle,

        style: const TextStyle(color: Colors.white54, fontSize: 12),
      ),

      trailing: const Icon(Icons.chevron_right_rounded, color: Colors.white38),
    );
  }
}

// ============================================================
// ACCOUNT INFO
// ============================================================

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String title;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.title,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),

      child: Row(
        children: [
          Icon(icon, color: Colors.white54, size: 21),

          const SizedBox(width: 14),

          SizedBox(
            width: 110,

            child: Text(
              title,

              style: const TextStyle(color: Colors.white54, fontSize: 14),
            ),
          ),

          Expanded(
            child: Text(
              value,

              textAlign: TextAlign.right,

              maxLines: 1,

              overflow: TextOverflow.ellipsis,

              style: const TextStyle(
                color: Colors.white,

                fontSize: 14,

                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
