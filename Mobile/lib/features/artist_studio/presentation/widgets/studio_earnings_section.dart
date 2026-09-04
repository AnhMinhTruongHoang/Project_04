part of artist_studio_screen;

class _EarningsSection extends ConsumerStatefulWidget {
  const _EarningsSection({required this.subscription});

  final AsyncValue<_StudioSubscriptionData?> subscription;

  @override
  ConsumerState<_EarningsSection> createState() => _EarningsSectionState();
}

class _EarningsSectionState extends ConsumerState<_EarningsSection> {
  String? _earningStatus;
  String? _payoutStatus;
  String? _cancelingPayoutId;

  static const _earningStatuses = [
    null,
    'PENDING',
    'AVAILABLE',
    'REJECTED',
    'REVERSED',
  ];

  static const _payoutStatuses = [
    null,
    'PENDING',
    'APPROVED',
    'PAID',
    'REJECTED',
    'CANCELED',
  ];

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
          title: 'Could not load earnings access',
          subtitle: 'Pull down to try again.',
        );
      },
      data: (subscriptionData) {
        final plan = subscriptionData?.plan ?? const _StudioPlan();

        if (!plan.canMonetize) {
          return _EarningsLockedCard(
            currentPlan: plan.name,
            onUpgrade: subscriptionData == null
                ? null
                : () => context.push('/plans'),
          );
        }

        final wallet = ref.watch(artistWalletProvider);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _EarningsWalletPanel(
              wallet: wallet,
              onRefresh: _refreshEarnings,
              onRequestPayout: _showPayoutSheet,
            ),
            wallet.maybeWhen(
              data: (walletData) {
                if (walletData == null) {
                  return const SizedBox.shrink();
                }

                return _EarningsDetails(
                  earningStatus: _earningStatus,
                  payoutStatus: _payoutStatus,
                  earningStatuses: _earningStatuses,
                  payoutStatuses: _payoutStatuses,
                  cancelingPayoutId: _cancelingPayoutId,
                  onEarningStatusChanged: (status) {
                    setState(() {
                      _earningStatus = status;
                    });
                  },
                  onPayoutStatusChanged: (status) {
                    setState(() {
                      _payoutStatus = status;
                    });
                  },
                  onCancelPayout: _confirmCancelPayout,
                );
              },
              orElse: SizedBox.shrink,
            ),
          ],
        );
      },
    );
  }

  void _refreshEarnings() {
    ref.invalidate(artistWalletProvider);
    ref.invalidate(artistEarningHistoryProvider);
    ref.invalidate(artistPayoutHistoryProvider);
  }

  Future<void> _showPayoutSheet(_ArtistWallet wallet) async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (_) {
        return _PayoutRequestSheet(wallet: wallet);
      },
    );

    if (created == true) {
      _refreshEarnings();
    }
  }

  Future<void> _confirmCancelPayout(_PayoutItem payout) async {
    final id = payout.id;

    if (id == null || id.isEmpty || _cancelingPayoutId != null) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: const Text(
            'Cancel payout request?',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: Text(
            'This will release ${_formatCurrency(payout.amount, payout.currency)} back to your available balance if the backend allows it.',
            style: const TextStyle(color: Color(0xFFBDBDBD)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Keep request'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFFF6975),
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Cancel payout'),
            ),
          ],
        );
      },
    );

    if (confirmed != true) {
      return;
    }

    setState(() {
      _cancelingPayoutId = id;
    });

    try {
      final response = await ApiService.instance.cancelArtistPayoutRequestApi(
        id,
      );

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      ref.invalidate(artistWalletProvider);
      ref.invalidate(artistPayoutHistoryProvider);

      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Payout request canceled.');
    } catch (_) {
      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Could not cancel payout request.');
    } finally {
      if (mounted) {
        setState(() {
          _cancelingPayoutId = null;
        });
      }
    }
  }
}

class _EarningsDetails extends ConsumerStatefulWidget {
  const _EarningsDetails({
    required this.earningStatus,
    required this.payoutStatus,
    required this.earningStatuses,
    required this.payoutStatuses,
    required this.cancelingPayoutId,
    required this.onEarningStatusChanged,
    required this.onPayoutStatusChanged,
    required this.onCancelPayout,
  });

