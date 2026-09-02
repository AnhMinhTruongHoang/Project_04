import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../home/models/home_track.dart';
import '../../player/providers/player_provider.dart';
import '../models/listening_history_item.dart';
import '../providers/library_provider.dart';
import 'following_screen.dart';
import 'liked_tracks_screen.dart';
import 'listening_history_screen.dart';
import 'placeholder_library_screen.dart';
import 'playlists_screen.dart';
import 'your_uploads_screen.dart';

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  static const Color background = Color(0xFF0D0D0D);
  static const Color orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final history = ref.watch(listeningHistoryProvider);
    final liked = ref.watch(likedTracksProvider);
    final playlists = ref.watch(playlistsProvider);
    final albums = ref.watch(albumsProvider);
    final following = ref.watch(followingProvider);
    final uploads = ref.watch(myUploadsProvider);

    return ColoredBox(
      color: background,
      child: SafeArea(
        top: false,
        bottom: false,
        child: RefreshIndicator(
          color: orange,
          backgroundColor: const Color(0xFF202020),
          onRefresh: () async {
            ref.invalidate(likedTracksProvider);
            ref.invalidate(playlistsProvider);
            ref.invalidate(albumsProvider);
            ref.invalidate(listeningHistoryProvider);
            ref.invalidate(myUploadsProvider);
            await Future.wait([
              ref.read(likedTracksProvider.future),
              ref.read(playlistsProvider.future),
              ref.read(listeningHistoryProvider.future),
              ref.read(myUploadsProvider.future),
            ]);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(
              parent: BouncingScrollPhysics(),
            ),
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 134),
            children: [
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Library',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const PlaceholderLibraryScreen(
                            title: 'Upgrade',
                            message:
                                'Subscription features can be connected to the backend plans API later.',
                          ),
                        ),
                      );
                    },
                    child: const Text(
                      'GET PRO',
                      style: TextStyle(
                        color: orange,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                  IconButton(
                    tooltip: 'Cast',
                    onPressed: () {},
                    icon: const Icon(Icons.cast_rounded),
                  ),
                  IconButton(
                    tooltip: 'Settings',
                    onPressed: () {},
                    icon: const Icon(Icons.settings_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 34),
              _LibraryNavItem(
                title: 'Your likes',
                subtitle: liked.maybeWhen(
                  data: (items) => '${items.length} tracks',
                  orElse: () => null,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const LikedTracksScreen(),
                    ),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Playlists',
                subtitle: playlists.maybeWhen(
                  data: (items) => '${items.length} playlists',
                  orElse: () => null,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const PlaylistsScreen()),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Albums',
                subtitle: albums.maybeWhen(
                  data: (items) => '${items.length} albums',
                  orElse: () => null,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const PlaceholderLibraryScreen(
                        title: 'Albums',
                        message:
                            'Albums are read from playlists marked as albums. Upload and album management can be added from Artist Studio.',
                      ),
                    ),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Following',
                subtitle: following.maybeWhen(
                  data: (items) => '${items.length} artists',
                  orElse: () => null,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(builder: (_) => const FollowingScreen()),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Stations',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const PlaceholderLibraryScreen(
                        title: 'Stations',
                        message:
                            'Station-style recommendations can reuse hidden gems and because-you-listened APIs.',
                      ),
                    ),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Your insights',
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const PlaceholderLibraryScreen(
                        title: 'Your insights',
                        message:
                            'Insights can be connected to Artist Studio stats for artist accounts.',
                      ),
                    ),
                  );
                },
              ),
              _LibraryNavItem(
                title: 'Your uploads',
                subtitle: uploads.maybeWhen(
                  data: (items) => '${items.length} tracks',
                  orElse: () => null,
                ),
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const YourUploadsScreen(),
                    ),
                  );
                },
              ),
              const SizedBox(height: 30),
              _RecentlyPlayedSection(history: history),
              const SizedBox(height: 30),
              Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Listening history',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 23,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF2B2B2B),
                      foregroundColor: Colors.white,
                    ),
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => const ListeningHistoryScreen(),
                        ),
                      );
                    },
                    child: const Text('See All'),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              history.when(
                loading: () => const Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: Center(
                    child: CircularProgressIndicator(color: orange),
                  ),
                ),
                error: (_, _) => const _LibraryHint(
                  text: 'Could not load listening history.',
                ),
                data: (items) {
                  if (items.isEmpty) {
                    return const _LibraryHint(
                      text: 'No listening history yet.',
                    );
                  }

                  final queue = items.map((item) => item.track).toList();

                  return Column(
                    children: [
                      for (final item in items.take(4))
                        _HistoryTile(item: item, queue: queue),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentlyPlayedSection extends StatelessWidget {
  const _RecentlyPlayedSection({required this.history});

  final AsyncValue<List<ListeningHistoryItem>> history;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Recently played',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 23,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2B2B2B),
                foregroundColor: Colors.white,
              ),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ListeningHistoryScreen(),
                  ),
                );
              },
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 14),
        history.when(
          loading: () {
            return const SizedBox(
              height: 176,
              child: Center(
                child: CircularProgressIndicator(color: LibraryScreen.orange),
              ),
            );
          },
          error: (_, _) {
            return const _LibraryHint(
              text: 'Could not load recently played tracks.',
            );
          },
          data: (items) {
            if (items.isEmpty) {
              return const _LibraryHint(
                text: 'Find all your recently played content here.',
              );
            }

            final recentItems = items.take(8).toList();
            final queue = items.map((item) => item.track).toList();

            return SizedBox(
              height: 176,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                itemCount: recentItems.length,
                separatorBuilder: (_, _) => const SizedBox(width: 16),
                itemBuilder: (context, index) {
                  return _RecentCard(item: recentItems[index], queue: queue);
                },
              ),
            );
          },
        ),
      ],
    );
  }
}

