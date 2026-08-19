import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../data/auth_service.dart';
import 'widgets/auth_field.dart';
import 'widgets/auth_logo.dart';
import 'widgets/auth_message.dart';
import 'widgets/auth_primary_button.dart';
import 'widgets/auth_scaffold.dart';

class VerifyOtpScreen extends StatefulWidget {
  const VerifyOtpScreen({
    super.key,
    required this.initialEmail,
  });

  final String initialEmail;

  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  late final TextEditingController _emailController;
  final _otpController = TextEditingController();
  final AuthService _authService = AuthService();

  bool _loading = false;
  bool _resending = false;
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
    super.dispose();
  }

  Future<void> _verify() async {
    final email = _emailController.text.trim().toLowerCase();
    final otp = _otpController.text.trim();

    if (email.isEmpty) {
      setState(() {
        _success = false;
        _message = 'Email is required.';
      });
      return;
    }

    if (otp.length != 6) {
      setState(() {
        _success = false;
        _message = 'Enter the 6-digit verification code.';
      });
      return;
    }

    setState(() {
      _loading = true;
      _message = '';
    });

    try {
      final message = await _authService.verifyOtp(email: email, otp: otp);

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

  Future<void> _resend() async {
    final email = _emailController.text.trim().toLowerCase();

    if (email.isEmpty) {
      setState(() {
        _success = false;
        _message = 'Email is required.';
      });
      return;
    }

    setState(() {
      _resending = true;
      _message = '';
    });

    try {
      final message = await _authService.resendOtp(email: email);

      if (mounted) {
        setState(() {
          _success = true;
          _message = message;
        });
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          _success = false;
          _message = error.toString();
        });
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      onBack: () => context.go('/login'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: AuthLogo(icon: Icons.mark_email_read_rounded),
          ),
          const SizedBox(height: 26),
          const Text(
            'Check your email',
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
            'Enter the 6-digit code we sent to verify your SoundClone account.',
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
            enabled: !_loading && !_resending,
          ),
          const SizedBox(height: 16),
          AuthField(
            controller: _otpController,
            label: 'Verification code',
            hint: '000000',
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.done,
            enabled: !_loading && !_resending,
            maxLength: 6,
            onSubmitted: (_) => _verify(),
          ),
          const SizedBox(height: 22),
          AuthPrimaryButton(
            label: 'Verify Account',
            loading: _loading,
            onPressed: _verify,
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: _resending || _loading ? null : _resend,
            child: Text(
              _resending ? 'Sending...' : 'Resend Code',
              style: const TextStyle(
                color: AppColors.textPrimary,
                fontSize: 13,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
