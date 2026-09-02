part of artist_studio_screen;

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        Text(
          subtitle,
          style: const TextStyle(
            color: Color(0xFF8A8A8A),
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

class _FilterStrip extends StatelessWidget {
  const _FilterStrip({required this.selected, required this.onChanged});

  final _StudioFilter selected;
  final ValueChanged<_StudioFilter> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final filter in _StudioFilter.values) ...[
            ChoiceChip(
              label: Text(filter.label),
              selected: selected == filter,
              onSelected: (_) => onChanged(filter),
              selectedColor: _studioOrange,
              backgroundColor: const Color(0xFF1C1C1C),
              labelStyle: TextStyle(
                color: selected == filter ? Colors.white : Colors.white70,
                fontWeight: FontWeight.w900,
              ),
              side: BorderSide(
                color: selected == filter
                    ? _studioOrange
                    : const Color(0xFF333333),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _SearchAndSortBar extends StatelessWidget {
  const _SearchAndSortBar({
    required this.controller,
    required this.sortDescending,
    required this.onChanged,
    required this.onToggleSort,
  });

  final TextEditingController controller;
  final bool sortDescending;
  final ValueChanged<String> onChanged;
  final VoidCallback onToggleSort;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            onChanged: onChanged,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Search tracks, hash or admin note',
              hintStyle: const TextStyle(
                color: Color(0xFF8D939A),
                fontWeight: FontWeight.w700,
              ),
              prefixIcon: const Icon(
                Icons.search_rounded,
                color: Color(0xFF9A9A9A),
              ),
              suffixIcon: controller.text.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Clear search',
                      onPressed: () {
                        controller.clear();
                        onChanged('');
                      },
                      icon: const Icon(Icons.close_rounded),
                    ),
              filled: true,
              fillColor: const Color(0xFF111111),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: const BorderSide(color: Color(0xFF303030)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(24),
                borderSide: const BorderSide(color: _studioOrange),
              ),
            ),
          ),
        ),
        const SizedBox(width: 8),
        TextButton.icon(
          onPressed: onToggleSort,
          icon: Icon(
            sortDescending
                ? Icons.arrow_downward_rounded
                : Icons.arrow_upward_rounded,
            size: 18,
          ),
          label: const Text('Date'),
          style: TextButton.styleFrom(
            foregroundColor: Colors.white,
            textStyle: const TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      ],
    );
  }
}

class _TracksTable extends StatelessWidget {
  const _TracksTable({
    required this.tracks,
    required this.onOpen,
    required this.onPlay,
  });

