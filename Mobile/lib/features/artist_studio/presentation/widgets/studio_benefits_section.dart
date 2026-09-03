part of artist_studio_screen;

class _BenefitsSection extends ConsumerWidget {
  const _BenefitsSection({required this.benefits, required this.subscription});

  final AsyncValue<List<_ArtistBenefit>> benefits;
  final AsyncValue<_StudioSubscriptionData?> subscription;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return subscription.when(
      loading: () {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 42),
          child: Center(child: CircularProgressIndicator(color: _studioOrange)),
        );
      },
      error: (_, _) {
        return const _StudioMessage(
          icon: Icons.cloud_off_rounded,
          title: 'Could not load benefits',
          subtitle: 'Pull down to try again.',
        );
      },
      data: (subscriptionData) {
        final plan = subscriptionData?.plan ?? const _StudioPlan();
        final unlocked = plan.hasMembershipBenefits;

        return benefits.when(
          loading: () {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 42),
              child: Center(
                child: CircularProgressIndicator(color: _studioOrange),
              ),
            );
          },
          error: (_, _) {
            return const _StudioMessage(
              icon: Icons.card_membership_rounded,
              title: 'Could not load membership benefits',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (items) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _BenefitsHero(
                  plan: plan,
                  unlocked: unlocked,
                  onUpgrade: subscriptionData == null
                      ? null
                      : () => context.push('/plans'),
                ),
                const SizedBox(height: 12),
                if (items.isEmpty)
                  const _StudioMessage(
                    icon: Icons.workspace_premium_rounded,
                    title: 'No membership benefits available',
                    subtitle: 'Benefits will appear when they are added.',
                  )
                else
                  for (var index = 0; index < items.length; index++) ...[
                    _BenefitCard(benefit: items[index], unlocked: unlocked),
                    if (index != items.length - 1) const SizedBox(height: 10),
                  ],
              ],
            );
          },
        );
      },
    );
  }
}

class _BenefitsHero extends StatelessWidget {
  const _BenefitsHero({
    required this.plan,
    required this.unlocked,
    required this.onUpgrade,
  });

  final _StudioPlan plan;
  final bool unlocked;
  final VoidCallback? onUpgrade;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: unlocked
                      ? const Color(0x29F4C542)
                      : const Color(0xFF242424),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  unlocked
                      ? Icons.workspace_premium_rounded
                      : Icons.lock_outline_rounded,
                  color: unlocked ? const Color(0xFFF4C542) : Colors.white54,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        const Text(
                          'Artist Pro Benefits',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        _StatusBadge(
                          label: unlocked ? 'Active' : 'Artist Pro',
                          tone: unlocked
                              ? _BadgeTone.success
                              : _BadgeTone.muted,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      unlocked
                          ? 'Your ${plan.name} membership benefits are active.'
                          : 'Upgrade to Artist Pro to unlock membership benefits.',
                      style: const TextStyle(
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
          if (!unlocked) ...[
            const SizedBox(height: 14),
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: _studioOrange,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(44),
              ),
              onPressed: onUpgrade,
              icon: const Icon(Icons.arrow_upward_rounded),
              label: const Text('Upgrade to Artist Pro'),
            ),
          ],
        ],
      ),
    );
  }
}

class _BenefitCard extends StatelessWidget {
  const _BenefitCard({required this.benefit, required this.unlocked});

  final _ArtistBenefit benefit;
  final bool unlocked;

  @override
  Widget build(BuildContext context) {
    final imageUrl = benefit.resolvedImageUrl;

    return Opacity(
      opacity: unlocked ? 1 : 0.58,
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: const Color(0xFF151515),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: unlocked ? const Color(0x33F4C542) : const Color(0xFF2B2B2B),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 8.5,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  if (imageUrl == null)
                    Container(
                      color: const Color(0xFF202020),
                      child: const Icon(
                        Icons.image_not_supported_rounded,
                        color: Colors.white38,
                        size: 34,
                      ),
                    )
                  else
                    Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) {
                        return Container(
                          color: const Color(0xFF202020),
                          child: const Icon(
                            Icons.image_not_supported_rounded,
                            color: Colors.white38,
                            size: 34,
                          ),
                        );
                      },
                    ),
                  if (!unlocked)
                    Container(
                      color: Colors.black.withValues(alpha: 0.52),
                      child: const Center(
                        child: _StatusBadge(
                          label: 'Locked',
                          tone: _BadgeTone.muted,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    benefit.title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    benefit.description.isEmpty
                        ? 'No description available.'
                        : benefit.description,
                    style: const TextStyle(
                      color: Color(0xFFAAAAAA),
                      fontWeight: FontWeight.w700,
                      height: 1.35,
                    ),
                  ),
                  if (benefit.saveLabel != null) ...[
                    const SizedBox(height: 12),
                    _StatusBadge(
                      label: benefit.saveLabel!,
                      tone: unlocked ? _BadgeTone.success : _BadgeTone.muted,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
