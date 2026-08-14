import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String email;

  const ResetPasswordScreen({
    super.key,
    required this.email,
  });

  @override
  State<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState
    extends State<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();

  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController =
  TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();

    super.dispose();
  }

  Future<void> _resetPassword() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) {
      return;
    }

    final authProvider = context.read<AuthProvider>();

    final success =
    await authProvider.resetPassword(
      email: widget.email,
      otp: _otpController.text.trim(),
      newPassword: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Đặt lại mật khẩu thành công.',
          ),
        ),
      );

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (_) => const LoginScreen(),
        ),
            (route) => false,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 30,
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment:
                  CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 20),

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
                          Icons.password_rounded,
                          color: Color(0xFFFF5500),
                          size: 42,
                        ),
                      ),
                    ),

                    const SizedBox(height: 28),

                    const Text(
                      'Đặt lại mật khẩu',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 10),

                    Text(
                      'Mã OTP đã được gửi đến ${widget.email}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white60,
                      ),
                    ),

                    const SizedBox(height: 35),

                    // OTP

                    const Text(
                      'Mã OTP',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(height: 8),

                    TextFormField(
                      controller: _otpController,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      enabled: !authProvider.isLoading,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 8,
                      ),
                      decoration: const InputDecoration(
                        hintText: '••••••',
                        counterText: '',
                        prefixIcon: Icon(
                          Icons.pin_outlined,
                        ),
                      ),
                      validator: (value) {
                        if (value == null ||
                            value.trim().isEmpty) {
                          return 'Vui lòng nhập OTP';
                        }

                        if (!RegExp(r'^\d{6}$')
                            .hasMatch(value.trim())) {
                          return 'OTP phải gồm 6 chữ số';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    // PASSWORD

                    const Text(
                      'Mật khẩu mới',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(height: 8),

                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      enabled: !authProvider.isLoading,
                      style: const TextStyle(
                        color: Colors.white,
                      ),
                      decoration: InputDecoration(
                        hintText:
                        'Nhập mật khẩu mới',
                        prefixIcon: const Icon(
                          Icons.lock_outline,
                        ),
                        suffixIcon: IconButton(
                          onPressed:
                          authProvider.isLoading
                              ? null
                              : () {
                            setState(() {
                              _obscurePassword =
                              !_obscurePassword;
                            });
                          },
                          icon: Icon(
                            _obscurePassword
                                ? Icons
                                .visibility_off_outlined
                                : Icons
                                .visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null ||
                            value.isEmpty) {
                          return 'Vui lòng nhập mật khẩu';
                        }

                        if (value.length < 8) {
                          return 'Mật khẩu phải có ít nhất 8 ký tự';
                        }

                        return null;
                      },
                    ),

                    const SizedBox(height: 20),

                    // CONFIRM PASSWORD

                    const Text(
                      'Xác nhận mật khẩu',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),

                    const SizedBox(height: 8),

                    TextFormField(
                      controller:
                      _confirmPasswordController,
                      obscureText:
                      _obscureConfirmPassword,
                      enabled: !authProvider.isLoading,
                      style: const TextStyle(
                        color: Colors.white,
                      ),
                      decoration: InputDecoration(
                        hintText:
                        'Nhập lại mật khẩu',
                        prefixIcon: const Icon(
                          Icons.lock_reset_outlined,
                        ),
                        suffixIcon: IconButton(
                          onPressed:
                          authProvider.isLoading
                              ? null
                              : () {
                            setState(() {
                              _obscureConfirmPassword =
                              !_obscureConfirmPassword;
                            });
                          },
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons
                                .visibility_off_outlined
                                : Icons
                                .visibility_outlined,
                          ),
                        ),
                      ),
                      validator: (value) {
                        if (value == null ||
                            value.isEmpty) {
                          return 'Vui lòng xác nhận mật khẩu';
                        }

                        if (value !=
                            _passwordController.text) {
                          return 'Mật khẩu xác nhận không khớp';
                        }

                        return null;
                      },
                    ),

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
                        ),
                        child: Text(
                          authProvider.errorMessage!,
                          style: const TextStyle(
                            color: Colors.redAccent,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),

                    SizedBox(
                      height: 52,
                      child: ElevatedButton(
                        onPressed:
                        authProvider.isLoading
                            ? null
                            : _resetPassword,
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
                          'Đặt lại mật khẩu',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight:
                            FontWeight.bold,
                          ),
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