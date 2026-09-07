part of artist_studio_screen;

class PaymentResultScreen extends ConsumerStatefulWidget {
  const PaymentResultScreen({super.key, required this.queryParameters});

  final Map<String, String> queryParameters;

  @override
  ConsumerState<PaymentResultScreen> createState() =>
      _PaymentResultScreenState();
}

class _PaymentResultScreenState extends ConsumerState<PaymentResultScreen> {
  bool _loading = true;
  bool _openingPayment = false;
  String? _errorMessage;
  _SubscriptionPaymentStatus? _status;
  _PendingSubscriptionPayment? _pendingPayment;

  String get _orderCode {
    return _firstQueryText([
      'orderCode',
      'vnp_TxnRef',
      'txnRef',
      'transactionId',
      'paymentCode',
    ]);
  }

  String get _queryStatus {
    return _normalizePaymentStatus(
      _firstQueryText(['status', 'vnp_ResponseCode', 'responseCode']),
    );
  }

  @override
  void initState() {
    super.initState();
    unawaited(_loadResult());
  }

  Future<void> _loadResult() async {
    if (mounted) {
      setState(() {
        _loading = true;
        _errorMessage = null;
      });
    }

    try {
      final storedPayment = _PendingSubscriptionPayment.fromJson(
        await SubscriptionPaymentStorage.getPendingPayment(),
      );
      final orderCode = _orderCode.isNotEmpty
          ? _orderCode
          : storedPayment.orderCode;

      if (orderCode.isEmpty) {
        throw StateError('Missing payment order code.');
      }

      final response = await ApiService.instance.getPaymentApi(orderCode);

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      final status = _SubscriptionPaymentStatus.fromJson(response.data);
      final effectiveStatus = status.orderCode.isEmpty
          ? _SubscriptionPaymentStatus(
              orderCode: orderCode,
              status: status.status,
              responseCode: status.responseCode,
              transactionStatus: status.transactionStatus,
              subscriptionId: status.subscriptionId,
              failureReason: status.failureReason,
            )
          : status;

      if (effectiveStatus.paid) {
        if (storedPayment.orderCode.isEmpty ||
            storedPayment.orderCode == effectiveStatus.orderCode) {
          await SubscriptionPaymentStorage.clearPendingPayment();
        }

        ref.invalidate(artistStudioSubscriptionProvider);
        ref.invalidate(artistStudioStatsProvider);
      } else if (storedPayment.isValid &&
          storedPayment.orderCode == effectiveStatus.orderCode) {
        await SubscriptionPaymentStorage.savePendingPayment(
          storedPayment.copyWith(status: effectiveStatus.status).toJson(),
        );
      }

      ref.invalidate(subscriptionPaymentHistoryProvider);

      if (!mounted) {
        return;
      }

      setState(() {
        _status = effectiveStatus;
        _pendingPayment = storedPayment.isValid ? storedPayment : null;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _errorMessage = error is StateError
            ? error.message
            : 'Could not check payment result.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = _status;
    final displayStatus = status?.status ?? _queryStatus;
    final tone = _paymentResultTone(displayStatus);
    final title = _paymentResultTitle(displayStatus, _loading, _errorMessage);
    final subtitle = _paymentResultSubtitle(status, _errorMessage);
    final pendingUrl =
        _pendingPayment?.orderCode == (status?.orderCode ?? _orderCode)
        ? _pendingPayment?.paymentUrl
        : null;

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(title: const Text('Payment result')),
      body: SafeArea(
        child: ListView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(18, 24, 18, 120),
          children: [
            _StudioCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    width: 74,
                    height: 74,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: tone.color.withValues(alpha: 0.14),
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 32,
                            height: 32,
                            child: CircularProgressIndicator(
                              color: _studioOrange,
                              strokeWidth: 3,
                            ),
                          )
                        : Icon(tone.icon, color: tone.color, size: 38),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: Color(0xFFAAAAAA),
                      fontWeight: FontWeight.w700,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if ((status?.orderCode ?? _orderCode).isNotEmpty)
                    _InfoRows(
                      rows: [
                        _InfoRowData(
                          'Order code',
                          _shortId(status?.orderCode ?? _orderCode),
                        ),
                        _InfoRowData('Status', displayStatus),
                        if (status?.responseCode != null)
                          _InfoRowData('Response code', status!.responseCode!),
                      ],
                    ),
                  const SizedBox(height: 20),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: _studioOrange,
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(46),
                    ),
                    onPressed: _loading ? null : _loadResult,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Refresh status'),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF444444)),
                      minimumSize: const Size.fromHeight(46),
                    ),
                    onPressed: () {
                      context.go('/artist-studio?tab=subscription');
                    },
                    icon: const Icon(Icons.workspace_premium_rounded),
                    label: const Text('Back to Subscription'),
                  ),
                  if (pendingUrl?.trim().isNotEmpty == true &&
                      displayStatus == 'PENDING') ...[
                    const SizedBox(height: 10),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFFFC2A6),
                        side: const BorderSide(color: Color(0xFFFF5500)),
                        minimumSize: const Size.fromHeight(46),
                      ),
                      onPressed: _openingPayment
                          ? null
                          : () => _openPayment(pendingUrl!),
                      icon: _openingPayment
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: _studioOrange,
                              ),
                            )
                          : const Icon(Icons.open_in_new_rounded),
                      label: const Text('Open VNPay again'),
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

  Future<void> _openPayment(String paymentUrl) async {
    final uri = Uri.tryParse(paymentUrl.trim());

    if (uri == null) {
      return;
    }

    setState(() {
      _openingPayment = true;
    });

    await launchUrl(uri, mode: LaunchMode.externalApplication);

    if (mounted) {
      setState(() {
        _openingPayment = false;
      });
    }
  }

  String _firstQueryText(List<String> keys) {
    for (final key in keys) {
      final value = widget.queryParameters[key]?.trim();

      if (value != null && value.isNotEmpty) {
        return value;
      }
    }

    return '';
  }
}

