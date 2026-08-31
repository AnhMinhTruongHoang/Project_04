part of 'profile_screen.dart';

class ProfileMobileHero extends ConsumerWidget {
  const ProfileMobileHero({
    super.key,
    required this.user,
    required this.isOwner,
    required this.onUploadCover,
  });

  final UserModel user;
  final bool isOwner;
  final VoidCallback onUploadCover;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coverUrl = _resolveMediaUrl(user.coverUrl);
    final avatarUrl = _resolveMediaUrl(user.avatarUrl);
    final badges = ref.watch(_profileBadgesProvider(user.id)).value ?? const [];
    final verifiedBadge = badges.cast<Map<String, dynamic>?>().firstWhere(
      (item) => _badgeCode(item) == 'VERIFIED_ARTIST',
      orElse: () => null,
    );
    final secondaryBadges = badges
        .where((item) => _badgeCode(item) != 'VERIFIED_ARTIST')
        .take(2)
        .toList();

    return Stack(
      fit: StackFit.expand,
      children: [
        if (coverUrl != null)
          Image.network(
            coverUrl,
            fit: BoxFit.cover,
            alignment: Alignment.center,
            errorBuilder: (_, _, _) => const _HeroCoverFallback(),
          )
        else
          const _HeroCoverFallback(),
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0x28000000), Color(0x66000000)],
              stops: [0.2, 1],
            ),
          ),
        ),
        if (isOwner)
          Positioned(
            top: 70,
            right: 14,
            child: FilledButton.icon(
              onPressed: onUploadCover,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xE6050505),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 13,
                  vertical: 10,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(5),
                ),
              ),
              icon: const Icon(Icons.camera_alt_rounded, size: 17),
              label: const Text(
                'Upload header image',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900),
              ),
            ),
          ),
        Positioned(
          left: 18,
          right: 18,
          bottom: 22,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                width: 116,
                height: 116,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0x33FFFFFF),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x73000000),
                      blurRadius: 28,
                      offset: Offset(0, 12),
                    ),
                  ],
                ),
                child: ClipOval(
                  child: ColoredBox(
                    color: const Color(0xFFFF5500),
                    child: avatarUrl == null
                        ? _HeroInitials(user: user)
                        : Image.network(
                            avatarUrl,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) =>
                                _HeroInitials(user: user),
                          ),
                  ),
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 5,
                      ),
                      color: const Color(0xB8000000),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Flexible(
                            child: Text(
                              user.name.isEmpty ? user.email : user.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                height: 1.1,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          if (verifiedBadge != null || user.verified) ...[
                            const SizedBox(width: 6),
                            const Icon(
                              Icons.verified_rounded,
                              color: Color(0xFF4DA3FF),
                              size: 22,
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    if (isOwner || _publicHandle(user).isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        color: const Color(0xB8000000),
                        child: Text(
                          isOwner ? user.email : _publicHandle(user),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFFD0D0D0),
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    if (secondaryBadges.isNotEmpty) ...[
                      const SizedBox(height: 7),
                      Wrap(
                        spacing: 6,
                        runSpacing: 5,
                        children: secondaryBadges
                            .map((item) => _HeroBadgeChip(item: item))
                            .toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class ProfileMobileDetails extends StatelessWidget {
  const ProfileMobileDetails({
    super.key,
    required this.user,
    required this.isOwner,
    required this.onEdit,
    required this.onShare,
  });
  final UserModel user;
  final bool isOwner;
  final VoidCallback onEdit;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              _HeroActionButton(
                icon: Icons.share_rounded,
                tooltip: 'Share',
                onTap: onShare,
              ),
              if (isOwner) ...[
                const SizedBox(width: 8),
                OutlinedButton.icon(
                  onPressed: onEdit,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF555555)),
                  ),
                  icon: const Icon(Icons.edit_rounded, size: 16),
                  label: const Text('Edit'),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          if ((user.bio ?? '').trim().isNotEmpty)
            Text(
              user.bio!.trim(),
              style: const TextStyle(
                color: Color(0xFFE0E0E0),
                fontSize: 14,
                height: 1.45,
              ),
            ),
          if ((user.website ?? '').isNotEmpty) ...[
            const SizedBox(height: 10),
            Wrap(
              spacing: 14,
              runSpacing: 8,
              children: [
                if ((user.website ?? '').isNotEmpty)
                  _ProfileMeta(
                    icon: Icons.link_rounded,
                    text: user.website!,
                    orange: true,
                  ),
              ],
            ),
          ],
          const SizedBox(height: 16),
          Row(
            children: [
              _FollowStat(value: user.followers, label: 'Followers'),
              const SizedBox(width: 24),
              _FollowStat(value: user.following, label: 'Following'),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(color: Color(0xFF262626), height: 1),
        ],
      ),
    );
  }
}

String _publicHandle(UserModel user) {
  final username = user.username?.trim() ?? '';

  if (username.isEmpty || username.contains('@')) {
    return '';
  }

  return '@$username';
}

class _HeroCoverFallback extends StatelessWidget {
  const _HeroCoverFallback();

  @override
  Widget build(BuildContext context) {
    return const ColoredBox(
      color: Color(0xFF151718),
      child: Center(
        child: Icon(
          Icons.graphic_eq_rounded,
          color: Color(0x2EFFFFFF),
          size: 92,
        ),
      ),
    );
  }
}

class _HeroInitials extends StatelessWidget {
  const _HeroInitials({required this.user});
  final UserModel user;

  @override
  Widget build(BuildContext context) {
    final source = user.name.trim().isEmpty ? user.email : user.name;
    final words = source
        .trim()
        .split(RegExp(r'\s+'))
        .where((e) => e.isNotEmpty);
    final initials = words.isEmpty
        ? 'U'
        : words.length > 1
        ? '${words.first[0]}${words.last[0]}'.toUpperCase()
        : words.first[0].toUpperCase();
    return Center(
      child: Text(
        initials,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 38,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _HeroActionButton extends StatelessWidget {
  const _HeroActionButton({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });
  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: const Color(0xC9000000),
        shape: const CircleBorder(side: BorderSide(color: Color(0x66FFFFFF))),
        child: InkWell(
          customBorder: const CircleBorder(),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
        ),
      ),
    );
  }
}

class _HeroBadgeChip extends StatelessWidget {
  const _HeroBadgeChip({required this.item});
  final Map<String, dynamic> item;

  @override
  Widget build(BuildContext context) {
    final badge = Map<String, dynamic>.from(item['badge'] as Map);
    final code = badge['code']?.toString() ?? '';
    final name = badge['name']?.toString() ?? code;
    final color =
        _hexColor(badge['color']?.toString()) ?? const Color(0xFFFFB020);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_badgeIcon(code), color: color, size: 14),
          const SizedBox(width: 4),
          Text(
            name,
            style: TextStyle(
              color: color,
              fontSize: 10,
              fontWeight: FontWeight.w900,
            ),
          ),
        ],
      ),
    );
  }
}

String _badgeCode(Map<String, dynamic>? item) {
  if (item == null || item['badge'] is! Map) return '';
  return (item['badge'] as Map)['code']?.toString().toUpperCase() ?? '';
}

IconData _badgeIcon(String code) {
  switch (code.toUpperCase()) {
    case 'VERIFIED_ARTIST':
      return Icons.verified_rounded;
    case 'FOUNDING_ARTIST':
      return Icons.military_tech_rounded;
    case 'EARLY_SUPPORTER':
      return Icons.favorite_rounded;
    case 'TOP_LISTENER':
      return Icons.headphones_rounded;
    default:
      return Icons.workspace_premium_rounded;
  }
}

Color? _hexColor(String? value) {
  if (value == null) return null;
  final normalized = value.replaceFirst('#', '').trim();
  if (normalized.length != 6 && normalized.length != 8) return null;
  final parsed = int.tryParse(normalized, radix: 16);
  if (parsed == null) return null;
  return Color(normalized.length == 6 ? 0xFF000000 | parsed : parsed);
}
