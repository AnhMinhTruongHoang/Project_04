import '../../home/models/home_track.dart';

class PlayerSocialState {
  const PlayerSocialState({
    this.likedTrackIds = const {},
    this.followedUserIds = const {},
    this.trackLikeCounts = const {},
  });

  final Set<String> likedTrackIds;
  final Set<String> followedUserIds;
  final Map<String, int> trackLikeCounts;

  bool isTrackLiked(HomeTrack track) {
    return likedTrackIds.contains(track.id);
  }

  int likeCountFor(HomeTrack track) {
    return trackLikeCounts[track.id] ?? track.countLike;
  }

  bool isArtistFollowed(HomeTrack track) {
    final uploaderId = track.uploaderId;

    return uploaderId != null && followedUserIds.contains(uploaderId);
  }

  PlayerSocialState copyWith({
    Set<String>? likedTrackIds,
    Set<String>? followedUserIds,
    Map<String, int>? trackLikeCounts,
  }) {
    return PlayerSocialState(
      likedTrackIds: likedTrackIds ?? this.likedTrackIds,
      followedUserIds: followedUserIds ?? this.followedUserIds,
      trackLikeCounts: trackLikeCounts ?? this.trackLikeCounts,
    );
  }
}
