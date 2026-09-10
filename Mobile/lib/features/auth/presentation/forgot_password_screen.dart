import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../data/auth_service.dart';
import 'widgets/auth_page_shell.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();

  final AuthService _authService = AuthService();

  bool _loading = false;

  String _message = '';
  bool _success = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  // ============================================================
  // SEND OTP
  // ============================================================

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (_loading) {
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final email = _emailController.text.trim().toLowerCase();

    setState(() {
      _loading = true;
      _message = '';
      _success = false;
    });

    try {
      final result = await _authService.forgotPassword(email: email);

      if (!mounted) {
        return;
      }

      setState(() {
        _success = true;
        _message = result.message;
      });

      // Giống FE: hiển thị success ngắn trước khi chuyển trang.
      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) {
        return;
      }

      context.go(
        '/auth/reset-password'
        '?email=${Uri.encodeQueryComponent(result.email)}',
      );
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
        _message = 'Send OTP failed. Please try again.';
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
  // UI
  // ============================================================

  @override
  Widget build(BuildContext context) {
    return AuthPageShell(
      onBack: () {
        if (!_loading) {
          context.go('/login');
        }
      },
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildHeader(),

            const SizedBox(height: 28),

            if (_message.isNotEmpty) ...[
              AuthStatusMessage(message: _message, success: _success),
              const SizedBox(height: 20),
            ],

            // EMAIL
            AuthFieldGroup(
              label: 'Email',
              child: TextFormField(
                controller: _emailController,
                enabled: !_loading,
                autofocus: true,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.done,
                autofillHints: const [AutofillHints.email],
                onFieldSubmitted: (_) {
                  if (!_loading) {
                    _submit();
                  }
                },
                style: const TextStyle(color: Colors.white, fontSize: 15),
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

            const SizedBox(height: 24),

            // SEND OTP BUTTON
            AuthPrimaryButton(
              loading: _loading,
              onPressed: _submit,
              text: 'Send OTP',
              loadingText: 'Sending OTP...',
            ),

            const SizedBox(height: 26),

            // BACK TO LOGIN
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Flexible(
                  child: Text(
                    'Remember your password? ',
                    style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
                  ),
                ),
                GestureDetector(
                  onTap: _loading
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

  // ============================================================
  // HEADER
  // ============================================================

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
            Icons.lock_reset_rounded,
            color: Color(0xFFFF7A00),
            size: 36,
          ),
        ),

        const SizedBox(height: 16),

        const Text(
          'Forgot Password',
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
          'Enter your email and we will send you an OTP code.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF8B949E),
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ],
    );
  }

  // ============================================================
  // VALIDATE EMAIL
  // ============================================================

  String? _validateEmail(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Email is required.';
    }

    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

    if (!emailRegex.hasMatch(email)) {
      return 'Email is invalid.';
    }

    return null;
  }
}
