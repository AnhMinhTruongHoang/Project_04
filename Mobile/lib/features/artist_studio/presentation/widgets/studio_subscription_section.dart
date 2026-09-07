part of artist_studio_screen;

class _LockedStudioSection extends StatelessWidget {
  const _LockedStudioSection({required this.section});

  final _StudioSection section;

  @override
  Widget build(BuildContext context) {
    return _StudioMessage(
      icon: Icons.hourglass_empty_rounded,
      title: section.label,
      subtitle: 'This section is not available yet.',
    );
  }
}

class _SubscriptionPanel extends ConsumerStatefulWidget {
  const _SubscriptionPanel({required this.subscription});

  final AsyncValue<_StudioSubscriptionData?> subscription;

  @override
  ConsumerState<_SubscriptionPanel> createState() => _SubscriptionPanelState();
}

class _SubscriptionPanelState extends ConsumerState<_SubscriptionPanel>
    with WidgetsBindingObserver {
  bool _canceling = false;
  bool _checkingPayment = false;
  String? _checkingHistoryOrderCode;
  int _paymentHistoryLimit = 5;
  bool _refreshAfterPayment = false;
  _PendingSubscriptionPayment? _pendingPayment;
  String? _paymentMessage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_loadPendingPayment());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || !_refreshAfterPayment) {
      return;
    }

    _refreshAfterPayment = false;
    unawaited(_checkPendingPayment(refreshSubscription: true));
  }

  @override
  Widget build(BuildContext context) {
    return widget.subscription.when(
      loading: () {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 42),
          child: Center(child: CircularProgressIndicator(color: _studioOrange)),
        );
      },
      error: (_, _) {
        return const _StudioMessage(
          icon: Icons.cloud_off_rounded,
          title: 'Could not load subscription',
          subtitle: 'Pull down to try again.',
        );
      },
      data: (data) {
        if (data == null) {
          return const _StudioMessage(
            icon: Icons.warning_amber_rounded,
            title: 'Subscription information is not available',
            subtitle: 'Try refreshing Artist Studio.',
          );
        }

        final plan = data.plan;
        final subscription = data.subscription;
        final usage = data.usage;
        final history = ref.watch(
          subscriptionPaymentHistoryProvider(_paymentHistoryLimit),
        );
        final isBasic = plan.code.toUpperCase() == 'BASIC';
        final canCancel =
            !isBasic &&
            subscription.isActive &&
            !subscription.cancelAtPeriodEnd;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_pendingPayment != null) ...[
              _PendingPaymentCard(
                payment: _pendingPayment!,
                checking: _checkingPayment,
                message: _paymentMessage,
                onOpenPayment: _openPendingPayment,
                onCheckStatus: () =>
                    _checkPendingPayment(refreshSubscription: true),
                onDismiss: _clearPendingPayment,
              ),
              const SizedBox(height: 12),
            ],
            _StudioCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _StatusBadge(
                        label: plan.name,
                        tone: isBasic ? _BadgeTone.muted : _BadgeTone.success,
                      ),
                      _StatusBadge(
                        label: subscription.status,
                        tone: subscription.isActive
                            ? _BadgeTone.success
                            : _BadgeTone.warning,
                      ),
                      if (subscription.cancelAtPeriodEnd)
                        const _StatusBadge(
                          label: 'Cancellation scheduled',
                          tone: _BadgeTone.warning,
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    plan.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    plan.description.isEmpty
                        ? 'Manage your SoundClone subscription and creator access.'
                        : plan.description,
                    style: const TextStyle(
                      color: Color(0xFFAAAAAA),
                      fontWeight: FontWeight.w700,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _formatMoney(plan.monthlyPrice),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: _studioOrange,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    onPressed: () => context.push('/plans'),
                    icon: const Icon(Icons.credit_card_rounded),
                    label: const Text('View plans'),
                  ),
                  if (!isBasic) ...[
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFFF8A94),
                        disabledForegroundColor: const Color(0xFF666666),
                        side: const BorderSide(color: Color(0xFFFF8A94)),
                        minimumSize: const Size.fromHeight(44),
                      ),
                      onPressed: canCancel && !_canceling
                          ? () => _confirmCancel(data)
                          : null,
                      icon: const Icon(Icons.cancel_schedule_send_rounded),
                      label: Text(
                        subscription.cancelAtPeriodEnd
                            ? 'Cancellation scheduled'
                            : 'Cancel at period end',
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 12),
            _StudioCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Subscription period',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _InfoRows(
                    rows: [
                      _InfoRowData(
                        'Activated',
                        _formatDate(subscription.startedAt),
                      ),
                      _InfoRowData(
                        'Period started',
                        _formatDate(subscription.currentPeriodStart),
                      ),
                      _InfoRowData(
                        'Active until',
                        _formatDate(subscription.currentPeriodEnd),
                      ),
                      _InfoRowData(
                        'Days remaining',
                        '${_remainingDays(subscription.currentPeriodEnd)} days',
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            _StudioCard(
              child: usage.unlimited
                  ? _UnlimitedQuotaStatus(usage: usage)
                  : _LimitedQuotaStatus(usage: usage),
            ),
            const SizedBox(height: 12),
            _SubscriptionPaymentHistorySection(
              history: history,
              checkingOrderCode: _checkingHistoryOrderCode,
              pendingPayment: _pendingPayment,
              onRefresh: () {
                ref.invalidate(subscriptionPaymentHistoryProvider);
              },
              onLoadMore: () {
                setState(() {
                  _paymentHistoryLimit += 5;
                });
              },
              onOpenPayment: _openPaymentUrl,
              onCheckStatus: _checkHistoryPayment,
            ),
            const SizedBox(height: 12),
            _StudioCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Plan features',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...() {
                    final features = _subscriptionFeatures(plan);

                    return [
                      for (var index = 0; index < features.length; index++) ...[
                        _PlanFeatureTile(feature: features[index]),
                        if (index != features.length - 1)
                          const SizedBox(height: 8),
                      ],
                    ];
                  }(),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _confirmCancel(_StudioSubscriptionData data) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: const Text(
            'Cancel subscription?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: Text(
            'Your ${data.plan.name} access will remain active until ${_formatDate(data.subscription.currentPeriodEnd)}.',
            style: const TextStyle(color: Color(0xFFBDBDBD)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Keep plan'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF6975),
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Cancel plan'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _canceling = true;
    });

    try {
      final response = await ApiService.instance.cancelSubscriptionApi();

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      ref.invalidate(artistStudioSubscriptionProvider);
      await ref.read(artistStudioSubscriptionProvider.future);

      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Cancellation has been scheduled.');
    } catch (_) {
      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Could not cancel subscription.');
    } finally {
      if (mounted) {
        setState(() {
          _canceling = false;
        });
      }
    }
  }

  Future<void> _showPlans(_StudioSubscriptionData current) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return _PlansSheet(
          current: current,
          onPaymentStarted: (payment) {
            setState(() {
              _pendingPayment = payment;
              _paymentMessage = _vnpayReturnInstruction;
            });
            _refreshAfterPayment = true;
          },
          onPlanChanged: () async {
            await _refreshSubscription();
          },
        );
      },
    );
  }

  Future<void> _loadPendingPayment() async {
    final data = await SubscriptionPaymentStorage.getPendingPayment();

    if (!mounted) {
      return;
    }

    if (data == null) {
      return;
    }

    final payment = _PendingSubscriptionPayment.fromJson(data);

    if (!payment.isValid) {
      await SubscriptionPaymentStorage.clearPendingPayment();
      return;
    }

    setState(() {
      _pendingPayment = payment;
    });
  }

  Future<void> _openPendingPayment() async {
    final payment = _pendingPayment;

    if (payment == null || _checkingPayment) {
      return;
    }

    _refreshAfterPayment = true;

    final opened = await launchUrl(
      Uri.parse(payment.paymentUrl),
      mode: LaunchMode.externalApplication,
    );

    if (!mounted) {
      return;
    }

    setState(() {
      _paymentMessage = opened
          ? _vnpayReturnInstruction
          : 'Could not open VNPay payment.';
    });
  }

  Future<void> _checkPendingPayment({required bool refreshSubscription}) async {
    final payment = _pendingPayment;

    if (payment == null || _checkingPayment) {
      return;
    }

    setState(() {
      _checkingPayment = true;
      _paymentMessage = null;
    });

    try {
      final response = await ApiService.instance.getPaymentApi(
        payment.orderCode,
      );

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final status = _SubscriptionPaymentStatus.fromJson(response.data);
      final nextPayment = payment.copyWith(status: status.status);

      if (status.paid) {
        await SubscriptionPaymentStorage.clearPendingPayment();

        if (refreshSubscription) {
          await _refreshSubscription();
        }

        ref.invalidate(subscriptionPaymentHistoryProvider);

        if (!mounted) {
          return;
        }

        setState(() {
          _pendingPayment = null;
          _paymentMessage = null;
        });

        showAppToast(context, message: 'Payment confirmed. Plan updated.');
        return;
      }

      await SubscriptionPaymentStorage.savePendingPayment(nextPayment.toJson());
      ref.invalidate(subscriptionPaymentHistoryProvider);

      if (!mounted) {
        return;
      }

      setState(() {
        _pendingPayment = nextPayment;
        _paymentMessage = _paymentStatusMessage(status);
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _paymentMessage = 'Could not check payment status.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _checkingPayment = false;
        });
      }
    }
  }

  Future<void> _clearPendingPayment() async {
    await SubscriptionPaymentStorage.clearPendingPayment();

    if (!mounted) {
      return;
    }

    setState(() {
      _pendingPayment = null;
      _paymentMessage = null;
    });
    ref.invalidate(subscriptionPaymentHistoryProvider);
  }

  Future<void> _refreshSubscription() async {
    ref.invalidate(artistStudioSubscriptionProvider);
    ref.invalidate(artistStudioStatsProvider);
    await ref.read(artistStudioSubscriptionProvider.future);
  }

  Future<void> _openPaymentUrl(String paymentUrl) async {
    final uri = Uri.tryParse(paymentUrl.trim());

    if (uri == null) {
      return;
    }

    _refreshAfterPayment = true;
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  Future<void> _checkHistoryPayment(
    _SubscriptionPaymentHistoryItem payment,
  ) async {
    if (_checkingHistoryOrderCode != null) {
      return;
    }

    setState(() {
      _checkingHistoryOrderCode = payment.orderCode;
    });

    try {
      final response = await ApiService.instance.getPaymentApi(
        payment.orderCode,
      );

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final status = _SubscriptionPaymentStatus.fromJson(response.data);

      if (_pendingPayment?.orderCode == payment.orderCode) {
        if (status.paid) {
          await SubscriptionPaymentStorage.clearPendingPayment();
        } else {
          final nextPayment = _pendingPayment!.copyWith(status: status.status);
          await SubscriptionPaymentStorage.savePendingPayment(
            nextPayment.toJson(),
          );
        }
      }

      if (status.paid) {
        await _refreshSubscription();
      }

      ref.invalidate(subscriptionPaymentHistoryProvider);

      if (!mounted) {
        return;
      }

      showAppToast(context, message: _paymentStatusMessage(status));
      setState(() {
        if (_pendingPayment?.orderCode == payment.orderCode) {
          if (status.paid) {
            _pendingPayment = null;
            _paymentMessage = null;
          } else {
            _pendingPayment = _pendingPayment!.copyWith(status: status.status);
            _paymentMessage = _paymentStatusMessage(status);
          }
        }
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Could not check payment status.');
    } finally {
      if (mounted) {
        setState(() {
          _checkingHistoryOrderCode = null;
        });
      }
    }
  }
}

class _StudioCard extends StatelessWidget {
  const _StudioCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF151515),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2B2B2B)),
      ),
      child: child,
    );
  }
}

