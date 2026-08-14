import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  Future<void> _logout(BuildContext context) async {
    final authProvider = context.read<AuthProvider>();

    await authProvider.logout();

    if (!context.mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(
        builder: (_) => const LoginScreen(),
      ),
          (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SoundApp'),
        actions: [
          IconButton(
            tooltip: 'Đăng xuất',
            icon: const Icon(Icons.logout),
            onPressed: () => _showLogoutDialog(context),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final user = authProvider.currentUser;

          if (user == null) {
            return const Center(
              child: Text(
                'Không tìm thấy thông tin người dùng',
                style: TextStyle(fontSize: 16),
              ),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 30),

                // Avatar
                CircleAvatar(
                  radius: 45,
                  backgroundColor: const Color(0xFFFF5500),
                  backgroundImage: user.avatarUrl != null &&
                      user.avatarUrl!.isNotEmpty
                      ? NetworkImage(user.avatarUrl!)
                      : null,
                  child: user.avatarUrl == null ||
                      user.avatarUrl!.isEmpty
                      ? const Icon(
                    Icons.person,
                    size: 45,
                    color: Colors.white,
                  )
                      : null,
                ),

                const SizedBox(height: 20),

                Text(
                  user.name?.isNotEmpty == true
                      ? user.name!
                      : user.email,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  user.email,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 15,
                  ),
                ),

                const SizedBox(height: 30),

                _InfoRow(
                  icon: Icons.person_outline,
                  label: 'Username',
                  value: user.username ?? 'Chưa cập nhật',
                ),

                _InfoRow(
                  icon: Icons.verified_user_outlined,
                  label: 'Role',
                  value: user.role ?? 'USER',
                ),

                _InfoRow(
                  icon: Icons.people_outline,
                  label: 'Followers',
                  value: user.followers.toString(),
                ),

                _InfoRow(
                  icon: Icons.person_add_alt_1_outlined,
                  label: 'Following',
                  value: user.following.toString(),
                ),

                const SizedBox(height: 30),

                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton.icon(
                    onPressed: () => _showLogoutDialog(context),
                    icon: const Icon(Icons.logout),
                    label: const Text(
                      'Đăng xuất',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Đăng xuất'),
          content: const Text(
            'Bạn có chắc chắn muốn đăng xuất không?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
              },
              child: const Text('Hủy'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop();
                _logout(context);
              },
              child: const Text('Đăng xuất'),
            ),
          ],
        );
      },
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(
            icon,
            color: const Color(0xFFFF5500),
          ),
          const SizedBox(width: 14),
          Text(
            '$label: ',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
            ),
          ),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }
}