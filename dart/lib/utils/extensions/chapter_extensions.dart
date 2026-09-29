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
import 'package:yuri_reader/modules/malsync/malsync_panel.dart';
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
      _syncViaYuriSync(
        manga.name!,
        chapterNumber,
        manga.itemType,
        url: matchUrl,
      ).whenComplete(() {
        // Re-read the panel so the bumped value shows without the user leaving
        // the page and opening it again.
        malsyncSyncTick.value++;
      }),
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

  static Future<void> _syncViaYuriSync(
    String title,
    int chapterNumber,
    ItemType itemType, {
    String? url,
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
      );
      if (kDebugMode) {
        debugPrint(
          '[MALSyncTrace] ${DateTime.now().toIso8601String()} track.auto done '
          'title=$title chapter=$chapterNumber result=$result',
        );
      }
    } catch (error, stack) {
      debugPrint(
        '[MALSyncTrace] ${DateTime.now().toIso8601String()} track.auto failed '
        'title=$title chapter=$chapterNumber error=$error\n$stack',
      );
    }
  }
}