  final String? earningStatus;
  final String? payoutStatus;
  final List<String?> earningStatuses;
  final List<String?> payoutStatuses;
  final String? cancelingPayoutId;
  final ValueChanged<String?> onEarningStatusChanged;
  final ValueChanged<String?> onPayoutStatusChanged;
  final ValueChanged<_PayoutItem> onCancelPayout;

  @override
  ConsumerState<_EarningsDetails> createState() => _EarningsDetailsState();
}

class _EarningsDetailsState extends ConsumerState<_EarningsDetails> {
  int _earningPage = 1;
  int _payoutPage = 1;

  @override
  void didUpdateWidget(covariant _EarningsDetails oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.earningStatus != widget.earningStatus) {
      _earningPage = 1;
    }

    if (oldWidget.payoutStatus != widget.payoutStatus) {
      _payoutPage = 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final earnings = _mergedEarnings();
    final payouts = _mergedPayouts();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 14),
        _EarningHistoryPanel(
          selectedStatus: widget.earningStatus,
          statuses: widget.earningStatuses,
          history: earnings,
          onStatusChanged: widget.onEarningStatusChanged,
          onRefresh: _refreshEarnings,
          onLoadMore: _loadMoreEarnings,
        ),
        const SizedBox(height: 14),
        _PayoutHistoryPanel(
          selectedStatus: widget.payoutStatus,
          statuses: widget.payoutStatuses,
          history: payouts,
          cancelingPayoutId: widget.cancelingPayoutId,
          onStatusChanged: widget.onPayoutStatusChanged,
          onRefresh: _refreshPayouts,
          onLoadMore: _loadMorePayouts,
          onCancel: widget.onCancelPayout,
        ),
      ],
    );
  }

  _PagedEarningHistory _mergedEarnings() {
    final values = [
      for (var page = 1; page <= _earningPage; page++)
        ref.watch(
          artistEarningHistoryProvider(
            _HistoryQuery(status: widget.earningStatus, page: page),
          ),
        ),
    ];

    final items = <_EarningItem>[];
    var totalPages = 1;
    var totalItems = 0;
    var initialLoading = false;
    var loadingMore = false;
    var hasError = false;

    for (var index = 0; index < values.length; index++) {
      values[index].when(
        loading: () {
          if (index == 0 && items.isEmpty) {
            initialLoading = true;
          } else {
            loadingMore = true;
          }
        },
        error: (_, _) {
          hasError = true;
        },
        data: (page) {
          items.addAll(page.items);
          totalPages = page.totalPages;
          totalItems = page.totalItems;
        },
      );
    }

    return _PagedEarningHistory(
      items: items,
      currentPage: _earningPage,
      totalPages: totalPages,
      totalItems: totalItems,
      initialLoading: initialLoading,
      loadingMore: loadingMore,
      hasError: hasError,
    );
  }

  _PagedPayoutHistory _mergedPayouts() {
    final values = [
      for (var page = 1; page <= _payoutPage; page++)
        ref.watch(
          artistPayoutHistoryProvider(
            _HistoryQuery(status: widget.payoutStatus, page: page),
          ),
        ),
    ];

    final items = <_PayoutItem>[];
    var totalPages = 1;
    var totalItems = 0;
    var initialLoading = false;
    var loadingMore = false;
    var hasError = false;

    for (var index = 0; index < values.length; index++) {
      values[index].when(
        loading: () {
          if (index == 0 && items.isEmpty) {
            initialLoading = true;
          } else {
            loadingMore = true;
          }
        },
        error: (_, _) {
          hasError = true;
        },
        data: (page) {
          items.addAll(page.items);
          totalPages = page.totalPages;
          totalItems = page.totalItems;
        },
      );
    }

    return _PagedPayoutHistory(
      items: items,
      currentPage: _payoutPage,
      totalPages: totalPages,
      totalItems: totalItems,
      initialLoading: initialLoading,
      loadingMore: loadingMore,
      hasError: hasError,
    );
  }

  void _refreshEarnings() {
    setState(() {
      _earningPage = 1;
    });
    ref.invalidate(artistEarningHistoryProvider);
  }

  void _refreshPayouts() {
    setState(() {
      _payoutPage = 1;
    });
    ref.invalidate(artistPayoutHistoryProvider);
  }

  void _loadMoreEarnings() {
    setState(() {
      _earningPage++;
    });
  }

  void _loadMorePayouts() {
    setState(() {
      _payoutPage++;
    });
  }
}

