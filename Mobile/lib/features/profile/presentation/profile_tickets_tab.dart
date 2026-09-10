part of 'profile_screen.dart';

class ProfileMobileTicketsTab extends ConsumerWidget {
  const ProfileMobileTicketsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tickets = ref.watch(_profileTicketsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: Text(
                'My tickets',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            IconButton(
              tooltip: 'Refresh tickets',
              onPressed: () => ref.invalidate(_profileTicketsProvider),
              icon: const Icon(Icons.refresh_rounded, color: Colors.white),
            ),
          ],
        ),
        const SizedBox(height: 14),
        tickets.when(
          loading: () => const _RecentLoading(),
          error: (error, _) => _ProfileEmptyTab(
            icon: Icons.cloud_off_outlined,
            title: 'Tickets unavailable',
            description: error.toString(),
          ),
          data: (items) {
            if (items.isEmpty) {
              return const _ProfileEmptyTab(
                icon: Icons.local_activity_outlined,
                title: 'No tickets yet',
                description: 'Tickets purchased on SoundClone appear here.',
              );
            }

            return Column(
              children: items
                  .map((ticket) => _TicketCard(ticket: ticket))
                  .toList(),
            );
          },
        ),
      ],
    );
  }
}

class _TicketCard extends StatelessWidget {
  const _TicketCard({required this.ticket});

  final Map<String, dynamic> ticket;

