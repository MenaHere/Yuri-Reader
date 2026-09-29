import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/download.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/models/track_preference.dart';
import 'package:yuri_reader/modules/manga/detail/providers/track_state_providers.dart';
import 'package:yuri_reader/modules/manga/reader/providers/push_router.dart';
import 'package:yuri_reader/modules/malsync/malsync_flash.dart';
import 'package:yuri_reader/modules/malsync/malsync_panel.dart';
import 'package:yuri_reader/router/router.dart';
import 'package:yuri_reader/utils/extensions/manga_extensions.dart';
import 'package:yuri_reader/modules/more/settings/track/providers/track_providers.dart';
import 'package:yuri_reader/modules/tracker_library/tracker_library_screen.dart';
import 'package:yuri_reader/providers/storage_provider.dart';
import 'package:yuri_reader/services/download_manager/download_isolate_pool.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'package:yuri_reader/services/download_manager/m_downloader.dart';
import 'package:yuri_reader/utils/chapter_recognition.dart';
import 'package:yuri_reader/utils/extensions/string_extensions.dart';
import 'package:path/path.dart' as p;

extension ChapterExtension on Chapter {
  Future<void> pushToReaderView(
    BuildContext context, {
    bool ignoreIsRead = false,
  }) async {
    if (ignoreIsRead || !isRead!) {
      await pushMangaReaderView(context: context, chapter: this);
    } else {
      final filteredChaps = manga.value!.getChapterListForReading();
      bool exist = false;
      for (var filteredChap in filteredChaps) {
        if (filteredChap.toJson().toString() == toJson().toString()) {
          exist = true;
        }
        if (exist && !filteredChap.isRead!) {
          await pushMangaReaderView(context: context, chapter: filteredChap);
          break;
        }
      }
    }
  }

  void cancelDownloads(int? downloadId) {
    // Cancel via the Isolate pool (new system)
    DownloadIsolatePool.instance.cancelTask('$id');
    DownloadIsolatePool.instance.cancelTask('m3u8_$id');

    // Clean the map for compatibility
    isolateChapsSendPorts.remove('$id');

    isar.writeTxnSync(() {
      isar.downloads.deleteSync(id!);
      if (downloadId != null) {
        isar.downloads.deleteSync(downloadId);
      }
    });
  }

  Future<void> deleteDownloadedFiles() async {
    final download = isar.downloads.getSync(id!);
    if (download == null) return;

    final storageProvider = StorageProvider();
    final mangaDir = await storageProvider.getMangaMainDirectory(this);
    final chapterDir = await storageProvider.getMangaChapterDirectory(
      this,
      mangaMainDirectory: mangaDir,
    );

    try {
      final cbzFile = File(p.join(mangaDir!.path, "$name.cbz"));
      if (cbzFile.existsSync()) cbzFile.deleteSync();
    } catch (error) {
      debugPrint('[DeleteDownloaded] could not delete the cbz: $error');
    }
    try {
      final mp4File = File(
        p.join(mangaDir!.path, "${name!.replaceForbiddenCharacters(' ')}.mp4"),
      );
      if (mp4File.existsSync()) mp4File.deleteSync();
    } catch (error) {
      debugPrint('[DeleteDownloaded] could not delete the mp4: $error');
    }
    try {
      final htmlFile = File(p.join(mangaDir!.path, "$name.html"));
      if (htmlFile.existsSync()) htmlFile.deleteSync();
    } catch (error) {
      debugPrint('[DeleteDownloaded] could not delete the html: $error');
    }
    try {
      chapterDir?.deleteSync(recursive: true);
    } catch (error) {
      debugPrint('[DeleteDownloaded] could not delete the chapter dir: $error');
    }

    cancelDownloads(download.id);
  }