class _EarningsLockedCard extends StatelessWidget {
  const _EarningsLockedCard({
    required this.currentPlan,
    required this.onUpgrade,
  });

  final String currentPlan;
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
                  color: _studioOrange.withValues(alpha: 0.16),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.lock_rounded, color: _studioOrange),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Artist earnings',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 6),
                    Text(
                      'Upgrade to Artist Pro to unlock monetization, wallet balances and payout history.',
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
          _StatusBadge(label: currentPlan, tone: _BadgeTone.muted),
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
      ),
    );
  }
}

class _EarningsWalletPanel extends StatelessWidget {
  const _EarningsWalletPanel({
    required this.wallet,
    required this.onRefresh,
    required this.onRequestPayout,
  });

  final AsyncValue<_ArtistWallet?> wallet;
  final VoidCallback onRefresh;
  final ValueChanged<_ArtistWallet> onRequestPayout;

  @override
  Widget build(BuildContext context) {
    return wallet.when(
      loading: () {
        return const _StudioCard(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: 34),
            child: Center(
              child: CircularProgressIndicator(color: _studioOrange),
            ),
          ),
        );
      },
      error: (_, _) {
        return const _StudioMessage(
          icon: Icons.account_balance_wallet_rounded,
          title: 'Could not load wallet',
          subtitle: 'Pull down to try again.',
        );
      },
      data: (walletData) {
        final data = walletData ?? const _ArtistWallet();
        final cards = [
          _WalletMetric(
            label: 'Available',
            description: 'Ready to request payout',
            amount: data.availableBalance,
            icon: Icons.account_balance_wallet_rounded,
          ),
          _WalletMetric(
            label: 'Pending',
            description: 'Waiting holding period',
            amount: data.pendingBalance,
            icon: Icons.schedule_rounded,
          ),
          _WalletMetric(
            label: 'Reserved',
            description: 'Held for active payout',
            amount: data.reservedBalance,
            icon: Icons.lock_rounded,
          ),
          _WalletMetric(
            label: 'Withdrawn',
            description: 'Completed payouts',
            amount: data.withdrawnBalance,
            icon: Icons.payments_rounded,
          ),
        ];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _StudioCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Artist earnings',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton.filledTonal(
                        tooltip: 'Refresh earnings',
                        onPressed: onRefresh,
                        icon: const Icon(Icons.refresh_rounded),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _formatCurrency(data.lifetimeEarnings, data.currency),
                    style: const TextStyle(
                      color: Color(0xFF63E6A6),
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Lifetime earnings',
                    style: TextStyle(
                      color: Color(0xFF9A9A9A),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 12),
                  _StatusBadge(
                    label: data.status,
                    tone: data.status == 'ACTIVE'
                        ? _BadgeTone.success
                        : _BadgeTone.warning,
                  ),
                  const SizedBox(height: 14),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: _studioOrange,
                      disabledBackgroundColor: const Color(0xFF303030),
                      disabledForegroundColor: const Color(0xFF777777),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(44),
                    ),
                    onPressed:
                        data.status == 'ACTIVE' && data.availableBalance > 0
                        ? () => onRequestPayout(data)
                        : null,
                    icon: const Icon(Icons.payments_rounded),
                    label: const Text('Request payout'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            LayoutBuilder(
              builder: (context, constraints) {
                final twoColumns = constraints.maxWidth >= 520;
                final width = twoColumns
                    ? (constraints.maxWidth - 10) / 2
                    : constraints.maxWidth;

                return Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    for (final metric in cards)
                      SizedBox(
                        width: width,
                        child: _WalletMetricCard(
                          metric: metric,
                          currency: data.currency,
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
        );
      },
    );
  }
}

class _WalletMetric {
  const _WalletMetric({
    required this.label,
    required this.description,
    required this.amount,
    required this.icon,
  });

  final String label;
  final String description;
  final double amount;
  final IconData icon;
}

class _WalletMetricCard extends StatelessWidget {
  const _WalletMetricCard({required this.metric, required this.currency});

  final _WalletMetric metric;
  final String currency;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: _studioOrange.withValues(alpha: 0.16),
              shape: BoxShape.circle,
            ),
            child: Icon(metric.icon, color: _studioOrange, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _formatCurrency(metric.amount, currency),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  metric.label,
                  style: const TextStyle(
                    color: Color(0xFFDDDDDD),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  metric.description,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF8A8A8A),
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

class _PagedEarningHistory {
  const _PagedEarningHistory({
    required this.items,
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.initialLoading,
    required this.loadingMore,
    required this.hasError,
  });

  final List<_EarningItem> items;
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final bool initialLoading;
  final bool loadingMore;
  final bool hasError;

  bool get canLoadMore => currentPage < totalPages && !loadingMore;
}

class _PagedPayoutHistory {
  const _PagedPayoutHistory({
    required this.items,
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.initialLoading,
    required this.loadingMore,
    required this.hasError,
  });

  final List<_PayoutItem> items;
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final bool initialLoading;
  final bool loadingMore;
  final bool hasError;

  bool get canLoadMore => currentPage < totalPages && !loadingMore;
}

class _EarningHistoryPanel extends StatelessWidget {
  const _EarningHistoryPanel({
    required this.selectedStatus,
    required this.statuses,
    required this.history,
    required this.onStatusChanged,
    required this.onRefresh,
    required this.onLoadMore,
  });

  final String? selectedStatus;
  final List<String?> statuses;
  final _PagedEarningHistory history;
  final ValueChanged<String?> onStatusChanged;
  final VoidCallback onRefresh;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _EarningsPanelHeader(
            icon: Icons.history_rounded,
            title: 'Earning history',
            subtitle: 'Qualified stream earnings will appear here.',
            onRefresh: onRefresh,
          ),
          const SizedBox(height: 12),
          _StatusFilterRow(
            selected: selectedStatus,
            statuses: statuses,
            onChanged: onStatusChanged,
          ),
          const SizedBox(height: 12),
          if (history.initialLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: CircularProgressIndicator(color: _studioOrange),
              ),
            )
          else if (history.hasError && history.items.isEmpty)
            const _StudioMessage(
              icon: Icons.history_rounded,
              title: 'Could not load earning history',
              subtitle: 'Try refreshing this section.',
            )
          else if (history.items.isEmpty)
            const _InlineEmptyState(
              icon: Icons.music_note_rounded,
              title: 'No earnings found',
              subtitle: 'Qualified stream earnings will appear here.',
            )
          else
            Column(
              children: [
                for (var index = 0; index < history.items.length; index++) ...[
                  _EarningTile(item: history.items[index]),
                  if (index != history.items.length - 1)
                    const Divider(height: 22, color: Color(0xFF282828)),
                ],
                if (history.hasError) ...[
                  const SizedBox(height: 12),
                  const _PayoutFormMessage(
                    icon: Icons.error_outline_rounded,
                    message: 'Could not load more earnings.',
                    error: true,
                  ),
                ],
                if (history.currentPage < history.totalPages) ...[
                  const SizedBox(height: 12),
                  _LoadMoreButton(
                    loading: history.loadingMore,
                    label:
                        'Load more (${history.currentPage}/${history.totalPages})',
                    onPressed: history.canLoadMore ? onLoadMore : null,
                  ),
                ],
              ],
            ),
        ],
      ),
    );
  }
}

