import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const display = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 28,
    height: 1.1,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.6,
  );

  static const sectionTitle = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 22,
    height: 1.15,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.35,
  );

  static const title = TextStyle(
    color: AppColors.textPrimary,
    fontSize: 15,
    height: 1.2,
    fontWeight: FontWeight.w800,
  );

  static const body = TextStyle(
    color: AppColors.textSecondary,
    fontSize: 13,
    height: 1.35,
    fontWeight: FontWeight.w500,
  );

  static const navLabel = TextStyle(
    fontSize: 11,
    height: 1.2,
    fontWeight: FontWeight.w700,
  );
}
