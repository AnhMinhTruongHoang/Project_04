import 'dart:async';
import 'dart:html' as html;
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
  print('[UploadPicker] create input accept=${accept.join(',')}');

  final input = html.FileUploadInputElement()
    ..accept = accept.join(',')
    ..multiple = false
    ..style.position = 'fixed'
    ..style.left = '-1000px'
    ..style.top = '-1000px'
    ..style.width = '1px'
    ..style.height = '1px'
    ..style.opacity = '0';

  final completer = Completer<UploadPickedFile?>();

  input.onChange.first.then((_) {
    print('[UploadPicker] input changed files=${input.files?.length ?? 0}');

    final file = input.files?.isNotEmpty == true ? input.files!.first : null;

    if (file == null) {
      print('[UploadPicker] no file selected');
      input.remove();
      completer.complete(null);
      return;
    }

    print(
      '[UploadPicker] selected name=${file.name} size=${file.size} type=${file.type}',
    );

    final reader = html.FileReader();

    reader.onError.first.then((_) {
      if (!completer.isCompleted) {
        print('[UploadPicker] read error');
        input.remove();
        completer.complete(null);
      }
    });

    reader.onLoad.first.then((_) {
      final result = reader.result;

      final bytes = result is Uint8List
          ? result
          : result is ByteBuffer
          ? result.asUint8List()
          : null;

      if (bytes == null) {
        print('[UploadPicker] unexpected reader result=${result.runtimeType}');
        input.remove();
        completer.complete(null);
        return;
      }

      print('[UploadPicker] read success bytes=${bytes.length}');
      input.remove();
      completer.complete(
        UploadPickedFile(name: file.name, bytes: bytes, size: file.size),
      );
    });

    reader.readAsArrayBuffer(file);
  });

  html.document.body?.append(input);
  print('[UploadPicker] appended input, calling click()');
  input.click();

  return completer.future;
}