  @override
  Widget build(BuildContext context) {
    final event = ticket['event'] is Map
        ? Map<String, dynamic>.from(ticket['event'] as Map)
        : ticket;
    final id = _firstText(ticket, ['id', '_id']);
    final eventName = _firstText(ticket, ['eventName']).isNotEmpty
        ? _firstText(ticket, ['eventName'])
        : _firstText(event, ['eventName', 'name', 'title']);
    final code = _firstText(ticket, ['ticketCode', 'code']);
    final status = _firstText(ticket, ['status']).toUpperCase();
    final collectionStatus = _firstText(ticket, [
      'collectionStatus',
    ]).toUpperCase();
    final eventDate = _readableDate(
      _firstText(ticket, ['eventStartAt']).isNotEmpty
          ? _firstText(ticket, ['eventStartAt'])
          : _firstText(event, ['eventStartAt', 'startAt']),
    );
    final venueName = _firstText(ticket, ['venueName']).isNotEmpty
        ? _firstText(ticket, ['venueName'])
        : _firstText(event, ['venueName', 'venue']);
    final venueAddress = _firstText(ticket, ['venueAddress']).isNotEmpty
        ? _firstText(ticket, ['venueAddress'])
        : _firstText(event, ['venueAddress', 'address']);
    final imageUrl = _resolveMediaUrl(
      _firstText(ticket, ['ticketImageUrl', 'ticketImage']).isNotEmpty
          ? _firstText(ticket, ['ticketImageUrl', 'ticketImage'])
          : _firstText(event, ['ticketImageUrl', 'ticketImage', 'imageUrl']),
    );
    final purchasePrice = ticket['purchasePrice'] ?? ticket['ticketPrice'];
    final used = status == 'USED' || ticket['checkedIn'] == true;
    final displayStatus = collectionStatus.isNotEmpty
        ? collectionStatus
        : status.isEmpty
        ? 'TICKET'
        : status;
    final statusColor = used
        ? const Color(0xFF7164FF)
        : displayStatus == 'VALID' || displayStatus == 'UPCOMING'
        ? const Color(0xFF55D68B)
        : displayStatus == 'CANCELLED'
        ? const Color(0xFFFF6B6B)
        : const Color(0xFFAAAAAA);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF343434)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              SizedBox(
                width: double.infinity,
                height: 172,
                child: imageUrl == null
                    ? ColoredBox(
                        color: const Color(0xFF242424),
                        child: Center(
                          child: Image.asset(
                            'assets/images/sc_logo.png',
                            width: 92,
                            height: 92,
                            fit: BoxFit.contain,
                          ),
                        ),
                      )
                    : Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const ColoredBox(
                          color: Color(0xFF242424),
                          child: Icon(
                            Icons.local_activity_rounded,
                            color: Color(0xFFFF5500),
                            size: 54,
                          ),
                        ),
                      ),
              ),
              Positioned(
                top: 10,
                left: 10,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.20),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: statusColor.withValues(alpha: 0.45),
                    ),
                  ),
                  child: Text(
                    _ticketStatusLabel(displayStatus),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(13, 13, 13, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eventName.isEmpty ? 'SoundClone ticket' : eventName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                if (code.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  Text(
                    code,
                    style: const TextStyle(
                      color: Color(0xFF888888),
                      fontSize: 10,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
                if (eventDate.isNotEmpty) ...[
                  const SizedBox(height: 13),
                  _TicketDetailLine(
                    icon: Icons.calendar_month_rounded,
                    text: eventDate,
                  ),
                ],
                if (venueName.isNotEmpty || venueAddress.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  _TicketDetailLine(
                    icon: Icons.location_on_rounded,
                    text: venueName,
                    secondary: venueAddress,
                  ),
                ],
                const SizedBox(height: 13),
                const Text(
                  'Purchase price',
                  style: TextStyle(color: Color(0xFF777777), fontSize: 10),
                ),
                const SizedBox(height: 3),
                Text(
                  _formatMoney(purchasePrice),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: id.isEmpty
                        ? null
                        : () => _showTicketQr(context, ticket),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFFFF5500),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    icon: const Icon(Icons.qr_code_2_rounded, size: 18),
                    label: const Text(
                      'View ticket',
                      style: TextStyle(fontWeight: FontWeight.w900),
                    ),
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

class _TicketDetailLine extends StatelessWidget {
  const _TicketDetailLine({
    required this.icon,
    required this.text,
    this.secondary = '',
  });

  final IconData icon;
  final String text;
  final String secondary;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: const Color(0xFF999999), size: 16),
        const SizedBox(width: 7),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (text.isNotEmpty)
                Text(
                  text,
                  style: const TextStyle(
                    color: Color(0xFFDDDDDD),
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              if (secondary.isNotEmpty) ...[
                const SizedBox(height: 3),
                Text(
                  secondary,
                  style: const TextStyle(
                    color: Color(0xFF888888),
                    fontSize: 10,
                    height: 1.4,
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

String _ticketStatusLabel(String status) {
  if (status.isEmpty) return 'Ticket';
  return '${status[0]}${status.substring(1).toLowerCase()}';
}

Future<void> _showTicketQr(
  BuildContext context,
  Map<String, dynamic> ticket,
) async {
  final ticketId = _firstText(ticket, ['id', '_id']);
  if (ticketId.isEmpty) return;

  await showDialog<void>(
    context: context,
    builder: (dialogContext) => FutureBuilder<ApiResponse<dynamic>>(
      future: ApiService.instance.getMyTicketQrApi(ticketId),
      builder: (context, snapshot) {
        final loading = snapshot.connectionState != ConnectionState.done;
        final response = snapshot.data;
        final data = response?.data is Map
            ? Map<String, dynamic>.from(response!.data as Map)
            : const <String, dynamic>{};
        final qrValue = _firstText(data, ['qrValue', 'qrToken']);
        final eventName = _firstText(data, ['eventName']);
        final ticketCode = _firstText(data, ['ticketCode']);

        return AlertDialog(
          backgroundColor: const Color(0xFF181818),
          surfaceTintColor: Colors.transparent,
          title: const Text(
            'Ticket QR',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
          ),
          content: SizedBox(
            width: 280,
            child: loading
                ? const SizedBox(
                    height: 280,
                    child: Center(
                      child: CircularProgressIndicator(
                        color: Color(0xFFFF5500),
                      ),
                    ),
                  )
                : qrValue.isEmpty
                ? Text(
                    response?.message ?? 'QR code unavailable.',
                    style: const TextStyle(color: Color(0xFFFF6B6B)),
                  )
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        color: Colors.white,
                        child: QrImageView(
                          data: qrValue,
                          version: QrVersions.auto,
                          size: 230,
                          backgroundColor: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        eventName,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        ticketCode,
                        style: const TextStyle(
                          color: Color(0xFF999999),
                          fontFamily: 'monospace',
                        ),
                      ),
                    ],
                  ),
          ),
          actions: [
            if (qrValue.isNotEmpty)
              TextButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: qrValue));
                  if (dialogContext.mounted) {
                    ScaffoldMessenger.of(dialogContext)
                      ..hideCurrentSnackBar()
                      ..showSnackBar(
                        const SnackBar(
                          content: Text(
                            'QR token copied for check-in testing.',
                          ),
                        ),
                      );
                  }
                },
                icon: const Icon(Icons.copy_rounded),
                label: const Text('Copy token'),
              ),
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Close'),
            ),
          ],
        );
      },
    ),
  );
}
