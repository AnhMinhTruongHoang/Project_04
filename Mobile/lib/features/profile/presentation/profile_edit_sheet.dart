part of 'profile_screen.dart';

Future<void> _showEditProfile(
  BuildContext context,
  WidgetRef ref,
  UserModel user,
) async {
  final name = TextEditingController(text: user.name);
  final bio = TextEditingController(text: user.bio ?? '');
  final website = TextEditingController(text: user.website ?? '');
  final city = TextEditingController(text: user.city ?? '');
  final country = TextEditingController(text: user.country ?? '');
  XFile? avatarFile;
  XFile? coverFile;
  var saving = false;
  String? errorMessage;

  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: const Color(0xFF181818),
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
    ),
    builder: (sheetContext) {
      return StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> save() async {
            if (name.text.trim().isEmpty || saving) {
              setModalState(() => errorMessage = 'Name is required.');
              return;
            }

            setModalState(() {
              saving = true;
              errorMessage = null;
            });

            try {
              String? avatarUrl = user.avatarUrl;
              String? coverUrl = user.coverUrl;

              if (avatarFile != null) {
                final upload = await _uploadPickedImage(avatarFile!);
                avatarUrl = _uploadedImageUrl(upload);
                if (avatarUrl == null) {
                  throw StateError(upload.message.isEmpty
                      ? 'Upload avatar failed.'
                      : upload.message);
                }
              }

              if (coverFile != null) {
                final upload = await _uploadPickedImage(coverFile!);
                coverUrl = _uploadedImageUrl(upload);
                if (coverUrl == null) {
                  throw StateError(upload.message.isEmpty
                      ? 'Upload background failed.'
                      : upload.message);
                }
              }

              final response = await ApiService.instance.updateMyProfileApi(
                name: name.text,
                bio: bio.text,
                website: website.text,
                city: city.text,
                country: country.text,
                avatarUrl: avatarUrl,
                coverUrl: coverUrl,
              );

              if (!response.isSuccess) {
                throw StateError(response.message);
              }

              await ref.read(authProvider.notifier).reloadAccount();
              if (sheetContext.mounted) {
                Navigator.pop(sheetContext);
              }
            } catch (error) {
              setModalState(() {
                saving = false;
                errorMessage = error.toString().replaceFirst('Bad state: ', '');
              });
            }
          }

          Future<void> pickImage(bool avatar) async {
            final picked = await ImagePicker().pickImage(
              source: ImageSource.gallery,
              imageQuality: 88,
              maxWidth: avatar ? 1200 : 2200,
            );
            if (picked == null) return;
            setModalState(() {
              if (avatar) {
                avatarFile = picked;
              } else {
                coverFile = picked;
              }
            });
          }

          return Padding(
            padding: EdgeInsets.fromLTRB(
              20,
              16,
              20,
              MediaQuery.viewInsetsOf(context).bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Edit your profile',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 21,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 18),
                  _ProfileImageEditors(
                    user: user,
                    avatarFile: avatarFile,
                    coverFile: coverFile,
                    onPickAvatar: () => pickImage(true),
                    onPickCover: () => pickImage(false),
                  ),
                  const SizedBox(height: 48),
                  _ProfileTextField(controller: name, label: 'Display name'),
                  _ProfileTextField(
                    controller: bio,
                    label: 'Bio',
                    maxLines: 3,
                  ),
                  _ProfileTextField(controller: website, label: 'Website'),
                  Row(
                    children: [
                      Expanded(
                        child: _ProfileTextField(controller: city, label: 'City'),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _ProfileTextField(
                          controller: country,
                          label: 'Country',
                        ),
                      ),
                    ],
                  ),
                  if (errorMessage != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      errorMessage!,
                      style: const TextStyle(color: Color(0xFFFF6B6B)),
                    ),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: saving ? null : save,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFFF5500),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      child: saving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text(
                              'Save changes',
                              style: TextStyle(fontWeight: FontWeight.w900),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      );
    },
  );

  name.dispose();
  bio.dispose();
  website.dispose();
  city.dispose();
  country.dispose();
}

