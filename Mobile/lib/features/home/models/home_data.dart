import 'track_model.dart';

class HomeSectionData {
  const HomeSectionData({
    required this.title,
    required this.tracks,
  });

  final String title;
  final List<TrackModel> tracks;
}

class HomeData {
  const HomeData({
    required this.sections,
  });

  final List<HomeSectionData> sections;
}