  final List<HomeTrack> tracks;
  final ValueChanged<HomeTrack> onOpen;
  final ValueChanged<HomeTrack> onPlay;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: const Color(0xFF111111),
          border: Border.all(color: const Color(0xFF2B2B2B)),
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: SizedBox(
            width: 1080,
            child: Column(
              children: [
                const _TableHeader(),
                for (final track in tracks)
                  _TableRow(
                    track: track,
                    onOpen: () => onOpen(track),
                    onPlay: track.resolvedTrackUrl == null
                        ? null
                        : () => onPlay(track),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TableHeader extends StatelessWidget {
  const _TableHeader();

  @override
  Widget build(BuildContext context) {
    return const _TableLine(
      minHeight: 52,
      bottomBorder: true,
      children: [
        _HeaderCell(width: 330, text: 'TRACKS'),
        _HeaderCell(width: 170, text: 'STATUS'),
        _HeaderCell(width: 130, text: 'DATE'),
        _HeaderCell(width: 280, text: 'ADMIN NOTE'),
        _HeaderCell(width: 80, text: 'PLAYS'),
        SizedBox(width: 38),
      ],
    );
  }
}

class _TableRow extends StatelessWidget {
  const _TableRow({
    required this.track,
    required this.onOpen,
    required this.onPlay,
  });

  final HomeTrack track;
  final VoidCallback onOpen;
  final VoidCallback? onPlay;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onOpen,
      hoverColor: const Color(0x12FF5500),
      child: _TableLine(
        minHeight: 84,
        bottomBorder: true,
        children: [
          SizedBox(
            width: 330,
            child: Row(
              children: [
                _Artwork(url: track.resolvedImageUrl),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        track.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        _fileName(track.trackUrl),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Color(0xFF9EA4AA),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 170,
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _StatusBadge(
                  label: _status(track.approvalStatus) ?? 'PRIVATE',
                  tone: _statusTone(track.approvalStatus),
                ),
                _StatusBadge(
                  label: _status(track.copyrightStatus) ?? 'UNKNOWN',
                  tone: _statusTone(track.copyrightStatus),
                ),
              ],
            ),
          ),
          SizedBox(
            width: 130,
            child: Text(
              _formatDate(track.createdAt),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          SizedBox(
            width: 280,
            child: Text(
              _adminNote(track),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFFD7D7D7),
                fontSize: 12.5,
                height: 1.35,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          SizedBox(
            width: 80,
            child: Text(
              track.countPlay.toString(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
          SizedBox(
            width: 38,
            child: IconButton(
              tooltip: onPlay == null ? 'Audio is processing' : 'Play',
              color: onPlay == null ? const Color(0xFF777777) : _studioOrange,
              onPressed: onPlay,
              icon: Icon(
                onPlay == null
                    ? Icons.hourglass_bottom_rounded
                    : Icons.play_circle_fill_rounded,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _TableLine extends StatelessWidget {
  const _TableLine({
    required this.children,
    required this.minHeight,
    this.bottomBorder = false,
  });

  final List<Widget> children;
  final double minHeight;
  final bool bottomBorder;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(minHeight: minHeight),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: bottomBorder
            ? const Border(bottom: BorderSide(color: Color(0xFF303030)))
            : null,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: children,
      ),
    );
  }
}

class _HeaderCell extends StatelessWidget {
  const _HeaderCell({required this.width, required this.text});

  final double width;
  final String text;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _StudioTrackTile extends StatelessWidget {
  const _StudioTrackTile({
    required this.track,
    required this.onTap,
    required this.onPlay,
  });

  final HomeTrack track;
  final VoidCallback onTap;
  final VoidCallback? onPlay;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF262626)),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.fromLTRB(10, 10, 6, 10),
        leading: _Artwork(url: track.resolvedImageUrl),
        title: Text(
          track.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Wrap(
            spacing: 7,
            runSpacing: 7,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text(
                track.artistName,
                style: const TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontWeight: FontWeight.w700,
                ),
              ),
              for (final badge in _badges(track))
                _StatusBadge(label: badge.label, tone: badge.tone),
            ],
          ),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: onPlay == null ? 'Audio is processing' : 'Play',
              color: onPlay == null ? const Color(0xFF777777) : _studioOrange,
              onPressed: onPlay,
              icon: Icon(
                onPlay == null
                    ? Icons.hourglass_bottom_rounded
                    : Icons.play_circle_fill_rounded,
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF777777)),
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}

class _Artwork extends StatelessWidget {
  const _Artwork({required this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 56,
        height: 56,
        color: const Color(0xFF242424),
        child: url == null
            ? const Icon(Icons.music_note_rounded, color: Colors.white70)
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) {
                  return const Icon(
                    Icons.music_note_rounded,
                    color: Colors.white70,
                  );
                },
              ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.label, required this.tone});

  final String label;
  final _BadgeTone tone;

  @override
  Widget build(BuildContext context) {
    final style = _badgeStyle(tone);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: style.background,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: style.border),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: style.foreground,
          fontSize: 10.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _StudioMessage extends StatelessWidget {
  const _StudioMessage({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 52, horizontal: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF666666), size: 52),
          const SizedBox(height: 14),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF9A9A9A)),
          ),
        ],
      ),
    );
  }
}
