import 'package:flutter/material.dart';
import '../../downloads/presentation/track_download_button.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../services/api/api_service.dart';
import '../providers/player_provider.dart';

Future<void> showPlayerQueueSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    backgroundColor: const Color(0xFF151515),
    showDragHandle: true,
    builder: (_) => const FractionallySizedBox(
      heightFactor: 0.72,
      child: PlayerQueueSheet(),
    ),
  );
}

class PlayerQueueSheet extends ConsumerWidget {
  const PlayerQueueSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = ref.watch(playerProvider);
    final queue = player.queue;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 0, 18, 12),
          child: Row(
            children: [
              const Expanded(
                child: Text(
                  'Playlist queue',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              Text(
                '${queue.length} tracks',
                style: const TextStyle(color: Color(0xFF999999)),
              ),
            ],
          ),
        ),
        const Divider(height: 1, color: Color(0xFF292929)),
        Expanded(
          child: queue.isEmpty
              ? const Center(
                  child: Text(
                    'No tracks in the queue.',
                    style: TextStyle(color: Color(0xFF999999)),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 24),
                  itemCount: queue.length,
                  separatorBuilder: (_, __) => const Divider(
                    height: 1,
                    indent: 68,
                    color: Color(0xFF242424),
                  ),
                  itemBuilder: (context, index) {
                    final track = queue[index];
                    final selected = track.id == player.currentTrack?.id;
                    final imageUrl = ApiService.instance.getImageUrl(
                      track.imgUrl,
                    );

                    return ListTile(
                      selected: selected,
                      selectedTileColor: const Color(0x18FF5500),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(9),
                      ),
                      leading: ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: SizedBox(
                          width: 48,
                          height: 48,
                          child: imageUrl.isEmpty
                              ? const ColoredBox(
                                  color: Color(0xFF292929),
                                  child: Icon(Icons.music_note_rounded),
                                )
                              : Image.network(
                                  imageUrl,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      const ColoredBox(
                                        color: Color(0xFF292929),
                                        child: Icon(Icons.music_note_rounded),
                                      ),
                                ),
                        ),
                      ),
                      title: Text(
                        track.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: selected
                              ? const Color(0xFFFF782F)
                              : Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      subtitle: Text(
                        track.artistName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: Color(0xFF999999)),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TrackDownloadButton(track: track),
                          selected
                              ? Icon(
                                  player.isPlaying
                                      ? Icons.equalizer_rounded
                                      : Icons.pause_circle_outline_rounded,
                                  color: const Color(0xFFFF5500),
                                )
                              : Text(
                                  '${index + 1}',
                                  style: const TextStyle(
                                    color: Color(0xFF777777),
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                        ],
                      ),
                      onTap: () {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: queue);
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }
}
