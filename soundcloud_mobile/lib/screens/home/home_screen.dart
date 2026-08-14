import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/track_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/home_provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedGenreIndex = 0;

  final List<String> _fallbackGenres = const [
    'INDIE',
    'KPOP',
    'RAP',
    'EDM',
    'ROCK',
    'RNB',
    'LOFI',
  ];

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      context.read<HomeProvider>().loadHome();
    });
  }

  void _showComingSoon(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$title sẽ được làm ở bước tiếp theo'),
      ),
    );
  }

  void _onTrackTap(TrackModel track) {
    _showComingSoon('Player - ${track.title}');
  }

  Future<void> _refresh() async {
    await context.read<HomeProvider>().loadHome();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;

    final userName =
    user?.name?.trim().isNotEmpty == true ? user!.name! : 'Bạn';

    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      body: SafeArea(
        child: Consumer<HomeProvider>(
          builder: (context, provider, _) {
            if (provider.isLoading && !provider.hasContent) {
              return const Center(
                child: CircularProgressIndicator(
                  color: Color(0xFFFF5500),
                ),
              );
            }

            final moreOfWhatYouLike =
            provider.becauseYouListened.isNotEmpty
                ? provider.becauseYouListened
                : provider.trendingTracks;

            final mixTracks = provider.trendingTracks;

            final genres = provider.categories.isNotEmpty
                ? provider.categories
                .map((e) => e.name.toUpperCase())
                .take(10)
                .toList()
                : _fallbackGenres;

            return RefreshIndicator(
              color: const Color(0xFFFF5500),
              onRefresh: _refresh,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(
                    child: _TopHeader(
                      onProTap: () => _showComingSoon('Upgrade'),
                      onCastTap: () => _showComingSoon('Cast'),
                      onUploadTap: () => _showComingSoon('Upload'),
                      onMessageTap: () => _showComingSoon('Messages'),
                      onNotificationTap: () =>
                          _showComingSoon('Notifications'),
                    ),
                  ),

                  if (provider.errorMessage != null)
                    SliverToBoxAdapter(
                      child: _ErrorBanner(
                        message: provider.errorMessage!,
                      ),
                    ),

                  if (moreOfWhatYouLike.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _SectionTitle(
                        title: 'More of what you like',
                        onSeeAll: () =>
                            _showComingSoon('More of what you like'),
                      ),
                    ),

                  if (moreOfWhatYouLike.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _LargeTrackCarousel(
                        tracks: moreOfWhatYouLike.take(10).toList(),
                        onTap: _onTrackTap,
                      ),
                    ),

                  if (mixTracks.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(
                          20,
                          30,
                          20,
                          12,
                        ),
                        child: Text(
                          'Mixed for $userName',
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.7,
                          ),
                        ),
                      ),
                    ),

                  if (mixTracks.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _MixCarousel(
                        tracks: mixTracks,
                        onTap: _onTrackTap,
                      ),
                    ),

                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(
                        20,
                        32,
                        20,
                        14,
                      ),
                      child: Text(
                        'Trending by genre',
                        style: const TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.7,
                        ),
                      ),
                    ),
                  ),

                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 48,
                      child: ListView.separated(
                        padding:
                        const EdgeInsets.symmetric(horizontal: 20),
                        scrollDirection: Axis.horizontal,
                        itemCount: genres.length,
                        separatorBuilder: (_, __) =>
                        const SizedBox(width: 12),
                        itemBuilder: (context, index) {
                          final selected =
                              index == _selectedGenreIndex;

                          return _GenreChip(
                            title: genres[index],
                            selected: selected,
                            onTap: () {
                              setState(() {
                                _selectedGenreIndex = index;
                              });
                            },
                          );
                        },
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(
                    child: SizedBox(height: 18),
                  ),

                  if (provider.trendingTracks.isNotEmpty)
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                            (context, index) {
                          final track =
                          provider.trendingTracks[index];

                          return _TrendingTrackTile(
                            track: track,
                            onTap: () => _onTrackTap(track),
                            onMoreTap: () =>
                                _showComingSoon('Track options'),
                          );
                        },
                        childCount:
                        provider.trendingTracks.length > 10
                            ? 10
                            : provider.trendingTracks.length,
                      ),
                    ),

                  if (provider.trendingTracks.isEmpty &&
                      !provider.isLoading)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(30),
                        child: Center(
                          child: Text(
                            'Chưa có bài hát',
                            style: TextStyle(
                              color: Colors.white54,
                            ),
                          ),
                        ),
                      ),
                    ),

                  const SliverToBoxAdapter(
                    child: SizedBox(height: 40),
                  ),
                ],
              ),
            );
          },
        ),
      ),

      bottomNavigationBar: _SoundCloudBottomNavigation(
        onTap: (index) {
          if (index == 0) return;

          const pages = [
            'Home',
            'Feed',
            'Search',
            'Library',
            'Upgrade',
          ];

          _showComingSoon(pages[index]);
        },
      ),
    );
  }
}

