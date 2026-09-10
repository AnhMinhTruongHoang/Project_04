part of 'profile_screen.dart';

class ProfileTourTab extends ConsumerWidget {
  const ProfileTourTab({
    super.key,
    required this.artistId,
    required this.isOwner,
  });

  final String artistId;
  final bool isOwner;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(_profileEventsProvider(artistId));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'Concerts / Tour',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            if (isOwner)
              FilledButton.icon(
                onPressed: () => showTicketScannerSheet(context, ref),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFFF5500),
                  foregroundColor: Colors.white,
                ),
                icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                label: const Text('Scan QR'),
              ),
            IconButton(
              tooltip: 'Refresh events',
              onPressed: () => ref.invalidate(_profileEventsProvider(artistId)),
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 14),
        events.when(
          loading: () => const _RecentLoading(),
          error: (error, _) => _ProfileEmptyTab(
            icon: Icons.cloud_off_outlined,
            title: 'Events unavailable',
            description: error.toString(),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const _ProfileEmptyTab(
                icon: Icons.event_busy_outlined,
                title: 'No upcoming events',
                description: 'Published concerts and tour dates appear here.',
              );
            }

            return Column(
              children: items
                  .map(
                    (event) => _TourEventCard(
                      event: event,
                      isOwner: isOwner,
                      ref: ref,
                    ),
                  )
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _TourEventCard extends StatelessWidget {
  const _TourEventCard({
    required this.event,
    required this.isOwner,
    required this.ref,
  });

  final Map<String, dynamic> event;
  final bool isOwner;
  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final id = _firstText(event, ['id', '_id']);
    final title = _firstText(event, ['eventName', 'name', 'title']);
    final venue = _firstText(event, ['venueName', 'venueAddress']);
    final start = _readableDate(_firstText(event, ['eventStartAt', 'startAt']));
    final price = _formatMoney(event['ticketPrice']);
    final remaining = _toInt(event['remainingQuantity']);
    final canPurchase = event['canPurchase'] == true && remaining > 0;
    final image = _resolveMediaUrl(
      _firstText(event, ['ticketImageUrl', 'ticketImage', 'imageUrl']),
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF141414),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF2A2A2A)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity,
            height: 150,
            child: image == null
                ? const ColoredBox(
                    color: Color(0xFF222222),
                    child: Icon(
                      Icons.event_rounded,
                      color: Color(0xFFFF5500),
                      size: 48,
                    ),
                  )
                : Image.network(
                    image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const ColoredBox(
                      color: Color(0xFF222222),
                      child: Icon(
                        Icons.event_rounded,
                        color: Color(0xFFFF5500),
                        size: 48,
                      ),
                    ),
                  ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title.isEmpty ? 'SoundClone event' : title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 17,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 9),
                _TourMeta(icon: Icons.location_on_outlined, text: venue),
                _TourMeta(icon: Icons.schedule_rounded, text: start),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        price.isEmpty ? 'Free' : price,
                        style: const TextStyle(
                          color: Color(0xFFFF782F),
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                    Text(
                      '$remaining remaining',
                      style: const TextStyle(
                        color: Color(0xFF999999),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (isOwner)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: id.isEmpty
                              ? null
                              : () => _showMyEventTicketQr(
                                  context,
                                  ref,
                                  eventId: id,
                                  eventName: title,
                                ),
                          icon: const Icon(Icons.qr_code_2_rounded),
                          label: const Text('View QR'),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => showTicketScannerSheet(context, ref),
                          icon: const Icon(Icons.qr_code_scanner_rounded),
                          label: const Text('Check in'),
                        ),
                      ),
                    ],
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: canPurchase && id.isNotEmpty
                          ? () => _showBuyTicketSheet(context, event)
                          : null,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFFF5500),
                        foregroundColor: Colors.white,
                      ),
                      icon: const Icon(Icons.local_activity_outlined),
                      label: Text(remaining <= 0 ? 'Sold out' : 'Buy ticket'),
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

Future<void> _showMyEventTicketQr(
  BuildContext context,
  WidgetRef ref, {
  required String eventId,
  required String eventName,
}) async {
  final ticketsFuture = ref.read(_profileTicketsProvider.future);

  try {
    final tickets = await ticketsFuture;
    if (!context.mounted) return;

    Map<String, dynamic>? matchingTicket;
    final normalizedEventName = eventName.trim().toLowerCase();
    for (final ticket in tickets) {
      final ticketEventId = _firstText(ticket, ['eventId']);
      final ticketEventName = _firstText(ticket, [
        'eventName',
      ]).trim().toLowerCase();
      final status = _firstText(ticket, ['status']).toUpperCase();
      final sameEvent =
          ticketEventId == eventId ||
          (normalizedEventName.isNotEmpty &&
              ticketEventName == normalizedEventName);
      if (sameEvent && status != 'CANCELLED') {
        matchingTicket = ticket;
        break;
      }
    }

    if (matchingTicket == null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(
          const SnackBar(
            content: Text('You do not have a ticket for this concert yet.'),
          ),
        );
      return;
    }

    await _showTicketQr(context, matchingTicket);
  } catch (error) {
    if (!context.mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Bad state: ', '')),
        ),
      );
  }
}

class _TourMeta extends StatelessWidget {
  const _TourMeta({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    if (text.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF999999), size: 17),
          const SizedBox(width: 7),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Color(0xFFBBBBBB), fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}

Future<void> _showBuyTicketSheet(
  BuildContext context,
  Map<String, dynamic> event,
) async {
  var quantity = 1;
  var loading = false;
  String? error;
  final remaining = _toInt(event['remainingQuantity']).clamp(1, 99);

  await showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    useSafeArea: true,
    backgroundColor: const Color(0xFF181818),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (sheetContext) => StatefulBuilder(
      builder: (context, setState) {
        Future<void> pay() async {
          setState(() {
            loading = true;
            error = null;
          });
          final response = await ApiService.instance.createTicketPaymentApi(
            eventId: _firstText(event, ['id', '_id']),
            quantity: quantity,
          );
          final data = response.data is Map
              ? Map<String, dynamic>.from(response.data as Map)
              : const <String, dynamic>{};
          final paymentUrl = data['paymentUrl']?.toString().trim() ?? '';

          if (!response.isSuccess || paymentUrl.isEmpty) {
            setState(() {
              loading = false;
              error = response.message.isEmpty
                  ? 'Cannot create VNPay payment.'
                  : response.message;
            });
            return;
          }

          final opened = await launchUrl(
            Uri.parse(paymentUrl),
            mode: LaunchMode.externalApplication,
          );
          if (!opened) {
            setState(() {
              loading = false;
              error = 'Cannot open VNPay.';
            });
          } else if (sheetContext.mounted) {
            Navigator.pop(sheetContext);
          }
        }

        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                _firstText(event, ['eventName', 'name', 'title']),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.outlined(
                    onPressed: quantity > 1
                        ? () => setState(() => quantity--)
                        : null,
                    icon: const Icon(Icons.remove),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Text(
                      '$quantity',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                  IconButton.outlined(
                    onPressed: quantity < remaining
                        ? () => setState(() => quantity++)
                        : null,
                    icon: const Icon(Icons.add),
                  ),
                ],
              ),
              if (error != null) ...[
                const SizedBox(height: 10),
                Text(error!, style: const TextStyle(color: Color(0xFFFF6B6B))),
              ],
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: loading ? null : pay,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFFF5500),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: loading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Continue to VNPay'),
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

int _toInt(dynamic value) {
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
