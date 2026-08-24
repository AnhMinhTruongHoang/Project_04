import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/models/user_model.dart';
import '../../player/providers/player_provider.dart';
import '../models/home_track.dart';
import '../providers/home_provider.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({
    super.key,
    required this.user,
  });

  final UserModel user;

  static const Color _background = Color(0xFF0D0D0D);
  static const Color _orange = Color(0xFFFF5500);

  @override
  Widget build(
      BuildContext context,
      WidgetRef ref,
      ) {
    final home = ref.watch(homeFeedProvider);

    return ColoredBox(
      color: _background,
      child: SafeArea(
        // Header đã nằm ở AppShell phía trên,
        // nên không cần chừa SafeArea top lần nữa.
        top: false,
        bottom: false,
        child: home.when(
          // =======================================================
          // LOADING
          // =======================================================
          loading: () => const _HomeLoading(),

          // =======================================================
          // ERROR
          // =======================================================
          error: (error, stack) {
            return _HomeError(
              onRetry: () {
                ref.invalidate(homeFeedProvider);
              },
            );
          },

          // =======================================================
          // DATA
          // =======================================================
          data: (data) {
            return RefreshIndicator(
              color: _orange,
              backgroundColor: const Color(0xFF202020),
              onRefresh: () async {
                ref.invalidate(homeFeedProvider);

                await ref.read(
                  homeFeedProvider.future,
                );
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.only(
                  top: 6,
                  bottom: 178,
                ),
                children: [
                  // ===============================================
                  // HISTORY
                  // ===============================================
                  if (data.historyTracks.isNotEmpty)
                    _TrackSection(
                      title: data.historyTitle,
                      tracks: data.historyTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.historyTracks);
                      },
                    ),

                  // ===============================================
                  // BECAUSE YOU LISTENED
                  // ===============================================
                  if (data.becauseTracks.isNotEmpty)
                    _TrackSection(
                      title: data.becauseTitle,
                      tracks: data.becauseTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.becauseTracks);
                      },
                    ),

                  // ===============================================
                  // HIDDEN GEMS
                  // ===============================================
                  if (data.hiddenGems.isNotEmpty)
                    _TrackSection(
                      title: 'Hidden Gems',
                      tracks: data.hiddenGems,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.hiddenGems);
                      },
                    ),

                  // ===============================================
                  // TOP NCS
                  // ===============================================
                  if (data.ncsTracks.isNotEmpty)
                    _TrackSection(
                      title: 'Top NCS',
                      tracks: data.ncsTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.ncsTracks);
                      },
                    ),

                  // ===============================================
                  // TOP KPOP
                  // ===============================================
                  if (data.kpopTracks.isNotEmpty)
                    _TrackSection(
                      title: 'Top KPOP',
                      tracks: data.kpopTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.kpopTracks);
                      },
                    ),

                  // ===============================================
                  // TOP POP
                  // ===============================================
                  if (data.popTracks.isNotEmpty)
                    _TrackSection(
                      title: 'Top POP',
                      tracks: data.popTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.popTracks);
                      },
                    ),

                  // ===============================================
                  // TOP LOFI
                  // ===============================================
                  if (data.lofiTracks.isNotEmpty)
                    _TrackSection(
                      title: 'Top LOFI',
                      tracks: data.lofiTracks,
                      onTrackTap: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: data.lofiTracks);
                      },
                    ),

                  // ===============================================
                  // EMPTY
                  // ===============================================
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

// ============================================================================
// TRACK SECTION
// ============================================================================

class _TrackSection extends StatelessWidget {
  const _TrackSection({
    required this.title,
    required this.tracks,
    required this.onTrackTap,
  });

