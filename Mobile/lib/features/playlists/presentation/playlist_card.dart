import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../library/models/playlist.dart';
import '../../library/presentation/playlist_detail_screen.dart';
import '../../player/providers/player_provider.dart';

String playlistId(Map<String, dynamic> playlist) =>
    (playlist['id'] ?? playlist['_id'] ?? '').toString();

List<HomeTrack> playlistTracks(Map<String, dynamic> playlist) {
  final value = playlist['tracks'];
  if (value is! List) return const [];
  return value
      .map(HomeTrack.fromJson)
      .where((track) => track.id.isNotEmpty)
      .toList();
}

class ProfilePlaylistCard extends ConsumerWidget {
  const ProfilePlaylistCard({super.key, required this.playlist, this.onManage});

  final Map<String, dynamic> playlist;
  final VoidCallback? onManage;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracks = playlistTracks(playlist);
    final title = (playlist['title'] ?? 'Untitled playlist').toString();
    final isPublic = playlist['isPublic'] != false;
    final cover = tracks.isEmpty
        ? ''
        : ApiService.instance.getImageUrl(tracks.first.imgUrl);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Material(
        color: const Color(0xFF181A1B),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFF303233)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _openPlaylist(context),
          child: Padding(
            padding: const EdgeInsets.all(13),
            child: Column(
              children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: SizedBox(
                  width: 82,
                  height: 82,
                  child: cover.isEmpty
                      ? Image.asset(
                          'assets/images/sc_logo.png',
                          fit: BoxFit.cover,
                        )
                      : Image.network(
                          cover,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) => Image.asset(
                            'assets/images/sc_logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        InkWell(
                          borderRadius: BorderRadius.circular(18),
                          onTap: tracks.isEmpty
                              ? null
                              : () => _playAndOpenPlayer(
                                    context,
                                    ref,
                                    tracks.first,
                                    tracks,
                                  ),
                          child: Container(
                            width: 36,
                            height: 36,
                            decoration: const BoxDecoration(
                              color: Color(0xFFFF5500),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.play_arrow_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        Icon(
                          isPublic ? Icons.public_rounded : Icons.lock_rounded,
                          color: const Color(0xFF999999),
                          size: 16,
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '${isPublic ? 'Public' : 'Private'} playlist · ${tracks.length} tracks',
                      style: const TextStyle(
                        color: Color(0xFF999999),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (tracks.isNotEmpty) ...[
            const SizedBox(height: 12),
            ...tracks
                .take(5)
                .toList()
                .asMap()
                .entries
                .map(
                  (entry) => _PreviewTrack(
                    index: entry.key + 1,
                    track: entry.value,
                    queue: tracks,
                  ),
                ),
          ] else
            const Padding(
              padding: EdgeInsets.only(top: 18, bottom: 6),
              child: Text(
                'This playlist has no tracks.',
                style: TextStyle(color: Color(0xFF8F8F8F), fontSize: 13),
              ),
            ),
          if (onManage != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: () => _openPlaylist(context),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF292B2D),
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.tune_rounded, size: 17),
                label: const Text('Manage playlist'),
              ),
            ),
          ],
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _openPlaylist(BuildContext context) {
    final model = Playlist.fromJson(playlist);

    if (model.id.isEmpty) return;

    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => PlaylistDetailScreen(
          playlistId: model.id,
          initialPlaylist: model,
        ),
      ),
    );
  }

  Future<void> _playAndOpenPlayer(
    BuildContext context,
    WidgetRef ref,
    HomeTrack track,
    List<HomeTrack> queue,
  ) async {
    await ref.read(playerProvider.notifier).playTrack(track, queue: queue);

    if (!context.mounted) return;

    await WidgetsBinding.instance.endOfFrame;

    if (!context.mounted) return;

    await context.push('/player');
  }
}

class _PreviewTrack extends ConsumerWidget {
  const _PreviewTrack({
    required this.index,
    required this.track,
    required this.queue,
  });
  final int index;
  final HomeTrack track;
  final List<HomeTrack> queue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final image = ApiService.instance.getImageUrl(track.imgUrl);
    return InkWell(
      onTap: () => _playAndOpenPlayer(context, ref),
      child: SizedBox(
        height: 40,
        child: Row(
          children: [
            SizedBox(
              width: 24,
              child: Text(
                '$index',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const SizedBox(width: 7),
            ClipRRect(
              borderRadius: BorderRadius.circular(3),
              child: SizedBox(
                width: 28,
                height: 28,
                child: image.isEmpty
                    ? const ColoredBox(
                        color: Color(0xFF292929),
                        child: Icon(Icons.music_note, size: 15),
                      )
                    : Image.network(
                        image,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const Icon(Icons.music_note, size: 15),
                      ),
              ),
            ),
            const SizedBox(width: 9),
            Expanded(
              child: Text(
                track.title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            const Icon(
              Icons.play_arrow_rounded,
              color: Color(0xFF999999),
              size: 17,
            ),
            Text(
              '${track.countPlay}',
              style: const TextStyle(color: Color(0xFF999999), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _playAndOpenPlayer(
    BuildContext context,
    WidgetRef ref,
  ) async {
    await ref.read(playerProvider.notifier).playTrack(track, queue: queue);

    if (!context.mounted) return;

    await WidgetsBinding.instance.endOfFrame;

    if (!context.mounted) return;

    await context.push('/player');
  }
}