class _PayoutHistoryPanel extends StatelessWidget {
  const _PayoutHistoryPanel({
    required this.selectedStatus,
    required this.statuses,
    required this.history,
    required this.cancelingPayoutId,
    required this.onStatusChanged,
    required this.onRefresh,
    required this.onLoadMore,
    required this.onCancel,
  });

  final String? selectedStatus;
  final List<String?> statuses;
  final _PagedPayoutHistory history;
  final String? cancelingPayoutId;
  final ValueChanged<String?> onStatusChanged;
  final VoidCallback onRefresh;
  final VoidCallback onLoadMore;
  final ValueChanged<_PayoutItem> onCancel;

  @override
  Widget build(BuildContext context) {
    return _StudioCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _EarningsPanelHeader(
            icon: Icons.payments_rounded,
            title: 'Payout history',
            subtitle: 'Review and manage payout requests.',
            onRefresh: onRefresh,
          ),
          const SizedBox(height: 12),
          _StatusFilterRow(
            selected: selectedStatus,
            statuses: statuses,
            onChanged: onStatusChanged,
          ),
          const SizedBox(height: 12),
          if (history.initialLoading)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 32),
              child: Center(
                child: CircularProgressIndicator(color: _studioOrange),
              ),
            )
          else if (history.hasError && history.items.isEmpty)
            const _StudioMessage(
              icon: Icons.account_balance_rounded,
              title: 'Could not load payout history',
              subtitle: 'Try refreshing this section.',
            )
          else if (history.items.isEmpty)
            const _InlineEmptyState(
              icon: Icons.account_balance_rounded,
              title: 'No payout requests',
              subtitle: 'Your payout requests will appear here.',
            )
          else
            Column(
              children: [
                for (var index = 0; index < history.items.length; index++) ...[
                  _PayoutTile(
                    item: history.items[index],
                    canceling: cancelingPayoutId == history.items[index].id,
                    onCancel: () => onCancel(history.items[index]),
                  ),
                  if (index != history.items.length - 1)
                    const Divider(height: 22, color: Color(0xFF282828)),
                ],
                if (history.hasError) ...[
                  const SizedBox(height: 12),
                  const _PayoutFormMessage(
                    icon: Icons.error_outline_rounded,
                    message: 'Could not load more payouts.',
                    error: true,
                  ),
                ],
                if (history.currentPage < history.totalPages) ...[
                  const SizedBox(height: 12),
                  _LoadMoreButton(
                    loading: history.loadingMore,
                    label:
                        'Load more (${history.currentPage}/${history.totalPages})',
                    onPressed: history.canLoadMore ? onLoadMore : null,
                  ),
                ],
              ],
            ),
        ],
      ),
    );
  }
}

