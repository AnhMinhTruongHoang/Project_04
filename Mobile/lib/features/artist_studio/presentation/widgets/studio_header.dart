part of artist_studio_screen;

class _HeroPanel extends StatelessWidget {
  const _HeroPanel({required this.onUpload});

  final VoidCallback onUpload;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF282828)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Artist Studio',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'All time stats updated daily',
                      style: TextStyle(
                        color: Color(0xFFAAAAAA),
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: _studioOrange,
              foregroundColor: Colors.white,
              minimumSize: const Size.fromHeight(42),
            ),
            onPressed: onUpload,
            icon: const Icon(Icons.cloud_upload_rounded),
            label: const Text('Upload tracks'),
          ),
        ],
      ),
    );
  }
}

class _MinutesUsedCard extends StatelessWidget {
  const _MinutesUsedCard({required this.stats});

  final _ArtistStudioStats? stats;

  @override
  Widget build(BuildContext context) {
    final total = stats?.uploadMinutesLimit ?? 180;
    final used = stats?.uploadMinutesUsed ?? 0;
    final clamped = total <= 0 ? 0.0 : (used / total).clamp(0.0, 1.0);
    final remaining = (total - used).clamp(0, total);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1B1B1B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF303030)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: const BoxDecoration(
              color: Color(0xFF2A2A2A),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.cloud_upload_rounded, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        '$used / $total minutes used',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      stats?.planName ?? 'Basic',
                      style: const TextStyle(
                        color: Color(0xFF9A9A9A),
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: LinearProgressIndicator(
                    value: clamped,
                    minHeight: 6,
                    color: _studioOrange,
                    backgroundColor: const Color(0xFF555555),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '$remaining minutes remaining',
                  style: const TextStyle(
                    color: Color(0xFF9A9A9A),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          OutlinedButton(
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.white,
              side: const BorderSide(color: Color(0xFF555555)),
            ),
            onPressed: () {},
            child: const Text('Upgrade'),
          ),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({
    required this.summary,
    required this.remoteStats,
    required this.commentTotal,
  });

  final _StudioSummary summary;
  final _ArtistStudioStats? remoteStats;
  final int? commentTotal;

  @override
  Widget build(BuildContext context) {
    final stats = [
      _StatCardData(
        label: 'SC plays',
        value: (remoteStats?.plays ?? summary.plays).toString(),
        icon: Icons.play_circle_fill_rounded,
      ),
      _StatCardData(
        label: 'Likes',
        value: (remoteStats?.likes ?? summary.likes).toString(),
        icon: Icons.favorite_rounded,
      ),
      _StatCardData(
        label: 'Comments',
        value: (commentTotal ?? remoteStats?.comments ?? summary.comments)
            .toString(),
        icon: Icons.comment_rounded,
      ),
      const _StatCardData(
        label: 'Insights',
        value: '7 days',
        icon: Icons.bar_chart_rounded,
      ),
      const _StatCardData(
        label: 'Membership',
        value: 'Upgrade',
        icon: Icons.swap_horiz_rounded,
        locked: true,
      ),
      const _StatCardData(
        label: 'Downloads',
        value: 'Upgrade',
        icon: Icons.download_rounded,
        locked: true,
      ),
      const _StatCardData(
        label: 'Earnings',
        value: 'Upgrade',
        icon: Icons.paid_rounded,
        locked: true,
      ),
      const _StatCardData(
        label: 'Fans',
        value: 'Upgrade',
        icon: Icons.groups_rounded,
        locked: true,
      ),
      const _StatCardData(
        label: 'Benefits',
        value: 'Upgrade',
        icon: Icons.workspace_premium_rounded,
        locked: true,
      ),
      _StatCardData(
        label: 'Uploads',
        value: summary.total.toString(),
        icon: Icons.library_music_rounded,
      ),
      _StatCardData(
        label: 'Public',
        value: summary.publicTracks.toString(),
        icon: Icons.public_rounded,
      ),
      _StatCardData(
        label: 'Pending',
        value: summary.pendingTracks.toString(),
        icon: Icons.hourglass_top_rounded,
      ),
      _StatCardData(
        label: 'Rejected',
        value: summary.rejectedTracks.toString(),
        icon: Icons.report_gmailerrorred_rounded,
      ),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final columns = width >= 920
            ? 4
            : width >= 620
            ? 3
            : 2;
        const spacing = 10.0;
        final cardWidth = (width - (spacing * (columns - 1))) / columns;

        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final item in stats)
              SizedBox(
                width: cardWidth,
                height: 82,
                child: _StatCard(data: item),
              ),
          ],
        );
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.data});

  final _StatCardData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF171717),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF282828)),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              color: _studioOrange.withValues(alpha: 0.16),
              shape: BoxShape.circle,
            ),
            child: Icon(data.icon, color: _studioOrange, size: 19),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: data.locked ? 13 : 20,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        data.label,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF9A9A9A),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    if (data.locked) ...[
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.lock_rounded,
                        color: Color(0xFF777777),
                        size: 13,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StudioSectionTabs extends StatelessWidget {
  const _StudioSectionTabs({required this.selected, required this.onChanged});

  final _StudioSection selected;
  final ValueChanged<_StudioSection> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final section in _StudioSection.values) ...[
            _StudioSectionChip(
              section: section,
              selected: selected == section,
              onTap: () => onChanged(section),
            ),
            const SizedBox(width: 10),
          ],
        ],
      ),
    );
  }
}

class _StudioSectionChip extends StatelessWidget {
  const _StudioSectionChip({
    required this.section,
    required this.selected,
    required this.onTap,
  });

  final _StudioSection section;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? _studioOrange : const Color(0xFF171717),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: selected ? _studioOrange : const Color(0xFF333333),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (selected)
              const Padding(
                padding: EdgeInsets.only(right: 6),
                child: Icon(Icons.check_rounded, color: Colors.white, size: 16),
              ),
            Text(
              section.label,
              style: TextStyle(
                color: selected ? Colors.white : Colors.white70,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