String? _uploadedImageUrl(ApiResponse<dynamic> response) {
  if (!response.isSuccess || response.data is! Map) return null;
  final data = Map<String, dynamic>.from(response.data as Map);
  final value = data['url'] ?? data['fileUrl'] ?? data['path'];
  final url = value?.toString().trim();
  return url == null || url.isEmpty ? null : url;
}

Future<ApiResponse<dynamic>> _uploadPickedImage(XFile file) async {
  return ApiService.instance.uploadImageBytesApi(
    bytes: await file.readAsBytes(),
    filename: file.name.isEmpty ? 'profile-image.jpg' : file.name,
  );
}

class _ProfileImageEditors extends StatelessWidget {
  const _ProfileImageEditors({
    required this.user,
    required this.avatarFile,
    required this.coverFile,
    required this.onPickAvatar,
    required this.onPickCover,
  });

  final UserModel user;
  final XFile? avatarFile;
  final XFile? coverFile;
  final VoidCallback onPickAvatar;
  final VoidCallback onPickCover;

  @override
  Widget build(BuildContext context) {
    final remoteCover = _resolveMediaUrl(user.coverUrl);
    final remoteAvatar = _resolveMediaUrl(user.avatarUrl);

    return Stack(
      clipBehavior: Clip.none,
      children: [
        GestureDetector(
          onTap: onPickCover,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: double.infinity,
              height: 145,
              color: const Color(0xFF262626),
              child: _SelectedImage(
                file: coverFile,
                remoteUrl: remoteCover,
                fallbackIcon: Icons.landscape_outlined,
              ),
            ),
          ),
        ),
        Positioned(
          right: 10,
          top: 10,
          child: _ImageEditBadge(label: 'Background', onTap: onPickCover),
        ),
        Positioned(
          left: 14,
          bottom: -30,
          child: GestureDetector(
            onTap: onPickAvatar,
            child: Container(
              width: 82,
              height: 82,
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                color: Color(0xFF181818),
                shape: BoxShape.circle,
              ),
              child: ClipOval(
                child: ColoredBox(
                  color: const Color(0xFFFF5500),
                  child: _SelectedImage(
                    file: avatarFile,
                    remoteUrl: remoteAvatar,
                    fallbackIcon: Icons.person_rounded,
                  ),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 72,
          bottom: -28,
          child: Material(
            color: const Color(0xFFFF5500),
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onPickAvatar,
              child: const Padding(
                padding: EdgeInsets.all(7),
                child: Icon(Icons.camera_alt_rounded, color: Colors.white, size: 15),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _SelectedImage extends StatelessWidget {
  const _SelectedImage({
    required this.file,
    required this.remoteUrl,
    required this.fallbackIcon,
  });

  final XFile? file;
  final String? remoteUrl;
  final IconData fallbackIcon;

  @override
  Widget build(BuildContext context) {
    if (file != null) {
      return kIsWeb
          ? Image.network(file!.path, fit: BoxFit.cover)
          : Image.file(File(file!.path), fit: BoxFit.cover);
    }
    if (remoteUrl != null) {
      return Image.network(
        remoteUrl!,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => _fallback(),
      );
    }
    return _fallback();
  }

  Widget _fallback() => Center(
        child: Icon(fallbackIcon, color: const Color(0xFF888888), size: 38),
      );
}

class _ImageEditBadge extends StatelessWidget {
  const _ImageEditBadge({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xCC111111),
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
          child: Row(
            children: [
              const Icon(Icons.camera_alt_outlined, color: Colors.white, size: 15),
              const SizedBox(width: 5),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileTextField extends StatelessWidget {
  const _ProfileTextField({
    required this.controller,
    required this.label,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String label;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Color(0xFFAAAAAA)),
          filled: true,
          fillColor: const Color(0xFF222222),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFF383838)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFFFF5500)),
          ),
        ),
      ),
    );
  }
}