class _PendingPaymentCard extends StatelessWidget {
  const _PendingPaymentCard({
    required this.payment,
    required this.checking,
    required this.message,
    required this.onOpenPayment,
    required this.onCheckStatus,
    required this.onDismiss,
  });

  final _PendingSubscriptionPayment payment;
  final bool checking;
  final String? message;
  final VoidCallback onOpenPayment;
  final VoidCallback onCheckStatus;
  final VoidCallback onDismiss;

  @override
  Widget build(BuildContext context) {
    final status = payment.status.toUpperCase();
    final finalStatus = _isFinalPaymentStatus(status);
    final failed = finalStatus && status != 'PAID';

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
                  color: failed
                      ? const Color(0x29FF6975)
                      : _studioOrange.withValues(alpha: 0.16),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  failed ? Icons.error_outline_rounded : Icons.payments_rounded,
                  color: failed ? const Color(0xFFFF8A94) : _studioOrange,
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
                      children: [
                        _StatusBadge(
                          label: status,
                          tone: failed ? _BadgeTone.error : _BadgeTone.warning,
                        ),
                        _StatusBadge(
                          label: payment.planName,
                          tone: _BadgeTone.muted,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Subscription payment',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_formatCurrency(payment.amount, payment.currency)} • ${_shortId(payment.orderCode)}',
                      style: const TextStyle(
                        color: Color(0xFFAAAAAA),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      _vnpayReturnInstruction,
                      style: TextStyle(
                        color: Color(0xFF9FA6AD),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                tooltip: 'Dismiss',
                onPressed: onDismiss,
                icon: const Icon(Icons.close_rounded),
              ),
            ],
          ),
          if (message != null && message!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              message!,
              style: const TextStyle(
                color: Color(0xFFC8C8C8),
                fontWeight: FontWeight.w700,
                height: 1.35,
              ),
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    side: const BorderSide(color: Color(0xFF4A4A4A)),
                    minimumSize: const Size.fromHeight(42),
                  ),
                  onPressed: checking ? null : onOpenPayment,
                  icon: const Icon(Icons.open_in_new_rounded),
                  label: const Text('Open VNPay'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: _studioOrange,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(42),
                  ),
                  onPressed: checking ? null : onCheckStatus,
                  icon: checking
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.refresh_rounded),
                  label: Text(checking ? 'Checking' : 'Check status'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

String _paymentStatusMessage(_SubscriptionPaymentStatus status) {
  switch (status.status) {
    case 'PAID':
      return 'Payment confirmed.';
    case 'PROCESSING':
      return 'Payment is processing. Check again in a moment.';
    case 'FAILED':
      return status.failureReason ??
          'Payment failed. Try creating a new payment.';
    case 'CANCELED':
      return 'Payment was canceled. You can open VNPay again or choose a plan again.';
    case 'EXPIRED':
      return 'Payment session expired. Choose the plan again to create a new payment.';
    case 'INVALID':
      return 'Payment could not be verified.';
    default:
      return 'Payment is still pending. Complete it in VNPay, then return here and tap Check status.';
  }
}

const _vnpayReturnInstruction =
    'After VNPay, return to this app and tap Check status. If a web result tab opens, you can close it.';

class _SubscriptionPaymentHistorySection extends StatelessWidget {
  const _SubscriptionPaymentHistorySection({
    required this.history,
    required this.checkingOrderCode,
    required this.pendingPayment,
    required this.onRefresh,
    required this.onLoadMore,
    required this.onOpenPayment,
    required this.onCheckStatus,
  });

  final AsyncValue<_SubscriptionPaymentHistoryPage> history;
  final String? checkingOrderCode;
  final _PendingSubscriptionPayment? pendingPayment;
  final VoidCallback onRefresh;
  final VoidCallback onLoadMore;
  final Future<void> Function(String paymentUrl) onOpenPayment;
  final Future<void> Function(_SubscriptionPaymentHistoryItem payment)
  onCheckStatus;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt_long_rounded, color: _studioOrange),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Payment history',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Refresh',
                onPressed: onRefresh,
                icon: const Icon(Icons.refresh_rounded),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'Recent subscription payments and VNPay status.',
            style: TextStyle(
              color: Color(0xFF9A9A9A),
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          history.when(
            loading: () {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 18),
                child: Center(
                  child: CircularProgressIndicator(color: _studioOrange),
                ),
              );
            },
            error: (_, _) {
              return const _StudioMessage(
                icon: Icons.cloud_off_rounded,
                title: 'Could not load payment history',
                subtitle: 'Try refreshing this section.',
              );
            },
            data: (page) {
              if (page.items.isEmpty) {
                return const _StudioMessage(
                  icon: Icons.receipt_long_rounded,
                  title: 'No payments yet',
                  subtitle: 'Subscription payment attempts will appear here.',
                );
              }

              return Column(
                children: [
                  for (var index = 0; index < page.items.length; index++) ...[
                    _SubscriptionPaymentHistoryTile(
                      payment: page.items[index],
                      pendingPayment: pendingPayment,
                      checking:
                          checkingOrderCode == page.items[index].orderCode,
                      onOpenPayment: onOpenPayment,
                      onCheckStatus: onCheckStatus,
                    ),
                    if (index != page.items.length - 1)
                      const Divider(height: 18, color: Color(0xFF262626)),
                  ],
                  if (page.totalItems > page.items.length) ...[
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.white,
                          side: const BorderSide(color: Color(0xFF4A4A4A)),
                          minimumSize: const Size.fromHeight(42),
                        ),
                        onPressed: onLoadMore,
                        icon: const Icon(Icons.expand_more_rounded),
                        label: Text(
                          'Load more (${page.items.length}/${page.totalItems})',
                        ),
                      ),
                    ),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class _SubscriptionPaymentHistoryTile extends StatelessWidget {
  const _SubscriptionPaymentHistoryTile({
    required this.payment,
    required this.pendingPayment,
    required this.checking,
    required this.onOpenPayment,
    required this.onCheckStatus,
  });

  final _SubscriptionPaymentHistoryItem payment;
  final _PendingSubscriptionPayment? pendingPayment;
  final bool checking;
  final Future<void> Function(String paymentUrl) onOpenPayment;
  final Future<void> Function(_SubscriptionPaymentHistoryItem payment)
  onCheckStatus;

  @override
  Widget build(BuildContext context) {
    final status = payment.status.toUpperCase();
    final tone = payment.paid
        ? _BadgeTone.success
        : _isFinalPaymentStatus(status)
        ? _BadgeTone.error
        : _BadgeTone.warning;
    final storedPaymentUrl = pendingPayment?.orderCode == payment.orderCode
        ? pendingPayment?.paymentUrl
        : null;
    final paymentUrl = payment.paymentUrl ?? storedPaymentUrl;
    final canOpen = payment.isPending && paymentUrl?.trim().isNotEmpty == true;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: _studioOrange.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(
                payment.paid
                    ? Icons.check_circle_rounded
                    : payment.isPending
                    ? Icons.hourglass_top_rounded
                    : Icons.error_outline_rounded,
                color: payment.paid
                    ? const Color(0xFF52D273)
                    : payment.isPending
                    ? _studioOrange
                    : const Color(0xFFFF8A94),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      _StatusBadge(label: status, tone: tone),
                      Text(
                        _formatCurrency(payment.amount, payment.currency),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '${_shortId(payment.orderCode)} • ${_formatDate(payment.createdAt)}',
                    style: const TextStyle(
                      color: Color(0xFF9A9A9A),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  if (payment.failureReason != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      payment.failureReason!,
                      style: const TextStyle(
                        color: Color(0xFFFFA0A7),
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        if (payment.isPending) ...[
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.white,
                    disabledForegroundColor: const Color(0xFF666666),
                    side: const BorderSide(color: Color(0xFF4A4A4A)),
                  ),
                  onPressed: canOpen ? () => onOpenPayment(paymentUrl!) : null,
                  icon: const Icon(Icons.open_in_new_rounded, size: 18),
                  label: const Text('VNPay'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: _studioOrange,
                    foregroundColor: Colors.white,
                  ),
                  onPressed: checking ? null : () => onCheckStatus(payment),
                  icon: checking
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.refresh_rounded, size: 18),
                  label: Text(checking ? 'Checking' : 'Check'),
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}

class _PlansSheet extends ConsumerStatefulWidget {
  const _PlansSheet({
    required this.current,
    required this.onPaymentStarted,
    required this.onPlanChanged,
  });

  final _StudioSubscriptionData current;
  final ValueChanged<_PendingSubscriptionPayment> onPaymentStarted;
  final Future<void> Function() onPlanChanged;

  @override
  ConsumerState<_PlansSheet> createState() => _PlansSheetState();
}

class _PlansSheetState extends ConsumerState<_PlansSheet> {
  String? _changingCode;

  @override
  Widget build(BuildContext context) {
    final plans = ref.watch(subscriptionPlansProvider);

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.52,
      maxChildSize: 0.95,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0D0D0D),
            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(18, 10, 18, 12),
                child: Column(
                  children: [
                    Container(
                      width: 42,
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFF555555),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        const Expanded(
                          child: Text(
                            'Choose your plan',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.of(context).pop(),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    const Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Upgrade access for distribution, monetization and benefits.',
                        style: TextStyle(
                          color: Color(0xFFAAAAAA),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFF242424)),
              Expanded(
                child: plans.when(
                  loading: () {
                    return const Center(
                      child: CircularProgressIndicator(color: _studioOrange),
                    );
                  },
                  error: (_, _) {
                    return const _StudioMessage(
                      icon: Icons.cloud_off_rounded,
                      title: 'Could not load plans',
                      subtitle: 'Pull down and try again.',
                    );
                  },
                  data: (items) {
                    final list = items.isEmpty ? _fallbackPlans() : items;

                    return ListView.separated(
                      controller: scrollController,
                      padding: const EdgeInsets.fromLTRB(18, 16, 18, 24),
                      itemCount: list.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        return _PlanCard(
                          plan: list[index],
                          currentCode: widget.current.plan.code,
                          changing: _changingCode == list[index].code,
                          onSelect: () => _confirmPlanChange(list[index]),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _confirmPlanChange(_StudioPlan plan) async {
    final currentCode = widget.current.plan.code.toUpperCase();
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
        widget.onPaymentStarted(payment);

        final opened = await launchUrl(
          Uri.parse(payment.paymentUrl),
          mode: LaunchMode.externalApplication,
        );

        if (!opened) {
          throw StateError('Could not open payment URL.');
        }

        await widget.onPlanChanged();

        if (!mounted) {
          return;
        }

        showAppToast(context, message: _vnpayReturnInstruction);
        Navigator.of(context).pop();
        return;
      }

      await widget.onPlanChanged();

      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Switched to ${plan.name}');
      Navigator.of(context).pop();
    } catch (_) {
      if (!mounted) {
        return;
      }

      showAppToast(
        context,
        message: requiresPayment
            ? 'Could not start subscription payment.'
            : 'Could not change plan.',
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

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.plan,
    required this.currentCode,
    required this.changing,
    required this.onSelect,
  });

  final _StudioPlan plan;
  final String currentCode;
  final bool changing;
  final VoidCallback onSelect;

  @override
  Widget build(BuildContext context) {
    final isCurrent = plan.code.toUpperCase() == currentCode.toUpperCase();
    final features = _subscriptionFeatures(plan);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF151515),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isCurrent ? _studioOrange : const Color(0xFF2B2B2B),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      plan.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      plan.description.isEmpty
                          ? 'SoundClone creator plan'
                          : plan.description,
                      style: const TextStyle(
                        color: Color(0xFF9A9A9A),
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              if (isCurrent)
                const _StatusBadge(label: 'Current', tone: _BadgeTone.success),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _formatMoney(plan.monthlyPrice),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 14),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _MiniFeatureBadge(
                label: plan.unlimitedUploads
                    ? 'Unlimited uploads'
                    : '${plan.uploadMinutesLimit.toStringAsFixed(0)} min',
              ),
              _MiniFeatureBadge(
                label: plan.advancedInsightsDays > 0
                    ? '${plan.advancedInsightsDays}d insights'
                    : 'No insights',
              ),
            ],
          ),
          const SizedBox(height: 14),
          for (var index = 0; index < features.length; index++) ...[
            _CompactPlanFeature(feature: features[index]),
            if (index != features.length - 1) const SizedBox(height: 8),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: isCurrent
                    ? const Color(0xFF333333)
                    : _studioOrange,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(44),
              ),
              onPressed: isCurrent || changing ? null : onSelect,
              child: changing
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(isCurrent ? 'Current plan' : 'Choose plan'),
            ),
          ),
        ],
      ),
    );
  }
}

class _MiniFeatureBadge extends StatelessWidget {
  const _MiniFeatureBadge({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFF242424),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFFE0E0E0),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _CompactPlanFeature extends StatelessWidget {
  const _CompactPlanFeature({required this.feature});

  final _PlanFeatureData feature;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          feature.enabled ? Icons.check_rounded : Icons.close_rounded,
          color: feature.enabled ? const Color(0xFF52D273) : Colors.white38,
          size: 18,
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            '${feature.label}: ${feature.value}',
            style: TextStyle(
              color: feature.enabled ? Colors.white : const Color(0xFF8A8A8A),
              fontSize: 13,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _UnlimitedQuotaStatus extends StatelessWidget {
  const _UnlimitedQuotaStatus({required this.usage});

  final _SubscriptionUsage usage;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            color: _studioOrange.withValues(alpha: 0.16),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.all_inclusive_rounded,
            color: _studioOrange,
            size: 26,
          ),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Unlimited uploads',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'No upload limit on this plan.',
                style: TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                '${usage.uploadedMinutes.toStringAsFixed(1)} minutes uploaded this period',
                style: const TextStyle(
                  color: Color(0xFF9A9A9A),
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LimitedQuotaStatus extends StatelessWidget {
  const _LimitedQuotaStatus({required this.usage});

  final _SubscriptionUsage usage;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Upload quota',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '${usage.uploadedMinutes.toStringAsFixed(1)} / ${usage.limitMinutes.toStringAsFixed(0)} minutes',
          style: const TextStyle(
            color: Color(0xFFAAAAAA),
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: (usage.percentage / 100).clamp(0.0, 1.0),
            minHeight: 8,
            color: _studioOrange,
            backgroundColor: const Color(0xFF2B2B2B),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '${usage.remainingMinutes.toStringAsFixed(1)} minutes remaining • ${usage.percentage.toStringAsFixed(1)}% used',
          style: const TextStyle(
            color: Color(0xFF9A9A9A),
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}

class _InfoRows extends StatelessWidget {
  const _InfoRows({required this.rows});

  final List<_InfoRowData> rows;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var index = 0; index < rows.length; index++) ...[
          Row(
            children: [
              Expanded(
                child: Text(
                  rows[index].label,
                  style: const TextStyle(
                    color: Color(0xFF9A9A9A),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                rows[index].value,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ],
          ),
          if (index != rows.length - 1)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 10),
              child: Divider(height: 1, color: Color(0xFF282828)),
            ),
        ],
      ],
    );
  }
}

class _PlanFeatureTile extends StatelessWidget {
  const _PlanFeatureTile({required this.feature});

  final _PlanFeatureData feature;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1D1D1D),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF303030)),
      ),
      child: Row(
        children: [
          Icon(
            feature.enabled
                ? Icons.check_circle_rounded
                : Icons.lock_outline_rounded,
            color: feature.enabled ? const Color(0xFF52D273) : Colors.white38,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  feature.label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  feature.value,
                  style: const TextStyle(
                    color: Color(0xFF9A9A9A),
                    fontSize: 12,
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