class _LoadMoreButton extends StatelessWidget {
  const _LoadMoreButton({
    required this.loading,
    required this.label,
    required this.onPressed,
  });

  final bool loading;
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      style: OutlinedButton.styleFrom(
        foregroundColor: Colors.white,
        disabledForegroundColor: const Color(0xFF777777),
        side: const BorderSide(color: Color(0xFF444444)),
        minimumSize: const Size.fromHeight(42),
      ),
      onPressed: onPressed,
      icon: loading
          ? const SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Icon(Icons.expand_more_rounded),
      label: Text(loading ? 'Loading...' : label),
    );
  }
}

class _EarningsPanelHeader extends StatelessWidget {
  const _EarningsPanelHeader({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onRefresh,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: _studioOrange, size: 24),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Color(0xFF9A9A9A),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
        IconButton(
          tooltip: 'Refresh',
          onPressed: onRefresh,
          icon: const Icon(Icons.refresh_rounded),
        ),
      ],
    );
  }
}

class _StatusFilterRow extends StatelessWidget {
  const _StatusFilterRow({
    required this.selected,
    required this.statuses,
    required this.onChanged,
  });

  final String? selected;
  final List<String?> statuses;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          for (final status in statuses) ...[
            ChoiceChip(
              label: Text(status ?? 'All'),
              selected: selected == status,
              onSelected: (_) => onChanged(status),
              selectedColor: _studioOrange,
              backgroundColor: const Color(0xFF202020),
              side: BorderSide(
                color: selected == status
                    ? _studioOrange
                    : const Color(0xFF333333),
              ),
              labelStyle: TextStyle(
                color: selected == status ? Colors.white : Colors.white70,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }
}

class _EarningTile extends StatelessWidget {
  const _EarningTile({required this.item});

  final _EarningItem item;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                _shortId(item.trackId),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            _StatusBadge(label: item.status, tone: _earningTone(item.status)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          _formatCurrency(item.amount, item.currency),
          style: const TextStyle(
            color: Color(0xFF63E6A6),
            fontSize: 19,
            fontWeight: FontWeight.w900,
          ),
        ),
        const SizedBox(height: 8),
        _InfoRows(
          rows: [
            _InfoRowData(
              'Earned',
              _formatStudioDateTime(item.earningDate) ?? '--',
            ),
            _InfoRowData(
              'Qualified',
              _formatStudioDateTime(item.qualifiedAt) ?? '--',
            ),
            _InfoRowData(
              'Available',
              _formatStudioDateTime(item.availableAt) ?? '--',
            ),
            if (item.rejectionReason != null)
              _InfoRowData('Reason', item.rejectionReason!),
          ],
        ),
      ],
    );
  }
}

class _PayoutTile extends StatelessWidget {
  const _PayoutTile({
    required this.item,
    required this.canceling,
    required this.onCancel,
  });

