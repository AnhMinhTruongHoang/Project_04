import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:soundcloud_mobile/providers/player_provider.dart';
import 'package:soundcloud_mobile/screens/auth/login_screen.dart';
import 'package:soundcloud_mobile/screens/library/library_screen.dart';
import 'package:soundcloud_mobile/screens/player/player_screen.dart';
import 'package:soundcloud_mobile/screens/profile/profile_screen.dart';
import 'package:soundcloud_mobile/widgets/add_to_playlist_sheet.dart';
import 'package:soundcloud_mobile/widgets/mini_player.dart';

import '../../models/artist_model.dart';
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

      context.read<PlayerProvider>().loadLikedTracks();
    });
  }

  void _openProfile() {
    Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (_) => const ProfileScreen()));
  }

  void _openGetPro() {
    _showComingSoon('GET PRO');
  }

  void _openSettings() {
    _showComingSoon('Settings');
  }

  Future<void> _logout() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF242424),
          title: const Text('Log out?'),
          content: const Text('Are you sure you want to log out?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, false);
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext, true);
              },
              child: const Text(
                'Log out',
                style: TextStyle(color: Color(0xFFFF5500)),
              ),
            ),
          ],
        );
      },
    );

    if (confirm != true || !mounted) {
      return;
    }

    await context.read<AuthProvider>().logout();

    if (!mounted) return;

    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<void> _refresh() async {
    await context.read<HomeProvider>().loadHome();
  }

  void _showComingSoon(String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$title sẽ được làm ở bước tiếp theo')),
    );
  }

  Future<void> _onTrackTap(
    TrackModel track, {
    required List<TrackModel> queue,
  }) async {
    final player = context.read<PlayerProvider>();

    await player.playTrack(track, queue: queue);

  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().currentUser;

    final userName = user?.name?.trim().isNotEmpty == true
        ? user!.name!
        : 'Bạn';

    return Scaffold(
      backgroundColor: const Color(0xFF101010),

      body: SafeArea(
        child: Consumer<HomeProvider>(
          builder: (context, provider, _) {
            if (provider.isLoading && !provider.hasContent) {
              return const Center(
                child: CircularProgressIndicator(color: Color(0xFFFF5500)),
              );
            }

            final moreOfWhatYouLike = provider.becauseYouListened.isNotEmpty
                ? provider.becauseYouListened
                : provider.trendingTracks;

            final mixTracks = provider.trendingTracks;

            final genres = provider.categories.isNotEmpty
                ? provider.categories
                      .map((category) => category.name.toUpperCase())
                      .take(10)
                      .toList()
                : _fallbackGenres;

            final displayedGenreTracks = provider.genreTracks.isNotEmpty
                ? provider.genreTracks
                : provider.trendingTracks;

            final moreTracks = moreOfWhatYouLike.take(10).toList();

            final visibleMixTracks = mixTracks.take(6).toList();

            final curatedTracks = provider.hiddenGems.take(10).toList();

            final recentTracks = provider.recentlyPlayed
                .map((item) => item.track)
                .take(10)
                .toList();

            return RefreshIndicator(
              color: const Color(0xFFFF5500),
              onRefresh: _refresh,

              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),

                slivers: [
                  // ==================================================
                  // HEADER
                  // ==================================================
                  SliverToBoxAdapter(
                    child: _TopHeader(
                      avatarUrl: user?.avatarUrl,
                      userName: userName,
                      onProfileTap: _openProfile,
                      onGetProTap: _openGetPro,
                      onSettingsTap: _openSettings,
                      onLogoutTap: _logout,
                      onCastTap: () => _showComingSoon('Cast'),
                      onUploadTap: () => _showComingSoon('Upload'),
                      onMessageTap: () => _showComingSoon('Messages'),
                      onNotificationTap: () => _showComingSoon('Notifications'),
                    ),
                  ),

                  // ==================================================
                  // ERROR
                  // ==================================================
                  if (provider.errorMessage != null)
                    SliverToBoxAdapter(
                      child: _ErrorBanner(message: provider.errorMessage!),
                    ),

                  // ==================================================
                  // MORE OF WHAT YOU LIKE
                  // ==================================================
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
                        tracks: moreTracks,
                        onTap: (track) => _onTrackTap(track, queue: moreTracks),
                      ),
                    ),

                  // ==================================================
                  // MIXED FOR USER
                  // ==================================================
                  if (mixTracks.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 30, 20, 12),

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
                        tracks: visibleMixTracks,
                        onTap: (track) =>
                            _onTrackTap(track, queue: visibleMixTracks),
                      ),
                    ),

                  // ==================================================
                  // TRENDING BY GENRE
                  // ==================================================
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20, 32, 20, 14),

                      child: Text(
                        'Trending by genre',

                        style: TextStyle(
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
                        padding: const EdgeInsets.symmetric(horizontal: 20),

                        scrollDirection: Axis.horizontal,

                        itemCount: genres.length,

                        separatorBuilder: (_, __) => const SizedBox(width: 12),

                        itemBuilder: (context, index) {
                          final selected = index == _selectedGenreIndex;

                          return _GenreChip(
                            title: genres[index],

                            selected: selected,

                            onTap: () {
                              setState(() {
                                _selectedGenreIndex = index;
                              });

                              context.read<HomeProvider>().loadGenreTracks(
                                genres[index],
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ),

                  const SliverToBoxAdapter(child: SizedBox(height: 18)),

                  if (provider.isGenreLoading)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.all(28),

                        child: Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFFFF5500),
                          ),
                        ),
                      ),
                    )
                  else if (displayedGenreTracks.isNotEmpty)
                    SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final track = displayedGenreTracks[index];

                          return _TrendingTrackTile(
                            track: track,

                            onTap: () =>
                                _onTrackTap(track, queue: displayedGenreTracks),

                            onMoreTap: () {
                              showAddToPlaylistSheet(context, track: track);
                            },
                          );
                        },

                        childCount: displayedGenreTracks.length > 10
                            ? 10
                            : displayedGenreTracks.length,
                      ),
                    ),

                  // ==================================================
                  // CURATED
                  // ==================================================
                  if (provider.hiddenGems.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _SectionTitle(
                        title: 'Curated by SoundApp',

                        onSeeAll: () => _showComingSoon('Curated by SoundApp'),
                      ),
                    ),

                  if (provider.hiddenGems.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _LargeTrackCarousel(
                        tracks: curatedTracks,
                        onTap: (track) =>
                            _onTrackTap(track, queue: curatedTracks),
                      ),
                    ),

                  // ==================================================
                  // ARTISTS TO WATCH
                  // ==================================================
                  if (provider.artistsToWatch.isNotEmpty)
                    const SliverToBoxAdapter(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(20, 32, 20, 16),

                        child: Text(
                          'Artists to watch out for',

                          style: TextStyle(
                            color: Colors.white,

                            fontSize: 28,

                            fontWeight: FontWeight.w800,

                            letterSpacing: -0.7,
                          ),
                        ),
                      ),
                    ),

                  if (provider.artistsToWatch.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _ArtistCarousel(
                        artists: provider.artistsToWatch,

                        onTap: (artist) {
                          _showComingSoon('Artist - ${artist.name}');
                        },
                      ),
                    ),

                  // ==================================================
                  // EDITORIAL BANNER
                  // ==================================================
                  const SliverToBoxAdapter(child: _EditorialBanner()),

                  // ==================================================
                  // RECENTLY PLAYED
                  // ==================================================
                  if (provider.recentlyPlayed.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _SectionTitle(
                        title: 'Recently played',

                        onSeeAll: () => _showComingSoon('Recently played'),
                      ),
                    ),

                  if (provider.recentlyPlayed.isNotEmpty)
                    SliverToBoxAdapter(
                      child: _LargeTrackCarousel(
                        tracks: recentTracks,
                        onTap: (track) =>
                            _onTrackTap(track, queue: recentTracks),
                      ),
                    ),

                  const SliverToBoxAdapter(child: SizedBox(height: 40)),
                ],
              ),
            );
          },
        ),
      ),

      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const MiniPlayer(),

          _SoundCloudBottomNavigation(
            onTap: (index) {
              if (index == 0) {
                return;
              }

              if (index == 4) {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LibraryScreen()),
                );

                return;
              }

              const pages = ['Home', 'Feed', 'Upload', 'Search', 'Library'];

              _showComingSoon(pages[index]);
            },
          ),
        ],
      ),
    );
  }
}

