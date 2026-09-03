import 'package:flutter/material.dart';

class SoundCloneFooter extends StatelessWidget {
  const SoundCloneFooter({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  final int currentIndex;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF0B0B0B),
        border: Border(top: BorderSide(color: Color(0xFF202020), width: 0.8)),
      ),

      child: SafeArea(
        top: false,

        child: NavigationBar(
          height: 64,

          selectedIndex: currentIndex,

          onDestinationSelected: onTap,

          backgroundColor: const Color(0xFF0B0B0B),

          surfaceTintColor: Colors.transparent,

          indicatorColor: Colors.transparent,

          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,

          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ),

            NavigationDestination(
              icon: Icon(Icons.article_outlined),
              selectedIcon: Icon(Icons.article_rounded),
              label: 'News',
            ),

            NavigationDestination(
              icon: Icon(Icons.library_music_outlined),
              selectedIcon: Icon(Icons.library_music_rounded),
              label: 'Library',
            ),

            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
