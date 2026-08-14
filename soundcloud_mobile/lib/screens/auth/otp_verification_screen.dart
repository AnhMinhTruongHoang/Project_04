import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import 'login_screen.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;

  const OtpVerificationScreen({
    super.key,
    required this.email,
  });

  @override
  State<OtpVerificationScreen> createState() =>
      _OtpVerificationScreenState();
}

class _OtpVerificationScreenState
    extends State<OtpVerificationScreen> {
  final _formKey = GlobalKey<FormState>();

  final _otpController = TextEditingController();

  Timer? _timer;

  int _secondsRemaining = 60;

  bool get _canResend => _secondsRemaining == 0;

  @override
  void initState() {
    super.initState();

    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();

    super.dispose();
  }

  // ======================================================
  // TIMER
  // ======================================================

  void _startTimer() {
    _timer?.cancel();

    setState(() {
      _secondsRemaining = 60;
    });

    _timer = Timer.periodic(
      const Duration(seconds: 1),
          (timer) {
        if (_secondsRemaining <= 1) {
          timer.cancel();

          if (mounted) {
            setState(() {
              _secondsRemaining = 0;
            });
          }

          return;
        }

        if (mounted) {
          setState(() {
            _secondsRemaining--;
          });
        }
      },
    );
  }

  // ======================================================
  // VERIFY OTP
  // ======================================================

  Future<void> _verifyOtp() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = context.read<AuthProvider>();

    final success = await authProvider.verifyOtp(
      email: widget.email,
      otp: _otpController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Xác thực tài khoản thành công!',
          ),
        ),
      );

      // API verify OTP chưa trả token.
      // Chuyển về Login để người dùng đăng nhập.
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => const LoginScreen(),
        ),
            (route) => false,
      );
    }
  }

  // ======================================================
  // RESEND OTP
  // ======================================================

  Future<void> _resendOtp() async {
    if (!_canResend) {
      return;
    }

    final authProvider = context.read<AuthProvider>();

    final success = await authProvider.resendOtp(
      email: widget.email,
    );

    if (!mounted) return;

    if (success) {
      _otpController.clear();

      _startTimer();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Mã OTP mới đã được gửi đến email của bạn.',
          ),
        ),
      );
    }
  }

  // ======================================================
  // BUILD
  // ======================================================

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Consumer<AuthProvider>(
          builder: (
              context,
              authProvider,
              child,
              ) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 20,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment:
                  CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 30),

                    // ==================================================
                    // ICON
                    // ==================================================

                    Center(
                      child: Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF5500)
                              .withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.mark_email_read_outlined,
                          color: Color(0xFFFF5500),
                          size: 42,
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ==================================================
                    // TITLE
                    // ==================================================

                    const Text(
                      'Xác thực email',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 12),

                    const Text(
                      'Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white60,
                        fontSize: 15,
                      ),
                    ),

                    const SizedBox(height: 6),

                    Text(
                      widget.email,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(height: 40),

                    // ==================================================
                    // OTP
                    // ==================================================

                    const Text(
                      'Mã xác thực',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(height: 10),

                    TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.done,
                      maxLength: 6,
                      enabled: !authProvider.isLoading,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 10,
                      ),
                      decoration: InputDecoration(
                        hintText: '••••••',
                        hintStyle: const TextStyle(
                          color: Colors.white24,
                          fontSize: 24,
                          letterSpacing: 10,
                        ),
                        counterText: '',
                        filled: true,
                        fillColor: const Color(0xFF1E1E1E),
                        border: OutlineInputBorder(
                          borderRadius:
                          BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder:
                        OutlineInputBorder(
                          borderRadius:
                          BorderRadius.circular(12),
                          borderSide:
                          const BorderSide(
                            color: Color(0xFFFF5500),
                            width: 1.5,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null ||
                            value.trim().isEmpty) {
                          return 'Vui lòng nhập mã OTP';
                        }

                        if (!RegExp(r'^\d{6}$')
                            .hasMatch(value.trim())) {
                          return 'Mã OTP phải gồm 6 chữ số';
                        }

                        return null;
                      },
                      onFieldSubmitted: (_) {
                        _verifyOtp();
                      },
                    ),

                    // ==================================================
                    // ERROR
                    // ==================================================

                    if (authProvider.errorMessage != null) ...[
                      const SizedBox(height: 16),

                      Container(
                        padding:
                        const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withValues(
                            alpha: 0.12,
                          ),
                          borderRadius:
                          BorderRadius.circular(10),
                          border: Border.all(
                            color: Colors.red.withValues(
                              alpha: 0.35,
                            ),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment:
                          CrossAxisAlignment.start,
                          children: [
                            const Icon(
                              Icons.error_outline,
                              color: Colors.redAccent,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                authProvider.errorMessage!,
                                style: const TextStyle(
                                  color: Colors.redAccent,
                                  fontSize: 14,
                                ),
                              ),
                            ),
                            GestureDetector(
                              onTap:
                              authProvider.clearError,
                              child: const Icon(
                                Icons.close,
                                color: Colors.redAccent,
                                size: 18,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 24),

                    // ==================================================
                    // VERIFY BUTTON
                    // ==================================================

                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed:
                        authProvider.isLoading
                            ? null
                            : _verifyOtp,
                        child: authProvider.isLoading
                            ? const SizedBox(
                          width: 24,
                          height: 24,
                          child:
                          CircularProgressIndicator(
                            strokeWidth: 2.5,
                            color: Colors.white,
                          ),
                        )
                            : const Text(
                          'Xác thực tài khoản',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                            FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // ==================================================
                    // RESEND
                    // ==================================================

                    Row(
                      mainAxisAlignment:
                      MainAxisAlignment.center,
                      children: [
                        const Text(
                          'Không nhận được mã?',
                          style: TextStyle(
                            color: Colors.white60,
                          ),
                        ),
                        TextButton(
                          onPressed:
                          authProvider.isLoading ||
                              !_canResend
                              ? null
                              : _resendOtp,
                          child: Text(
                            _canResend
                                ? 'Gửi lại mã'
                                : 'Gửi lại sau ${_secondsRemaining}s',
                            style: TextStyle(
                              color: _canResend
                                  ? const Color(
                                0xFFFF5500,
                              )
                                  : Colors.white38,
                              fontWeight:
                              FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // ==================================================
                    // CHANGE EMAIL
                    // ==================================================

                    TextButton(
                      onPressed: authProvider.isLoading
                          ? null
                          : () {
                        Navigator.of(context)
                            .pop();
                      },
                      child: const Text(
                        'Quay lại đăng ký',
                        style: TextStyle(
                          color: Colors.white60,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}