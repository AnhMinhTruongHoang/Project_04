import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/models/user_model.dart';
import '../models/home_track.dart';
import '../providers/home_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    required this.user,
  });

  final UserModel user;

  static const _background =
  Color(0xFF0D0D0D);

  static const _orange =
  Color(0xFFFF5500);

  @override
  Widget build(
      BuildContext context,
      WidgetRef ref,
      ) {
    final home =
    ref.watch(homeFeedProvider);

    return ColoredBox(
      color: _background,
      child: SafeArea(
        top: true,
        bottom: false,
        child: home.when(
          loading: () =>
          const _HomeLoading(),

          error: (error, stack) {
            return _HomeError(
              onRetry: () {
                ref.invalidate(
                  homeFeedProvider,
                );
              },
            );
          },

          data: (data) {
            return RefreshIndicator(
              color: _orange,
              backgroundColor:
              const Color(
                0xFF202020,
              ),
              onRefresh: () async {
                ref.invalidate(
                  homeFeedProvider,
                );

                await ref.read(
                  homeFeedProvider.future,
                );
              },
              child: ListView(
                physics:
                const AlwaysScrollableScrollPhysics(
                  parent:
                  BouncingScrollPhysics(),
                ),
                padding:
                const EdgeInsets.only(
                  bottom: 110,
                ),
                children: [
                  _HomeHeader(
                    user: user,
                  ),

                  if (data.historyTracks
                      .isNotEmpty)
                    _TrackSection(
                      title:
                      data.historyTitle,
                      tracks:
                      data.historyTracks,
                    ),

                  if (data.becauseTracks
                      .isNotEmpty)
                    _TrackSection(
                      title:
                      data.becauseTitle,
                      tracks:
                      data.becauseTracks,
                    ),

                  if (data.hiddenGems
                      .isNotEmpty)
                    _TrackSection(
                      title: 'Hidden Gems',
                      tracks:
                      data.hiddenGems,
                    ),

                  if (data.ncsTracks
                      .isNotEmpty)
                    _TrackSection(
                      title: 'Top NCS',
                      tracks:
                      data.ncsTracks,
                    ),

                  if (data.kpopTracks
                      .isNotEmpty)
                    _TrackSection(
                      title: 'Top KPOP',
                      tracks:
                      data.kpopTracks,
                    ),

                  if (data.popTracks
                      .isNotEmpty)
                    _TrackSection(
                      title: 'Top POP',
                      tracks:
                      data.popTracks,
                    ),

                  if (data.lofiTracks
                      .isNotEmpty)
                    _TrackSection(
                      title: 'Top LOFI',
                      tracks:
                      data.lofiTracks,
                    ),

                  if (data.isEmpty)
                    const _EmptyHome(),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

// =================================================
// HEADER
// =================================================

class _HomeHeader
    extends StatelessWidget {
  const _HomeHeader({
    required this.user,
  });

  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final name = user.name.trim();

    final displayName =
    name.isNotEmpty
        ? name
        : 'Listener';

    return Padding(
      padding:
      const EdgeInsets.fromLTRB(
        18,
        20,
        18,
        10,
      ),
      child: Column(
        crossAxisAlignment:
        CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Good morning',
                  style: TextStyle(
                    color:
                    Colors.grey.shade300,
                    fontSize: 14,
                    fontWeight:
                    FontWeight.w500,
                  ),
                ),
              ),

              IconButton(
                onPressed: () {},
                icon: const Icon(
                  Icons
                      .notifications_none_rounded,
                  color: Colors.white,
                ),
              ),

              IconButton(
                onPressed: () {},
                icon: const Icon(
                  Icons.search_rounded,
                  color: Colors.white,
                ),
              ),

              CircleAvatar(
                radius: 17,
                backgroundColor:
                const Color(
                  0xFFFF5500,
                ),
                child: Text(
                  displayName[0]
                      .toUpperCase(),
                  style:
                  const TextStyle(
                    color: Colors.white,
                    fontWeight:
                    FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          Text(
            displayName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 27,
              fontWeight:
              FontWeight.w900,
              letterSpacing: -0.6,
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================
// TRACK SECTION
// =================================================

class _TrackSection
    extends StatelessWidget {
  const _TrackSection({
    required this.title,
    required this.tracks,
  });

  final String title;
  final List<HomeTrack> tracks;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding:
      const EdgeInsets.only(
        top: 20,
      ),
      child: Column(
        crossAxisAlignment:
        CrossAxisAlignment.start,
        children: [
          Padding(
            padding:
            const EdgeInsets.symmetric(
              horizontal: 18,
            ),
            child: Text(
              title,
              maxLines: 2,
              overflow:
              TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 21,
                fontWeight:
                FontWeight.w900,
                letterSpacing: -0.4,
              ),
            ),
          ),

          const SizedBox(height: 14),

          SizedBox(
            height: 208,
            child: ListView.separated(
              padding:
              const EdgeInsets.symmetric(
                horizontal: 18,
              ),
              physics:
              const BouncingScrollPhysics(),
              scrollDirection:
              Axis.horizontal,
              itemCount: tracks.length,
              separatorBuilder:
                  (_, __) =>
              const SizedBox(
                width: 14,
              ),
              itemBuilder:
                  (context, index) {
                return _TrackCard(
                  track:
                  tracks[index],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================
// TRACK CARD
// =================================================

class _TrackCard
    extends StatelessWidget {
  const _TrackCard({
    required this.track,
  });

  final HomeTrack track;

  @override
  Widget build(BuildContext context) {
    const size = 145.0;

    return SizedBox(
      width: size,
      child: InkWell(
        borderRadius:
        BorderRadius.circular(8),
        onTap: () {
          // Sau này:
          // mở player / track detail
        },
        child: Column(
          crossAxisAlignment:
          CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                _TrackCover(
                  track: track,
                  size: size,
                ),

                Positioned(
                  right: 8,
                  bottom: 8,
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration:
                    const BoxDecoration(
                      color:
                      Color(
                        0xFFFF5500,
                      ),
                      shape:
                      BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons
                          .play_arrow_rounded,
                      color: Colors.white,
                      size: 27,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 9),

            Text(
              track.title,
              maxLines: 1,
              overflow:
              TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight:
                FontWeight.w700,
              ),
            ),

            const SizedBox(height: 4),

            Text(
              track.artistName,
              maxLines: 1,
              overflow:
              TextOverflow.ellipsis,
              style: const TextStyle(
                color:
                Color(0xFF999999),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// =================================================
// COVER
// =================================================

class _TrackCover
    extends StatelessWidget {
  const _TrackCover({
    required this.track,
    required this.size,
  });

  final HomeTrack track;
  final double size;

  @override
  Widget build(BuildContext context) {
    final url =
    track.imgUrl?.trim();

    return ClipRRect(
      borderRadius:
      BorderRadius.circular(8),
      child: Container(
        width: size,
        height: size,
        color:
        const Color(0xFF202020),
        child: url == null ||
            url.isEmpty
            ? const _CoverFallback()
            : Image.network(
          url,
          fit: BoxFit.cover,
          errorBuilder:
              (
              context,
              error,
              stack,
              ) {
            return const _CoverFallback();
          },
        ),
      ),
    );
  }
}

class _CoverFallback
    extends StatelessWidget {
  const _CoverFallback();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Icon(
        Icons
            .music_note_rounded,
        color:
        Color(0xFF555555),
        size: 46,
      ),
    );
  }
}

// =================================================
// LOADING
// =================================================

class _HomeLoading
    extends StatelessWidget {
  const _HomeLoading();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child:
      CircularProgressIndicator(
        color:
        Color(0xFFFF5500),
      ),
    );
  }
}

// =================================================
// ERROR
// =================================================

class _HomeError
    extends StatelessWidget {
  const _HomeError({
    required this.onRetry,
  });

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize:
        MainAxisSize.min,
        children: [
          const Icon(
            Icons
                .cloud_off_rounded,
            color:
            Color(0xFFFF5500),
            size: 52,
          ),

          const SizedBox(
            height: 16,
          ),

          const Text(
            'Couldn\'t load music',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight:
              FontWeight.w800,
            ),
          ),

          const SizedBox(
            height: 18,
          ),

          FilledButton(
            style:
            FilledButton.styleFrom(
              backgroundColor:
              const Color(
                0xFFFF5500,
              ),
            ),
            onPressed: onRetry,
            child: const Text(
              'Try Again',
            ),
          ),
        ],
      ),
    );
  }
}

// =================================================
// EMPTY
// =================================================

class _EmptyHome
    extends StatelessWidget {
  const _EmptyHome();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding:
      EdgeInsets.symmetric(
        vertical: 80,
        horizontal: 30,
      ),
      child: Column(
        children: [
          Icon(
            Icons
                .library_music_rounded,
            color:
            Color(0xFF555555),
            size: 55,
          ),

          SizedBox(height: 16),

          Text(
            'No music available',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight:
              FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}