// ============================================================
// TOP HEADER
// ============================================================

class _TopHeader extends StatelessWidget {
  final String? avatarUrl;
  final String userName;

  final VoidCallback onProfileTap;
  final VoidCallback onGetProTap;
  final VoidCallback onSettingsTap;
  final VoidCallback onLogoutTap;

  final VoidCallback onCastTap;
  final VoidCallback onUploadTap;
  final VoidCallback onMessageTap;
  final VoidCallback onNotificationTap;

  const _TopHeader({
    required this.avatarUrl,
    required this.userName,
    required this.onProfileTap,
    required this.onGetProTap,
    required this.onSettingsTap,
    required this.onLogoutTap,
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

          _HeaderButton(icon: Icons.cast_rounded, onTap: onCastTap),

          _HeaderButton(icon: Icons.upload_rounded, onTap: onUploadTap),

          _HeaderButton(icon: Icons.mail_outline_rounded, onTap: onMessageTap),

          _HeaderButton(
            icon: Icons.notifications_none_rounded,
            onTap: onNotificationTap,
          ),

          const SizedBox(width: 6),

          _UserMenu(
            avatarUrl: avatarUrl,
            userName: userName,
            onProfileTap: onProfileTap,
            onGetProTap: onGetProTap,
            onSettingsTap: onSettingsTap,
            onLogoutTap: onLogoutTap,
          ),
        ],
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _HeaderButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: Icon(icon, color: Colors.white70, size: 27),
    );
  }
}

