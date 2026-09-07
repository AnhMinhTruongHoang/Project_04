part of 'profile_screen.dart';

Future<void> showTicketScannerSheet(BuildContext context, WidgetRef ref) async {
  final tokenController = TextEditingController();
  final scannerController = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );
  var checking = false;
  var cameraActive = true;
  var sheetOpen = true;
  String? message;
  bool success = false;

  Future<void> stopCamera() async {
    try {
      await scannerController.stop();
    } catch (_) {
      // Camera may already be stopped or its permission may have been revoked.
    }
  }

  Future<void> resumeCamera() async {
    if (!sheetOpen || !cameraActive || checking) return;
    try {
      await scannerController.start();
    } catch (_) {
      // The scanner UI will remain available for manual token check-in.
    }
  }

  final lifecycleListener = AppLifecycleListener(
    onInactive: stopCamera,
    onPause: stopCamera,
    onHide: stopCamera,
    onDetach: stopCamera,
    onResume: resumeCamera,
  );

  try {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: const Color(0xFF111111),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setState) {
          Future<void> closeScanner() async {
            cameraActive = false;
            await stopCamera();
            if (sheetContext.mounted) {
              Navigator.pop(sheetContext);
            }
          }

          Future<void> checkIn([String? scannedValue]) async {
            final token = _extractTicketQrToken(
              scannedValue ?? tokenController.text,
            );
            if (token.isEmpty || checking) return;

            tokenController.text = token;
            setState(() {
              checking = true;
              success = false;
              message = null;
              cameraActive = false;
            });
            await stopCamera();

            final response = await ApiService.instance.checkInTicketApi({
              'qrToken': token,
            });

            if (!sheetContext.mounted) return;
            if (response.isSuccess && response.data != null) {
              ref.invalidate(_profileTicketsProvider);
              ref.invalidate(_profileEventsProvider);
              final data = response.data is Map
                  ? Map<String, dynamic>.from(response.data as Map)
                  : const <String, dynamic>{};
              final code = _firstText(data, ['ticketCode', 'code']);
              setState(() {
                checking = false;
                success = true;
                message = code.isEmpty
                    ? 'Ticket checked in successfully.'
                    : 'Checked in ticket $code.';
              });
            } else {
              setState(() {
                checking = false;
                success = false;
                message = response.message.isEmpty
                    ? 'Unable to check in this ticket.'
                    : response.message;
              });
            }
          }

          Future<void> scanNext() async {
            tokenController.clear();
            setState(() {
              success = false;
              message = null;
              cameraActive = true;
            });
            await scannerController.start();
          }

          return SizedBox(
            height: MediaQuery.sizeOf(context).height * 0.88,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 20),
              child: Column(
                children: [
                  Container(
                    width: 42,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFF555555),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      const Expanded(
                        child: Text(
                          'Ticket check-in',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: closeScanner,
                        icon: const Icon(Icons.close, color: Colors.white),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: cameraActive
                          ? Stack(
                              fit: StackFit.expand,
                              children: [
                                MobileScanner(
                                  controller: scannerController,
                                  onDetect: (capture) {
                                    final value = capture.barcodes
                                        .map((barcode) => barcode.rawValue)
                                        .whereType<String>()
                                        .where(
                                          (value) => value.trim().isNotEmpty,
                                        )
                                        .firstOrNull;
                                    if (value != null) {
                                      checkIn(value);
                                    }
                                  },
                                ),
                                Center(
                                  child: Container(
                                    width: 225,
                                    height: 225,
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(18),
                                      border: Border.all(
                                        color: const Color(0xFFFF5500),
                                        width: 3,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : ColoredBox(
                              color: const Color(0xFF1C1C1C),
                              child: Center(
                                child: checking
                                    ? const CircularProgressIndicator(
                                        color: Color(0xFFFF5500),
                                      )
                                    : Icon(
                                        success
                                            ? Icons.check_circle_rounded
                                            : Icons.qr_code_scanner_rounded,
                                        size: 84,
                                        color: success
                                            ? const Color(0xFF55D68B)
                                            : const Color(0xFFFF6B6B),
                                      ),
                              ),
                            ),
                    ),
                  ),
                  if (message != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      message!,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: success
                            ? const Color(0xFF55D68B)
                            : const Color(0xFFFF6B6B),
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: tokenController,
                    enabled: !checking,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      hintText: 'Scan or paste SCT-... token',
                      hintStyle: const TextStyle(color: Color(0xFF777777)),
                      filled: true,
                      fillColor: const Color(0xFF202020),
                      suffixIcon: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          IconButton(
                            tooltip: 'Paste token',
                            onPressed: checking
                                ? null
                                : () async {
                                    final clipboard = await Clipboard.getData(
                                      Clipboard.kTextPlain,
                                    );
                                    if (!sheetContext.mounted) return;
                                    final value = clipboard?.text?.trim() ?? '';
                                    if (value.isNotEmpty) {
                                      tokenController.text = value;
                                    }
                                  },
                            icon: const Icon(Icons.content_paste_rounded),
                          ),
                          IconButton(
                            tooltip: 'Check in token',
                            onPressed: checking ? null : () => checkIn(),
                            icon: const Icon(Icons.login_rounded),
                          ),
                        ],
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: checking
                          ? null
                          : success
                          ? scanNext
                          : () => checkIn(),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFFF5500),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: Icon(
                        success
                            ? Icons.qr_code_scanner_rounded
                            : Icons.check_circle_outline,
                      ),
                      label: Text(success ? 'Scan next' : 'Check in'),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  } finally {
    sheetOpen = false;
    cameraActive = false;
    lifecycleListener.dispose();
    await stopCamera();
    await scannerController.dispose();
    tokenController.dispose();
  }
}

String _extractTicketQrToken(String rawValue) {
  final value = rawValue.trim();
  if (value.isEmpty) return '';

  final uri = Uri.tryParse(value);
  if (uri != null) {
    final wrappedToken =
        uri.queryParameters['qrToken'] ??
        uri.queryParameters['token'] ??
        uri.queryParameters['qrValue'];
    if (wrappedToken != null && wrappedToken.trim().isNotEmpty) {
      return wrappedToken.trim();
    }
  }

  return value;
}
