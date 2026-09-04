import 'dart:async';

import 'package:flutter/material.dart';

OverlayEntry? _activeToastEntry;
Timer? _activeToastTimer;

void showAppToast(
  BuildContext context, {
  required String message,
  String? actionLabel,
  VoidCallback? onAction,
  Duration duration = const Duration(seconds: 3),
  double bottomOffset = 126,
}) {
  final overlay = Overlay.maybeOf(context, rootOverlay: true);
  if (overlay == null) {
    return;
  }

  _activeToastTimer?.cancel();
  _activeToastEntry?.remove();

  late final OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) {
      return Positioned(
        left: 24,
        right: 24,
        bottom: bottomOffset + MediaQuery.paddingOf(context).bottom,
        child: IgnorePointer(
          ignoring: actionLabel == null,
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 340),
              child: _SoundCloneToast(
                message: message,
                actionLabel: actionLabel,
                onAction: () {
                  _dismissAppToast(entry);
                  onAction?.call();
                },
              ),
            ),
          ),
        ),
      );
    },
  );

  _activeToastEntry = entry;
  overlay.insert(entry);

  _activeToastTimer = Timer(duration, () {
    _dismissAppToast(entry);
  });
}

void _dismissAppToast(OverlayEntry entry) {
  if (_activeToastEntry != entry) {
    return;
  }

  _activeToastTimer?.cancel();
  _activeToastTimer = null;
  _activeToastEntry?.remove();
  _activeToastEntry = null;
}

class _SoundCloneToast extends StatelessWidget {
  const _SoundCloneToast({
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(minHeight: 44),
        padding: EdgeInsets.fromLTRB(18, 11, actionLabel == null ? 18 : 8, 11),
        decoration: BoxDecoration(
          color: const Color(0xF22F2F2F),
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.34),
              blurRadius: 18,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Text(
                message,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            if (actionLabel != null) ...[
              const SizedBox(width: 8),
              TextButton(
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFFFF5500),
                  visualDensity: VisualDensity.compact,
                  minimumSize: const Size(0, 34),
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                ),
                onPressed: onAction,
                child: Text(
                  actionLabel!,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
