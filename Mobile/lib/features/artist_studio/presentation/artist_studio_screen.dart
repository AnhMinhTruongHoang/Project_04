library artist_studio_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../services/api/api_service.dart';
import '../../home/models/home_track.dart';
import '../../library/providers/library_provider.dart';
import '../../notifications/models/notification_item.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../player/providers/player_provider.dart';

part 'widgets/studio_comments_section.dart';
part 'widgets/studio_header.dart';
part 'widgets/studio_subscription_section.dart';
part 'widgets/studio_tracks_section.dart';
part 'studio_helpers.dart';

const _studioOrange = Color(0xFFFF5500);

final artistStudioStatsProvider = FutureProvider<_ArtistStudioStats>((
  ref,
) async {
  final response = await ApiService.instance.getArtistStudioStatsApi();

  if (!response.isSuccess) {
    return const _ArtistStudioStats();
  }

  return _ArtistStudioStats.fromJson(_unwrap(response.data));
});

final artistStudioSubscriptionProvider =
    FutureProvider<_StudioSubscriptionData?>((ref) async {
      final response = await ApiService.instance.getMySubscriptionApi();

      if (!response.isSuccess) {
        return null;
      }

      return _StudioSubscriptionData.fromJson(_unwrap(response.data));
    });

final subscriptionPlansProvider = FutureProvider<List<_StudioPlan>>((
  ref,
) async {
  final response = await ApiService.instance.getSubscriptionPlansApi();

  if (!response.isSuccess) {
    return const [];
  }

  return _resultList(response.data).map(_StudioPlan.fromJson).toList()
    ..sort((first, second) => first.sortOrder.compareTo(second.sortOrder));
});

final artistStudioTrackCommentsProvider =
    FutureProvider.family<List<_StudioComment>, String>((ref, trackId) async {
      final response = await ApiService.instance.getTrackCommentsApi(trackId);

      if (!response.isSuccess) {
        return const [];
      }

      return _studioCommentsFromResponse(response.data);
    });

class ArtistStudioScreen extends ConsumerStatefulWidget {
  const ArtistStudioScreen({super.key});

  @override
  ConsumerState<ArtistStudioScreen> createState() => _ArtistStudioScreenState();
}

