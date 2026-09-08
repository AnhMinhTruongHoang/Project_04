import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/presentation/home_screen.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';
import 'splash_screen.dart';

class AuthGate extends ConsumerWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return authState.when(
      loading: () => const SplashScreen(),
      error: (_, _) => const LoginScreen(),
      data: (user) {
        if (user == null) {
          return const LoginScreen();
        }

        return HomeScreen(user: user);
      },
    );
  }
}
