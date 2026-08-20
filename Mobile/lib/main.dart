import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  DioClient.initialize();

  runApp(
    const ProviderScope(
      child: SoundCloneApp(),
    ),
  );
}

class SoundCloneApp extends StatelessWidget {
  const SoundCloneApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,

      title: 'SoundClone',

      routerConfig: appRouter,

      theme: ThemeData(
        useMaterial3: true,

        brightness: Brightness.dark,

        scaffoldBackgroundColor: const Color(0xFF0D0D0D),

        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF5500),
          brightness: Brightness.dark,
          surface: const Color(0xFF121212),
        ),

        // ========================================================
        // APP BAR
        // ========================================================

        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0B0B0B),
          foregroundColor: Colors.white,
          elevation: 0,
          scrolledUnderElevation: 0,
          surfaceTintColor: Colors.transparent,
        ),

        // ========================================================
        // NAVIGATION FOOTER
        // ========================================================

        navigationBarTheme: NavigationBarThemeData(
          backgroundColor: const Color(0xFF0B0B0B),

          indicatorColor: Colors.transparent,

          elevation: 0,

          iconTheme: WidgetStateProperty.resolveWith(
                (states) {
              if (states.contains(WidgetState.selected)) {
                return const IconThemeData(
                  color: Color(0xFFFF5500),
                  size: 27,
                );
              }

              return const IconThemeData(
                color: Color(0xFF8B8B8B),
                size: 25,
              );
            },
          ),

          labelTextStyle: WidgetStateProperty.resolveWith(
                (states) {
              if (states.contains(WidgetState.selected)) {
                return const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                );
              }

              return const TextStyle(
                color: Color(0xFF888888),
                fontSize: 11,
                fontWeight: FontWeight.w600,
              );
            },
          ),
        ),

        dividerColor: const Color(0xFF202020),

        splashColor: Colors.white.withValues(
          alpha: 0.05,
        ),

        highlightColor: Colors.transparent,
      ),
    );
  }
}