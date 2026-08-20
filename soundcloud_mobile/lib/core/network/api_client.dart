import 'package:dio/dio.dart';
import 'package:flutter/cupertino.dart';

import '../constants/app_constants.dart';
import '../storage/storage_service.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient._();

  static final ApiClient instance = ApiClient._();

  final Dio dio = Dio();

  bool _initialized = false;

  void initialize() {
    if (_initialized) return;

    _initialized = true;

    dio.options = BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      sendTimeout: const Duration(seconds: 15),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await StorageService.instance.getAccessToken();

          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          handler.next(options);
        },
        onError: (error, handler) {
          handler.next(error);
        },
      ),
    );
  }

  // ==============================
  // GET
  // ==============================

  Future<Response<dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Duration? receiveTimeout,
    Duration? connectTimeout,
  }) async {
    final stopwatch = Stopwatch()..start();

    debugPrint('API GET START: $path');
    debugPrint('Query: $queryParameters');
    debugPrint('Connect timeout: $connectTimeout');
    debugPrint('Receive timeout: $receiveTimeout');

    final oldConnectTimeout = dio.options.connectTimeout;

    final oldReceiveTimeout = dio.options.receiveTimeout;

    try {
      if (connectTimeout != null) {
        dio.options.connectTimeout = connectTimeout;
      }

      if (receiveTimeout != null) {
        dio.options.receiveTimeout = receiveTimeout;
      }

      final response = await dio.get(path, queryParameters: queryParameters);

      stopwatch.stop();

      debugPrint('API GET SUCCESS: $path');

      debugPrint('Status: ${response.statusCode}');

      debugPrint('Time: ${stopwatch.elapsedMilliseconds} ms');

      return response;
    } on DioException catch (e) {
      stopwatch.stop();

      debugPrint('API GET ERROR: $path');

      debugPrint('Time: ${stopwatch.elapsedMilliseconds} ms');

      debugPrint('Dio type: ${e.type}');

      debugPrint('Status: ${e.response?.statusCode}');

      debugPrint('Message: ${e.message}');

      debugPrint('Response: ${e.response?.data}');

      throw _handleError(e);
    } finally {
      dio.options.connectTimeout = oldConnectTimeout;

      dio.options.receiveTimeout = oldReceiveTimeout;
    }
  }

  // ==============================
  // POST
  // ==============================

  Future<Response<dynamic>> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      return await dio.post(path, data: data, queryParameters: queryParameters);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ==============================
  // PUT
  // ==============================

  Future<Response<dynamic>> put(String path, {dynamic data}) async {
    try {
      return await dio.put(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ==============================
  // PATCH
  // ==============================

  Future<Response<dynamic>> patch(String path, {dynamic data}) async {
    try {
      return await dio.patch(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ==============================
  // DELETE
  // ==============================

  Future<Response<dynamic>> delete(String path, {dynamic data}) async {
    try {
      return await dio.delete(path, data: data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // ==============================
  // Error Handler
  // ==============================

  ApiException _handleError(DioException error) {
    final statusCode = error.response?.statusCode;

    String message = 'Đã xảy ra lỗi kết nối';

    if (error.response?.data is Map) {
      final data = error.response!.data;

      if (data['message'] != null) {
        message = data['message'].toString();
      }
    } else if (error.message != null) {
      message = error.message!;
    }

    return ApiException(message: message, statusCode: statusCode);
  }
}