  final _PayoutItem item;
  final bool canceling;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Text(
                _formatCurrency(item.amount, item.currency),
                style: const TextStyle(
                  color: Color(0xFF63E6A6),
                  fontSize: 19,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            _StatusBadge(label: item.status, tone: _payoutTone(item.status)),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          '${item.bankName ?? 'Bank'} • ${_maskAccount(item.accountNumber)}',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
          ),
        ),
        if (item.accountHolderName != null) ...[
          const SizedBox(height: 3),
          Text(
            item.accountHolderName!,
            style: const TextStyle(
              color: Color(0xFF9A9A9A),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
        const SizedBox(height: 10),
        _InfoRows(
          rows: [
            _InfoRowData(
              'Requested',
              _formatStudioDateTime(item.requestedAt) ?? '--',
            ),
            if (item.transactionReference != null)
              _InfoRowData('Transaction', item.transactionReference!),
            if (item.artistNote != null)
              _InfoRowData('Artist note', item.artistNote!),
            if (item.adminNote != null)
              _InfoRowData('Admin note', item.adminNote!),
          ],
        ),
        if (item.canCancel) ...[
          const SizedBox(height: 12),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFFF8A94),
              side: const BorderSide(color: Color(0xFFFF8A94)),
              minimumSize: const Size.fromHeight(40),
            ),
            onPressed: canceling ? null : onCancel,
            icon: canceling
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.cancel_rounded),
            label: Text(canceling ? 'Canceling...' : 'Cancel request'),
          ),
        ],
      ],
    );
  }
}

class _PayoutRequestSheet extends ConsumerStatefulWidget {
  const _PayoutRequestSheet({required this.wallet});

  final _ArtistWallet wallet;

  @override
  ConsumerState<_PayoutRequestSheet> createState() =>
      _PayoutRequestSheetState();
}

class _PayoutRequestSheetState extends ConsumerState<_PayoutRequestSheet> {
  static const _minimumAmount = 100000.0;

  final _amountController = TextEditingController();
  final _bankCodeController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _accountHolderController = TextEditingController();
  final _noteController = TextEditingController();