class _ArtistStudioScreenState extends ConsumerState<ArtistStudioScreen> {
  _StudioFilter _filter = _StudioFilter.all;
  _StudioSection _section = _StudioSection.tracks;
  final TextEditingController _searchController = TextEditingController();
  bool _sortDescending = true;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }

      ref.invalidate(myUploadsProvider);
      ref.invalidate(artistStudioStatsProvider);
      ref.invalidate(artistStudioSubscriptionProvider);
      ref.read(notificationProvider.notifier).refresh(preview: true);
    });
  }

  @override
  Widget build(BuildContext context) {
    final uploads = ref.watch(myUploadsProvider);
    final stats = ref.watch(artistStudioStatsProvider);
    final subscription = ref.watch(artistStudioSubscriptionProvider);
    final notificationState = ref.watch(notificationProvider);
    final commentNotifications = notificationState.items
        .where(_isCommentNotification)
        .map(_studioCommentFromNotification)
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      appBar: AppBar(
        title: const Text('Artist Studio'),
        actions: [
          IconButton(
            tooltip: 'Upload track',
            onPressed: () {
              context.push('/track/upload');
            },
            icon: const Icon(Icons.upload_rounded),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: _studioOrange,
        backgroundColor: const Color(0xFF202020),
        onRefresh: () async {
          ref.invalidate(myUploadsProvider);
          ref.invalidate(artistStudioStatsProvider);
          ref.invalidate(artistStudioSubscriptionProvider);
          await Future.wait([
            ref.read(myUploadsProvider.future),
            ref.read(artistStudioStatsProvider.future),
            ref.read(artistStudioSubscriptionProvider.future),
            ref.read(notificationProvider.notifier).refresh(preview: true),
          ]);
        },
        child: uploads.when(
          loading: () {
            return const Center(
              child: CircularProgressIndicator(color: _studioOrange),
            );
          },
          error: (_, _) {
            return const _StudioMessage(
              icon: Icons.cloud_off_rounded,
              title: 'Could not load Artist Studio',
              subtitle: 'Pull down to try again.',
            );
          },
          data: (tracks) {
            final summary = _StudioSummary.fromTracks(tracks);
            final displayed =
                tracks.where(_matchesFilter).where(_matchesSearch).toList()
                  ..sort((first, second) {
                    final firstTime = _createdTime(first);
                    final secondTime = _createdTime(second);

                    return _sortDescending
                        ? secondTime.compareTo(firstTime)
                        : firstTime.compareTo(secondTime);
                  });

            return ListView(
              physics: const AlwaysScrollableScrollPhysics(
                parent: BouncingScrollPhysics(),
              ),
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 132),
              children: [
                _MinutesUsedCard(stats: stats.asData?.value),
                const SizedBox(height: 12),
                _HeroPanel(
                  onUpload: () {
                    context.push('/track/upload');
                  },
                  onRefresh: () {
                    ref.invalidate(myUploadsProvider);
                    ref.invalidate(artistStudioStatsProvider);
                    ref.invalidate(artistStudioSubscriptionProvider);
                    ref
                        .read(notificationProvider.notifier)
                        .refresh(preview: true);
                  },
                ),
                const SizedBox(height: 18),
                _StatsGrid(
                  summary: summary,
                  remoteStats: stats.asData?.value,
                  commentTotal: _resolvedCommentTotal(
                    null,
                    commentNotifications,
                  ),
                ),
                const SizedBox(height: 14),
                _StudioSectionTabs(
                  selected: _section,
                  onChanged: (section) {
                    setState(() {
                      _section = section;
                    });
                  },
                ),
                const SizedBox(height: 22),
                if (_section == _StudioSection.tracks) ...[
                  _SectionHeader(
                    title: 'SoundClone Tracks',
                    subtitle: '${displayed.length}/${tracks.length} shown',
                  ),
                  const SizedBox(height: 12),
                  _SearchAndSortBar(
                    controller: _searchController,
                    sortDescending: _sortDescending,
                    onChanged: (_) => setState(() {}),
                    onToggleSort: () {
                      setState(() {
                        _sortDescending = !_sortDescending;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  _FilterStrip(
                    selected: _filter,
                    onChanged: (value) {
                      setState(() {
                        _filter = value;
                      });
                    },
                  ),
                  const SizedBox(height: 12),
                  if (tracks.isEmpty)
                    const _StudioMessage(
                      icon: Icons.library_music_outlined,
                      title: 'No uploads yet',
                      subtitle: 'Upload your first track to start managing it.',
                    )
                  else if (displayed.isEmpty)
                    const _StudioMessage(
                      icon: Icons.filter_alt_off_rounded,
                      title: 'No tracks in this filter',
                      subtitle: 'Try another status.',
                    )
                  else
                    _TracksTable(
                      tracks: displayed,
                      onOpen: _openTrack,
                      onPlay: (track) {
                        ref
                            .read(playerProvider.notifier)
                            .playTrack(track, queue: displayed);
                      },
                    ),
                ] else if (_section == _StudioSection.comments) ...[
                  _SectionHeader(
                    title: 'Comments',
                    subtitle:
                        '${_resolvedCommentTotal(null, commentNotifications) ?? summary.comments} total',
                  ),
                  const SizedBox(height: 12),
                  _CommentsOverview(
                    notificationComments: commentNotifications,
                    tracks: tracks,
                  ),
                ] else if (_section == _StudioSection.subscription) ...[
                  const _SectionHeader(
                    title: 'Subscription',
                    subtitle: 'Plan and quota',
                  ),
                  const SizedBox(height: 12),
                  _SubscriptionPanel(subscription: subscription),
                ] else ...[
                  _LockedStudioSection(section: _section),
                ],
              ],
            );
          },
        ),
      ),
    );
  }

  bool _matchesFilter(HomeTrack track) {
    switch (_filter) {
      case _StudioFilter.all:
        return true;
      case _StudioFilter.public:
        return _status(track.approvalStatus) == 'APPROVED';
      case _StudioFilter.private:
        return !_isPublicTrack(track) && !_isRejectedTrack(track);
      case _StudioFilter.rejected:
        return _isRejectedTrack(track);
    }
  }

  bool _matchesSearch(HomeTrack track) {
    final query = _searchController.text.trim().toLowerCase();

    if (query.isEmpty) {
      return true;
    }

    final haystack = [
      track.title,
      _fileName(track.trackUrl),
      track.audioHash,
      _adminNote(track),
      track.artistName,
    ].whereType<String>().join(' ').toLowerCase();

    return haystack.contains(query);
  }

  void _openTrack(HomeTrack track) {
    final key = track.slug?.trim().isNotEmpty == true ? track.slug! : track.id;

    if (key.isEmpty) {
      return;
    }

    context.push('/track/$key', extra: track);
  }
}

