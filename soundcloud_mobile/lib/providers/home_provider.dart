import 'package:flutter/foundation.dart';

import '../core/network/api_exception.dart';
import '../models/category_model.dart';
import '../models/track_model.dart';
import '../services/track_service.dart';

class HomeProvider extends ChangeNotifier {
  final TrackService _trackService;

  HomeProvider({TrackService? trackService})
      : _trackService = trackService ?? TrackService();

  bool _isLoading = false;
  String? _errorMessage;

  List<TrackModel> _trendingTracks = const [];
  List<CategoryModel> _categories = const [];
  List<ListeningHistoryItem> _continueListening = const [];
  List<ListeningHistoryItem> _recentlyPlayed = const [];
  List<TrackModel> _becauseYouListened = const [];
  TrackModel? _becauseBasedOn;
  List<TrackModel> _hiddenGems = const [];

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  List<TrackModel> get trendingTracks => _trendingTracks;
  List<CategoryModel> get categories => _categories;
  List<ListeningHistoryItem> get continueListening => _continueListening;
  List<ListeningHistoryItem> get recentlyPlayed => _recentlyPlayed;
  List<TrackModel> get becauseYouListened => _becauseYouListened;
  TrackModel? get becauseBasedOn => _becauseBasedOn;
  List<TrackModel> get hiddenGems => _hiddenGems;

  bool get hasContent =>
      _trendingTracks.isNotEmpty ||
          _categories.isNotEmpty ||
          _continueListening.isNotEmpty ||
          _recentlyPlayed.isNotEmpty ||
          _becauseYouListened.isNotEmpty ||
          _hiddenGems.isNotEmpty;

  Future<void> loadHome() async {
    if (_isLoading) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final errors = <String>[];

    try {
      final trendingFuture = _safe(
            () => _trackService.getTracks(pageSize: 20),
        errors,
        'tracks',
      );

      final categoriesFuture = _safe(
        _trackService.getAllCategories,
        errors,
        'categories',
      );

      final historyFuture = _safe(
            () => _trackService.getHomeListeningHistory(limit: 10),
        errors,
        'history',
      );

      final recommendationFuture = _safe(
            () => _trackService.getBecauseYouListened(limit: 10),
        errors,
        'recommendations',
      );

      final hiddenGemsFuture = _safe(
            () => _trackService.getHiddenGems(limit: 10),
        errors,
        'hidden-gems',
      );

      final results = await Future.wait([
        trendingFuture,
        categoriesFuture,
        historyFuture,
        recommendationFuture,
        hiddenGemsFuture,
      ]);

      _trendingTracks =
          results[0] as List<TrackModel>? ?? const <TrackModel>[];

      _categories =
          results[1] as List<CategoryModel>? ?? const <CategoryModel>[];

      final history = results[2] as HomeListeningHistory?;
      _continueListening =
          history?.continueListening ?? const <ListeningHistoryItem>[];
      _recentlyPlayed =
          history?.recentlyPlayed ?? const <ListeningHistoryItem>[];

      final recommendation = results[3] as BecauseYouListenedResult?;
      _becauseBasedOn = recommendation?.basedOn;
      _becauseYouListened =
          recommendation?.tracks ?? const <TrackModel>[];

      _hiddenGems =
          results[4] as List<TrackModel>? ?? const <TrackModel>[];

      if (errors.isNotEmpty) {
        debugPrint('Home API errors:');
        for (final error in errors) {
          debugPrint(error);
        }

        if (!hasContent) {
          _errorMessage = errors.join('\n');
        }
      }
    } catch (e, stackTrace) {
      debugPrint('HomeProvider loadHome error: $e');
      debugPrint('$stackTrace');

      if (!hasContent) {
        _errorMessage = e.toString();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<T?> _safe<T>(
      Future<T> Function() action,
      List<String> errors,
      String section,
      ) async {
    try {
      return await action();
    } on ApiException catch (e) {
      errors.add('$section: ${e.message}');
      return null;
    } catch (e) {
      errors.add('$section: ${e.toString()}');
      return null;
    }
  }
}
