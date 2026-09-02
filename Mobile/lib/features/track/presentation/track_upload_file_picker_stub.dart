import 'dart:typed_data';

class UploadPickedFile {
  const UploadPickedFile({
    required this.name,
    required this.bytes,
    required this.size,
  });

  final String name;
  final Uint8List bytes;
  final int size;
}

Future<UploadPickedFile?> pickUploadFile({required List<String> accept}) async {
  return null;
}
