import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../data/auth_service.dart';
import 'widgets/auth_page_shell.dart';

class VerifyOtpScreen extends StatefulWidget {
  const VerifyOtpScreen({super.key, this.initialEmail = ''});

  final String initialEmail;

  @override
  State<VerifyOtpScreen> createState() => _VerifyOtpScreenState();
}

class _VerifyOtpScreenState extends State<VerifyOtpScreen> {
  final _formKey = GlobalKey<FormState>();

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

  // ============================================================
  // VERIFY
  // ============================================================

  Future<void> _verify() async {
    FocusScope.of(context).unfocus();

    if (_loading || _resending) {
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _loading = true;
      _success = false;
      _message = '';
    });

    try {
      final result = await _authService.verifyRegisterOtp(
        email: _emailController.text,
        otp: _otpController.text,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _success = true;
        _message = result.message;
      });

      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) {
        return;
      }

      context.go('/login');
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _success = false;
        _message = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _success = false;
        _message = 'Verify OTP failed. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  // ============================================================
  // RESEND
  // ============================================================

  Future<void> _resend() async {
    FocusScope.of(context).unfocus();

    if (_loading || _resending) {
      return;
    }

    final email = _emailController.text.trim();

    if (email.isEmpty) {
      setState(() {
        _success = false;
        _message = 'Email is required.';
      });

      return;
    }

    setState(() {
      _resending = true;
      _success = false;
      _message = '';
    });

    try {
      final result = await _authService.resendRegisterOtp(email: email);

      if (!mounted) {
        return;
      }

      _otpController.clear();

      setState(() {
        _success = true;
        _message = result.message;
      });
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _success = false;
        _message = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _success = false;
        _message = 'Resend OTP failed. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _resending = false;
        });
      }
    }
  }

  // ============================================================
  // UI
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      maxWidth: 480,
      onBack: () {
        if (!_loading && !_resending) {
          context.go('/login');
        }
      },
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(),

            const SizedBox(height: 26),

            if (_message.isNotEmpty) ...[
              AuthStatusMessage(message: _message, success: _success),
              const SizedBox(height: 20),
            ],

            // ==================================================
            // EMAIL
            // ==================================================
            AuthFieldGroup(
              label: 'Email',
              child: TextFormField(
                controller: _emailController,
                enabled: !_loading && !_resending,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                autofillHints: const [AutofillHints.email],
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
                decoration: authInputDecoration(hint: 'your@email.com')
                    .copyWith(
                      prefixIcon: const Icon(
                        Icons.mail_outline_rounded,
                        color: Color(0xFF8B949E),
                      ),
                    ),
                validator: _validateEmail,
              ),
            ),

            const SizedBox(height: 18),

            // ==================================================
            // OTP
            // ==================================================
            AuthFieldGroup(
              label: 'OTP Code',
              child: TextFormField(
                controller: _otpController,
                enabled: !_loading && !_resending,
                autofocus: widget.initialEmail.isNotEmpty,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.done,
                maxLength: 6,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(6),
                ],
                onFieldSubmitted: (_) {
                  if (!_loading && !_resending) {
                    _verify();
                  }
                },
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 8,
                ),
                decoration: authInputDecoration(
                  hint: '000000',
                ).copyWith(counterText: ''),
                validator: _validateOtp,
              ),
            ),

            const SizedBox(height: 26),

            // ==================================================
            // VERIFY BUTTON
            // ==================================================
            AuthPrimaryButton(
              loading: _loading,
              onPressed: _verify,
              text: 'Verify account',
              loadingText: 'Verifying...',
            ),

            const SizedBox(height: 12),

            // ==================================================
            // RESEND
            // ==================================================
            TextButton(
              onPressed: _loading || _resending ? null : _resend,
              style: TextButton.styleFrom(
                foregroundColor: authCyan,
                padding: const EdgeInsets.symmetric(vertical: 13),
              ),
              child: _resending
                  ? const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 17,
                          height: 17,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: authCyan,
                          ),
                        ),
                        SizedBox(width: 10),
                        Text(
                          'Sending...',
                          style: TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ],
                    )
                  : const Text(
                      'Resend OTP',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
            ),

            const SizedBox(height: 12),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Already verified? ',
                  style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
                ),
                GestureDetector(
                  onTap: _loading || _resending
                      ? null
                      : () {
                          context.go('/login');
                        },
                  child: const Text(
                    'Sign in',
                    style: TextStyle(
                      color: authCyan,
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      children: [
        Container(
          width: 68,
          height: 68,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: authOrange.withValues(alpha: 0.14),
            border: Border.all(
              color: const Color(0xFFFF7A00).withValues(alpha: 0.40),
            ),
            boxShadow: [
              BoxShadow(
                color: authOrange.withValues(alpha: 0.25),
                blurRadius: 28,
              ),
            ],
          ),
          child: const Icon(
            Icons.mark_email_read_rounded,
            color: Color(0xFFFF7A00),
            size: 36,
          ),
        ),

        const SizedBox(height: 16),

        const Text(
          'Verify OTP',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
          ),
        ),

        const SizedBox(height: 9),

        const Text(
          'Enter the OTP code sent to your email.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Color(0xFF8B949E), fontSize: 14),
        ),
      ],
    );
  }

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Email is required.';
    }

    final regex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

    if (!regex.hasMatch(email)) {
      return 'Email is invalid.';
    }

    return null;
  }

  String? _validateOtp(String? value) {
    final otp = value?.trim() ?? '';

    if (otp.isEmpty) {
      return 'OTP is required.';
    }

    if (otp.length != 6) {
      return 'OTP must contain 6 digits.';
    }

    return null;
  }
}
