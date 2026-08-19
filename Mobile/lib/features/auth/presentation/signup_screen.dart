import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../data/auth_service.dart';
import 'widgets/auth_field.dart';
import 'widgets/auth_logo.dart';
import 'widgets/auth_message.dart';
import 'widgets/auth_primary_button.dart';
import 'widgets/auth_scaffold.dart';
import 'widgets/terms_sheet.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  final AuthService _authService = AuthService();

  bool _obscurePassword = true;
  bool _agree = false;
  bool _loading = false;
  String _message = '';

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _openTerms() async {
    final accepted = await showTermsSheet(context);
    if (accepted && mounted) setState(() => _agree = true);
  }

  Future<void> _submit() async {
    FocusScope.of(context).unfocus();
    setState(() => _message = '');

    if (!_formKey.currentState!.validate()) return;

    if (!_agree) {
      setState(() {
        _message = 'You must agree to the Terms of Service and Privacy Policy.';
      });
      return;
    }

    final email = _emailController.text.trim().toLowerCase();
    setState(() => _loading = true);

    try {
      await _authService.register(
        name: _nameController.text,
        email: email,
        password: _passwordController.text,
      );

      if (!mounted) return;

      context.go('/verify-otp?email=${Uri.encodeQueryComponent(email)}');
    } on AuthException catch (error) {
      if (!mounted) return;

      if (error.statusCode == 409 && error.requiresVerification) {
        final targetEmail = error.verificationEmail ?? email;
        context.go(
          '/verify-otp?email=${Uri.encodeQueryComponent(targetEmail)}',
        );
        return;
      }

      setState(() => _message = error.message);
    } catch (error) {
      if (mounted) setState(() => _message = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      onBack: () => context.pop(),
      maxWidth: 450,
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(
              child: AuthLogo(icon: Icons.person_add_alt_1_rounded),
            ),
            const SizedBox(height: 26),
            const Text(
              'Create your account',
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
              'Join SoundClone and make every listen yours.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 28),
            AuthMessage(message: _message),
            if (_message.isNotEmpty) const SizedBox(height: 18),
            AuthField(
              controller: _nameController,
              label: 'Name',
              hint: 'What should we call you?',
              textInputAction: TextInputAction.next,
              enabled: !_loading,
              validator: (value) =>
                  value == null || value.trim().isEmpty ? 'Name is required.' : null,
            ),
            const SizedBox(height: 16),
            AuthField(
              controller: _emailController,
              label: 'Email',
              hint: 'name@example.com',
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              enabled: !_loading,
              validator: (value) {
                final email = value?.trim() ?? '';
                if (email.isEmpty) return 'Email is required.';
                if (!RegExp(r'\S+@\S+\.\S+').hasMatch(email)) {
                  return 'Enter a valid email.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            AuthField(
              controller: _passwordController,
              label: 'Password',
              hint: 'At least 8 characters',
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.next,
              enabled: !_loading,
              suffixIcon: IconButton(
                onPressed: _loading
                    ? null
                    : () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_outlined
                      : Icons.visibility_off_outlined,
                  color: AppColors.textSecondary,
                ),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) return 'Password is required.';
                if (value.length < 8) {
                  return 'Password must be at least 8 characters.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            AuthField(
              controller: _confirmController,
              label: 'Confirm password',
              hint: 'Enter your password again',
              obscureText: _obscurePassword,
              textInputAction: TextInputAction.done,
              enabled: !_loading,
              onSubmitted: (_) => _submit(),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please confirm your password.';
                }
                if (value != _passwordController.text) {
                  return 'Passwords do not match.';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            InkWell(
              onTap: _loading ? null : _openTerms,
              borderRadius: BorderRadius.circular(8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Checkbox(
                    value: _agree,
                    onChanged: _loading
                        ? null
                        : (value) => setState(() => _agree = value ?? false),
                    activeColor: AppColors.primary,
                    checkColor: Colors.white,
                    side: const BorderSide(color: AppColors.textSecondary),
                  ),
                  const Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(top: 12),
                      child: Text(
                        'I agree to the Terms of Service and Privacy Policy.',
                        style: TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                          height: 1.35,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const Padding(
                    padding: EdgeInsets.only(top: 10),
                    child: Icon(
                      Icons.chevron_right_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            AuthPrimaryButton(
              label: 'Create Account',
              loading: _loading,
              onPressed: _submit,
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: _loading ? null : () => context.go('/login'),
              child: const Text(
                'Already have an account? Log in',
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
      ),
    );
  }
}