class _PaymentResultTone {
  const _PaymentResultTone({required this.color, required this.icon});

  final Color color;
  final IconData icon;
}

_PaymentResultTone _paymentResultTone(String status) {
  switch (status.toUpperCase()) {
    case 'PAID':
      return const _PaymentResultTone(
        color: Color(0xFF46E086),
        icon: Icons.check_circle_rounded,
      );
    case 'FAILED':
    case 'CANCELED':
    case 'EXPIRED':
    case 'INVALID':
      return const _PaymentResultTone(
        color: Color(0xFFFF6975),
        icon: Icons.error_rounded,
      );
    default:
      return const _PaymentResultTone(
        color: Color(0xFFFFB84D),
        icon: Icons.hourglass_top_rounded,
      );
  }
}

String _paymentResultTitle(String status, bool loading, String? errorMessage) {
  if (loading) {
    return 'Checking payment';
  }

  if (errorMessage != null) {
    return 'Could not verify payment';
  }

  switch (status.toUpperCase()) {
    case 'PAID':
      return 'Payment confirmed';
    case 'FAILED':
      return 'Payment failed';
    case 'CANCELED':
      return 'Payment canceled';
    case 'EXPIRED':
      return 'Payment expired';
    default:
      return 'Payment pending';
  }
}

String _paymentResultSubtitle(
  _SubscriptionPaymentStatus? status,
  String? errorMessage,
) {
  if (errorMessage != null) {
    return '$errorMessage You can refresh status or return to Subscription.';
  }

  if (status == null) {
    return 'Please wait while SoundClone checks VNPay and updates your plan.';
  }

  if (status.paid) {
    return 'Your subscription has been updated. You can return to Artist Studio now.';
  }

  if (status.failureReason?.isNotEmpty == true) {
    return status.failureReason!;
  }

  if (_isFinalPaymentStatus(status.status)) {
    return 'This payment attempt is finished. Choose the plan again if you want to retry.';
  }

  return 'VNPay has not confirmed this payment yet. Refresh after completing payment.';
}