  void updateTrackChapterRead(dynamic ref) {
    if (!(ref is WidgetRef || ref is Ref)) return;
    final updateProgressAfterReading = ref.read(
      updateProgressAfterReadingStateProvider,
    );
    final manga = this.manga.value;
    if (kDebugMode) {
      debugPrint(
        '[TrackUpdate] ${DateTime.now().toIso8601String()} '
        'enter chapter="$name" manga="${manga?.name}" '
        'updateProgressAfterReading=$updateProgressAfterReading',
      );
    }
    if (!updateProgressAfterReading) return;
    if (manga == null) {
      if (kDebugMode) {
        debugPrint('[TrackUpdate] manga is null, aborting');
      }
      return;
    }
    final chapterNumber = ChapterRecognition().parseEpisodeNumber(
      manga.name!,
      name!,
    );
    if (kDebugMode) {
      debugPrint(
        '[TrackUpdate] parsed chapterNumber=$chapterNumber '
        'itemType=${manga.itemType}',
      );
    }

    final tracks = isar.tracks
        .filter()
        .idIsNotNull()
        .itemTypeEqualTo(manga.itemType)
        .mangaIdEqualTo(manga.id!)
        .findAllSync();
    if (kDebugMode) {
      debugPrint(
        '[TrackUpdate] tracks found=${tracks.length} mangaId=${manga.id}',
      );
      for (final t in tracks) {
        debugPrint(
          '[TrackUpdate]   track syncId=${t.syncId} '
          'lastChapterRead=${t.lastChapterRead} '
          'totalChapter=${t.totalChapter} status=${t.status}',
        );
      }
    }

    // MAL-Sync and the native trackers write the same accounts, and they read
    // the chapter number differently (the bridge searches by title, the native
    // trackers use this app's recognition), so both running pushes the same
    // title twice and can leave the two disagreeing about the progress. When
    // MAL-Sync is enabled it owns the update and the native rows are left to
    // it.
    final malsyncOwnsTracking = isar.trackPreferences
        .filter()
        .syncIdIsNotNull()
        .syncIdEqualTo(TrackerProviders.malsync.syncId)
        .findFirstSync() != null;
    if (kDebugMode) {
      debugPrint('[TrackUpdate] malsyncOwnsTracking=$malsyncOwnsTracking');
    }

    // The match the user picked by hand is stored on the MAL-Sync track row.
    // The bridge has to write to that entry: a fresh title search can land on
    // a different entry, and then the user's own entry never moves.
    final matchUrl = tracks
        .where((track) => track.syncId == TrackerProviders.malsync.syncId)
        .map((track) => track.trackingUrl)
        .firstWhere(
          (url) => url != null && url.isNotEmpty,
          orElse: () => null,
        );
    if (kDebugMode) {
      debugPrint('[TrackUpdate] matchUrl=$matchUrl');
    }

    // Always attempt to sync via the Yuri-Sync MALSync bridge (fire-and-forget).
    if (kDebugMode) {
      debugPrint(
        '[MALSyncTrace] ${DateTime.now().toIso8601String()} '
        'chapter-complete title=${manga.name} chapter=$name '
        'chapterNumber=$chapterNumber tracks=${tracks.length} '
        'malsyncOwnsTracking=$malsyncOwnsTracking',
      );
    }
    unawaited(
      _syncWithConfirmations(
        manga.name!,
        chapterNumber,
        manga.itemType,
        matchUrl,
      ),
    );

    if (tracks.isEmpty || malsyncOwnsTracking) {
      if (kDebugMode) {
        debugPrint(
          '[TrackUpdate] skipping native update '
          '(tracksEmpty=${tracks.isEmpty} '
          'malsyncOwnsTracking=$malsyncOwnsTracking)',
        );
      }
      return;
    }
    for (var track in tracks) {
      final service = isar.trackPreferences
          .filter()
          .syncIdIsNotNull()
          .syncIdEqualTo(track.syncId)
          .findFirstSync();
      final shouldUpdate = !(service == null ||
          chapterNumber <= (track.lastChapterRead ?? 0));
      if (kDebugMode) {
        debugPrint(
          '[TrackUpdate]   native track syncId=${track.syncId} '
          'service=${service?.syncId} chapterNumber=$chapterNumber '
          'lastChapterRead=${track.lastChapterRead} '
          'shouldUpdate=$shouldUpdate',
        );
      }
      if (shouldUpdate) {
        if (track.status != TrackStatus.completed) {
          track.lastChapterRead = chapterNumber;
          if (track.lastChapterRead == track.totalChapter &&
              (track.totalChapter ?? 0) > 0) {
            track.status = TrackStatus.completed;
            track.finishedReadingDate = DateTime.now().millisecondsSinceEpoch;
          } else {
            track.status = manga.itemType == ItemType.manga
                ? TrackStatus.reading
                : TrackStatus.watching;
            if (track.lastChapterRead == 1) {
              track.startedReadingDate = DateTime.now().millisecondsSinceEpoch;
            }
          }
        }
        if (kDebugMode) {
          debugPrint(
            '[TrackUpdate]   native update -> '
            'lastChapterRead=${track.lastChapterRead} '
            'status=${track.status}',
          );
        }
        ref
            .read(
              trackStateProvider(
                track: track,
                itemType: manga.itemType,
                widgetRef: ref,
              ).notifier,
            )
            .updateManga();
      }
    }
  }

