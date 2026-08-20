import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../data/auth_service.dart';
import 'widgets/auth_page_shell.dart';

class ResetPasswordScreen
    extends StatefulWidget {
  const ResetPasswordScreen({
    super.key,
    this.initialEmail = '',
  });

  final String initialEmail;

  @override
  State<ResetPasswordScreen>
  createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState
    extends State<ResetPasswordScreen> {
  final _formKey =
  GlobalKey<FormState>();

  late final TextEditingController
  _emailController;

  final _otpController =
  TextEditingController();

  final _newPasswordController =
  TextEditingController();

  final _rePasswordController =
  TextEditingController();

  final AuthService _authService =
  AuthService();

  bool _loading = false;

  bool _showNewPassword = false;
  bool _showRePassword = false;

  String _message = '';
  bool _success = false;

  @override
  void initState() {
    super.initState();

    _emailController =
        TextEditingController(
          text: widget.initialEmail,
        );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _newPasswordController.dispose();
    _rePasswordController.dispose();

    super.dispose();
  }

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (_loading) {
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final email = _emailController.text
        .trim()
        .toLowerCase();

    final otp =
    _otpController.text.trim();

    final newPassword =
        _newPasswordController.text;

    setState(() {
      _loading = true;
      _success = false;
      _message = '';
    });

    try {
      final result =
      await _authService.resetPassword(
        email: email,
        otp: otp,
        newPassword: newPassword,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _success = true;
        _message = result.message;
      });

      // FE cũng chờ khoảng 900ms rồi quay về Sign in.
      await Future.delayed(
        const Duration(milliseconds: 900),
      );

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
        _message =
        'Reset password failed. Please try again.';
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
      maxWidth: 500,
      onBack: () {
        if (!_loading) {
          context.go(
            '/auth/forgot-password',
          );
        }
      },
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment:
          CrossAxisAlignment.stretch,
          children: [
            _buildHeader(),

            const SizedBox(height: 26),

            if (_message.isNotEmpty) ...[
              AuthStatusMessage(
                message: _message,
                success: _success,
              ),
              const SizedBox(height: 20),
            ],

            // ==================================================
            // EMAIL
            // ==================================================

            AuthFieldGroup(
              label: 'Email',
              child: TextFormField(
                controller:
                _emailController,
                enabled: !_loading,
                keyboardType:
                TextInputType.emailAddress,
                textInputAction:
                TextInputAction.next,
                autofillHints: const [
                  AutofillHints.email,
                ],
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                ),
                decoration:
                authInputDecoration(
                  hint: 'your@email.com',
                ).copyWith(
                  prefixIcon: const Icon(
                    Icons.mail_outline_rounded,
                    color:
                    Color(0xFF8B949E),
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
                controller:
                _otpController,
                enabled: !_loading,
                autofocus:
                widget.initialEmail
                    .isNotEmpty,
                keyboardType:
                TextInputType.number,
                textInputAction:
                TextInputAction.next,
                maxLength: 6,
                inputFormatters: [
                  FilteringTextInputFormatter
                      .digitsOnly,
                  LengthLimitingTextInputFormatter(
                    6,
                  ),
                ],
                textAlign:
                TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight:
                  FontWeight.w900,
                  letterSpacing: 8,
                ),
                decoration:
                authInputDecoration(
                  hint: '000000',
                ).copyWith(
                  counterText: '',
                ),
                validator: _validateOtp,
              ),
            ),

            const SizedBox(height: 18),

            // ==================================================
            // NEW PASSWORD
            // ==================================================

            AuthFieldGroup(
              label: 'New Password',
              child: TextFormField(
                controller:
                _newPasswordController,
                enabled: !_loading,
                obscureText:
                !_showNewPassword,
                textInputAction:
                TextInputAction.next,
                autofillHints: const [
                  AutofillHints.newPassword,
                ],
                style: const TextStyle(
                  color: Colors.white,
                ),
                decoration:
                authInputDecoration(
                  hint: '••••••••',
                ).copyWith(
                  prefixIcon: const Icon(
                    Icons
                        .lock_outline_rounded,
                    color:
                    Color(0xFF8B949E),
                  ),
                  suffixIcon: IconButton(
                    tooltip:
                    _showNewPassword
                        ? 'Hide password'
                        : 'Show password',
                    onPressed: _loading
                        ? null
                        : () {
                      setState(() {
                        _showNewPassword =
                        !_showNewPassword;
                      });
                    },
                    icon: Icon(
                      _showNewPassword
                          ? Icons
                          .visibility_outlined
                          : Icons
                          .visibility_off_outlined,
                      color: const Color(
                        0xFF8B949E,
                      ),
                    ),
                  ),
                ),
                validator:
                _validateNewPassword,
              ),
            ),

            const SizedBox(height: 18),

            // ==================================================
            // RE PASSWORD
            // ==================================================

            AuthFieldGroup(
              label: 'Re Password',
              child: TextFormField(
                controller:
                _rePasswordController,
                enabled: !_loading,
                obscureText:
                !_showRePassword,
                textInputAction:
                TextInputAction.done,
                autofillHints: const [
                  AutofillHints.newPassword,
                ],
                onFieldSubmitted: (_) {
                  if (!_loading) {
                    _submit();
                  }
                },
                style: const TextStyle(
                  color: Colors.white,
                ),
                decoration:
                authInputDecoration(
                  hint: '••••••••',
                ).copyWith(
                  prefixIcon: const Icon(
                    Icons
                        .lock_outline_rounded,
                    color:
                    Color(0xFF8B949E),
                  ),
                  suffixIcon: IconButton(
                    tooltip:
                    _showRePassword
                        ? 'Hide password'
                        : 'Show password',
                    onPressed: _loading
                        ? null
                        : () {
                      setState(() {
                        _showRePassword =
                        !_showRePassword;
                      });
                    },
                    icon: Icon(
                      _showRePassword
                          ? Icons
                          .visibility_outlined
                          : Icons
                          .visibility_off_outlined,
                      color: const Color(
                        0xFF8B949E,
                      ),
                    ),
                  ),
                ),
                validator:
                _validateRePassword,
              ),
            ),

            const SizedBox(height: 26),

            // ==================================================
            // RESET BUTTON
            // ==================================================

            AuthPrimaryButton(
              loading: _loading,
              onPressed: _submit,
              text: 'Reset password',
              loadingText: 'Resetting...',
            ),

            const SizedBox(height: 24),

            // ==================================================
            // BACK TO SIGN IN
            // ==================================================

            Row(
              mainAxisAlignment:
              MainAxisAlignment.center,
              children: [
                const Text(
                  'Back to ',
                  style: TextStyle(
                    color:
                    Color(0xFFB8B8B8),
                    fontSize: 14,
                  ),
                ),
                GestureDetector(
                  onTap: _loading
                      ? null
                      : () {
                    context.go(
                      '/login',
                    );
                  },
                  child: const Text(
                    'Sign in',
                    style: TextStyle(
                      color: authCyan,
                      fontSize: 14,
                      fontWeight:
                      FontWeight.w800,
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
            color:
            authOrange.withValues(
              alpha: 0.14,
            ),
            border: Border.all(
              color: const Color(
                0xFFFF7A00,
              ).withValues(
                alpha: 0.40,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color:
                authOrange.withValues(
                  alpha: 0.25,
                ),
                blurRadius: 28,
              ),
            ],
          ),
          child: const Icon(
            Icons.password_rounded,
            color: Color(0xFFFF7A00),
            size: 36,
          ),
        ),

        const SizedBox(height: 16),

        const Text(
          'Reset Password',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 32,
            fontWeight:
            FontWeight.w900,
            letterSpacing: -0.8,
          ),
        ),

        const SizedBox(height: 9),

        const Text(
          'Enter your OTP and create a new password.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color:
            Color(0xFF8B949E),
            fontSize: 14,
            height: 1.45,
          ),
        ),
      ],
    );
  }

  // ============================================================
  // VALIDATION
  // ============================================================

  String? _validateEmail(
      String? value,
      ) {
    final email =
        value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Email is required.';
    }

    final emailRegex = RegExp(
      r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
    );

    if (!emailRegex.hasMatch(email)) {
      return 'Email is invalid.';
    }

    return null;
  }

  String? _validateOtp(
      String? value,
      ) {
    final otp =
        value?.trim() ?? '';

    if (otp.isEmpty) {
      return 'OTP is required.';
    }

    if (otp.length != 6) {
      return 'OTP must contain 6 digits.';
    }

    return null;
  }

  String? _validateNewPassword(
      String? value,
      ) {
    final password =
        value ?? '';

    if (password.trim().isEmpty) {
      return 'New password is required.';
    }

    // Bám đúng validate hiện tại của FE.
    if (password.length < 3) {
      return 'Password must be at least 3 characters.';
    }

    return null;
  }

  String? _validateRePassword(
      String? value,
      ) {
    if (value == null ||
        value.isEmpty) {
      return 'Please re-enter your password.';
    }

    if (value !=
        _newPasswordController.text) {
      return 'Passwords do not match.';
    }

    return null;
  }
}