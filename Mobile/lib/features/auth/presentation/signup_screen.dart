import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../data/auth_service.dart';
import '../providers/auth_provider.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _showPassword = false;
  bool _agreeTerms = false;
  bool _receiveNotifications = false;
  bool _termsError = false;

  static const _orange = Color(0xFFFF5500);
  static const _cyan = Color(0xFF00FFE0);

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    setState(() {
      _termsError = !_agreeTerms;
    });

    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (!_agreeTerms) {
      return;
    }

    final email = _emailController.text.trim().toLowerCase();

    try {
      final result = await ref
          .read(authProvider.notifier)
          .register(
            name: _nameController.text.trim(),
            email: email,
            password: _passwordController.text,
          );

      if (!mounted) return;

      _showMessage(
        result.message.isNotEmpty ? result.message : 'Registration successful.',
        success: true,
      );

      await Future.delayed(const Duration(milliseconds: 900));

      if (!mounted) return;

      // Router hiện tại chưa có verify OTP.
      // Tạm thời quay về login.
      context.go('/login');
    } on AuthRegisterException catch (error) {
      if (!mounted) return;

      if (error.statusCode == 409 && error.requiresVerification) {
        _showMessage('This account has not been verified yet.', success: false);

        return;
      }

      _showMessage(error.message, success: false);
    } catch (error) {
      if (!mounted) return;

      _showMessage(error.toString(), success: false);
    }
  }

  void _showMessage(String message, {required bool success}) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: success
              ? const Color(0xFF137333)
              : const Color(0xFFB3261E),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          content: Row(
            children: [
              Icon(
                success
                    ? Icons.check_circle_outline_rounded
                    : Icons.error_outline_rounded,
                color: Colors.white,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
  }

  void _showTerms({required String title}) {
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.75),
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.transparent,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
              child: Container(
                constraints: const BoxConstraints(maxWidth: 480),
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: const Color(0xFF111315).withValues(alpha: 0.98),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.12),
                  ),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            title,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            Navigator.pop(dialogContext);
                          },
                          icon: const Icon(
                            Icons.close_rounded,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'SoundClone terms and privacy content will be displayed here.',
                      style: TextStyle(
                        color: Color(0xFFB8B8B8),
                        fontSize: 14,
                        height: 1.6,
                      ),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          gradient: const LinearGradient(
                            colors: [Color(0xFFFF4D00), Color(0xFFFF7A00)],
                          ),
                        ),
                        child: FilledButton(
                          onPressed: () {
                            setState(() {
                              _agreeTerms = true;
                              _termsError = false;
                            });

                            Navigator.pop(dialogContext);
                          },
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.transparent,
                            shadowColor: Colors.transparent,
                          ),
                          child: const Text(
                            'I Agree',
                            style: TextStyle(fontWeight: FontWeight.w800),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final loading = authState.isLoading;

    return Scaffold(
      backgroundColor: const Color(0xFF050607),
      body: Stack(
        children: [
          const Positioned.fill(child: _SignupBackground()),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 32,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 520),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 14, sigmaY: 14),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.10),
                          ),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              const Color(0xFF121416).withValues(alpha: 0.96),
                              const Color(0xFF0A0C0E).withValues(alpha: 0.97),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.45),
                              blurRadius: 50,
                              offset: const Offset(0, 24),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              _buildHeader(),

                              const SizedBox(height: 30),

                              _buildNameField(loading),

                              const SizedBox(height: 18),

                              _buildEmailField(loading),

                              const SizedBox(height: 18),

                              _buildPasswordField(loading),

                              const SizedBox(height: 18),

                              _buildConfirmPasswordField(loading),

                              const SizedBox(height: 26),

                              _buildDivider(),

                              const SizedBox(height: 18),

                              _buildTerms(loading),

                              const SizedBox(height: 10),

                              _buildNotifications(loading),

                              const SizedBox(height: 24),

                              _buildRegisterButton(loading),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
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
            color: _orange.withValues(alpha: 0.15),
            border: Border.all(
              color: const Color(0xFFFF7A00).withValues(alpha: 0.40),
            ),
            boxShadow: [
              BoxShadow(color: _orange.withValues(alpha: 0.25), blurRadius: 28),
            ],
          ),
          child: const Icon(
            Icons.person_add_alt_1_rounded,
            color: _orange,
            size: 34,
          ),
        ),

        const SizedBox(height: 16),

        const Text(
          'Sign Up',
          style: TextStyle(
            color: Colors.white,
            fontSize: 34,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
          ),
        ),

        const SizedBox(height: 8),

        const Text(
          'Create your SoundClone account',
          style: TextStyle(color: Color(0xFF8B949E), fontSize: 14),
        ),

        const SizedBox(height: 12),

        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Already have an account? ',
              style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
            ),
            GestureDetector(
              onTap: () {
                context.go('/login');
              },
              child: const Text(
                'Sign in',
                style: TextStyle(
                  color: _cyan,
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildNameField(bool loading) {
    return _SignupField(
      label: 'Name',
      child: TextFormField(
        controller: _nameController,
        enabled: !loading,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.name],
        style: const TextStyle(color: Colors.white),
        decoration: _inputDecoration('Enter your name'),
        validator: (value) {
          if (value == null || value.trim().isEmpty) {
            return 'Name is required.';
          }

          return null;
        },
      ),
    );
  }

  Widget _buildEmailField(bool loading) {
    return _SignupField(
      label: 'Email',
      child: TextFormField(
        controller: _emailController,
        enabled: !loading,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.email],
        style: const TextStyle(color: Colors.white),
        decoration: _inputDecoration('your@email.com'),
        validator: (value) {
          final email = value?.trim() ?? '';

          if (email.isEmpty) {
            return 'Email is required.';
          }

          final regex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');

          if (!regex.hasMatch(email)) {
            return 'Email is invalid.';
          }

          return null;
        },
      ),
    );
  }

  Widget _buildPasswordField(bool loading) {
    return _SignupField(
      label: 'Password',
      child: TextFormField(
        controller: _passwordController,
        enabled: !loading,
        obscureText: !_showPassword,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.newPassword],
        style: const TextStyle(color: Colors.white),
        decoration: _inputDecoration(
          '••••••••',
        ).copyWith(suffixIcon: _passwordButton(loading)),
        validator: (value) {
          final password = value ?? '';

          if (password.isEmpty) {
            return 'Password is required.';
          }

          if (password.length < 8) {
            return 'Password must be at least 8 characters.';
          }

          return null;
        },
      ),
    );
  }

  Widget _buildConfirmPasswordField(bool loading) {
    return _SignupField(
      label: 'Re Password',
      child: TextFormField(
        controller: _confirmPasswordController,
        enabled: !loading,
        obscureText: !_showPassword,
        textInputAction: TextInputAction.done,
        onFieldSubmitted: (_) {
          if (!loading) {
            _submit();
          }
        },
        style: const TextStyle(color: Colors.white),
        decoration: _inputDecoration(
          '••••••••',
        ).copyWith(suffixIcon: _passwordButton(loading)),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Please re-enter your password.';
          }

          if (value != _passwordController.text) {
            return 'Passwords do not match.';
          }

          return null;
        },
      ),
    );
  }

  Widget _passwordButton(bool loading) {
    return IconButton(
      onPressed: loading
          ? null
          : () {
              setState(() {
                _showPassword = !_showPassword;
              });
            },
      icon: Icon(
        _showPassword
            ? Icons.visibility_outlined
            : Icons.visibility_off_outlined,
        color: const Color(0xFF8B949E),
      ),
    );
  }

  Widget _buildDivider() {
    return const Row(
      children: [
        Expanded(child: Divider(color: Color(0xFF303438))),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 14),
          child: Text(
            'Term of service',
            style: TextStyle(color: Color(0xFF8B949E), fontSize: 14),
          ),
        ),
        Expanded(child: Divider(color: Color(0xFF303438))),
      ],
    );
  }

  Widget _buildTerms(bool loading) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Checkbox(
              value: _agreeTerms,
              onChanged: loading
                  ? null
                  : (value) {
                      setState(() {
                        _agreeTerms = value ?? false;
                        _termsError = false;
                      });
                    },
              activeColor: _cyan,
              checkColor: const Color(0xFF07110F),
              side: BorderSide(
                color: _termsError
                    ? const Color(0xFFFF4D4F)
                    : const Color(0xFF8B949E),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Wrap(
                  children: [
                    const Text(
                      'I agree to the ',
                      style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
                    ),
                    GestureDetector(
                      onTap: () {
                        _showTerms(title: 'Terms of Service');
                      },
                      child: const Text(
                        'Terms of Service',
                        style: TextStyle(
                          color: _cyan,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const Text(
                      ' and ',
                      style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
                    ),
                    GestureDetector(
                      onTap: () {
                        _showTerms(title: 'Privacy Policy');
                      },
                      child: const Text(
                        'Privacy Policy',
                        style: TextStyle(
                          color: _cyan,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const Text('.', style: TextStyle(color: Color(0xFFB8B8B8))),
                  ],
                ),
              ),
            ),
          ],
        ),

        if (_termsError)
          const Padding(
            padding: EdgeInsets.only(left: 48),
            child: Text(
              'You must agree to the terms and privacy policy.',
              style: TextStyle(color: Color(0xFFFF4D4F), fontSize: 12),
            ),
          ),
      ],
    );
  }

  Widget _buildNotifications(bool loading) {
    return Row(
      children: [
        Checkbox(
          value: _receiveNotifications,
          onChanged: loading
              ? null
              : (value) {
                  setState(() {
                    _receiveNotifications = value ?? false;
                  });
                },
          activeColor: _cyan,
          checkColor: const Color(0xFF07110F),
          side: const BorderSide(color: Color(0xFF8B949E)),
        ),
        const Expanded(
          child: Text(
            'I want to receive notifications in English',
            style: TextStyle(color: Color(0xFFB8B8B8), fontSize: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildRegisterButton(bool loading) {
    return SizedBox(
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: loading
              ? null
              : const LinearGradient(
                  colors: [Color(0xFFFF4D00), Color(0xFFFF7A00)],
                ),
          color: loading ? Colors.white.withValues(alpha: 0.12) : null,
          boxShadow: loading
              ? null
              : [
                  BoxShadow(
                    color: _orange.withValues(alpha: 0.28),
                    blurRadius: 28,
                    offset: const Offset(0, 12),
                  ),
                ],
        ),
        child: FilledButton(
          onPressed: loading ? null : _submit,
          style: FilledButton.styleFrom(
            backgroundColor: Colors.transparent,
            disabledBackgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: loading
              ? const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(width: 12),
                    Text(
                      'Creating account...',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                )
              : const Text(
                  'Sign Up',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF8B949E)),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.04),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      enabledBorder: _border(Colors.white.withValues(alpha: 0.16)),
      border: _border(Colors.white.withValues(alpha: 0.16)),
      focusedBorder: _border(_cyan, width: 1.5),
      errorBorder: _border(const Color(0xFFFF4D4F)),
      focusedErrorBorder: _border(const Color(0xFFFF4D4F), width: 1.5),
      errorStyle: const TextStyle(color: Color(0xFFFF6B6B)),
    );
  }

  OutlineInputBorder _border(Color color, {double width = 1}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(color: color, width: width),
    );
  }
}

class _SignupField extends StatelessWidget {
  const _SignupField({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFFE5E7EB),
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        child,
      ],
    );
  }
}

class _SignupBackground extends StatelessWidget {
  const _SignupBackground();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _SignupBackgroundPainter(),
      child: const SizedBox.expand(),
    );
  }
}