  bool _submitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _amountController.dispose();
    _bankCodeController.dispose();
    _bankNameController.dispose();
    _accountNumberController.dispose();
    _accountHolderController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    final available = widget.wallet.availableBalance.clamp(0, double.infinity);
    final amount = _amount;
    final canSubmit = _isFormValid && !_submitting;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.55,
      maxChildSize: 0.96,
      builder: (context, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0D0D0D),
            borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
          ),
          child: ListView(
            controller: scrollController,
            padding: EdgeInsets.fromLTRB(18, 10, 18, 18 + bottomInset),
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFF555555),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: _studioOrange.withValues(alpha: 0.16),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.payments_rounded,
                      color: _studioOrange,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Request payout',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'Withdraw your available artist earnings.',
                          style: TextStyle(
                            color: Color(0xFF9A9A9A),
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: _submitting
                        ? null
                        : () => Navigator.of(context).pop(false),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _StudioCard(
                child: Row(
                  children: [
                    const Icon(
                      Icons.account_balance_wallet_rounded,
                      color: _studioOrange,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Available balance',
                            style: TextStyle(
                              color: Color(0xFF9A9A9A),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            _formatCurrency(available, widget.wallet.currency),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: _submitting || available <= 0
                          ? null
                          : _useFullBalance,
                      child: const Text('Use all'),
                    ),
                  ],
                ),
              ),
              if (_errorMessage != null) ...[
                const SizedBox(height: 12),
                _PayoutFormMessage(
                  icon: Icons.error_outline_rounded,
                  message: _errorMessage!,
                  error: true,
                ),
              ] else if (available < _minimumAmount) ...[
                const SizedBox(height: 12),
                _PayoutFormMessage(
                  icon: Icons.info_outline_rounded,
                  message:
                      'Minimum payout is ${_formatCurrency(_minimumAmount, widget.wallet.currency)}.',
                  error: false,
                ),
              ],
              const SizedBox(height: 14),
              _PayoutTextField(
                controller: _amountController,
                label: 'Payout amount',
                hint: '100000',
                keyboardType: TextInputType.number,
                suffix: widget.wallet.currency,
                onChanged: (_) => _clearErrorAndUpdate(),
              ),
              if (_amountController.text.trim().isNotEmpty &&
                  !_isAmountValid) ...[
                const SizedBox(height: 6),
                Text(
                  amount < _minimumAmount
                      ? 'Amount must be at least ${_formatCurrency(_minimumAmount, widget.wallet.currency)}.'
                      : 'Amount cannot exceed available balance.',
                  style: const TextStyle(
                    color: Color(0xFFFF8A94),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _PayoutTextField(
                      controller: _bankCodeController,
                      label: 'Bank code',
                      hint: 'VCB',
                      textCapitalization: TextCapitalization.characters,
                      onChanged: _updateBankCode,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _PayoutTextField(
                      controller: _bankNameController,
                      label: 'Bank name',
                      hint: 'Vietcombank',
                      onChanged: (_) => _clearErrorAndUpdate(),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _PayoutTextField(
                controller: _accountNumberController,
                label: 'Account number',
                hint: '0123456789',
                keyboardType: TextInputType.number,
                onChanged: _updateAccountNumber,
              ),
              if (_accountNumberController.text.trim().isNotEmpty &&
                  !_isAccountNumberValid) ...[
                const SizedBox(height: 6),
                const Text(
                  'Account number must contain 6-30 digits.',
                  style: TextStyle(
                    color: Color(0xFFFF8A94),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
              const SizedBox(height: 12),
              _PayoutTextField(
                controller: _accountHolderController,
                label: 'Account holder name',
                hint: 'NGUYEN VAN A',
                textCapitalization: TextCapitalization.characters,
                onChanged: _updateAccountHolder,
              ),
              const SizedBox(height: 12),
              _PayoutTextField(
                controller: _noteController,
                label: 'Note',
                hint: 'Optional note',
                minLines: 3,
                maxLines: 5,
                maxLength: 500,
                onChanged: (_) => _clearErrorAndUpdate(),
              ),
              const SizedBox(height: 14),
              const Text(
                'Requested funds move to reserved balance until the payout is paid, rejected or canceled.',
                style: TextStyle(
                  color: Color(0xFF777777),
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  height: 1.35,
                ),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: _studioOrange,
                  disabledBackgroundColor: const Color(0xFF303030),
                  disabledForegroundColor: const Color(0xFF777777),
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: canSubmit ? _submit : null,
                icon: _submitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.payments_rounded),
                label: Text(_submitting ? 'Submitting...' : 'Submit request'),
              ),
            ],
          ),
        );
      },
    );
  }

  double get _amount {
    return double.tryParse(_amountController.text.trim()) ?? 0;
  }

  bool get _isAmountValid {
    final amount = _amount;
    final available = widget.wallet.availableBalance;

    return amount % 1 == 0 &&
        amount >= _minimumAmount &&
        amount <= available &&
        available >= _minimumAmount;
  }

  bool get _isBankCodeValid {
    return RegExp(
      r'^[A-Z0-9_-]{2,30}$',
    ).hasMatch(_bankCodeController.text.trim());
  }

  bool get _isAccountNumberValid {
    return RegExp(
      r'^[0-9]{6,30}$',
    ).hasMatch(_accountNumberController.text.trim());
  }

  bool get _isFormValid {
    return _isAmountValid &&
        _isBankCodeValid &&
        _bankNameController.text.trim().isNotEmpty &&
        _isAccountNumberValid &&
        _accountHolderController.text.trim().isNotEmpty;
  }

  void _useFullBalance() {
    _amountController.text = widget.wallet.availableBalance.floor().toString();
    _clearErrorAndUpdate();
  }

  void _updateBankCode(String value) {
    final cleaned = value.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9_-]'), '');

    if (cleaned != value) {
      _bankCodeController.value = TextEditingValue(
        text: cleaned,
        selection: TextSelection.collapsed(offset: cleaned.length),
      );
    }

    _clearErrorAndUpdate();
  }

  void _updateAccountNumber(String value) {
    final cleaned = value.replaceAll(RegExp(r'\D'), '');

    if (cleaned != value) {
      _accountNumberController.value = TextEditingValue(
        text: cleaned,
        selection: TextSelection.collapsed(offset: cleaned.length),
      );
    }

    _clearErrorAndUpdate();
  }

  void _updateAccountHolder(String value) {
    final cleaned = value.toUpperCase();

    if (cleaned != value) {
      _accountHolderController.value = TextEditingValue(
        text: cleaned,
        selection: TextSelection.collapsed(offset: cleaned.length),
      );
    }

    _clearErrorAndUpdate();
  }

  void _clearErrorAndUpdate() {
    if (_errorMessage == null) {
      setState(() {});
      return;
    }

    setState(() {
      _errorMessage = null;
    });
  }

  Future<void> _submit() async {
    if (!_isFormValid || _submitting) {
      setState(() {
        _errorMessage = 'Please complete all payout information correctly.';
      });
      return;
    }

    setState(() {
      _submitting = true;
      _errorMessage = null;
    });

    final payload = {
      'amount': _amount.floor(),
      'bankCode': _bankCodeController.text.trim().toUpperCase(),
      'bankName': _bankNameController.text.trim(),
      'accountNumber': _accountNumberController.text.trim(),
      'accountHolderName': _accountHolderController.text
          .trim()
          .replaceAll(RegExp(r'\s+'), ' ')
          .toUpperCase(),
      'artistNote': _noteController.text.trim(),
    };

    if (payload['artistNote'] == '') {
      payload.remove('artistNote');
    }

    try {
      final response = await ApiService.instance.createArtistPayoutRequestApi(
        payload,
      );

      if (!response.isSuccess) {
        throw StateError(response.message);
      }

      ref.invalidate(artistWalletProvider);
      ref.invalidate(artistPayoutHistoryProvider);

      if (!mounted) {
        return;
      }

      showAppToast(context, message: 'Payout request submitted.');
      Navigator.of(context).pop(true);
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _submitting = false;
        _errorMessage = error.toString().replaceFirst('Bad state: ', '');
      });
    }
  }
}

