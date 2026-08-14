class AppValidators {
  AppValidators._();

  // ==============================
  // Email
  // ==============================

  static final RegExp emailRegex = RegExp(
    r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+$",
  );

  // ==============================
  // Password
  // ==============================

  static final RegExp passwordRegex = RegExp(
    r'^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#%]).{6,20}$',
  );

  // ==============================
  // Email validator
  // ==============================

  static String? email(String? value) {
    final email = value?.trim() ?? '';

    if (email.isEmpty) {
      return 'Vui lòng nhập email';
    }

    if (!emailRegex.hasMatch(email)) {
      return 'Email không hợp lệ';
    }

    return null;
  }

  // ==============================
  // Password validator
  // ==============================

  static String? password(String? value) {
    final password = value ?? '';

    if (password.isEmpty) {
      return 'Vui lòng nhập mật khẩu';
    }

    if (!passwordRegex.hasMatch(password)) {
      return 'Mật khẩu phải có 6-20 ký tự, gồm chữ hoa, chữ thường, số và @/#/%';
    }

    return null;
  }
}