class _UserMenu extends StatelessWidget {
  final String? avatarUrl;
  final String userName;

  final VoidCallback onProfileTap;
  final VoidCallback onGetProTap;
  final VoidCallback onSettingsTap;
  final VoidCallback onLogoutTap;

  const _UserMenu({
    required this.avatarUrl,
    required this.userName,
    required this.onProfileTap,
    required this.onGetProTap,
    required this.onSettingsTap,
    required this.onLogoutTap,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      tooltip: 'Account',
      color: const Color(0xFF242424),
      offset: const Offset(0, 52),

      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),

      onSelected: (value) {
        switch (value) {
          case 'profile':
            onProfileTap();
            break;

          case 'pro':
            onGetProTap();
            break;

          case 'settings':
            onSettingsTap();
            break;

          case 'logout':
            onLogoutTap();
            break;
        }
      },

      itemBuilder: (context) => [
        // ================================================
        // USER
        // ================================================
        PopupMenuItem<String>(
          enabled: false,
          child: Row(
            children: [
              _SmallAvatar(avatarUrl: avatarUrl, size: 38),

              const SizedBox(width: 12),

              Expanded(
                child: Text(
                  userName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,

                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
        ),

        const PopupMenuDivider(),

        // ================================================
        // PROFILE
        // ================================================
        const PopupMenuItem<String>(
          value: 'profile',
          child: Row(
            children: [
              Icon(Icons.person_outline_rounded, color: Colors.white),

              SizedBox(width: 12),

              Text('Profile'),
            ],
          ),
        ),

        // ================================================
        // GET PRO
        // ================================================
        const PopupMenuItem<String>(
          value: 'pro',
          child: Row(
            children: [
              Icon(Icons.workspace_premium_outlined, color: Color(0xFFFF5500)),

              SizedBox(width: 12),

              Text(
                'GET PRO',
                style: TextStyle(
                  color: Color(0xFFFF5500),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),

        // ================================================
        // SETTINGS
        // ================================================
        const PopupMenuItem<String>(
          value: 'settings',
          child: Row(
            children: [
              Icon(Icons.settings_outlined, color: Colors.white),

              SizedBox(width: 12),

              Text('Settings', style: TextStyle(color: Colors.white)),
            ],
          ),
        ),

        const PopupMenuDivider(),

        // ================================================
        // LOGOUT
        // ================================================
        const PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              Icon(Icons.logout_rounded, color: Colors.redAccent),

              SizedBox(width: 12),

              Text('Log out', style: TextStyle(color: Colors.redAccent)),
            ],
          ),
        ),
      ],

      child: _SmallAvatar(avatarUrl: avatarUrl, size: 42),
    );
  }
}

class _SmallAvatar extends StatelessWidget {
  final String? avatarUrl;
  final double size;

  const _SmallAvatar({required this.avatarUrl, required this.size});

  @override
  Widget build(BuildContext context) {
    final hasAvatar = avatarUrl != null && avatarUrl!.trim().isNotEmpty;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white24),
      ),
      child: ClipOval(
        child: hasAvatar
            ? Image.network(
                avatarUrl!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _placeholder(),
              )
            : _placeholder(),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF292929),
      alignment: Alignment.center,
      child: Icon(
        Icons.person_rounded,
        color: Colors.white54,
        size: size * 0.58,
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

  const _SectionTitle({required this.title, required this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 30, 20, 14),

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

              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),

              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),

            child: const Text(
              'See All',

              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// TRACK CAROUSEL
// ============================================================

class _LargeTrackCarousel extends StatelessWidget {
  final List<TrackModel> tracks;
  final void Function(TrackModel) onTap;

  const _LargeTrackCarousel({required this.tracks, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 315,

      child: ListView.separated(
        scrollDirection: Axis.horizontal,

        padding: const EdgeInsets.symmetric(horizontal: 20),

        itemCount: tracks.length,

        separatorBuilder: (_, __) => const SizedBox(width: 18),

        itemBuilder: (context, index) {
          final track = tracks[index];

          return _LargeTrackCard(track: track, onTap: () => onTap(track));
        },
      ),
    );
  }
}

class _LargeTrackCard extends StatelessWidget {
  final TrackModel track;
  final VoidCallback onTap;

  const _LargeTrackCard({required this.track, required this.onTap});

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

              child: _NetworkArtwork(url: track.imgUrl),
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

              style: const TextStyle(color: Colors.white54, fontSize: 15),
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

  const _MixCarousel({required this.tracks, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final visibleTracks = tracks.take(6).toList();

    return SizedBox(
      height: 315,

      child: ListView.separated(
        scrollDirection: Axis.horizontal,

        padding: const EdgeInsets.symmetric(horizontal: 20),

        itemCount: visibleTracks.length,

        separatorBuilder: (_, __) => const SizedBox(width: 18),

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

                  child: _NetworkArtwork(url: track.imgUrl),
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
                      colors: [Color(0xFF7B61FF), Color(0xFF547CFF)],
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

        padding: const EdgeInsets.symmetric(horizontal: 22),

        alignment: Alignment.center,

        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),

          border: Border.all(
            color: selected ? const Color(0xFF69A7FF) : Colors.white70,

            width: 2,
          ),
        ),

        child: Text(
          title,

          style: TextStyle(
            color: selected ? const Color(0xFF69A7FF) : Colors.white70,

            fontWeight: FontWeight.w700,

            letterSpacing: 1,
          ),
        ),
      ),
    );
  }
}

// ============================================================
// TRENDING TRACK
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),

        child: Row(
          children: [
            SizedBox(
              width: 72,
              height: 72,

              child: _NetworkArtwork(url: track.imgUrl),
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

                    style: const TextStyle(color: Colors.white54, fontSize: 14),
                  ),
                ],
              ),
            ),

            IconButton(
              onPressed: onMoreTap,

              icon: const Icon(Icons.more_vert, color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================
// ARTISTS
// ============================================================

class _ArtistCarousel extends StatelessWidget {
  final List<ArtistModel> artists;

  final void Function(ArtistModel) onTap;

  const _ArtistCarousel({required this.artists, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 290,

      child: ListView.separated(
        scrollDirection: Axis.horizontal,

        padding: const EdgeInsets.symmetric(horizontal: 20),

        itemCount: artists.length,

        separatorBuilder: (_, __) => const SizedBox(width: 18),

        itemBuilder: (context, index) {
          final artist = artists[index];

          return _ArtistCard(artist: artist, onTap: () => onTap(artist));
        },
      ),
    );
  }
}

class _ArtistCard extends StatelessWidget {
  final ArtistModel artist;
  final VoidCallback onTap;

  const _ArtistCard({required this.artist, required this.onTap});

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
                borderRadius: BorderRadius.circular(3),

                child:
                    artist.avatarUrl != null &&
                        artist.avatarUrl!.trim().isNotEmpty
                    ? Image.network(
                        artist.avatarUrl!,

                        fit: BoxFit.cover,

                        errorBuilder: (_, __, ___) =>
                            const _ArtistPlaceholder(),
                      )
                    : const _ArtistPlaceholder(),
              ),
            ),

            const SizedBox(height: 9),

            Row(
              children: [
                Flexible(
                  child: Text(
                    artist.name,

                    maxLines: 1,

                    overflow: TextOverflow.ellipsis,

                    style: const TextStyle(
                      color: Colors.white,

                      fontSize: 17,

                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),

                if (artist.verified) ...[
                  const SizedBox(width: 5),

                  const Icon(Icons.verified, color: Colors.blue, size: 16),
                ],
              ],
            ),

            const SizedBox(height: 3),

            Text(
              '${artist.followers} followers',

              style: const TextStyle(color: Colors.white54, fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}

class _ArtistPlaceholder extends StatelessWidget {
  const _ArtistPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF292929),

      alignment: Alignment.center,

      child: const Icon(Icons.person_rounded, size: 65, color: Colors.white24),
    );
  }
}

// ============================================================
// EDITORIAL BANNER
// ============================================================

class _EditorialBanner extends StatelessWidget {
  const _EditorialBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 35, 20, 10),

      height: 260,

      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),

        gradient: const LinearGradient(
          begin: Alignment.topLeft,

          end: Alignment.bottomRight,

          colors: [Color(0xFF3C3C3C), Color(0xFF1B1B1B)],
        ),
      ),

