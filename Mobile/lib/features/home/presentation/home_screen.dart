import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/models/user_model.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    required this.user,
  });

  final UserModel user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ColoredBox(
      color: const Color(0xFF0D0D0D),

      child: SafeArea(
        top: false,

        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),

            child: Column(
              mainAxisSize: MainAxisSize.min,

              children: [
                const Icon(
                  Icons.cloud_rounded,
                  color: Color(0xFFFF5500),
                  size: 52,
                ),

                const SizedBox(height: 16),

                Text(
                  'Welcome, ${user.name}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w800,
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  user.email,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF999999),
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 24),

                const Text(
                  'SoundClone Home',
                  style: TextStyle(
                    color: Color(0xFFFF5500),
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}