class _SignupBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF050607), Color(0xFF101214), Color(0xFF1E2021)],
      ).createShader(Offset.zero & size);

    canvas.drawRect(Offset.zero & size, background);

    final orange = Paint()
      ..shader =
          RadialGradient(
            colors: [
              const Color(0xFFFF5500).withValues(alpha: 0.22),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.5, size.height * 0.18),
              radius: size.width * 0.75,
            ),
          );

    canvas.drawCircle(
      Offset(size.width * 0.5, size.height * 0.18),
      size.width * 0.75,
      orange,
    );

    final cyan = Paint()
      ..shader =
          RadialGradient(
            colors: [
              const Color(0xFF00FFE0).withValues(alpha: 0.12),
              Colors.transparent,
            ],
          ).createShader(
            Rect.fromCircle(
              center: Offset(size.width * 0.9, size.height * 0.72),
              radius: size.width * 0.7,
            ),
          );

    canvas.drawCircle(
      Offset(size.width * 0.9, size.height * 0.72),
      size.width * 0.7,
      cyan,
    );

    final grid = Paint()
      ..color = Colors.white.withValues(alpha: 0.025)
      ..strokeWidth = 1;

    const spacing = 42.0;

    for (double x = 0; x < size.width; x += spacing) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), grid);
    }

    for (double y = 0; y < size.height; y += spacing) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), grid);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}
