import 'package:flutter/material.dart';

import '../../../../core/theme/app_text_styles.dart';
import '../../models/home_data.dart';
import 'home_track_card.dart';

class HomeSection extends StatelessWidget {
  const HomeSection({
    super.key,
    required this.section,
  });

  final HomeSectionData section;

  @override
  Widget build(BuildContext context) {
    if (section.tracks.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              section.title,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTextStyles.sectionTitle,
            ),
          ),
          const SizedBox(height: 14),
          SizedBox(
            height: 218,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: section.tracks.length,
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemBuilder: (context, index) {
                return HomeTrackCard(track: section.tracks[index]);
              },
            ),
          ),
        ],
      ),
    );
  }
}
