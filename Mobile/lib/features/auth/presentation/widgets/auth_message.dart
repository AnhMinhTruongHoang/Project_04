import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class AuthMessage extends StatelessWidget {
  const AuthMessage({
    super.key,
    required this.message,
    this.success = false,
  });

  final String message;
  final bool success;

  @override
  Widget build(BuildContext context) {
    if (message.trim().isEmpty) {
      return const SizedBox.shrink();
    }

    final color = success ? const Color(0xFF57D38C) : AppColors.danger;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Text(
        message,
        style: TextStyle(
          color: color,
          fontSize: 13,
          height: 1.35,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
