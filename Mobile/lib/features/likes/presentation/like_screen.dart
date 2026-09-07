import '../../downloads/presentation/track_download_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../home/providers/home_provider.dart';
import '../../library/providers/library_provider.dart';
import '../../player/providers/player_provider.dart';
import '../../player/providers/player_social_provider.dart';
import '../../profile/presentation/profile_screen.dart';

class LikeScreen extends ConsumerWidget {
  const LikeScreen({super.key});

  static const _orange = Color(0xFFFF5500);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final likedTracks = ref.watch(likedTracksProvider);

    return ColoredBox(
      color: const Color(0xFF181A1B),
      child: SafeArea(
        top: false,
        bottom: false,
        child: likedTracks.when(
          loading: () =>
              const Center(child: CircularProgressIndicator(color: _orange)),
          error: (error, _) => _LikeError(
            message: error.toString().replaceFirst('Bad state: ', ''),
            onRetry: () => ref.invalidate(likedTracksProvider),
          ),
          data: (tracks) => RefreshIndicator(
            color: _orange,
            backgroundColor: const Color(0xFF252728),
            onRefresh: () async {
              ref.invalidate(likedTracksProvider);
              await ref.read(likedTracksProvider.future);
            },
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              slivers: [
                const SliverToBoxAdapter(child: _LikeHeader()),
                if (tracks.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyLikes(),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 110),
                    sliver: SliverGrid(
                      gridDelegate:
                          const SliverGridDelegateWithMaxCrossAxisExtent(
                            maxCrossAxisExtent: 220,
                            mainAxisExtent: 255,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 20,
                          ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) => _LikedTrackCard(
                          track: tracks[index],
                          onPlay: () {
                            ref
                                .read(playerSocialProvider.notifier)
                                .markTracksLiked(tracks);
                            ref
                                .read(playerProvider.notifier)
                                .playTrack(tracks[index], queue: tracks);
                          },
                          onUnlike: () => _unlike(context, ref, tracks[index]),
                        ),
                        childCount: tracks.length,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _unlike(
    BuildContext context,
    WidgetRef ref,
    HomeTrack track,
  ) async {
    final result = await ApiService.instance.dislikeTrackApi(track.id);
    if (!context.mounted) return;
    if (result.isSuccess) {
      ref.read(playerSocialProvider.notifier).markTrackUnliked(track);
      ref.invalidate(homeFeedProvider);
      ref.invalidate(profileTracksProvider);
      final likedRefresh = ref.refresh(likedTracksProvider.future);
      try {
        await likedRefresh;
      } catch (_) {}
      return;
    }

    if (context.mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(result.message)));
    }
  }
}

class _LikeHeader extends StatelessWidget {
  const _LikeHeader();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.fromLTRB(20, 30, 20, 28),
      child: Column(
        children: [
          Text(
            'Tracks you\'ve liked',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Colors.white,
              fontSize: 28,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Listen again to the songs you loved on SoundClone.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Color(0xFF9A9A9A),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 24),
          Divider(height: 1, color: Color(0xFF303233)),
        ],
      ),
    );
  }
}

class _LikedTrackCard extends StatelessWidget {
  const _LikedTrackCard({
    required this.track,
    required this.onPlay,
    required this.onUnlike,
  });

  final HomeTrack track;
  final VoidCallback onPlay;
  final VoidCallback onUnlike;

  @override
  Widget build(BuildContext context) {
    final imageUrl = ApiService.instance.getImageUrl(track.imgUrl);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: GestureDetector(
            onTap: onPlay,
            child: Stack(
            fit: StackFit.expand,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: ColoredBox(
                  color: const Color(0xFF111111),
                  child: imageUrl.isEmpty
                      ? const _CoverFallback()
                      : Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => const _CoverFallback(),
                        ),
                ),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFF303030)),
                  gradient: const LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.transparent, Color(0x99000000)],
                    stops: [0.45, 1],
                  ),
                ),
              ),
              Center(
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF5500),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(color: Color(0x66FF5500), blurRadius: 20),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow_rounded,
                    color: Colors.white,
                    size: 34,
                  ),
                ),
              ),
              Positioned(
                right: 5,
                bottom: 5,
                child: IconButton(
                  tooltip: 'Unlike',
                  onPressed: onUnlike,
                  style: IconButton.styleFrom(
                    backgroundColor: const Color(0xCC111111),
                  ),
                  icon: const Icon(
                    Icons.favorite_rounded,
                    color: Color(0xFFFF5500),
                    size: 20,
                  ),
                ),
              ),
              Positioned(
                right: 5,
                top: 5,
                child: TrackDownloadButton(track: track, onCover: true),
              ),
            ],
            ),
          ),
        ),
        const SizedBox(height: 9),
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
        const SizedBox(height: 4),
        Text(
          track.description?.trim().isNotEmpty == true
              ? track.description!.trim()
              : track.artistName,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Color(0xFF9A9A9A),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 7),
        Row(
          children: [
            const Icon(
              Icons.play_arrow_rounded,
              color: Color(0xFF8F8F8F),
              size: 17,
            ),
            Text(
              '${track.countPlay}',
              style: const TextStyle(color: Color(0xFF8F8F8F), fontSize: 12),
            ),
            const SizedBox(width: 12),
            const Icon(
              Icons.favorite_rounded,
              color: Color(0xFF8F8F8F),
              size: 15,
            ),
            const SizedBox(width: 3),
            Text(
              '${track.countLike}',
              style: const TextStyle(color: Color(0xFF8F8F8F), fontSize: 12),
            ),
          ],
        ),
      ],
    );
  }
}

class _CoverFallback extends StatelessWidget {
  const _CoverFallback();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Icon(Icons.music_note_rounded, color: Color(0xFF555555), size: 48),
    );
  }
}

class _EmptyLikes extends StatelessWidget {
  const _EmptyLikes();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 0, 18, 110),
      child: Container(
        constraints: const BoxConstraints(minHeight: 260),
        decoration: BoxDecoration(
          color: const Color(0xFF111314),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF414141)),
        ),
        child: const Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.favorite_rounded, color: Color(0xFFFF5500), size: 54),
            SizedBox(height: 14),
            Text(
              'No liked songs yet!',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            SizedBox(height: 8),
            Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Text(
                'Like a track and it will be displayed here.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF9A9A9A), fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LikeError extends StatelessWidget {
  const _LikeError({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              color: Color(0xFFFF5500),
              size: 50,
            ),
            const SizedBox(height: 14),
            const Text(
              'Couldn\'t load liked tracks',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 19,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF999999)),
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF5500),
              ),
              child: const Text('Try again'),
            ),
          ],
        ),
      ),
    );
  }
}
