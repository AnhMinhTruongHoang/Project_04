import 'package:flutter/material.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';

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

class ProfilePlaylistCard extends StatelessWidget {
  const ProfilePlaylistCard({super.key, required this.playlist, this.onManage});

  final Map<String, dynamic> playlist;
  final VoidCallback? onManage;

  @override
  Widget build(BuildContext context) {
    final tracks = playlistTracks(playlist);
    final title = (playlist['title'] ?? 'Untitled playlist').toString();
    final isPublic = playlist['isPublic'] != false;
    final cover = tracks.isEmpty
        ? ''
        : ApiService.instance.getImageUrl(tracks.first.imgUrl);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFF181A1B),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF303233)),
      ),
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
                        Container(
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
                  (entry) =>
                      _PreviewTrack(index: entry.key + 1, track: entry.value),
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
                onPressed: onManage,
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
    );
  }
}

class _PreviewTrack extends StatelessWidget {
  const _PreviewTrack({required this.index, required this.track});
  final int index;
  final HomeTrack track;

  @override
  Widget build(BuildContext context) {
    final image = ApiService.instance.getImageUrl(track.imgUrl);
    return SizedBox(
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
    );
  }
}
