import 'package:flutter/material.dart';

import '../models/track_model.dart';
import 'track_card.dart';

class HorizontalTrackList extends StatelessWidget {
  final List<TrackModel> tracks;
  final void Function(TrackModel track)? onTrackTap;

  const HorizontalTrackList({
    super.key,
    required this.tracks,
    this.onTrackTap,
  });

  @override
  Widget build(BuildContext context) {
    if (tracks.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 242,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(right: 20),
        itemCount: tracks.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final track = tracks[index];
          return TrackCard(
            track: track,
            onTap: onTrackTap == null ? null : () => onTrackTap!(track),
          );
        },
      ),
    );
  }
}
