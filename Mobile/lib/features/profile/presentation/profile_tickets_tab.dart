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
    final eventDate = _readableDate(
      _firstText(ticket, ['eventStartAt']).isNotEmpty
          ? _firstText(ticket, ['eventStartAt'])
          : _firstText(event, ['eventStartAt', 'startAt']),
    );
    final used = status == 'USED' || ticket['checkedIn'] == true;
    final color = used
        ? const Color(0xFFFFB454)
        : status == 'VALID'
        ? const Color(0xFF55D68B)
        : const Color(0xFFAAAAAA);

    return InkWell(
      onTap: id.isEmpty ? null : () => _showTicketQr(context, ticket),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFF141414),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFF2A2A2A)),
        ),
        child: Row(
          children: [
            Container(
              width: 58,
              height: 58,
              decoration: BoxDecoration(
                color: const Color(0xFF242424),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.qr_code_2_rounded,
                color: Color(0xFFFF5500),
                size: 34,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    eventName.isEmpty ? 'SoundClone ticket' : eventName,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (code.isNotEmpty) ...[
                    const SizedBox(height: 5),
                    Text(
                      code,
                      style: const TextStyle(
                        color: Color(0xFF888888),
                        fontSize: 11,
                        fontFamily: 'monospace',
                      ),
                    ),
                  ],
                  if (eventDate.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      eventDate,
                      style: const TextStyle(
                        color: Color(0xFFAAAAAA),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              children: [
                Text(
                  status.isEmpty ? 'TICKET' : status,
                  style: TextStyle(
                    color: color,
                    fontSize: 11,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 7),
                const Icon(Icons.chevron_right, color: Color(0xFF777777)),
              ],
            ),
          ],
        ),
      ),
    );
  }
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
