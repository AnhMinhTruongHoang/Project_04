import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../data/auth_service.dart';
import 'widgets/auth_field.dart';
import 'widgets/auth_logo.dart';
import 'widgets/auth_message.dart';
import 'widgets/auth_primary_button.dart';
import 'widgets/auth_scaffold.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _authService = AuthService();

  bool _loading = false;
  bool _success = false;
  String _message = '';

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim().toLowerCase();

    if (email.isEmpty) {
      setState(() {
        _success = false;
        _message = 'Email is required.';
      });
      return;
    }

    if (!RegExp(r'\S+@\S+\.\S+').hasMatch(email)) {
      setState(() {
        _success = false;
        _message = 'Enter a valid email.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _message = '';
    });

    try {
      final message = await _authService.forgotPassword(email: email);

      if (!mounted) return;

      setState(() {
        _success = true;
        _message = message;
      });

      await Future<void>.delayed(const Duration(milliseconds: 700));

      if (mounted) {
        context.go(
          '/reset-password?email=${Uri.encodeQueryComponent(email)}',
        );
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _success = false;
          _message = error.toString();
        });
      }
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      onBack: () => context.pop(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: AuthLogo(icon: Icons.lock_reset_rounded),
          ),
          const SizedBox(height: 26),
          const Text(
            'Reset your password',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textPrimary,
              fontSize: 29,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.6,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Enter your email and we will send you a reset code.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 28),
          AuthMessage(message: _message, success: _success),
          if (_message.isNotEmpty) const SizedBox(height: 18),
          AuthField(
            controller: _emailController,
            label: 'Email',
            hint: 'name@example.com',
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            enabled: !_loading,
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 22),
          AuthPrimaryButton(
            label: 'Send Reset Code',
            loading: _loading,
            onPressed: _submit,
          ),
          const SizedBox(height: 18),
          GestureDetector(
            onTap: _loading ? null : () => context.go('/login'),
            child: const Text(
              'Back to Log In',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w800,
                decoration: TextDecoration.underline,
                decorationColor: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
