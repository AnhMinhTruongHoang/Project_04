import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _rememberMe = false;

  static const _orange = Color(0xFFFF5500);
  static const _cyan = Color(0xFF00FFE0);

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      await ref.read(authProvider.notifier).login(
        email: _emailController.text.trim().toLowerCase(),
        password: _passwordController.text,
      );

      if (!mounted) return;

      context.go('/home');
    } catch (error) {
      if (!mounted) return;

      _showMessage(
        error.toString(),
        success: false,
      );
    }
  }

  void _showMessage(
      String message, {
        required bool success,
      }) {
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

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final isLoading = authState.isLoading;

    return Scaffold(
      backgroundColor: const Color(0xFF050607),
      body: Stack(
        children: [
          const Positioned.fill(
            child: _LoginBackground(),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 32,
                ),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(
                    maxWidth: 450,
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(22),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(
                        sigmaX: 14,
                        sigmaY: 14,
                      ),
                      child: Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          border: Border.all(
                            color: Colors.white.withValues(
                              alpha: 0.10,
                            ),
                          ),
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              const Color(0xFF121416)
                                  .withValues(alpha: 0.96),
                              const Color(0xFF0A0C0E)
                                  .withValues(alpha: 0.97),
                            ],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(
                                alpha: 0.45,
                              ),
                              blurRadius: 50,
                              offset: const Offset(0, 24),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment:
                            CrossAxisAlignment.stretch,
                            children: [
                              _buildHeader(),

                              const SizedBox(height: 32),

                              _buildEmailField(isLoading),

                              const SizedBox(height: 18),

                              _buildPasswordField(isLoading),

                              const SizedBox(height: 8),

                              _buildRememberMe(isLoading),

                              const SizedBox(height: 18),

                              _buildLoginButton(isLoading),

                              const SizedBox(height: 28),

                              _buildDivider(),

                              const SizedBox(height: 22),

                              _buildSocialButton(
                                icon: Icons.g_mobiledata_rounded,
                                text: 'Sign in with Google',
                                enabled: !isLoading,
                                onPressed: () {
                                  _showMessage(
                                    'Google sign in is not connected yet.',
                                    success: false,
                                  );
                                },
                              ),

                              const SizedBox(height: 12),

                              _buildSocialButton(
                                icon: Icons.code_rounded,
                                text: 'Sign in with GitHub',
                                enabled: !isLoading,
                                onPressed: () {
                                  _showMessage(
                                    'GitHub sign in is not connected yet.',
                                    success: false,
                                  );
                                },
                              ),

                              const SizedBox(height: 26),

                              _buildSignupLink(),
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
            color: _orange.withValues(alpha: 0.14),
            border: Border.all(
              color: const Color(0xFFFF7A00)
                  .withValues(alpha: 0.40),
            ),
            boxShadow: [
              BoxShadow(
                color: _orange.withValues(alpha: 0.25),
                blurRadius: 28,
              ),
            ],
          ),
          child: const Icon(
            Icons.cloud_rounded,
            color: _orange,
            size: 38,
          ),
        ),
        const SizedBox(height: 16),
        const Text(
          'Sign in',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Colors.white,
            fontSize: 34,
            fontWeight: FontWeight.w900,
            letterSpacing: -0.8,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Welcome back to SoundClone',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF8B949E),
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildEmailField(bool loading) {
    return _FieldGroup(
      label: 'Email',
      child: TextFormField(
        controller: _emailController,
        enabled: !loading,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        autofillHints: const [
          AutofillHints.email,
        ],
        style: const TextStyle(
          color: Colors.white,
        ),
        decoration: _inputDecoration(
          hint: 'Enter your email',
        ),
        validator: (value) {
          final email = value?.trim() ?? '';

          if (email.isEmpty) {
            return 'Email is required.';
          }

          final regex = RegExp(
            r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
          );

          if (!regex.hasMatch(email)) {
            return 'Please enter a valid email.';
          }

          return null;
        },
      ),
    );
  }

  Widget _buildPasswordField(bool loading) {
    return _FieldGroup(
      label: 'Password',
      child: TextFormField(
        controller: _passwordController,
        enabled: !loading,
        obscureText: _obscurePassword,
        textInputAction: TextInputAction.done,
        autofillHints: const [
          AutofillHints.password,
        ],
        onFieldSubmitted: (_) {
          if (!loading) {
            _submit();
          }
        },
        style: const TextStyle(
          color: Colors.white,
        ),
        decoration: _inputDecoration(
          hint: '••••••••',
        ).copyWith(
          suffixIcon: IconButton(
            onPressed: loading
                ? null
                : () {
              setState(() {
                _obscurePassword =
                !_obscurePassword;
              });
            },
            icon: Icon(
              _obscurePassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: const Color(0xFF8B949E),
            ),
          ),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Password is required.';
          }

          return null;
        },
      ),
    );
  }

  Widget _buildRememberMe(bool loading) {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: loading
          ? null
          : () {
        setState(() {
          _rememberMe = !_rememberMe;
        });
      },
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Checkbox(
            value: _rememberMe,
            onChanged: loading
                ? null
                : (value) {
              setState(() {
                _rememberMe = value ?? false;
              });
            },
            activeColor: _cyan,
            checkColor: const Color(0xFF07110F),
            side: const BorderSide(
              color: Color(0xFF8B949E),
            ),
          ),
          const Text(
            'Remember me',
            style: TextStyle(
              color: Color(0xFFB8B8B8),
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginButton(bool loading) {
    return SizedBox(
      height: 52,
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          gradient: loading
              ? null
              : const LinearGradient(
            colors: [
              Color(0xFFFF4D00),
              Color(0xFFFF7A00),
            ],
          ),
          color: loading
              ? Colors.white.withValues(alpha: 0.12)
              : null,
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
                'Signing in...',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          )
              : const Text(
            'Sign in',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w900,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Row(
      children: [
        Expanded(
          child: Divider(
            color: Color(0xFF303438),
          ),
        ),
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: 16,
          ),
          child: Text(
            'or',
            style: TextStyle(
              color: Color(0xFF8B949E),
            ),
          ),
        ),
        Expanded(
          child: Divider(
            color: Color(0xFF303438),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButton({
    required IconData icon,
    required String text,
    required bool enabled,
    required VoidCallback onPressed,
  }) {
    return SizedBox(
      height: 50,
      child: OutlinedButton.icon(
        onPressed: enabled ? onPressed : null,
        icon: Icon(
          icon,
          color: const Color(0xFFE5E7EB),
        ),
        label: Text(
          text,
          style: const TextStyle(
            color: Color(0xFFE5E7EB),
            fontWeight: FontWeight.w600,
          ),
        ),
        style: OutlinedButton.styleFrom(
          backgroundColor:
          Colors.white.withValues(alpha: 0.03),
          side: BorderSide(
            color: Colors.white.withValues(alpha: 0.14),
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      ),
    );
  }

  Widget _buildSignupLink() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text(
          "Don't have an account? ",
          style: TextStyle(
            color: Color(0xFFB8B8B8),
            fontSize: 14,
          ),
        ),
        GestureDetector(
          onTap: () {
            context.go('/auth/signup');
          },
          child: const Text(
            'Sign up',
            style: TextStyle(
              color: _cyan,
              fontSize: 14,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration({
    required String hint,
  }) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(
        color: Color(0xFF8B949E),
      ),
      filled: true,
      fillColor:
      Colors.white.withValues(alpha: 0.04),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 16,
      ),
      border: _border(
        Colors.white.withValues(alpha: 0.16),
      ),
      enabledBorder: _border(
        Colors.white.withValues(alpha: 0.16),
      ),
      focusedBorder: _border(
        _cyan,
        width: 1.5,
      ),
      errorBorder: _border(
        const Color(0xFFFF4D4F),
      ),
      focusedErrorBorder: _border(
        const Color(0xFFFF4D4F),
        width: 1.5,
      ),
      errorStyle: const TextStyle(
        color: Color(0xFFFF6B6B),
      ),
    );
  }

  OutlineInputBorder _border(
      Color color, {
        double width = 1,
      }) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: BorderSide(
        color: color,
        width: width,
      ),
    );
  }
}

class _FieldGroup extends StatelessWidget {
  const _FieldGroup({
    required this.label,
    required this.child,
  });

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

class _LoginBackground extends StatelessWidget {
  const _LoginBackground();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: _LoginBackgroundPainter(),
      child: const SizedBox.expand(),
    );
  }
}

class _LoginBackgroundPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final background = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          Color(0xFF050607),
          Color(0xFF101214),
          Color(0xFF1E2021),
        ],
      ).createShader(
        Offset.zero & size,
      );

    canvas.drawRect(
      Offset.zero & size,
      background,
    );

    final orange = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFFFF5500)
              .withValues(alpha: 0.22),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCircle(
          center: Offset(
            size.width * 0.5,
            size.height * 0.18,
          ),
          radius: size.width * 0.75,
        ),
      );

    canvas.drawCircle(
      Offset(
        size.width * 0.5,
        size.height * 0.18,
      ),
      size.width * 0.75,
      orange,
    );

    final cyan = Paint()
      ..shader = RadialGradient(
        colors: [
          const Color(0xFF00FFE0)
              .withValues(alpha: 0.11),
          Colors.transparent,
        ],
      ).createShader(
        Rect.fromCircle(
          center: Offset(
            size.width * 0.9,
            size.height * 0.72,
          ),
          radius: size.width * 0.7,
        ),
      );

    canvas.drawCircle(
      Offset(
        size.width * 0.9,
        size.height * 0.72,
      ),
      size.width * 0.7,
      cyan,
    );

    final grid = Paint()
      ..color =
      Colors.white.withValues(alpha: 0.025)
      ..strokeWidth = 1;

    const spacing = 42.0;

    for (double x = 0;
    x < size.width;
    x += spacing) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        grid,
      );
    }

    for (double y = 0;
    y < size.height;
    y += spacing) {
      canvas.drawLine(
        Offset(0, y),
        Offset(size.width, y),
        grid,
      );
    }
  }

  @override
  bool shouldRepaint(
      covariant CustomPainter oldDelegate,
      ) {
    return false;
  }
}