import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/models/user_model.dart';
import '../../features/player/presentation/mini_player.dart';
import 'widgets/soundclone_footer.dart';
import 'widgets/soundclone_header.dart';

class AppShell extends ConsumerWidget {
  const AppShell({
    super.key,
    required this.navigationShell,
    required this.currentLocation,
    required this.user,
  });

  final StatefulNavigationShell navigationShell;
  final String currentLocation;
  final UserModel user;

  void _changeTab(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final keyboardOpen = MediaQuery.viewInsetsOf(context).bottom > 0;
    final hideShellChrome =
        currentLocation == '/search' || currentLocation.startsWith('/news/');

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),

      // HEADER DÙNG CHUNG
      appBar: hideShellChrome
          ? null
          : SoundCloneHeader(
              user: user,

              onSearch: () {
                context.push('/search');
              },

              onNotification: () {
                // Sau này làm màn Notifications thì router ở đây.
              },

              onProfile: () {
                _changeTab(3);
              },
            ),

      // NỘI DUNG CỦA TỪNG TAB
      body: Stack(
        children: [
          Positioned.fill(
            child: navigationShell,
          ),
          if (!hideShellChrome && !keyboardOpen)
            const Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: MiniPlayer(),
            ),
        ],
      ),

      // FOOTER DÙNG CHUNG
      bottomNavigationBar: hideShellChrome
          ? null
          : SoundCloneFooter(
              currentIndex: navigationShell.currentIndex,
              onTap: _changeTab,
            ),
    );
  }
}
