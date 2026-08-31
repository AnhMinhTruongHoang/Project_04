import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/auth_gate.dart';
import '../../features/auth/presentation/forgot_password_screen.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/reset_password_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/auth/providers/auth_provider.dart';
import '../../features/likes/presentation/like_screen.dart';
import '../../features/library/presentation/library_screen.dart';
import '../../features/library/presentation/playlists_screen.dart';

import '../../features/profile/presentation/profile_screen.dart';

import '../../shared/presentation/app_shell.dart';

// ================================================================
// APP ROUTER
// ================================================================

final GoRouter appRouter = GoRouter(
  initialLocation: '/home',

  routes: [
    // ============================================================
    // GUEST AUTH ROUTES
    // ============================================================

    // ------------------------------------------------------------
    // LOGIN
    // ------------------------------------------------------------
    GoRoute(
      path: '/login',
      builder: (context, state) {
        return const LoginScreen();
      },
    ),

    // ------------------------------------------------------------
    // SIGN UP
    // ------------------------------------------------------------
    GoRoute(
      path: '/auth/signup',
      builder: (context, state) {
        return const SignupScreen();
      },
    ),

    // ------------------------------------------------------------
    // FORGOT PASSWORD
    // ------------------------------------------------------------
    GoRoute(
      path: '/auth/forgot-password',
      builder: (context, state) {
        return const ForgotPasswordScreen();
      },
    ),

    // ------------------------------------------------------------
    // RESET PASSWORD
    //
    // Example:
    // /auth/reset-password?email=user@gmail.com
    // ------------------------------------------------------------
    GoRoute(
      path: '/auth/reset-password',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';

        return ResetPasswordScreen(initialEmail: email);
      },
    ),

    // ============================================================
    // AUTHENTICATED MOBILE SHELL
    // ============================================================
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return _AuthenticatedShell(navigationShell: navigationShell);
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
            GoRoute(
              path: '/like',
              builder: (context, state) {
                return const LikeScreen();
              },
            ),
            GoRoute(
              path: '/playlist',
              builder: (context, state) {
                return const PlaylistsScreen();
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
                return const LibraryScreen();
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
                return const ProfileScreen();
              },
            ),
          ],
        ),
      ],
    ),
  ],
);

// ================================================================
// AUTHENTICATED SHELL
// ================================================================

class _AuthenticatedShell extends ConsumerWidget {
  const _AuthenticatedShell({required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      // ----------------------------------------------------------
      // LOADING
      // ----------------------------------------------------------
      loading: () {
        return const SplashScreen();
      },

      // ----------------------------------------------------------
      // ERROR
      // ----------------------------------------------------------
      error: (error, stackTrace) {
        return const LoginScreen();
      },

      // ----------------------------------------------------------
      // AUTH STATE
      // ----------------------------------------------------------
      data: (user) {
        if (user == null) {
          return const LoginScreen();
        }

        return AppShell(navigationShell: navigationShell, user: user);
      },
    );
  }
}

// ================================================================
// TEMPORARY PLACEHOLDER
//
// Chỉ còn sử dụng cho:
// - Search
// - Library
//
// Profile đã có ProfileScreen riêng.
// ================================================================

class _PlaceholderScreen extends StatelessWidget {
  const _PlaceholderScreen({required this.title, required this.icon});

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
            Icon(icon, size: 42, color: const Color(0xFFFF5500)),

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
