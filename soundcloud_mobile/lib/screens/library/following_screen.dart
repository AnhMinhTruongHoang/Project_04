import 'package:flutter/material.dart';

import '../../core/utils/app_toast.dart';
import '../../models/following_user_model.dart';
import '../../services/follow_service.dart';
import '../../widgets/mini_player.dart';

class FollowingScreen extends StatefulWidget {
  const FollowingScreen({super.key});

  @override
  State<FollowingScreen> createState() => _FollowingScreenState();
}

class _FollowingScreenState extends State<FollowingScreen> {
  final FollowService _followService = FollowService();

  List<FollowingUserModel> _users = const [];

  final Set<String> _busyUserIds = <String>{};

  bool _isLoading = true;

  String? _errorMessage;

  @override
  void initState() {
    super.initState();

    _loadFollowing();
  }

  // ============================================================
  // LOAD
  // ============================================================

  Future<void> _loadFollowing() async {
    if (!mounted) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final users = await _followService.getMyFollowing();

      if (!mounted) {
        return;
      }

      setState(() {
        _users = users;
      });
    } catch (e) {
      if (!mounted) {
        return;
      }

      setState(() {
        _errorMessage = e.toString();
      });

      AppToast.error(context, 'Không thể tải danh sách Following');
    } finally {
      if (!mounted) {
        return;
      }

      setState(() {
        _isLoading = false;
      });
    }
  }

  // ============================================================
  // UNFOLLOW
  // ============================================================

  Future<void> _unfollow(FollowingUserModel user) async {
    if (_busyUserIds.contains(user.id)) {
      return;
    }

    setState(() {
      _busyUserIds.add(user.id);
    });

    try {
      final status = await _followService.unfollow(user.id);

      if (!mounted) {
        return;
      }

      if (!status.following) {
        setState(() {
          _users = _users.where((item) => item.id != user.id).toList();
        });

        AppToast.success(context, 'Đã unfollow ${user.name}');
      } else {
        AppToast.error(context, 'Không thể unfollow ${user.name}');
      }
    } catch (e) {
      if (!mounted) {
        return;
      }

      AppToast.error(context, 'Không thể unfollow ${user.name}');
    } finally {
      if (!mounted) {
        return;
      }

      setState(() {
        _busyUserIds.remove(user.id);
      });
    }
  }

  // ============================================================
  // USER TAP
  // ============================================================

  void _openUser(FollowingUserModel user) {
    /*
     * Hiện project mới có ProfileScreen
     * cho user đang đăng nhập.
     *
     * Khi làm PublicProfileScreen,
     * thay AppToast bằng Navigator.push().
     */
    AppToast.info(
      context,
      'Profile của ${user.name} sẽ được làm ở bước tiếp theo',
    );
  }

  // ============================================================
  // BUILD
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      appBar: AppBar(
        backgroundColor: const Color(0xFF101010),

        elevation: 0,

        title: const Text(
          'Following',

          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
        ),

        actions: [
          IconButton(
            tooltip: 'Refresh',

            onPressed: _isLoading ? null : _loadFollowing,

            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),

      body: SafeArea(
        child: Column(
          children: [
            Expanded(child: _buildBody()),

            const MiniPlayer(),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _users.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFFF5500)),
      );
    }

    if (_errorMessage != null && _users.isEmpty) {
      return _FollowingError(onRetry: _loadFollowing);
    }

    if (_users.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadFollowing,

        color: const Color(0xFFFF5500),

        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),

          children: const [SizedBox(height: 120), _EmptyFollowing()],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadFollowing,

      color: const Color(0xFFFF5500),

      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),

        padding: const EdgeInsets.fromLTRB(18, 10, 18, 30),

        itemCount: _users.length,

        separatorBuilder: (_, __) =>
            const Divider(height: 1, color: Colors.white10),

        itemBuilder: (context, index) {
          final user = _users[index];

          return _FollowingTile(
            user: user,

            isLoading: _busyUserIds.contains(user.id),

            onTap: () => _openUser(user),

            onUnfollow: () => _unfollow(user),
          );
        },
      ),
    );
  }
}

