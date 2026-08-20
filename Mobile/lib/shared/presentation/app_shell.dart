import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/models/user_model.dart';
import 'widgets/soundclone_footer.dart';
import 'widgets/soundclone_header.dart';

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.navigationShell,
    required this.user,
  });

  final StatefulNavigationShell navigationShell;
  final UserModel user;

  void _changeTab(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),

      // HEADER DÙNG CHUNG
      appBar: SoundCloneHeader(
        user: user,

        onSearch: () {
          _changeTab(1);
        },

        onNotification: () {
          // Sau này làm màn Notifications thì router ở đây.
        },

        onProfile: () {
          _changeTab(3);
        },
      ),

      // NỘI DUNG CỦA TỪNG TAB
      body: navigationShell,

      // FOOTER DÙNG CHUNG
      bottomNavigationBar: SoundCloneFooter(
        currentIndex: navigationShell.currentIndex,
        onTap: _changeTab,
      ),
    );
  }
}