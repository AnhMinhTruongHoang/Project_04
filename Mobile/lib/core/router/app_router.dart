import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/auth_gate.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/auth/providers/auth_provider.dart';

import '../../shared/presentation/app_shell.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/home',

  routes: [
    // ============================================================
    // AUTH ROUTES
    // ============================================================

    GoRoute(
      path: '/login',
      builder: (context, state) {
        return const LoginScreen();
      },
    ),

    GoRoute(
      path: '/auth/signup',
      builder: (context, state) {
        return const SignupScreen();
      },
    ),

    // ============================================================
    // AUTHENTICATED MOBILE SHELL
    // ============================================================

    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return _AuthenticatedShell(
          navigationShell: navigationShell,
        );
      },

      branches: [
        // ========================================================
        // HOME
        // ========================================================

        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) {
                return const AuthGate();
              },
            ),
          ],
        ),

        // ========================================================
        // SEARCH
        // ========================================================

        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/search',
              builder: (context, state) {
                return const _PlaceholderScreen(
                  title: 'Search',
                  icon: Icons.search_rounded,
                );
              },
            ),
          ],
        ),

        // ========================================================
        // LIBRARY
        // ========================================================

        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/library',
              builder: (context, state) {
                return const _PlaceholderScreen(
                  title: 'Library',
                  icon: Icons.library_music_rounded,
                );
              },
            ),
          ],
        ),

        // ========================================================
        // PROFILE
        // ========================================================

        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) {
                return const _PlaceholderScreen(
                  title: 'Profile',
                  icon: Icons.person_rounded,
                );
              },
            ),
          ],
        ),
      ],
    ),
  ],
);

// ================================================================
// AUTH SHELL
// ================================================================

class _AuthenticatedShell extends ConsumerWidget {
  const _AuthenticatedShell({
    required this.navigationShell,
  });

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      loading: () {
        return const SplashScreen();
      },

      error: (error, stackTrace) {
        return const LoginScreen();
      },

      data: (user) {
        if (user == null) {
          return const LoginScreen();
        }

        return AppShell(
          navigationShell: navigationShell,
          user: user,
        );
      },
    );
  }
}

// ================================================================
// TEMP SCREEN
//
// Sau này Search / Library / Profile làm thật thì xóa class này.
// ================================================================

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen({
    required this.title,
    required this.icon,
  });

  final String title;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFF0D0D0D),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 42,
              color: const Color(0xFFFF5500),
            ),

            const SizedBox(height: 12),

            Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
      ),
    );
  }
}