// ============================================================
// TOP HEADER
// ============================================================

class _TopHeader extends StatelessWidget {
  final VoidCallback onProTap;
  final VoidCallback onCastTap;
  final VoidCallback onUploadTap;
  final VoidCallback onMessageTap;
  final VoidCallback onNotificationTap;

  const _TopHeader({
    required this.onProTap,
    required this.onCastTap,
    required this.onUploadTap,
    required this.onMessageTap,
    required this.onNotificationTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 12, 20),
      child: Row(
        children: [
          const Expanded(
            child: Text(
              'Home',
              style: TextStyle(
                fontSize: 32,
                color: Colors.white,
                fontWeight: FontWeight.w800,
                letterSpacing: -1,
              ),
            ),
          ),

          TextButton(
            onPressed: onProTap,
            child: const Text(
              'GET PRO',
              style: TextStyle(
                color: Color(0xFFFF5500),
                fontWeight: FontWeight.w800,
                letterSpacing: 1,
              ),
            ),
          ),

          _HeaderButton(
            icon: Icons.cast_rounded,
            onTap: onCastTap,
          ),

          _HeaderButton(
            icon: Icons.upload_rounded,
            onTap: onUploadTap,
          ),

          _HeaderButton(
            icon: Icons.mail_outline_rounded,
            onTap: onMessageTap,
          ),

          _HeaderButton(
            icon: Icons.notifications_none_rounded,
            onTap: onNotificationTap,
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _HeaderButton({
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: Icon(
        icon,
        color: Colors.white70,
        size: 27,
      ),
    );
  }
}

// ============================================================
// SECTION TITLE
// ============================================================

class _SectionTitle extends StatelessWidget {
  final String title;
  final VoidCallback onSeeAll;

  const _SectionTitle({
    required this.title,
    required this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.7,
              ),
            ),
          ),

          TextButton(
            onPressed: onSeeAll,
            style: TextButton.styleFrom(
              backgroundColor: const Color(0xFF292929),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 12,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'See All',
              style: TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// LARGE TRACK CAROUSEL
// ============================================================

class _LargeTrackCarousel extends StatelessWidget {
  final List<TrackModel> tracks;
  final void Function(TrackModel) onTap;

  const _LargeTrackCarousel({
    required this.tracks,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 315,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: tracks.length,
        separatorBuilder: (_, __) =>
        const SizedBox(width: 18),
        itemBuilder: (context, index) {
          final track = tracks[index];

          return _LargeTrackCard(
            track: track,
            onTap: () => onTap(track),
          );
        },
      ),
    );
  }
}

class _LargeTrackCard extends StatelessWidget {
  final TrackModel track;
  final VoidCallback onTap;

  const _LargeTrackCard({
    required this.track,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 1,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(2),
                child: _NetworkArtwork(
                  url: track.imgUrl,
                ),
              ),
            ),

            const SizedBox(height: 10),

            Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),

            const SizedBox(height: 3),

            Text(
              track.artistName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// MIX
// ============================================================

class _MixCarousel extends StatelessWidget {
  final List<TrackModel> tracks;
  final void Function(TrackModel) onTap;

  const _MixCarousel({
    required this.tracks,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final visibleTracks =
    tracks.take(6).toList();

    return SizedBox(
      height: 315,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 20),
        itemCount: visibleTracks.length,
        separatorBuilder: (_, __) =>
        const SizedBox(width: 18),
        itemBuilder: (context, index) {
          final track = visibleTracks[index];

          return _MixCard(
            track: track,
            mixNumber: index + 1,
            onTap: () => onTap(track),
          );
        },
      ),
    );
  }
}

class _MixCard extends StatelessWidget {
  final TrackModel track;
  final int mixNumber;
  final VoidCallback onTap;

  const _MixCard({
    required this.track,
    required this.mixNumber,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 220,
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              alignment: Alignment.bottomCenter,
              children: [
                AspectRatio(
                  aspectRatio: 1,
                  child: _NetworkArtwork(
                    url: track.imgUrl,
                  ),
                ),

                Container(
                  width: double.infinity,
                  margin: const EdgeInsets.all(10),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [
                        Color(0xFF7B61FF),
                        Color(0xFF547CFF),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    'MIX $mixNumber',
                    style: const TextStyle(
                      color: Colors.black,
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 10),

            Text(
              '${track.artistName}, ${track.title}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white60,
                fontSize: 15,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// GENRE
// ============================================================

class _GenreChip extends StatelessWidget {
  final String title;
  final bool selected;
  final VoidCallback onTap;

  const _GenreChip({
    required this.title,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(
          horizontal: 22,
        ),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          border: Border.all(
            color: selected
                ? const Color(0xFF69A7FF)
                : Colors.white70,
            width: 2,
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            color: selected
                ? const Color(0xFF69A7FF)
                : Colors.white70,
            fontWeight: FontWeight.w700,
            letterSpacing: 1,
          ),
        ),
      ),
    );
  }
}

// ============================================================
// TRENDING TRACK TILE
// ============================================================

class _TrendingTrackTile extends StatelessWidget {
  final TrackModel track;
  final VoidCallback onTap;
  final VoidCallback onMoreTap;

  const _TrendingTrackTile({
    required this.track,
    required this.onTap,
    required this.onMoreTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 10,
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(7),
              child: SizedBox(
                width: 72,
                height: 72,
                child: _NetworkArtwork(
                  url: track.imgUrl,
                ),
              ),
            ),

            const SizedBox(width: 15),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),

                  const SizedBox(height: 5),

                  Text(
                    track.artistName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white54,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),

            IconButton(
              onPressed: onMoreTap,
              icon: const Icon(
                Icons.more_vert,
                color: Colors.white70,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// NETWORK IMAGE
// ============================================================

class _NetworkArtwork extends StatelessWidget {
  final String? url;

  const _NetworkArtwork({
    required this.url,
  });

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.trim().isEmpty) {
      return Container(
        color: const Color(0xFF292929),
        child: const Center(
          child: Icon(
            Icons.music_note_rounded,
            color: Colors.white38,
            size: 48,
          ),
        ),
      );
    }

    return Image.network(
      url!,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) {
        return Container(
          color: const Color(0xFF292929),
          child: const Center(
            child: Icon(
              Icons.music_note_rounded,
              color: Colors.white38,
              size: 48,
            ),
          ),
        );
      },
    );
  }
}

// ============================================================
// ERROR
// ============================================================

class _ErrorBanner extends StatelessWidget {
  final String message;

  const _ErrorBanner({
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 8,
      ),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.info_outline,
            color: Colors.redAccent,
          ),

          const SizedBox(width: 10),

          Expanded(
            child: Text(
              message,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// BOTTOM NAVIGATION
// ============================================================

class _SoundCloudBottomNavigation extends StatelessWidget {
  final ValueChanged<int> onTap;

  const _SoundCloudBottomNavigation({
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF111111),
        border: Border(
          top: BorderSide(
            color: Color(0xFF222222),
          ),
        ),
      ),
      child: NavigationBar(
        height: 78,
        selectedIndex: 0,
        onDestinationSelected: onTap,
        backgroundColor: const Color(0xFF111111),
        indicatorColor: Colors.transparent,
        labelBehavior:
        NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(
              Icons.home_outlined,
              color: Colors.white54,
            ),
            selectedIcon: Icon(
              Icons.home,
              color: Colors.white,
            ),
            label: 'Home',
          ),

          NavigationDestination(
            icon: Icon(
              Icons.dynamic_feed_outlined,
              color: Colors.white54,
            ),
            label: 'Feed',
          ),

          NavigationDestination(
            icon: Icon(
              Icons.search,
              color: Colors.white54,
            ),
            label: 'Search',
          ),

          NavigationDestination(
            icon: Icon(
              Icons.library_music_outlined,
              color: Colors.white54,
            ),
            label: 'Library',
          ),

          NavigationDestination(
            icon: Icon(
              Icons.cloud_outlined,
              color: Colors.white54,
            ),
            label: 'Upgrade',
          ),
        ],
      ),
    );
  }
}