      child: Stack(
        children: [
          const Positioned(
            left: 24,
            top: 24,

            child: Text(
              'THE UPLOAD',

              style: TextStyle(
                color: Colors.white,

                fontSize: 32,

                fontWeight: FontWeight.w900,
              ),
            ),
          ),

          const Positioned(
            left: 24,
            right: 24,
            top: 78,

            child: Text(
              'Your weekly music show with new tracks, artists and discoveries picked for you.',

              style: TextStyle(
                color: Colors.white70,

                fontSize: 16,

                height: 1.5,
              ),
            ),
          ),

          Positioned(
            left: 24,
            bottom: 24,

            child: Container(
              width: 76,
              height: 76,

              decoration: const BoxDecoration(
                color: Color(0xFFFF5500),

                shape: BoxShape.circle,
              ),

              child: const Icon(
                Icons.cloud_rounded,

                color: Colors.white,

                size: 42,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================
// NETWORK ARTWORK
// ============================================================

class _NetworkArtwork extends StatelessWidget {
  final String? url;

  const _NetworkArtwork({required this.url});

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.trim().isEmpty) {
      return _placeholder();
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(3),

      child: Image.network(
        url!,

        fit: BoxFit.cover,

        errorBuilder: (_, __, ___) => _placeholder(),
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      color: const Color(0xFF292929),

      alignment: Alignment.center,

      child: const Icon(
        Icons.music_note_rounded,

        color: Colors.white38,

        size: 48,
      ),
    );
  }
}

// ============================================================
// ERROR
// ============================================================

class _ErrorBanner extends StatelessWidget {
  final String message;

  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),

      padding: const EdgeInsets.all(12),

      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),

        borderRadius: BorderRadius.circular(10),
      ),

      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Colors.redAccent),

          const SizedBox(width: 10),

          Expanded(
            child: Text(
              message,

              maxLines: 2,

              overflow: TextOverflow.ellipsis,

              style: const TextStyle(color: Colors.white70, fontSize: 12),
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

  const _SoundCloudBottomNavigation({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF111111),

        border: Border(top: BorderSide(color: Color(0xFF222222))),
      ),

      child: NavigationBar(
        height: 78,

        selectedIndex: 0,

        onDestinationSelected: onTap,

        backgroundColor: const Color(0xFF111111),

        indicatorColor: Colors.transparent,

        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,

        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined, color: Colors.white54),

            selectedIcon: Icon(Icons.home, color: Colors.white),

            label: 'Home',
          ),

          NavigationDestination(
            icon: Icon(Icons.dynamic_feed_outlined, color: Colors.white54),

            label: 'Feed',
          ),

          NavigationDestination(
            icon: Icon(Icons.add, size: 34, color: Colors.white),

            label: '',
          ),

          NavigationDestination(
            icon: Icon(Icons.search, color: Colors.white54),

            label: 'Search',
          ),

          NavigationDestination(
            icon: Icon(Icons.library_music_outlined, color: Colors.white54),

            label: 'Library',
          ),
        ],
      ),
    );
  }
}