class _PayoutTextField extends StatelessWidget {
  const _PayoutTextField({
    required this.controller,
    required this.label,
    required this.hint,
    required this.onChanged,
    this.keyboardType,
    this.textCapitalization = TextCapitalization.none,
    this.suffix,
    this.minLines = 1,
    this.maxLines = 1,
    this.maxLength,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final ValueChanged<String> onChanged;
  final TextInputType? keyboardType;
  final TextCapitalization textCapitalization;
  final String? suffix;
  final int minLines;
  final int maxLines;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textCapitalization: textCapitalization,
      minLines: minLines,
      maxLines: maxLines,
      maxLength: maxLength,
      onChanged: onChanged,
      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        suffixText: suffix,
        filled: true,
        fillColor: const Color(0xFF181818),
        counterStyle: const TextStyle(color: Color(0xFF777777)),
        labelStyle: const TextStyle(
          color: Color(0xFF9A9A9A),
          fontWeight: FontWeight.w700,
        ),
        hintStyle: const TextStyle(color: Color(0xFF666666)),
        suffixStyle: const TextStyle(
          color: Color(0xFFAAAAAA),
          fontWeight: FontWeight.w900,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF303030)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF303030)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: _studioOrange),
        ),
      ),
    );
  }
}

class _PayoutFormMessage extends StatelessWidget {
  const _PayoutFormMessage({
    required this.icon,
    required this.message,
    required this.error,
  });

  final IconData icon;
  final String message;
  final bool error;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: error ? const Color(0x22FF6975) : const Color(0x1AFFB35C),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: error ? const Color(0x66FF6975) : const Color(0x55FFB35C),
        ),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: error ? const Color(0xFFFF8A94) : const Color(0xFFFFB35C),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: error
                    ? const Color(0xFFFFB4BA)
                    : const Color(0xFFFFD39D),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _InlineEmptyState extends StatelessWidget {
  const _InlineEmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 34),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFF2B2B2B)),
      ),
      child: Column(
        children: [
          Icon(icon, color: _studioOrange, size: 34),
          const SizedBox(height: 10),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF8A8A8A),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

_BadgeTone _earningTone(String status) {
  switch (status) {
    case 'AVAILABLE':
      return _BadgeTone.success;
    case 'REJECTED':
    case 'REVERSED':
      return _BadgeTone.error;
    default:
      return _BadgeTone.warning;
  }
}

_BadgeTone _payoutTone(String status) {
  switch (status) {
    case 'PAID':
      return _BadgeTone.success;
    case 'REJECTED':
    case 'CANCELED':
      return _BadgeTone.error;
    case 'APPROVED':
      return _BadgeTone.muted;
    default:
      return _BadgeTone.warning;
  }
}
