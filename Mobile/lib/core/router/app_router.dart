import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) {
        return const Scaffold(
          body: Center(
            child: Text(
              'SoundClone Home',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
            ),
          ),
        );
      },
    ),

    GoRoute(
      path: '/search',
      builder: (context, state) {
        return const Scaffold(body: Center(child: Text('Search')));
      },
    ),

    GoRoute(
      path: '/library',
      builder: (context, state) {
        return const Scaffold(body: Center(child: Text('Library')));
      },
    ),

    GoRoute(
      path: '/profile',
      builder: (context, state) {
        return const Scaffold(body: Center(child: Text('Profile')));
      },
    ),
  ],
);
