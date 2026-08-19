import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.child,
    this.onBack,
    this.maxWidth = 430,
  });

  final Widget child;
  final VoidCallback? onBack;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Stack(
          children: [
            Positioned.fill(
              child: IgnorePointer(
                child: DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: RadialGradient(
                      center: const Alignment(0, -1.15),
                      radius: 1.05,
                      colors: [
                        AppColors.primary.withValues(alpha: 0.18),
                        AppColors.background.withValues(alpha: 0.96),
                        AppColors.background,
                      ],
                      stops: const [0, 0.48, 1],
                    ),
                  ),
                ),
              ),
            ),
            if (onBack != null)
              Positioned(
                top: 8,
                left: 8,
                child: IconButton(
                  onPressed: onBack,
                  icon: const Icon(Icons.arrow_back_ios_new_rounded),
                  color: AppColors.textPrimary,
                ),
              ),
            Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(24, 54, 24, 30),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: maxWidth),
                  child: child,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
