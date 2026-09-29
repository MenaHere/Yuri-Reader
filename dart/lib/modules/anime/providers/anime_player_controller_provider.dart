import 'package:flutter_riverpod/misc.dart';
import 'package:yuri_reader/repositories/chapter_repository.dart';
import 'package:yuri_reader/repositories/settings_repository.dart';
import 'package:yuri_reader/repositories/track_repository.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/modules/manga/reader/mixins/chapter_controller_mixin.dart';
import 'package:yuri_reader/utils/extensions/chapter_extensions.dart';
import 'package:yuri_reader/modules/more/settings/player/providers/player_state_provider.dart';
import 'package:yuri_reader/services/aniskip.dart';
import 'package:yuri_reader/utils/chapter_recognition.dart';
import 'package:yuri_reader/utils/riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'anime_player_controller_provider.g.dart';

final fullscreenProvider = StateProvider<bool>(() => false);

@riverpod
class AnimeStreamController extends _$AnimeStreamController
    with ChapterControllerMixin {
  @override
  KeepAliveLink build({required Chapter episode}) {
    _keepAliveLink = ref.keepAlive();
    return _keepAliveLink!;
  }

  KeepAliveLink? _keepAliveLink;
  KeepAliveLink? get keepAliveLink => _keepAliveLink;

  // Bridge the mixin's `chapter` contract to the `episode` build parameter.
  @override
  Chapter get chapter => episode;

  // Keep incognitoMode as a final field (read once, not on every access).
  @override
  final bool incognitoMode = settingsRepository.current.incognitoMode!;

  // ---------------------------------------------------------------------------
  // Anime-flavoured aliases (preserve the existing public API)
  // ---------------------------------------------------------------------------

  (int, bool) getEpisodeIndex() => getChapterIndex();

  Chapter getPrevEpisode() => getPrevChapter();
  Chapter getNextEpisode() => getNextChapter();

  bool get hasPreviousEpisode => hasPreviousChapter;
  bool get hasNextEpisode => hasNextChapter;

  int getEpisodesLength(bool isInFilterList) =>
      getChaptersLength(isInFilterList);

  // ---------------------------------------------------------------------------
  // Playback position
  // ---------------------------------------------------------------------------

  Duration getCurrentPosition() {
    if (incognitoMode) return Duration.zero;
    final position = episode.lastPageRead ?? '0';
    return Duration(
      milliseconds: episode.isRead!
          ? 0
          : int.parse(position.isEmpty ? "0" : position),
    );
  }

  void setCurrentPosition(
    Duration duration,
    Duration? totalDuration, {
    bool save = false,
  }) {
    if (incognitoMode) return;
    final markEpisodeAsSeenType = ref.read(markEpisodeAsSeenTypeStateProvider);
    final isWatch =
        totalDuration != null &&
            totalDuration != Duration.zero &&
            duration != Duration.zero
        ? duration.inSeconds >=
              ((totalDuration.inSeconds * markEpisodeAsSeenType) / 100).ceil()
        : false;
    if (isWatch || save) {
      // MAL-Sync tracks watching, not the app's seen state: reaching the
      // threshold must bump the tracker even when the episode is already
      // seen (the player skips seen episodes otherwise).
      if (isWatch) {
        episode.updateTrackChapterRead(ref);
      }
      if (episode.isRead!) return;
      final ep = episode;
      ep.isRead = isWatch;
      ep.lastPageRead = (duration.inMilliseconds).toString();
      if (totalDuration != null && totalDuration > Duration.zero) {
        ep.duration = totalDuration.inMilliseconds.toString();
      }
      ep.updatedAt = DateTime.now().millisecondsSinceEpoch;
      chapterRepository.save(ep);
    }
  }

  /// Persists the terminal playback state before the player route is replaced.
  /// Some backends emit `completed` before their final position event, so the
  /// known total duration is the deterministic terminal position.
  Future<void> completeEpisode(
    Duration totalDuration, {
    int elapsedSeconds = 0,
  }) async {
    if (incognitoMode) return;
    final completedPosition = totalDuration > Duration.zero
        ? totalDuration
        : Duration(milliseconds: int.tryParse(episode.lastPageRead ?? '') ?? 0);
    setCurrentPosition(completedPosition, totalDuration, save: true);
    await setHistoryUpdate(elapsedSeconds: elapsedSeconds);
  }

  // ---------------------------------------------------------------------------
  // AniSkip
  // ---------------------------------------------------------------------------

  (int, int)? _getTrackId() {
    final malId = trackRepository.getMediaIdBySyncAndManga(
      1,
      episode.manga.value!.id!,
    );
    final aniId = trackRepository.getMediaIdBySyncAndManga(
      2,
      episode.manga.value!.id!,
    );
    return switch (malId) {
      != null => (malId, 1),
      == null => switch (aniId) {
        != null => (aniId, 2),
        _ => null,
      },
      _ => null,
    };
  }

  Future<List<Results>?> getAniSkipResults(
    Function(List<Results>) result,
  ) async {
    await Future.delayed(const Duration(milliseconds: 300));
    final id = _getTrackId();
    if (id != null) {
      final res = await ref
          .read(aniSkipProvider.notifier)
          .getResult(
            id,
            ChapterRecognition().parseEpisodeNumber(
              episode.manga.value!.name!,
              episode.name!,
            ),
            0,
          );
      result.call(res ?? []);
      return res;
    }
    return null;
  }
}