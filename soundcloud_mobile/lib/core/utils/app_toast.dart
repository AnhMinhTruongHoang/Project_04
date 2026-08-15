import 'package:flutter/material.dart';
import 'package:toastification/toastification.dart';

class AppToast {
  AppToast._();

  static void success(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.success,
      style: ToastificationStyle.fillColored,

      icon: const Icon(
        Icons.check_circle_rounded,
        color: Colors.white,
        size: 24,
      ),

      title: Text(
        message,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),

      alignment: Alignment.topCenter,

      autoCloseDuration: const Duration(seconds: 3),

      showProgressBar: false,

      closeButton: ToastCloseButton(showType: CloseButtonShowType.none),
    );
  }

  static void error(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.error,
      style: ToastificationStyle.fillColored,

      icon: const Icon(Icons.error_rounded, color: Colors.white, size: 24),

      title: Text(
        message,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),

      alignment: Alignment.topCenter,

      autoCloseDuration: const Duration(seconds: 4),

      showProgressBar: false,

      closeButton: ToastCloseButton(showType: CloseButtonShowType.none),
    );
  }

  static void info(BuildContext context, String message) {
    toastification.show(
      context: context,
      type: ToastificationType.info,
      style: ToastificationStyle.fillColored,

      icon: const Icon(Icons.info_rounded, color: Colors.white, size: 24),

      title: Text(
        message,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),

      alignment: Alignment.topCenter,

      autoCloseDuration: const Duration(seconds: 3),

      showProgressBar: false,

      closeButton: ToastCloseButton(showType: CloseButtonShowType.none),
    );
  }
}
