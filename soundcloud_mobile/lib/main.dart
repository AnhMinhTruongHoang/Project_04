import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soundcloud_mobile/providers/playlist_provider.dart';

import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/home_provider.dart';
import 'screens/splash/splash_screen.dart';
import 'providers/player_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  ApiClient.instance.initialize();

  runApp(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(
            create: (_) =>
                AuthProvider(),
          ),

          ChangeNotifierProvider(
            create: (_) =>
                HomeProvider(),
          ),

          ChangeNotifierProvider(
            create: (_) =>
                PlayerProvider(),
          ),

          ChangeNotifierProvider(
            create: (_) =>
                PlaylistProvider(),
          ),
        ],
        child: const SoundApp(),
      )
  );
}

class SoundApp extends StatelessWidget {
  const SoundApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'SoundApp',
      theme: AppTheme.darkTheme,
      home: const SplashScreen(),
    );
  }
}