// ============================================================
// FOLLOWING TILE
// ============================================================

class _FollowingTile extends StatelessWidget {
  final FollowingUserModel user;

  final bool isLoading;

  final VoidCallback onTap;

  final VoidCallback onUnfollow;

  const _FollowingTile({
    required this.user,
    required this.isLoading,
    required this.onTap,
    required this.onUnfollow,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,

      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 14),

        child: Row(
          children: [
            _UserAvatar(url: user.avatarUrl),

            const SizedBox(width: 14),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          user.name,

                          maxLines: 1,

                          overflow: TextOverflow.ellipsis,

                          style: const TextStyle(
                            color: Colors.white,

                            fontSize: 16,

                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),

                      if (user.verified) ...[
                        const SizedBox(width: 5),

                        const Icon(
                          Icons.verified_rounded,

                          color: Color(0xFF69A7FF),

                          size: 17,
                        ),
                      ],
                    ],
                  ),

                  if (user.displayUsername.isNotEmpty) ...[
                    const SizedBox(height: 3),

                    Text(
                      user.displayUsername,

                      maxLines: 1,

                      overflow: TextOverflow.ellipsis,

                      style: const TextStyle(
                        color: Colors.white54,

                        fontSize: 13,
                      ),
                    ),
                  ],

                  const SizedBox(height: 6),

                  Row(
                    children: [
                      Text(
                        '${_formatCount(user.followers)} followers',

                        style: const TextStyle(
                          color: Colors.white38,

                          fontSize: 12,
                        ),
                      ),

                      if (user.location.isNotEmpty) ...[
                        const Text(
                          '  •  ',

                          style: TextStyle(color: Colors.white24),
                        ),

                        Flexible(
                          child: Text(
                            user.location,

                            maxLines: 1,

                            overflow: TextOverflow.ellipsis,

                            style: const TextStyle(
                              color: Colors.white38,

                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: 12),

            SizedBox(
              height: 38,

              child: OutlinedButton(
                onPressed: isLoading ? null : onUnfollow,

                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,

                  side: const BorderSide(color: Colors.white38),

                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),

                  padding: const EdgeInsets.symmetric(horizontal: 16),
                ),

                child: isLoading
                    ? const SizedBox(
                        width: 16,

                        height: 16,

                        child: CircularProgressIndicator(
                          strokeWidth: 2,

                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Following',

                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
              ),
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
// AVATAR
// ============================================================

class _UserAvatar extends StatelessWidget {
  final String? url;

  const _UserAvatar({required this.url});

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: SizedBox(
        width: 66,

        height: 66,

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

      child: const Icon(Icons.person_rounded, color: Colors.white54, size: 34),
    );
  }
}

// ============================================================
// EMPTY
// ============================================================

class _EmptyFollowing extends StatelessWidget {
  const _EmptyFollowing();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 30),

      child: Column(
        children: [
          Icon(Icons.person_add_alt_1_rounded, color: Colors.white24, size: 70),

          SizedBox(height: 18),

          Text(
            'You are not following anyone yet',

            textAlign: TextAlign.center,

            style: TextStyle(
              color: Colors.white,

              fontSize: 20,

              fontWeight: FontWeight.w800,
            ),
          ),

          SizedBox(height: 8),

          Text(
            'Artists and users you follow will appear here.',

            textAlign: TextAlign.center,

            style: TextStyle(color: Colors.white54, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// ERROR
// ============================================================

class _FollowingError extends StatelessWidget {
  final VoidCallback onRetry;

  const _FollowingError({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,

        children: [
          const Icon(
            Icons.error_outline_rounded,

            size: 50,

            color: Colors.redAccent,
          ),

          const SizedBox(height: 12),

          const Text(
            'Cannot load Following',

            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
          ),

          const SizedBox(height: 15),

          FilledButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
