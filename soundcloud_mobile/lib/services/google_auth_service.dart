import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService {
  GoogleAuthService._();

  static final GoogleAuthService instance = GoogleAuthService._();

  final GoogleSignIn _googleSignIn = GoogleSignIn.instance;

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    await _googleSignIn.initialize();

    _initialized = true;
  }

  Future<GoogleSignInAccount> signIn() async {
    await initialize();

    if (!_googleSignIn.supportsAuthenticate()) {
      throw Exception(
        'Google Sign-In không được hỗ trợ trên nền tảng này',
      );
    }

    final GoogleSignInAccount account =
    await _googleSignIn.authenticate();

    return account;
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (_) {
      // Không cần làm gì.
    }
  }

  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
    } catch (_) {
      // Không cần làm gì.
    }
  }
}