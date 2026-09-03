part of artist_studio_screen;

class PlansScreen extends ConsumerStatefulWidget {
  const PlansScreen({super.key});

  @override
  ConsumerState<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends ConsumerState<PlansScreen> {
  String? _changingCode;

  @override
  Widget build(BuildContext context) {
    final subscription = ref.watch(artistStudioSubscriptionProvider);
    final plans = ref.watch(subscriptionPlansProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(title: const Text('Plans')),
      body: RefreshIndicator(
        color: _studioOrange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(artistStudioSubscriptionProvider);
          ref.invalidate(subscriptionPlansProvider);
          await Future.wait([
            ref.read(artistStudioSubscriptionProvider.future),
            ref.read(subscriptionPlansProvider.future),
          ]);
        },
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(
            parent: BouncingScrollPhysics(),
          ),
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 120),
          children: [
            const Text(
              'Choose your plan',
              style: TextStyle(
                color: Colors.white,
                fontSize: 30,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Compare upload quota, distribution, monetization and creator benefits.',
              style: TextStyle(
                color: Color(0xFFAAAAAA),
                fontSize: 15,
                fontWeight: FontWeight.w700,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 16),
            subscription.when(
              loading: () => const _PlansStatusCard(
                icon: Icons.sync_rounded,
                title: 'Loading current plan',
                subtitle: 'Checking your subscription before comparing plans.',
              ),
              error: (_, _) => const _PlansStatusCard(
                icon: Icons.cloud_off_rounded,
                title: 'Could not load current plan',
                subtitle: 'You can still view plans, then refresh later.',
              ),
              data: (data) {
                final plan = data?.plan;

                if (plan == null) {
                  return const _PlansStatusCard(
                    icon: Icons.info_outline_rounded,
                    title: 'Current plan unavailable',
                    subtitle: 'Pull down to refresh subscription data.',
                  );
                }

                return _StudioCard(
                  child: Row(
                    children: [
                      Container(
                        width: 46,
                        height: 46,
                        decoration: BoxDecoration(
                          color: _studioOrange.withValues(alpha: 0.16),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.workspace_premium_rounded,
                          color: _studioOrange,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Current plan',
                              style: TextStyle(
                                color: Color(0xFFAAAAAA),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              plan.name,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ),
                      ),
                      _StatusBadge(
                        label: data!.subscription.status,
                        tone: data.subscription.isActive
                            ? _BadgeTone.success
                            : _BadgeTone.warning,
                      ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 14),
            plans.when(
              loading: () {
                return const Padding(
                  padding: EdgeInsets.symmetric(vertical: 46),
                  child: Center(
                    child: CircularProgressIndicator(color: _studioOrange),
                  ),
                );
              },
              error: (_, _) {
                return const _StudioMessage(
                  icon: Icons.cloud_off_rounded,
                  title: 'Could not load plans',
                  subtitle: 'Pull down to try again.',
                );
              },
              data: (items) {
                final list = items.isEmpty ? _fallbackPlans() : items;
                final currentCode =
                    subscription.asData?.value?.plan.code ?? 'BASIC';

                return Column(
                  children: [
                    for (var index = 0; index < list.length; index++) ...[
                      _PlanCard(
                        plan: list[index],
                        currentCode: currentCode,
                        changing: _changingCode == list[index].code,
                        onSelect: subscription.asData?.value == null
                            ? () => _showMissingSubscriptionMessage()
                            : () => _confirmPlanChange(
                                plan: list[index],
                                current: subscription.asData!.value!,
                              ),
                      ),
                      if (index != list.length - 1) const SizedBox(height: 12),
                    ],
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showMissingSubscriptionMessage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Refresh subscription before changing plan.'),
      ),
    );
  }

  Future<void> _confirmPlanChange({
    required _StudioPlan plan,
    required _StudioSubscriptionData current,
  }) async {
    final currentCode = current.plan.code.toUpperCase();
    final nextCode = plan.code.toUpperCase();
    final requiresPayment = plan.monthlyPrice > 0;

    if (currentCode == nextCode || _changingCode != null) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: Text(
            'Switch to ${plan.name}?',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          content: Text(
            requiresPayment
                ? 'VNPay will open in another tab. After paying, return to this app and tap Check status. If VNPay opens a web result page, you can close it.'
                : 'Your Studio access will update after the request succeeds.',
            style: const TextStyle(color: Color(0xFFBDBDBD)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: _studioOrange,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: Text(requiresPayment ? 'Continue to VNPay' : 'Confirm'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _changingCode = plan.code;
    });

    try {
      final response = requiresPayment
          ? await ApiService.instance.createVnPayPaymentApi(plan.code)
          : currentCode == 'BASIC'
          ? await ApiService.instance.subscribePlanApi(plan.code)
          : await ApiService.instance.changeSubscriptionPlanApi(plan.code);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      if (requiresPayment) {
        final payment = _PendingSubscriptionPayment.fromCreateResponse(
          response: response.data,
          plan: plan,
        );

        if (!payment.isValid) {
          throw StateError('Missing payment URL or order code.');
        }

        await SubscriptionPaymentStorage.savePendingPayment(payment.toJson());

        final opened = await launchUrl(
          Uri.parse(payment.paymentUrl),
          mode: LaunchMode.externalApplication,
        );

        if (!opened) {
          throw StateError('Could not open payment URL.');
        }

        ref.invalidate(artistStudioSubscriptionProvider);
        ref.invalidate(subscriptionPaymentHistoryProvider);

        if (!mounted) {
          return;
        }

        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text(_vnpayReturnInstruction)));
        return;
      }

      ref.invalidate(artistStudioSubscriptionProvider);
      ref.invalidate(artistStudioStatsProvider);
      await ref.read(artistStudioSubscriptionProvider.future);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Switched to ${plan.name}')));
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            requiresPayment
                ? 'Could not start subscription payment.'
                : 'Could not change plan.',
          ),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _changingCode = null;
        });
      }
    }
  }
}

class _PlansStatusCard extends StatelessWidget {
  const _PlansStatusCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Row(
        children: [
          Icon(icon, color: _studioOrange),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Color(0xFFAAAAAA),
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