  /// The MAL-Sync-style questions before a bump: "Start reading?" when the
  /// entry is not started, and "Set as completed?" when the chapter is the
  /// last one. Saying no to the first skips the write; saying no to the second
  /// still bumps the progress but leaves the status reading.
  static Future<void> _syncWithConfirmations(
    String title,
    int chapterNumber,
    ItemType itemType,
    String? matchUrl,
  ) async {
    final type = itemType == ItemType.anime ? 'anime' : 'manga';
    int? total;
    int? status;
    List<Map<String, dynamic>> scoreOptions = [];
    try {
      final result = await YuriSyncService().entryFind(
        title: title,
        type: type,
        url: matchUrl,
      );
      final entry = result['entry'];
      if (entry is Map) {
        total = (entry['totalEpisodes'] as num?)?.toInt();
        status = (entry['status'] as num?)?.toInt();
      }
      final options = result['scoreOptions'];
      if (options is List) {
        scoreOptions = options
            .whereType<Map>()
            .cast<Map<String, dynamic>>()
            .toList();
      }
    } catch (error) {
      debugPrint(
        '[TrackUpdate] could not read the entry before syncing: $error',
      );
    }

    // "Start reading?" - the entry is not started (plan to read / considering).
    final started = status != null && status != 0 && status != 5 && status != 7;
    if (!started) {
      final (ok, _) = await _confirmWithScore(
        itemType == ItemType.anime ? 'Start watching?' : 'Start reading?',
      );
      if (!ok) return;
    }

    // "Set as completed?" - this is the last chapter/episode. The bar carries
    // the score dropdown, and a Yes applies the chosen score.
    int? statusToSet;
    int? scoreToSet;
    final isLast = total != null && total > 0 && chapterNumber >= total;
    if (isLast) {
      final (ok, score) = await _confirmWithScore(
        'Set as completed?',
        scoreOptions,
      );
      if (ok) {
        statusToSet = 2; // malsync status.Completed
        scoreToSet = score;
      }
    }

    await _syncViaYuriSync(
      title,
      chapterNumber,
      itemType,
      url: matchUrl,
      status: statusToSet,
      score: scoreToSet,
    );
  }

  /// A Yes/No question at the top of the screen, the way MAL-Sync asks. An
  /// optional score dropdown rides on the bar, as the "Set as completed?"
  /// question carries one.
  static Future<(bool, int?)> _confirmWithScore(
    String message, [
    List<Map<String, dynamic>> scoreOptions = const [],
  ]) async {
    final context = navigatorKey.currentContext;
    if (context == null || !context.mounted) return (true, null);
    final overlay = navigatorKey.currentState?.overlay;
    if (overlay == null) return (true, null);
    final completer = Completer<(bool, int?)>();
    late OverlayEntry entry;
    void finish(bool answer, int? score) {
      dismissMalSyncConfirm();
      if (!completer.isCompleted) completer.complete((answer, score));
    }

    entry = OverlayEntry(
      builder: (context) => MalSyncFlashConfirm(
        message: message,
        scoreOptions: scoreOptions,
        onAnswer: finish,
      ),
    );
    overlay.insert(entry);
    // Leaving the reader answers "no": the bar must not follow the user out.
    registerMalSyncConfirm(entry, () {
      if (!completer.isCompleted) completer.complete((false, null));
    });
    return completer.future;
  }

