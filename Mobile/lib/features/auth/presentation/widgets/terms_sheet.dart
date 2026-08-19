import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

Future<bool> showTermsSheet(BuildContext context) async {
  final result = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: AppColors.surface,
    useSafeArea: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (context) => const _TermsSheet(),
  );

  return result == true;
}

class _TermsSheet extends StatelessWidget {
  const _TermsSheet();

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.86,
      minChildSize: 0.55,
      maxChildSize: 0.96,
      builder: (context, controller) {
        return Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 38,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textMuted,
                borderRadius: BorderRadius.circular(99),
              ),
            ),
            const Padding(
              padding: EdgeInsets.fromLTRB(22, 20, 22, 14),
              child: Text(
                'Terms of Service & Privacy Policy',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                ),
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.all(22),
                children: const [
                  _Heading('1. Terms of Service'),
                  _Paragraph(
                    'By creating an account and using SoundClone, you agree to use the service responsibly and follow all applicable rules. You must not upload, share, or distribute content that violates copyright, contains harmful material, or infringes the rights of other users, artists, or third parties.',
                  ),
                  _Paragraph(
                    'You are responsible for keeping your account secure, providing accurate information, and ensuring that any music, images, comments, or playlists you upload or create are legal and appropriate.',
                  ),
                  _Paragraph(
                    'SoundClone may remove content or restrict accounts used for spam, abuse, copyright infringement, or activity that affects the safety and experience of other users.',
                  ),
                  SizedBox(height: 12),
                  _Heading('2. Privacy Policy'),
                  _Paragraph(
                    'SoundClone uses personal information such as your name and email to create and manage your account, improve your experience, and support platform features.',
                  ),
                  _Paragraph(
                    'Music activity such as uploaded tracks, liked songs, playlists, comments, and listening history may be stored to provide recommendations, track details, and library features.',
                  ),
                  _Paragraph(
                    'SoundClone does not sell your personal information. Data may be shared only when required by law or when necessary to operate and secure the service.',
                  ),
                  SizedBox(height: 12),
                  _Paragraph(
                    'By continuing, you confirm that you have read and agree to the Terms of Service and Privacy Policy.',
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 12, 22, 18),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.textPrimary,
                        side: const BorderSide(color: AppColors.divider),
                        shape: const StadiumBorder(),
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: const Text(
                        'Close',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: () => Navigator.of(context).pop(true),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: const StadiumBorder(),
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: const Text(
                        'I Agree',
                        style: TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
}

class _Heading extends StatelessWidget {
  const _Heading(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.textPrimary,
          fontSize: 17,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _Paragraph extends StatelessWidget {
  const _Paragraph(this.text);
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        text,
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 14,
          height: 1.55,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
