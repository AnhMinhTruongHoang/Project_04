import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/storage/subscription_payment_storage.dart';
import '../../../services/api/api_service.dart';
import '../../auth/providers/auth_provider.dart';

class SubscriptionPlansScreen extends ConsumerStatefulWidget {
  const SubscriptionPlansScreen({super.key});

  @override
  ConsumerState<SubscriptionPlansScreen> createState() =>
      _SubscriptionPlansScreenState();
}

class _SubscriptionPlansScreenState
    extends ConsumerState<SubscriptionPlansScreen>
    with WidgetsBindingObserver {
  static const _orange = Color(0xFFFF5500);
  late Future<_PlansData> _plansFuture;
  String? _changingCode;
  bool _refreshAfterPayment = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _plansFuture = _loadPlans();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _refreshAfterPayment) {
      _refreshAfterPayment = false;
      _refresh();
    }
  }

  Future<_PlansData> _loadPlans() async {
    final responses = await Future.wait([
      ApiService.instance.getSubscriptionPlansApi(),
      ApiService.instance.getMySubscriptionApi(),
    ]);
    final plansResponse = responses[0];
    final subscriptionResponse = responses[1];

    if (!plansResponse.isSuccess) {
      throw StateError(
        plansResponse.message.isEmpty
            ? 'Could not load subscription plans.'
            : plansResponse.message,
      );
    }

    final plans = ApiService.instance
        .extractResultList(plansResponse)
        .map(_SubscriptionPlan.fromJson)
        .where(
          (plan) =>
              plan.isActive &&
              const {
                'ARTIST',
                'ARTIST_PRO',
                'ARTIST_PRO_DEMO',
              }.contains(plan.code),
        )
        .toList()
      ..sort((first, second) {
        final firstOrder = _planOrder(first.code);
        final secondOrder = _planOrder(second.code);
        return firstOrder.compareTo(secondOrder);
      });

    final current = subscriptionResponse.isSuccess
        ? _CurrentSubscription.fromJson(
            _unwrapResponse(subscriptionResponse.data),
          )
        : null;

    return _PlansData(plans: plans, current: current);
  }

  Future<void> _refresh() async {
    final future = _loadPlans();
    setState(() => _plansFuture = future);
    try {
      await future;
    } catch (_) {}
  }

  Future<void> _choosePlan(
    _SubscriptionPlan plan,
    _CurrentSubscription? current,
  ) async {
    if (_changingCode != null || current?.plan.code == plan.code) return;

    final paid = plan.code == 'ARTIST' || plan.code == 'ARTIST_PRO';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: const Color(0xFF191B1C),
        surfaceTintColor: Colors.transparent,
        title: Text(
          plan.code == 'ARTIST_PRO_DEMO'
              ? 'Activate Artist Pro Demo?'
              : 'Choose ${plan.name}?',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
          ),
        ),
        content: Text(
          paid
              ? 'VNPay will open so you can complete the payment securely.'
              : 'Artist Pro Demo gives you Artist Pro access for 7 days.',
          style: const TextStyle(color: Color(0xFFB0B4B8), height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: _orange),
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(paid ? 'Continue to VNPay' : 'Activate demo'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;
    setState(() => _changingCode = plan.code);

    try {
      if (paid) {
        final response = await ApiService.instance.createVnPayPaymentApi(
          plan.code,
        );
        if (!response.isSuccess) {
          throw StateError(response.message);
        }

        final paymentUrl = _extractPaymentUrl(response.data);
        if (paymentUrl == null) {
          throw StateError('VNPay payment URL was not returned.');
        }

        final orderCode = _extractText(
          response.data,
          const ['orderCode', 'orderId', 'transactionId', 'txnRef'],
        );
        if (orderCode != null) {
          await SubscriptionPaymentStorage.savePendingPayment({
            'orderCode': orderCode,
            'planCode': plan.code,
            'planName': plan.name,
            'paymentUrl': paymentUrl,
            'amount': plan.monthlyPrice,
            'currency': 'VND',
            'status': 'PENDING',
            'createdAt': DateTime.now().toIso8601String(),
          });
        }

        _refreshAfterPayment = true;
        final opened = await launchUrl(
          Uri.parse(paymentUrl),
          mode: LaunchMode.platformDefault,
          webOnlyWindowName: '_self',
        );
        if (!opened) throw StateError('Could not open VNPay.');
      } else {
        final response = await ApiService.instance.changeSubscriptionPlanApi(
          plan.code,
        );
        if (!response.isSuccess) {
          throw StateError(response.message);
        }
        await ref.read(authProvider.notifier).reloadAccount();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artist Pro Demo is active for 7 days.'),
          ),
        );
        await _refresh();
      }
    } catch (error) {
      if (!mounted) return;
      final message = error is StateError
          ? error.message.toString()
          : paid
          ? 'Could not start the VNPay payment.'
          : 'Could not activate Artist Pro Demo.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } finally {
      if (mounted) setState(() => _changingCode = null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF090B0C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF111314),
        foregroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        title: const Text(
          'Plans',
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
      ),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF17191A), Color(0xFF090B0C)],
          ),
        ),
        child: FutureBuilder<_PlansData>(
          future: _plansFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting &&
                !snapshot.hasData) {
              return const Center(
                child: CircularProgressIndicator(color: _orange),
              );
            }

            if (snapshot.hasError) {
              return _PlansError(onRetry: _refresh);
            }

            final data = snapshot.data!;
            return RefreshIndicator(
              color: _orange,
              backgroundColor: const Color(0xFF202224),
              onRefresh: _refresh,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(
                  parent: BouncingScrollPhysics(),
                ),
                padding: const EdgeInsets.fromLTRB(18, 34, 18, 150),
                children: [
                  const Icon(
                    Icons.workspace_premium_rounded,
                    color: _orange,
                    size: 42,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Available plans.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 31,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1.2,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Choose the creator tools that match your music journey.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF9CA3AF),
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                  if (data.current != null) ...[
                    const SizedBox(height: 18),
                    _CurrentPlanSummary(subscription: data.current!),
                  ],
                  const SizedBox(height: 30),
                  if (data.plans.isEmpty)
                    const _EmptyPlans()
                  else
                    for (var index = 0; index < data.plans.length; index++) ...[
                      _PlanCard(
                        plan: data.plans[index],
                        currentCode: data.current?.plan.code,
                        changing: _changingCode == data.plans[index].code,
                        onChoose: () => _choosePlan(
                          data.plans[index],
                          data.current,
                        ),
                      ),
                      if (index != data.plans.length - 1)
                        const SizedBox(height: 18),
                    ],
                  const SizedBox(height: 32),
                  const Divider(color: Color(0xFF292B2D)),
                  const SizedBox(height: 14),
                  const Text(
                    'Artist Pro Demo provides 7 days of Artist Pro access. '
                    'Artist and Artist Pro purchases use VNPay.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: Color(0xFF747B84),
                      fontSize: 12,
                      height: 1.6,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CurrentPlanSummary extends StatelessWidget {
  const _CurrentPlanSummary({required this.subscription});

  final _CurrentSubscription subscription;

  @override
  Widget build(BuildContext context) {
    final demo = subscription.plan.code == 'ARTIST_PRO_DEMO';
    final accent = demo ? const Color(0xFF22C55E) : const Color(0xFFFF5500);
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 10,
      runSpacing: 8,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
          decoration: BoxDecoration(
            color: accent.withValues(alpha: 0.13),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: accent.withValues(alpha: 0.45)),
          ),
          child: Text(
            'Current plan: ${subscription.plan.name}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
        Text(
          'Active until ${_formatDate(subscription.currentPeriodEnd)}',
          style: const TextStyle(color: Color(0xFF8B949E), fontSize: 12),
        ),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.currentCode,
    required this.changing,
    required this.onChoose,
  });

  final _SubscriptionPlan plan;
  final String? currentCode;
  final bool changing;
  final VoidCallback onChoose;

  @override
  Widget build(BuildContext context) {
    final accent = _accentFor(plan.code);
    final current = currentCode == plan.code;
    final demo = plan.code == 'ARTIST_PRO_DEMO';
    final popular = plan.code == 'ARTIST_PRO';

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [accent.withValues(alpha: 0.13), const Color(0xFF101213)],
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: current ? accent : accent.withValues(alpha: 0.42),
          width: current ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: accent.withValues(alpha: 0.08),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 28, 22, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Icon(
                  popular
                      ? Icons.workspace_premium_rounded
                      : demo
                      ? Icons.bolt_rounded
                      : Icons.graphic_eq_rounded,
                  color: accent,
                  size: 34,
                ),
                const SizedBox(height: 14),
                Text(
                  plan.name,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  plan.description.isEmpty
                      ? 'More tools to grow your music on SoundClone.'
                      : plan.description,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Color(0xFF9CA3AF),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  demo ? 'Free' : '${_formatPrice(plan.monthlyPrice)} VNĐ',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 25,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  demo ? '/ 7 days' : '/ month',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: demo ? accent : const Color(0xFF8B949E),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(46),
                    backgroundColor: demo
                        ? accent.withValues(alpha: 0.18)
                        : const Color(0xFF050505),
                    disabledBackgroundColor: Colors.white.withValues(
                      alpha: 0.06,
                    ),
                    foregroundColor: Colors.white,
                    shape: const StadiumBorder(),
                    side: BorderSide(color: accent.withValues(alpha: 0.55)),
                  ),
                  onPressed: current || changing ? null : onChoose,
                  child: changing
                      ? SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: accent,
                          ),
                        )
                      : Text(
                          current
                              ? 'Current plan'
                              : demo
                              ? 'Activate 7-day demo'
                              : 'Choose ${plan.name}',
                          style: const TextStyle(fontWeight: FontWeight.w900),
                        ),
                ),
                const SizedBox(height: 22),
                _Feature(
                  icon: Icons.cloud_upload_rounded,
                  text: plan.unlimitedUploads
                      ? 'Unlimited uploads'
                      : '${plan.uploadMinutesLimit.toStringAsFixed(0)} upload minutes',
                ),
                _Feature(
                  icon: Icons.insights_rounded,
                  text: plan.advancedInsightsDays <= 0
                      ? 'Unlimited advanced insights'
                      : '${plan.advancedInsightsDays} days of advanced insights',
                ),
                _Feature(
                  icon: Icons.public_rounded,
                  text: plan.canDistribute
                      ? 'Music distribution included'
                      : 'Standard public publishing',
                ),
                _Feature(
                  icon: Icons.schedule_rounded,
                  text: plan.canScheduleRelease
                      ? 'Schedule releases'
                      : 'Manual publishing',
                ),
                _Feature(
                  icon: Icons.attach_money_rounded,
                  text: plan.canMonetize
                      ? 'Creator monetization'
                      : 'Monetization not included',
                ),
              ],
            ),
          ),
          if (popular)
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                color: accent,
                child: const Text(
                  'MOST POPULAR',
                  style: TextStyle(
                    color: Color(0xFF111111),
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _Feature extends StatelessWidget {
  const _Feature({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 11),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFFD3D6D8), size: 19),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFFD3D6D8),
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PlansError extends StatelessWidget {
  const _PlansError({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off_rounded, color: Colors.white54, size: 46),
            const SizedBox(height: 14),
            const Text(
              'Could not load plans',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Check your connection and try again.',
              style: TextStyle(color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 18),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: _SubscriptionPlansScreenState._orange),
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyPlans extends StatelessWidget {
  const _EmptyPlans();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 40),
      child: Column(
        children: [
          Icon(Icons.layers_clear_rounded, color: Colors.white38, size: 44),
          SizedBox(height: 12),
          Text(
            'No upgrade plans are available right now.',
            textAlign: TextAlign.center,
            style: TextStyle(color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }
}

class _PlansData {
  const _PlansData({required this.plans, required this.current});
  final List<_SubscriptionPlan> plans;
  final _CurrentSubscription? current;
}

class _CurrentSubscription {
  const _CurrentSubscription({required this.plan, this.currentPeriodEnd});
  final _SubscriptionPlan plan;
  final String? currentPeriodEnd;

  factory _CurrentSubscription.fromJson(dynamic value) {
    final json = value is Map ? Map<String, dynamic>.from(value) : const <String, dynamic>{};
    final subscription = json['subscription'] is Map
        ? Map<String, dynamic>.from(json['subscription'] as Map)
        : const <String, dynamic>{};
    return _CurrentSubscription(
      plan: _SubscriptionPlan.fromJson(json['plan']),
      currentPeriodEnd: subscription['currentPeriodEnd']?.toString(),
    );
  }
}

class _SubscriptionPlan {
  const _SubscriptionPlan({
    required this.code,
    required this.name,
    required this.description,
    required this.monthlyPrice,
    required this.uploadMinutesLimit,
    required this.unlimitedUploads,
    required this.advancedInsightsDays,
    required this.canDistribute,
    required this.canMonetize,
    required this.canScheduleRelease,
    required this.isActive,
  });

  final String code;
  final String name;
  final String description;
  final double monthlyPrice;
  final double uploadMinutesLimit;
  final bool unlimitedUploads;
  final int advancedInsightsDays;
  final bool canDistribute;
  final bool canMonetize;
  final bool canScheduleRelease;
  final bool isActive;

  factory _SubscriptionPlan.fromJson(dynamic value) {
    final json = value is Map ? Map<String, dynamic>.from(value) : const <String, dynamic>{};
    final code = (json['code']?.toString() ?? 'BASIC').trim().toUpperCase();
    return _SubscriptionPlan(
      code: code,
      name: (json['name']?.toString().trim().isNotEmpty ?? false)
          ? json['name'].toString().trim()
          : _planName(code),
      description: json['description']?.toString().trim() ?? '',
      monthlyPrice: _toDouble(json['monthlyPrice'] ?? json['price']),
      uploadMinutesLimit: _toDouble(
        json['uploadMinutesLimit'] ?? json['limitMinutes'],
      ),
      unlimitedUploads: json['unlimitedUploads'] == true,
      advancedInsightsDays: _toInt(json['advancedInsightsDays']),
      canDistribute: json['canDistribute'] == true,
      canMonetize: json['canMonetize'] == true,
      canScheduleRelease: json['canScheduleRelease'] == true,
      isActive: json['isActive'] != false,
    );
  }
}

dynamic _unwrapResponse(dynamic value) {
  var result = value;
  while (result is Map && result['data'] != null) {
    result = result['data'];
  }
  return result;
}

String? _extractPaymentUrl(dynamic value) {
  final direct = _extractText(
    value,
    const [
      'paymentUrl',
      'paymentURL',
      'vnpayUrl',
      'vnPayUrl',
      'payUrl',
      'checkoutUrl',
      'redirectUrl',
      'paymentLink',
      'url',
    ],
  );
  final uri = Uri.tryParse(direct ?? '');
  return uri != null &&
          (uri.scheme == 'http' || uri.scheme == 'https') &&
          uri.host.isNotEmpty
      ? direct
      : null;
}

String? _extractText(dynamic value, List<String> keys) {
  if (value is! Map) return null;
  final json = Map<String, dynamic>.from(value);
  for (final key in keys) {
    final text = json[key]?.toString().trim();
    if (text != null && text.isNotEmpty && text != 'null') return text;
  }
  for (final key in const ['data', 'result', 'payment', 'checkout', 'vnpay']) {
    final text = _extractText(json[key], keys);
    if (text != null) return text;
  }
  return null;
}

int _planOrder(String code) => switch (code) {
  'ARTIST_PRO_DEMO' => 0,
  'ARTIST' => 1,
  'ARTIST_PRO' => 2,
  _ => 3,
};

Color _accentFor(String code) => switch (code) {
  'ARTIST_PRO_DEMO' => const Color(0xFF22C55E),
  'ARTIST_PRO' => const Color(0xFFD7A928),
  _ => const Color(0xFFFF5500),
};

String _planName(String code) => switch (code) {
  'ARTIST_PRO_DEMO' => 'Artist Pro Demo',
  'ARTIST_PRO' => 'Artist Pro',
  'ARTIST' => 'Artist',
  _ => 'Basic',
};

double _toDouble(dynamic value) =>
    value is num ? value.toDouble() : double.tryParse('$value') ?? 0;

int _toInt(dynamic value) =>
    value is num ? value.toInt() : int.tryParse('$value') ?? 0;

String _formatPrice(double value) {
  final digits = value.round().toString();
  final buffer = StringBuffer();
  for (var index = 0; index < digits.length; index++) {
    if (index > 0 && (digits.length - index) % 3 == 0) buffer.write('.');
    buffer.write(digits[index]);
  }
  return buffer.toString();
}

String _formatDate(String? value) {
  final date = DateTime.tryParse(value ?? '');
  if (date == null) return '--';
  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day/$month/${date.year}';
}