  final String title;
  final List<HomeTrack> tracks;
  final ValueChanged<HomeTrack> onTrackTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        top: 16,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // =======================================================
          // SECTION TITLE
          // =======================================================
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 18,
            ),
            child: Text(
              title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 21,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.4,
              ),
            ),
          ),

          const SizedBox(height: 14),

          // =======================================================
          // HORIZONTAL TRACK LIST
          // =======================================================
          SizedBox(
            height: 208,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(
                horizontal: 18,
              ),
              physics: const BouncingScrollPhysics(),
              scrollDirection: Axis.horizontal,
              itemCount: tracks.length,
              separatorBuilder: (_, _) {
                return const SizedBox(
                  width: 14,
                );
              },
              itemBuilder: (context, index) {
                return _TrackCard(
                  track: tracks[index],
                  onTap: () {
                    onTrackTap(tracks[index]);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// TRACK CARD
// ============================================================================

class _TrackCard extends StatelessWidget {
  const _TrackCard({
    required this.track,
    required this.onTap,
  });

  final HomeTrack track;
  final VoidCallback onTap;

  static const double _cardWidth = 145;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _cardWidth,
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =====================================================
            // COVER
            // =====================================================
            Stack(
              children: [
                _TrackCover(
                  track: track,
                  size: _cardWidth,
                ),

                // =================================================
                // PLAY BUTTON
                // =================================================
                Positioned(
                  right: 8,
                  bottom: 8,
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF5500),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.play_arrow_rounded,
                      color: Colors.white,
                      size: 27,
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 9),

            // =====================================================
            // TRACK TITLE
            // =====================================================
            Text(
              track.title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),

            const SizedBox(height: 4),

            // =====================================================
            // ARTIST
            // =====================================================
            Text(
              track.artistName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF999999),
                fontSize: 12,
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// TRACK COVER
// ============================================================================

class _TrackCover extends StatelessWidget {
  const _TrackCover({
    required this.track,
    required this.size,
  });

  final HomeTrack track;
  final double size;

  @override
  Widget build(BuildContext context) {
    final url = track.resolvedImageUrl;

    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: size,
        height: size,
        color: const Color(0xFF202020),
        child: url == null || url.isEmpty
            ? const _CoverFallback()
            : Image.network(
          url,
          width: size,
          height: size,
          fit: BoxFit.cover,

          // Nếu ảnh bị lỗi thì dùng ảnh fallback.
          errorBuilder: (
              context,
              error,
              stackTrace,
              ) {
            return const _CoverFallback();
          },

          // Hiển thị nền tối trong lúc ảnh đang load.
          loadingBuilder: (
              context,
              child,
              loadingProgress,
              ) {
            if (loadingProgress == null) {
              return child;
            }

            return Container(
              width: size,
              height: size,
              color: const Color(0xFF202020),
              alignment: Alignment.center,
              child: const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Color(0xFFFF5500),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

// ============================================================================
// COVER FALLBACK
// ============================================================================

class _CoverFallback extends StatelessWidget {
  const _CoverFallback();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Icon(
        Icons.music_note_rounded,
        color: Color(0xFF555555),
        size: 46,
      ),
    );
  }
}

// ============================================================================
// HOME LOADING
// ============================================================================

class _HomeLoading extends StatelessWidget {
  const _HomeLoading();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: CircularProgressIndicator(
        color: Color(0xFFFF5500),
      ),
    );
  }
}

// ============================================================================
// HOME ERROR
// ============================================================================

class _HomeError extends StatelessWidget {
  const _HomeError({
    required this.onRetry,
  });

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: 30,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // =====================================================
            // ERROR ICON
            // =====================================================
            const Icon(
              Icons.cloud_off_rounded,
              color: Color(0xFFFF5500),
              size: 52,
            ),

            const SizedBox(height: 16),

            // =====================================================
            // ERROR TITLE
            // =====================================================
            const Text(
              'Couldn\'t load music',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),

            const SizedBox(height: 8),

            const Text(
              'Check your connection and try again.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFF999999),
                fontSize: 13,
              ),
            ),

            const SizedBox(height: 20),

            // =====================================================
            // RETRY BUTTON
            // =====================================================
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(
                  0xFFFF5500,
                ),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 22,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(
                    24,
                  ),
                ),
              ),
              onPressed: onRetry,
              child: const Text(
                'Try Again',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// EMPTY HOME
// ============================================================================

class _EmptyHome extends StatelessWidget {
  const _EmptyHome();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(
        vertical: 80,
        horizontal: 30,
      ),
      child: Column(
        children: [
          // =======================================================
          // EMPTY ICON
          // =======================================================
          Icon(
            Icons.library_music_rounded,
            color: Color(0xFF555555),
            size: 55,
          ),

          SizedBox(height: 16),

          // =======================================================
          // EMPTY TITLE
          // =======================================================
          Text(
            'No music available',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),

          SizedBox(height: 7),

          Text(
            'Come back later for more music.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF888888),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
