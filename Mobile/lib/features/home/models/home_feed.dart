import 'home_track.dart';

class HomeFeed {
  const HomeFeed({
    this.historyTitle = 'Recently Played',
    this.historyTracks = const [],
    this.becauseTitle =
    'Because You Listened To',
    this.becauseTracks = const [],
    this.hiddenGems = const [],
    this.ncsTracks = const [],
    this.kpopTracks = const [],
    this.popTracks = const [],
    this.lofiTracks = const [],
  });

  final String historyTitle;
  final List<HomeTrack> historyTracks;

  final String becauseTitle;
  final List<HomeTrack> becauseTracks;

  final List<HomeTrack> hiddenGems;
  final List<HomeTrack> ncsTracks;
  final List<HomeTrack> kpopTracks;
  final List<HomeTrack> popTracks;
  final List<HomeTrack> lofiTracks;

  bool get isEmpty {
    return historyTracks.isEmpty &&
        becauseTracks.isEmpty &&
        hiddenGems.isEmpty &&
        ncsTracks.isEmpty &&
        kpopTracks.isEmpty &&
        popTracks.isEmpty &&
        lofiTracks.isEmpty;
  }
}