import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/models/track_search.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'base_tracker.dart';

/// MAL-Sync tracker that delegates to the Yuri-Sync bridge.
///
/// This does not require its own OAuth — auth tokens are forwarded
/// by the individual tracker providers (MAL, AniList, Kitsu).
/// Enabling MAL-Sync here simply exposes the bridge as a first-class
/// tracker in the UI.
class MalSyncTracker implements BaseTracker {
  @override
  Future<bool> checkRefresh() async => true;

  @override
  Future<Track?> findLibItem(Track track, bool isManga) async {
    // MAL-Sync bridge has no library-query endpoint; treat the local
    // Track record as the source of truth.
    return track;
  }

  @override
  Future<Track> update(Track track, bool isManga) async {
    final type = isManga ? 'manga' : 'anime';
    await YuriSyncService().trackAuto(
      title: track.title ?? '',
      type: type,
      chapter: isManga ? track.lastChapterRead : null,
      episode: isManga ? null : track.lastChapterRead,
    );
    return track;
  }

  @override
  List<TrackStatus> statusList(bool isManga) {
    if (isManga) {
      return [
        TrackStatus.reading,
        TrackStatus.completed,
        TrackStatus.onHold,
        TrackStatus.dropped,
        TrackStatus.planToRead,
        TrackStatus.reReading,
      ];
    }
    return [
      TrackStatus.watching,
      TrackStatus.completed,
      TrackStatus.onHold,
      TrackStatus.dropped,
      TrackStatus.planToWatch,
      TrackStatus.reWatching,
    ];
  }

  @override
  Future<List<TrackSearch>> search(String query, bool isManga) async {
    // Return a single synthetic result so the user can tap it
    // without a manual search round-trip.
    return [
      TrackSearch(
        title: query,
        mediaId: 0,
        totalChapter: 0,
      ),
    ];
  }

  @override
  Future<List<TrackSearch>> fetchGeneralData({
    bool? isManga,
    String? rankingType,
  }) async => [];

  @override
  Future<List<TrackSearch>> fetchUserData({bool? isManga}) async => [];

  @override
  (int, int) getScoreValue() => (10, 1);

  @override
  String displayScore(int score) => score.toString();
}
