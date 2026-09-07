import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soundclone_mobile/features/auth/models/user_model.dart';
import 'package:soundclone_mobile/features/auth/providers/auth_provider.dart';
import 'package:soundclone_mobile/features/downloads/data/downloaded_tracks_service.dart';
import 'package:soundclone_mobile/features/downloads/presentation/track_download_button.dart';
import 'package:soundclone_mobile/features/downloads/providers/downloads_provider.dart';
import 'package:soundclone_mobile/features/home/models/home_track.dart';

const song = HomeTrack(
  id: 'song',
  title: 'Song',
  trackUrl: 'https://example.com/song.mp3',
);

class TestAuth extends AuthNotifier {
  TestAuth(this.user);
  final UserModel? user;
  @override
  Future<UserModel?> build() async => user;
}

class TestDownloads extends DownloadsController {
  TestDownloads({this.saved = false});
  final bool saved;
  int started = 0;
  int cancelled = 0;
  @override
  Future<List<DownloadedTrack>> build() async =>
      saved ? [DownloadedTrack(track: song, localPath: '/audio.mp3')] : [];
  @override
  Future<String?> download(HomeTrack track) async {
    started++;
    state = AsyncData([DownloadedTrack(track: track, localPath: '/audio.mp3')]);
    return null;
  }

  @override
  void cancel(String id) {
    cancelled++;
  }
}

class TestJobs extends DownloadJobs {
  TestJobs(this.jobs);
  final Map<String, DownloadJob> jobs;
  @override
  Map<String, DownloadJob> build() => jobs;
}

void main() {
  Future<void> mount(
    WidgetTester tester,
    TestDownloads controller, {
    HomeTrack track = song,
    bool guest = false,
    DownloadJob? job,
    VoidCallback? onParentTap,
  }) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authProvider.overrideWith(
            () => TestAuth(
              guest
                  ? null
                  : const UserModel(
                      id: 'user',
                      email: 'u@e.com',
                      name: 'User',
                      role: 'USER',
                    ),
            ),
          ),
          downloadsProvider.overrideWith(() => controller),
          downloadJobsProvider.overrideWith(
            () => TestJobs(job == null ? {} : {song.id: job}),
          ),
        ],
        child: MaterialApp(
          home: Scaffold(
            body: InkWell(
              onTap: onParentTap,
              child: TrackDownloadButton(track: track, onCover: true),
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('download tap does not play parent and changes to downloaded', (
    tester,
  ) async {
    final controller = TestDownloads();
    var played = 0;
    await mount(tester, controller, onParentTap: () => played++);
    await tester.tap(find.byTooltip('Download'));
    await tester.pumpAndSettle();
    expect(controller.started, 1);
    expect(played, 0);
    expect(find.byTooltip('Downloaded'), findsOneWidget);
    expect(find.text('Downloaded Song.'), findsOneWidget);
  });
  testWidgets('saved song is not downloaded again', (tester) async {
    final controller = TestDownloads(saved: true);
    await mount(tester, controller);
    await tester.tap(find.byTooltip('Downloaded'));
    await tester.pumpAndSettle();
    expect(controller.started, 0);
    expect(find.text('Already saved in Profile > Downloads.'), findsOneWidget);
  });
  testWidgets('running job exposes cancel and progress', (tester) async {
    final controller = TestDownloads();
    await mount(
      tester,
      controller,
      job: const DownloadJob(song, progress: 0.4),
    );
    expect(
      tester
          .widget<CircularProgressIndicator>(
            find.byType(CircularProgressIndicator),
          )
          .value,
      0.4,
    );
    await tester.tap(find.byTooltip('Cancel download'));
    expect(controller.cancelled, 1);
    expect(controller.started, 0);
  });
  testWidgets('failed job offers retry', (tester) async {
    final controller = TestDownloads();
    await mount(
      tester,
      controller,
      job: const DownloadJob(song, error: 'Failed'),
    );
    await tester.tap(find.byTooltip('Retry download'));
    await tester.pumpAndSettle();
    expect(controller.started, 1);
  });
  testWidgets('guest gets login message without starting download', (
    tester,
  ) async {
    final controller = TestDownloads();
    await mount(tester, controller, guest: true);
    await tester.tap(find.byTooltip('Download'));
    await tester.pumpAndSettle();
    expect(controller.started, 0);
    expect(find.text('Log in to download music.'), findsOneWidget);
  });
  testWidgets('track without audio has disabled download', (tester) async {
    final controller = TestDownloads();
    await mount(
      tester,
      controller,
      track: const HomeTrack(id: 'missing', title: 'Missing'),
    );
    expect(find.byTooltip('Download unavailable'), findsOneWidget);
    expect(
      tester.widget<IconButton>(find.byType(IconButton)).onPressed,
      isNull,
    );
  });
}
