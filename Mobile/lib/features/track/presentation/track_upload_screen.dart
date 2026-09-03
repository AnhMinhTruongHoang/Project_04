import 'dart:typed_data';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../home/providers/home_provider.dart';
import '../../library/providers/library_provider.dart';
import '../../profile/presentation/profile_screen.dart';
import 'track_upload_file_picker.dart';

class TrackUploadScreen extends ConsumerStatefulWidget {
  const TrackUploadScreen({super.key});

  @override
  ConsumerState<TrackUploadScreen> createState() => _TrackUploadScreenState();
}

class _TrackUploadScreenState extends ConsumerState<TrackUploadScreen> {
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _licenseNoteController = TextEditingController();

  UploadPickedFile? _audioFile;
  UploadPickedFile? _imageFile;
  UploadPickedFile? _licenseFile;
  String? _category;
  String _licenseType = 'ORIGINAL_OWNER';
  bool _isUploading = false;

  static const _background = Color(0xFF0D0D0D);
  static const _panel = Color(0xFF181818);
  static const _orange = Color(0xFFFF5500);

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _licenseNoteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _background,
      appBar: AppBar(
        title: const Text('Upload track'),
        leading: IconButton(
          tooltip: 'Back',
          onPressed: () {
            if (context.canPop()) {
              context.pop();
            } else {
              context.go('/home');
            }
          },
          icon: const Icon(Icons.arrow_back_rounded),
        ),
      ),
      body: FutureBuilder<List<_CategoryOption>>(
        future: _loadCategories(),
        builder: (context, snapshot) {
          final categories = snapshot.data ?? _fallbackCategories;

          return ListView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 150),
            children: [
              const Text(
                'Upload your sound',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 30,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Select an audio file, add artwork and copyright details.',
                style: TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 22),
              _FilePickerPanel(
                title: 'Audio file',
                subtitle: _audioFile?.name ?? 'MP3, M4A or WAV',
                icon: Icons.audio_file_rounded,
                isRequired: true,
                onPick: _pickAudio,
                onClear: _audioFile == null
                    ? null
                    : () {
                        setState(() {
                          _audioFile = null;
                        });
                      },
              ),
              const SizedBox(height: 14),
              _FilePickerPanel(
                title: 'Cover image',
                subtitle: _imageFile?.name ?? 'JPG, PNG or WebP',
                icon: Icons.image_rounded,
                isRequired: true,
                onPick: _pickImage,
                onClear: _imageFile == null
                    ? null
                    : () {
                        setState(() {
                          _imageFile = null;
                        });
                      },
              ),
              const SizedBox(height: 18),
              _TextFieldCard(
                controller: _titleController,
                label: 'Title',
                hint: 'Track title',
                isRequired: true,
              ),
              const SizedBox(height: 14),
              _TextFieldCard(
                controller: _descriptionController,
                label: 'Description',
                hint: 'Tell listeners about this track',
                maxLines: 4,
              ),
              const SizedBox(height: 14),
              _DropdownCard(
                label: 'Category',
                value: _category,
                hint: 'Select category',
                items: categories,
                onChanged: (value) {
                  setState(() {
                    _category = value;
                  });
                },
              ),
              const SizedBox(height: 14),
              _LicenseTypeCard(
                value: _licenseType,
                onChanged: (value) {
                  if (value == null) return;
                  setState(() {
                    _licenseType = value;
                  });
                },
              ),
              const SizedBox(height: 14),
              _FilePickerPanel(
                title: 'License file',
                subtitle:
                    _licenseFile?.name ?? 'PDF proof of copyright/license',
                icon: Icons.description_rounded,
                isRequired: true,
                onPick: _pickLicense,
                onClear: _licenseFile == null
                    ? null
                    : () {
                        setState(() {
                          _licenseFile = null;
                        });
                      },
              ),
              const SizedBox(height: 14),
              _TextFieldCard(
                controller: _licenseNoteController,
                label: 'License note',
                hint: 'Optional note, max 2000 characters',
                maxLines: 3,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: _orange,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(54),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                onPressed: _isUploading ? null : _upload,
                icon: _isUploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.cloud_upload_rounded),
                label: Text(
                  _isUploading ? 'Uploading...' : 'Upload track',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<List<_CategoryOption>> _loadCategories() async {
    try {
      final response = await ApiService.instance.getAllCategoriesApi();
      final source = _resultList(response.data);
      final items = source
          .map(_CategoryOption.fromJson)
          .where((item) => item.value.isNotEmpty && item.label.isNotEmpty)
          .toList();

      if (items.isNotEmpty) {
        return items;
      }
    } catch (_) {}

    return _fallbackCategories;
  }

  Future<void> _pickAudio() async {
    debugPrint('[UploadScreen] pick audio tapped');

    final file = await pickUploadFile(accept: ['.mp3', '.m4a', '.wav']);
    if (file == null) {
      debugPrint('[UploadScreen] audio picker returned null');
      return;
    }

    debugPrint(
      '[UploadScreen] audio selected name=${file.name} size=${file.size} bytes=${file.bytes.length}',
    );

    setState(() {
      _audioFile = file;
      if (_titleController.text.trim().isEmpty) {
        _titleController.text = _filenameWithoutExtension(file.name);
      }
    });
  }

  Future<void> _pickImage() async {
    debugPrint('[UploadScreen] pick image tapped');

    final file = await pickUploadFile(accept: ['image/*']);
    if (file == null) {
      debugPrint('[UploadScreen] image picker returned null');
      return;
    }

    debugPrint(
      '[UploadScreen] image selected name=${file.name} size=${file.size} bytes=${file.bytes.length}',
    );

    setState(() {
      _imageFile = file;
    });
  }

  Future<void> _pickLicense() async {
    debugPrint('[UploadScreen] pick license tapped');

    final file = await pickUploadFile(accept: ['.pdf', 'application/pdf']);
    if (file == null) {
      debugPrint('[UploadScreen] license picker returned null');
      return;
    }

    debugPrint(
      '[UploadScreen] license selected name=${file.name} size=${file.size} bytes=${file.bytes.length}',
    );

    if (file.size > 10 * 1024 * 1024) {
      debugPrint('[UploadScreen] license rejected because size > 10MB');
      _showMessage('License file must be under 10MB.');
      return;
    }

    setState(() {
      _licenseFile = file;
    });
  }

  Future<void> _upload() async {
    debugPrint(
      '[UploadScreen] upload tapped audio=${_audioFile?.name} image=${_imageFile?.name} license=${_licenseFile?.name}',
    );

    final title = _titleController.text.trim();
    final description = _descriptionController.text.trim();
    final licenseNote = _licenseNoteController.text.trim();

    if (_audioFile == null) {
      _showMessage('Please select an audio file.');
      return;
    }

    if (_imageFile == null) {
      _showMessage('Please select a cover image.');
      return;
    }

    if (_licenseFile == null) {
      _showMessage('Please upload a copyright license PDF.');
      return;
    }

    if (title.isEmpty) {
      _showMessage('Please enter a track title.');
      return;
    }

    if (licenseNote.length > 2000) {
      _showMessage('License note must not exceed 2000 characters.');
      return;
    }

    setState(() {
      _isUploading = true;
    });

    final fields = <String, dynamic>{
      'title': title,
      'description': description,
      'category': _category,
      'licenseType': _licenseType,
      if (licenseNote.isNotEmpty) 'licenseNote': licenseNote,
    };

    fields.removeWhere((_, value) {
      return value == null || (value is String && value.trim().isEmpty);
    });

    try {
      debugPrint('[UploadScreen] sending multipart fields=${fields.keys}');

      final response = await ApiService.instance.createTrackBytesApi(
        fields: fields,
        files: {
          'audio': Uint8List.fromList(_audioFile!.bytes),
          'image': Uint8List.fromList(_imageFile!.bytes),
          'license': Uint8List.fromList(_licenseFile!.bytes),
        },
        filenames: {
          'audio': _audioFile!.name,
          'image': _imageFile!.name,
          'license': _licenseFile!.name,
        },
      );

      if (!mounted) return;

      debugPrint(
        '[UploadScreen] upload response status=${response.statusCode} success=${response.isSuccess} message=${response.message}',
      );

      if (response.isSuccess) {
        ref.invalidate(homeFeedProvider);
        ref.invalidate(profileTracksProvider);
        ref.invalidate(suggestedTracksProvider);
        ref.invalidate(myUploadsProvider);

        _showMessage('Track uploaded and waiting for processing.');
        _resetForm();
      } else {
        _showMessage(
          response.message.isEmpty
              ? 'Could not upload track.'
              : response.message,
        );
      }
    } catch (_) {
      if (mounted) {
        _showMessage('Could not upload track.');
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  void _resetForm() {
    setState(() {
      _audioFile = null;
      _imageFile = null;
      _licenseFile = null;
      _category = null;
      _licenseType = 'ORIGINAL_OWNER';
      _titleController.clear();
      _descriptionController.clear();
      _licenseNoteController.clear();
    });
  }

  void _showMessage(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor:
              message.toLowerCase().contains('could not') ||
                  message.toLowerCase().contains('please') ||
                  message.toLowerCase().contains('must')
              ? null
              : _orange,
        ),
      );
  }
}

class _FilePickerPanel extends StatelessWidget {
  const _FilePickerPanel({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onPick,
    this.onClear,
    this.isRequired = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onPick;
  final VoidCallback? onClear;
  final bool isRequired;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: _TrackUploadScreenState._panel,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        borderRadius: BorderRadius.circular(8),
        hoverColor: _TrackUploadScreenState._orange.withValues(alpha: 0.08),
        onTap: onPick,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF303030)),
          ),
          child: Row(
            children: [
              Container(
                width: 50,
                height: 50,
                decoration: const BoxDecoration(
                  color: Color(0xFF242424),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: _TrackUploadScreenState._orange),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        if (isRequired)
                          const Text(
                            ' *',
                            style: TextStyle(
                              color: _TrackUploadScreenState._orange,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 5),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFFAAAAAA),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              if (onClear != null)
                IconButton(
                  tooltip: 'Remove file',
                  color: const Color(0xFFCCCCCC),
                  onPressed: onClear,
                  icon: const Icon(Icons.close_rounded),
                )
              else
                const Icon(
                  Icons.add_rounded,
                  color: _TrackUploadScreenState._orange,
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TextFieldCard extends StatelessWidget {
  const _TextFieldCard({
    required this.controller,
    required this.label,
    required this.hint,
    this.maxLines = 1,
    this.isRequired = false,
  });

  final TextEditingController controller;
  final String label;
  final String hint;
  final int maxLines;
  final bool isRequired;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDecoration(label, hint, isRequired: isRequired),
    );
  }
}

class _DropdownCard extends StatelessWidget {
  const _DropdownCard({
    required this.label,
    required this.value,
    required this.hint,
    required this.items,
    required this.onChanged,
  });

  final String label;
  final String? value;
  final String hint;
  final List<_CategoryOption> items;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      dropdownColor: _TrackUploadScreenState._panel,
      iconEnabledColor: Colors.white,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDecoration(label, hint),
      items: [
        for (final item in items)
          DropdownMenuItem<String>(value: item.value, child: Text(item.label)),
      ],
      onChanged: onChanged,
    );
  }
}

class _LicenseTypeCard extends StatelessWidget {
  const _LicenseTypeCard({required this.value, required this.onChanged});

  final String value;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<String>(
      value: value,
      dropdownColor: _TrackUploadScreenState._panel,
      iconEnabledColor: Colors.white,
      style: const TextStyle(color: Colors.white),
      decoration: _inputDecoration(
        'Copyright license type',
        'Select license type',
        isRequired: true,
      ),
      items: const [
        DropdownMenuItem(
          value: 'ORIGINAL_OWNER',
          child: Text('Original owner'),
        ),
        DropdownMenuItem(
          value: 'LICENSED',
          child: Text('Licensed from copyright owner'),
        ),
        DropdownMenuItem(
          value: 'CREATIVE_COMMONS',
          child: Text('Creative Commons'),
        ),
        DropdownMenuItem(value: 'PUBLIC_DOMAIN', child: Text('Public domain')),
        DropdownMenuItem(value: 'OTHER', child: Text('Other')),
      ],
      onChanged: onChanged,
    );
  }
}

InputDecoration _inputDecoration(
  String label,
  String hint, {
  bool isRequired = false,
}) {
  return InputDecoration(
    labelText: isRequired ? '$label *' : label,
    hintText: hint,
    filled: true,
    fillColor: _TrackUploadScreenState._panel,
    labelStyle: const TextStyle(color: Color(0xFFBDBDBD)),
    hintStyle: const TextStyle(color: Color(0xFF777777)),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(color: Color(0xFF303030)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(8),
      borderSide: const BorderSide(
        color: _TrackUploadScreenState._orange,
        width: 1.4,
      ),
    ),
  );
}

class _CategoryOption {
  const _CategoryOption({required this.value, required this.label});

  final String value;
  final String label;

  factory _CategoryOption.fromJson(dynamic value) {
    if (value is! Map) {
      return const _CategoryOption(value: '', label: '');
    }

    final json = Map<String, dynamic>.from(value);
    final id = (json['slug'] ?? json['_id'] ?? json['id'] ?? '').toString();
    final name = (json['name'] ?? json['title'] ?? id).toString();

    return _CategoryOption(value: id.trim(), label: name.trim());
  }
}

const _fallbackCategories = [
  _CategoryOption(value: 'ncs', label: 'NCS'),
  _CategoryOption(value: 'kpop', label: 'K-Pop'),
  _CategoryOption(value: 'pop', label: 'Pop'),
  _CategoryOption(value: 'lofi', label: 'Lofi'),
];

List<dynamic> _resultList(dynamic value) {
  final data = _unwrap(value);

  if (data is List) {
    return data;
  }

  if (data is Map) {
    final result = data['result'] ?? data['categories'];

    if (result is List) {
      return result;
    }
  }

  return const [];
}

dynamic _unwrap(dynamic value) {
  if (value is Map && value['data'] != null) {
    return value['data'];
  }

  return value;
}

String _filenameWithoutExtension(String value) {
  final index = value.lastIndexOf('.');

  if (index <= 0) {
    return value;
  }

  return value.substring(0, index);
}
