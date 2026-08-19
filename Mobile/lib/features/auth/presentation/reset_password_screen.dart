import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../data/auth_service.dart';
import 'widgets/auth_field.dart';
import 'widgets/auth_logo.dart';
import 'widgets/auth_message.dart';
import 'widgets/auth_primary_button.dart';
import 'widgets/auth_scaffold.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({
    super.key,
    required this.initialEmail,
  });

  final String initialEmail;

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  late final TextEditingController _emailController;
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  final _authService = AuthService();

  bool _obscurePassword = true;
  bool _loading = false;
  bool _success = false;
  String _message = '';

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = _emailController.text.trim().toLowerCase();
    final otp = _otpController.text.trim();
    final password = _passwordController.text;
    final confirm = _confirmController.text;

    String? validationError;

    if (email.isEmpty) {
      validationError = 'Email is required.';
    } else if (otp.length != 6) {
      validationError = 'Enter the 6-digit reset code.';
    } else if (password.isEmpty) {
      validationError = 'New password is required.';
    } else if (password.length < 3) {
      validationError = 'Password must be at least 3 characters.';
    } else if (password != confirm) {
      validationError = 'Passwords do not match.';
    }

    if (validationError != null) {
      setState(() {
        _success = false;
        _message = validationError!;
      });
      return;
    }

    setState(() {
      _loading = true;
      _message = '';
    });

    try {
      final message = await _authService.resetPassword(
        email: email,
        otp: otp,
        newPassword: password,
      );

      if (!mounted) return;

      setState(() {
        _success = true;
        _message = message;
      });

      await Future<void>.delayed(const Duration(milliseconds: 800));

      if (mounted) context.go('/login');
    } catch (error) {
      if (mounted) {
        setState(() {
          _success = false;
          _message = error.toString();
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      onBack: () => context.go('/forgot-password'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: AuthLogo(icon: Icons.password_rounded),
          ),
          const SizedBox(height: 26),
          const Text(
            'Create a new password',
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
            'Use the code from your email and choose a new password.',
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
            textInputAction: TextInputAction.next,
            enabled: !_loading,
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _otpController,
            label: 'Reset code',
            hint: '000000',
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            enabled: !_loading,
            maxLength: 6,
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _passwordController,
            label: 'New password',
            hint: 'At least 3 characters',
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.next,
            enabled: !_loading,
            suffixIcon: IconButton(
              onPressed: _loading
                  ? null
                  : () {
                      setState(() {
                        _obscurePassword = !_obscurePassword;
                      });
                    },
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _confirmController,
            label: 'Confirm password',
            hint: 'Enter your new password again',
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            enabled: !_loading,
            onSubmitted: (_) => _submit(),
          ),
          const SizedBox(height: 22),
          AuthPrimaryButton(
            label: 'Reset Password',
            loading: _loading,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}
