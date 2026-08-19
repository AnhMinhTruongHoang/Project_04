import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/network/dio_client.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

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
      theme: AppTheme.dark,
    );
  }
}