class _RecentCard extends ConsumerWidget {
  const _RecentCard({required this.item, required this.queue});

  final ListeningHistoryItem item;
  final List<HomeTrack> queue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final track = item.track;

    return InkWell(
      borderRadius: BorderRadius.circular(8),
      hoverColor: const Color(0x1AFF5500),
      splashColor: const Color(0x33FF5500),
      mouseCursor: SystemMouseCursors.click,
      onTap: () {
        ref.read(playerProvider.notifier).playTrack(track, queue: queue);
      },
      child: SizedBox(
        width: 136,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _Artwork(url: track.resolvedImageUrl, size: 124),
            const SizedBox(height: 8),
            Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              track.artistName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFFAAAAAA), fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _LibraryNavItem extends StatelessWidget {
  const _LibraryNavItem({
    required this.title,
    required this.onTap,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      hoverColor: const Color(0x1AFF5500),
      splashColor: const Color(0x33FF5500),
      mouseCursor: SystemMouseCursors.click,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 18),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 23,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle!,
                      style: const TextStyle(
                        color: Color(0xFF888888),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: Colors.white,
              size: 40,
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryTile extends ConsumerWidget {
  const _HistoryTile({required this.item, required this.queue});

  final ListeningHistoryItem item;
  final List<HomeTrack> queue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final track = item.track;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      hoverColor: const Color(0x1AFF5500),
      mouseCursor: SystemMouseCursors.click,
      leading: _Artwork(url: track.resolvedImageUrl),
      title: Text(
        track.title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
        ),
      ),
      subtitle: Text(
        item.completed ? track.artistName : '${track.artistName}  •  Paused',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: IconButton(
        tooltip: 'More',
        onPressed: () {},
        icon: const Icon(Icons.more_vert_rounded),
      ),
      onTap: () {
        ref.read(playerProvider.notifier).playTrack(track, queue: queue);
      },
    );
  }
}

class _Artwork extends StatelessWidget {
  const _Artwork({required this.url, this.size = 58});

  final String? url;
  final double size;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: size,
        height: size,
        color: const Color(0xFF222222),
        child: url == null
            ? const Icon(Icons.music_note_rounded, color: Color(0xFF777777))
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.music_note_rounded,
                    color: Color(0xFF777777),
                  );
                },
              ),
      ),
    );
  }
}

class _LibraryHint extends StatelessWidget {
  const _LibraryHint({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 18),
      child: Text(
        text,
        style: const TextStyle(color: Color(0xFF888888), fontSize: 14),
      ),
    );
  }
}
