import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  DioClient.initialize();

  runApp(const ProviderScope(child: SoundCloneApp()));
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
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0D0D0D),

        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFFFF5500),
          brightness: Brightness.dark,
        ),

        useMaterial3: true,
      ),
    );
  }
}