  static Future<void> _syncViaYuriSync(
    String title,
    int chapterNumber,
    ItemType itemType, {
    String? url,
    int? status,
    int? score,
  }) async {
    final type = itemType == ItemType.anime ? 'anime' : 'manga';
    if (kDebugMode) {
      debugPrint(
        '[MALSyncTrace] ${DateTime.now().toIso8601String()} track.auto start '
        'title=$title chapter=$chapterNumber type=$type',
      );
    }
    try {
      final result = await YuriSyncService().trackAuto(
        title: title,
        type: type,
        chapter: type == 'manga' ? chapterNumber : null,
        episode: type == 'anime' ? chapterNumber : null,
        url: url,
        status: status,
        score: score,
      );
      if (kDebugMode) {
        debugPrint(
          '[MALSyncTrace] ${DateTime.now().toIso8601String()} track.auto done '
          'title=$title chapter=$chapterNumber result=$result',
        );
      }
      // Re-read the panel so the bumped value shows without the user leaving
      // the page and opening it again.
      malsyncSyncTick.value++;
      _showSyncResult(
        result,
        title: title,
        chapterNumber: chapterNumber,
        itemType: itemType,
        statusSet: status != null,
        scoreSet: score != null,
      );
    } catch (error, stack) {
      debugPrint(
        '[MALSyncTrace] ${DateTime.now().toIso8601String()} track.auto failed '
        'title=$title chapter=$chapterNumber error=$error\n$stack',
      );
    }
  }

  /// The bottom pop-up after a sync, the way MAL-Sync answers a finished
  /// chapter: the title, then `Volume: X/Y | Chapter: X/Y`, then the pink
  /// `Undo` / `Wrong?` buttons.
  static void _showSyncResult(
    Map<String, dynamic> result, {
    required String title,
    required int chapterNumber,
    required ItemType itemType,
    required bool statusSet,
    required bool scoreSet,
  }) {
    final context = navigatorKey.currentContext;
    if (context == null || !context.mounted) return;
    final type = result['type'] == 'anime' ? 'anime' : 'manga';
    final status = (result['entryStatus'] as num?)?.toInt() ?? 0;
    final volume = (result['volume'] as num?)?.toInt() ?? 0;
    final totalVolumes = (result['totalVolumes'] as num?)?.toInt() ?? 0;
    final episode = (result['episode'] as num?)?.toInt() ?? 0;
    final totalEpisodes = (result['totalEpisodes'] as num?)?.toInt() ?? 0;
    final score = (result['score'] as num?)?.toInt() ?? 0;

    final parts = <String>[];
    final statusWord = _statusWord(status, type);
    // The status word appears only when this sync set one, the way MAL-Sync
    // shows a field only when it changed.
    if (statusSet && statusWord.isNotEmpty) parts.add(statusWord);
    if (volume > 0) {
      parts.add('Volume: $volume/${totalVolumes > 0 ? totalVolumes : '?'}');
    }
    if (episode > 0) {
      final label = type == 'anime' ? 'Episode:' : 'Chapter:';
      parts.add('$label $episode/${totalEpisodes > 0 ? totalEpisodes : '?'}');
    }
    if (scoreSet && score > 0) parts.add('Your Score: $score');

    final message = parts.isEmpty ? title : '$title\n${parts.join(' | ')}';
    showMalSyncFlash(
      message,
      onUndo: () => _syncViaYuriSync(
        title,
        chapterNumber > 1 ? chapterNumber - 1 : 0,
        itemType,
        url: result['url'] as String?,
      ),
      onWrong: () {
        debugPrint(
          '[MALSyncTrace] wrong-match reported for $title '
          'chapter=$chapterNumber',
        );
      },
    );
  }

  static String _statusWord(int status, String type) {
    return switch (status) {
      1 => type == 'anime' ? 'Watching' : 'Reading',
      2 => 'Completed',
      3 => 'On Hold',
      4 => 'Dropped',
      5 => type == 'anime' ? 'Plan to Watch' : 'Plan to Read',
      6 => type == 'anime' ? 'Rewatching' : 'Rereading',
      7 => 'Considering',
      _ => '',
    };
  }
}
