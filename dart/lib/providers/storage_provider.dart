// ignore_for_file: depend_on_referenced_packages
import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:isar_community/isar.dart';
import 'package:yuri_reader/eval/model/source_preference.dart';
import 'package:yuri_reader/models/category.dart';
import 'package:yuri_reader/repositories/settings_repository.dart';
import 'package:yuri_reader/models/changed.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/custom_button.dart';
import 'package:yuri_reader/models/download.dart';
import 'package:yuri_reader/models/update.dart';
import 'package:yuri_reader/models/history.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/backup_password_fallback.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:yuri_reader/models/source.dart';
import 'package:yuri_reader/models/sync_preference.dart';
import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/models/track_preference.dart';
import 'package:yuri_reader/utils/extensions/string_extensions.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path/path.dart' as path;
import 'package:yuri_reader/utils/platform_utils.dart';

@visibleForTesting
String? linuxDocumentsFallbackPath(Map<String, String> environment) {
  final home = environment['HOME']?.trim();
  return home == null || home.isEmpty ? null : home;
}

class StorageProvider {
  /// The one-line marker that records which data directory this install runs
  /// on. It lives in the app-support directory, which is fixed for the
  /// install, so it is readable before any database opens.
  static const _dataDirMarkerFileName = 'yuri_reader_data_dir';

  /// The resolved data-directory leaf ("Yuri-Reader" or "Mangayomi"), cached
  /// by [initDataDirectory] so [dataDirName] can stay synchronous.
  static String? _cachedDataDirLeaf;

  /// The directory that holds the data-directory leaf. Android shared storage
  /// on Android, Application Support on macOS, Documents everywhere else.
  static String? _cachedParentPath;

  /// The app-support directory that holds the marker file.
  static String? _cachedAppSupportPath;

  /// Whether the marker file existed when the app started. [Mangayomi] exists
  /// is only consulted when it did not.
  static bool _markerPresent = false;

  /// The Leaf name the install is currently using.
  static String get dataDirLeaf => _cachedDataDirLeaf ?? 'Yuri-Reader';

  /// The directory holding the data-directory leaf, once resolved.
  static String? get cachedDataParentPath => _cachedParentPath;

  /// Whether the first launch must offer a data-directory choice: a Mangayomi
  /// folder exists and this install has never chosen a leaf.
  static bool get dataDirChoiceRequired {
    final parent = _cachedParentPath;
    if (parent == null || _markerPresent) return false;
    return Directory(path.join(parent, 'Mangayomi')).existsSync() &&
        !Directory(path.join(parent, 'Yuri-Reader')).existsSync();
  }

  /// Data directory name: the cached choice when one was made, otherwise
  /// "Yuri-Reader" when it exists, then "Mangayomi" when it exists, and
  /// "Yuri-Reader" for a fresh install.
  static String dataDirName(String parentPath) =>
      _cachedDataDirLeaf ?? _resolveLeafFromExistence(parentPath);

  static String _resolveLeafFromExistence(String parentPath) {
    if (Directory(path.join(parentPath, 'Yuri-Reader')).existsSync()) {
      return 'Yuri-Reader';
    }
    if (Directory(path.join(parentPath, 'Mangayomi')).existsSync()) {
      return 'Mangayomi';
    }
    return 'Yuri-Reader';
  }

  /// The directory that holds the data leaf, per platform. macOS keeps its
  /// database under Application Support, so its leaf is there too. iOS is the
  /// app sandbox and never uses a leaf name.
  static Future<String> _platformParentPath() async {
    if (Platform.isAndroid) return '/storage/emulated/0';
    if (Platform.isMacOS) {
      return (await getApplicationSupportDirectory()).path;
    }
    try {
      return (await getApplicationDocumentsDirectory()).path;
    } catch (e) {
      if (!Platform.isLinux) rethrow;
      final home = linuxDocumentsFallbackPath(Platform.environment);
      if (home == null) rethrow;
      return home;
    }
  }

  /// Resolves and caches which data directory this launch uses. Must run
  /// before the first [getDefaultDirectory] or [initDB] so the marker wins
  /// over the existence fallback.
  static Future<void> initDataDirectory() async {
    final support = await getApplicationSupportDirectory();
    _cachedAppSupportPath = support.path;
    final parent = await _platformParentPath();
    _cachedParentPath = parent;
    final marker = File(path.join(support.path, _dataDirMarkerFileName));
    if (await marker.exists()) {
      final leaf = (await marker.readAsString()).trim();
      if (leaf == 'Yuri-Reader' || leaf == 'Mangayomi') {
        _markerPresent = true;
        _cachedDataDirLeaf = leaf;
        return;
      }
      debugPrint('[Storage] ignoring invalid data-dir marker "$leaf"');
    }
    _markerPresent = false;
    _cachedDataDirLeaf = _resolveLeafFromExistence(parent);
  }

  /// Persists a data-directory choice and returns whether it differs from the
  /// one in effect. The directories are created best-effort; failing to make
  /// one does not lose the choice, which the next launch retries.
  static bool setDataDirectory(String leaf) {
    final changed = _cachedDataDirLeaf != leaf;
    _cachedDataDirLeaf = leaf;
    _markerPresent = true;
    final support = _cachedAppSupportPath;
    if (support != null) {
      try {
        Directory(support).createSync(recursive: true);
        File(path.join(support, _dataDirMarkerFileName)).writeAsStringSync(leaf);
      } catch (e) {
        debugPrint('[Storage] could not write the data-dir marker: $e');
      }
    } else {
      unawaited(_writeDataDirMarker(leaf));
    }
    final parent = _cachedParentPath;
    if (parent != null) {
      try {
        Directory(path.join(parent, leaf)).createSync(recursive: true);
      } catch (e) {
        debugPrint('[Storage] could not create the data directory: $e');
      }
    } else {
      unawaited(_createDataDirectory(leaf));
    }
    return changed;
  }

  static Future<void> _writeDataDirMarker(String leaf) async {
    try {
      final support = await getApplicationSupportDirectory();
      _cachedAppSupportPath = support.path;
      await Directory(support.path).create(recursive: true);
      await File(
        path.join(support.path, _dataDirMarkerFileName),
      ).writeAsString(leaf);
    } catch (e) {
      debugPrint('[Storage] could not write the data-dir marker: $e');
    }
  }

  static Future<void> _createDataDirectory(String leaf) async {
    try {
      final parent = await _platformParentPath();
      await Directory(path.join(parent, leaf)).create(recursive: true);
    } catch (e) {
      debugPrint('[Storage] could not create the data directory: $e');
    }
  }

  /// The schemas every Isar environment opens with. Single source of truth so
  /// the app database and a foreign database can be opened with the same set.
  static final List<CollectionSchema<dynamic>> dbSchemas = [
    MangaSchema,
    ChangedPartSchema,
    ChapterSchema,
    CategorySchema,
    CustomButtonSchema,
    UpdateSchema,
    HistorySchema,
    DownloadSchema,
    SourceSchema,
    SettingsSchema,
    TrackPreferenceSchema,
    TrackSchema,
    SyncPreferenceSchema,
    SourcePreferenceSchema,
    SourcePreferenceStringValueSchema,
    BackupPasswordFallbackSchema,
  ];

  static final StorageProvider _instance = StorageProvider._internal();
  StorageProvider._internal();
  factory StorageProvider() => _instance;

  /// `path_provider_linux` asks `xdg-user-dir` for Documents. Minimal desktop
  /// environments may not provide that executable, which must not prevent the
  /// database or downloads from initializing. Fall back to HOME on Linux.
  Future<Directory> _documentsDirectory() async {
    try {
      return await getApplicationDocumentsDirectory();
    } catch (_) {
      if (!Platform.isLinux) rethrow;
      final home = linuxDocumentsFallbackPath(Platform.environment);
      if (home == null) rethrow;
      return Directory(home);
    }
  }

  Future<bool> requestPermission() async {
    if (!Platform.isAndroid) return true;
    Permission permission = Permission.manageExternalStorage;
    if (await permission.isGranted) return true;
    if (await permission.request().isGranted) {
      return true;
    }
    return false;
  }

  Future<void> deleteBtDirectory() async {
    final btDir = Directory(await _btDirectoryPath());
    if (await btDir.exists()) await btDir.delete(recursive: true);
  }

  Future<void> deleteTmpDirectory() async {
    final tmpDir = Directory(await _tempDirectoryPath());
    if (await tmpDir.exists()) await tmpDir.delete(recursive: true);
  }

  Future<Directory?> getDefaultDirectory() async {
    Directory? directory;
    if (Platform.isAndroid) {
      directory = Directory(
        "/storage/emulated/0/${dataDirName('/storage/emulated/0')}/",
      );
    } else {
      final dir = await _documentsDirectory();
      // The documents dir in iOS is already named "Mangayomi".
      // Appending "Mangayomi" to the documents dir would create
      // unnecessarily nested Mangayomi/Mangayomi/ folder.
      if (Platform.isIOS) return dir;
      directory = Directory(path.join(dir.path, dataDirName(dir.path)));
    }
    return directory;
  }

  Future<Directory?> getMpvDirectory() async {
    final defaultDirectory = await getDefaultDirectory();
    String dbDir = path.join(defaultDirectory!.path, 'mpv');
    // Was a raw create() that threw a PathAccessException (permission denied) at
    // the user when playing on a fresh install with no all-files access.
    // createDirectorySafely requests the permission on failure (so the user is
    // asked at play time instead of hitting a cryptic error) and never throws;
    // return null if the dir still couldn't be made so playback proceeds with
    // mpv defaults instead of erroring. See #740.
    await createDirectorySafely(dbDir);
    final dir = Directory(dbDir);
    return await dir.exists() ? dir : null;
  }

  Future<Directory> getExtensionServerDirectory() async {
    final defaultDirectory = await getDefaultDirectory();
    if (defaultDirectory == null) {
      throw StateError('The app storage directory is unavailable');
    }
    String dbDir = path.join(defaultDirectory.path, 'extension_server');
    await Directory(dbDir).create(recursive: true);
    return Directory(dbDir);
  }

  Future<Directory?> getBtDirectory() async {
    final dbDir = await _btDirectoryPath();
    await createDirectorySafely(dbDir);
    return Directory(dbDir);
  }

  Future<String> _btDirectoryPath() async {
    final defaultDirectory = await getDefaultDirectory();
    return path.join(defaultDirectory!.path, 'torrents');
  }

  Future<Directory?> getTmpDirectory() async {
    final tmpPath = await _tempDirectoryPath();
    await createDirectorySafely(tmpPath);
    return Directory(tmpPath);
  }

  Future<Directory> getCacheDirectory(String? imageCacheFolderName) async {
    final cacheImagesDirectory = path.join(
      (await getApplicationCacheDirectory()).path,
      imageCacheFolderName ?? 'cacheimagecover',
    );
    return Directory(cacheImagesDirectory);
  }

  Future<Directory> createCacheDirectory(String? imageCacheFolderName) async {
    final cachePath = await getCacheDirectory(imageCacheFolderName);
    await createDirectorySafely(cachePath.path);
    return cachePath;
  }

  Future<String> _tempDirectoryPath() async {
    final defaultDirectory = await getDirectory();
    return path.join(defaultDirectory!.path, 'tmp');
  }

  Future<Directory?> getIosBackupDirectory() async {
    final defaultDirectory = await getDefaultDirectory();
    String dbDir = path.join(defaultDirectory!.path, 'backup');
    await createDirectorySafely(dbDir);
    return Directory(dbDir);
  }

  Future<Directory?> getDirectory() async {
    Directory? directory;
    String dPath = "";
    try {
      final setting = settingsRepository.currentOrNull;
      dPath = setting?.downloadLocation ?? "";
    } catch (e) {
      if (kDebugMode) {
        debugPrint("Could not get downloadLocation from Isar settings: $e");
      }
    }
    if (Platform.isAndroid) {
      directory = Directory(
        dPath.isEmpty
            ? "/storage/emulated/0/${dataDirName('/storage/emulated/0')}/"
            : "$dPath/",
      );
    } else {
      final dir = await _documentsDirectory();
      final p = dPath.isEmpty ? dir.path : dPath;
      // The documents dir in iOS is already named "Mangayomi".
      // Appending "Mangayomi" to the documents dir would create
      // unnecessarily nested Mangayomi/Mangayomi/ folder.
      if (Platform.isIOS) return Directory(p);
      directory = Directory(path.join(p, dataDirName(p)));
    }
    return directory;
  }

  Future<Directory?> getMangaMainDirectory(Chapter chapter) async {
    final manga = chapter.manga.value!;
    final itemType = chapter.manga.value!.itemType;
    final itemTypePath = itemType == ItemType.manga
        ? "Manga"
        : itemType == ItemType.anime
        ? "Anime"
        : "Novel";
    final dir = await getDirectory();
    return Directory(
      path.join(
        dir!.path,
        'downloads',
        itemTypePath,
        '${manga.source} (${manga.lang!.toUpperCase()})',
        manga.name!.replaceForbiddenCharacters('_'),
      ),
    );
  }

  Future<Directory?> getMangaChapterDirectory(
    Chapter chapter, {
    Directory? mangaMainDirectory,
  }) async {
    final basedir = mangaMainDirectory ?? await getMangaMainDirectory(chapter);
    String scanlator = chapter.scanlator?.isNotEmpty ?? false
        ? "${chapter.scanlator!.replaceForbiddenCharacters('_')}_"
        : "";
    return Directory(
      path.join(
        basedir!.path,
        scanlator + chapter.name!.replaceForbiddenCharacters('_').trim(),
      ),
    );
  }

  Future<Directory?> getDatabaseDirectory() async {
    // On macOS, host the libmdbx / Isar database under Application Support
    // (app-private, not TCC-gated) instead of Documents. macOS denies
    // unsigned/sideloaded/dev builds access to ~/Documents when iCloud
    // "Desktop & Documents Folders" sync is enabled, surfacing as
    // `IsarError: Cannot open Environment: MdbxError (13): Permission denied`
    // and a black screen on launch. iOS keeps Documents so the DB remains
    // visible alongside backups via the Files app. Windows / Linux are
    // untouched — Documents is the conventional location there.
    final dir = Platform.isMacOS
        ? await getApplicationSupportDirectory()
        : await _documentsDirectory();
    String dbDir;
    if (Platform.isAndroid) return dir;
    if (Platform.isIOS) {
      // Put the database files inside /databases like on Windows, Linux
      // So they are not just in the app folders root dir
      dbDir = path.join(dir.path, 'databases');
    } else {
      dbDir = path.join(dir.path, dataDirName(dir.path), 'databases');
    }
    if (Platform.isMacOS) {
      await _migrateLegacyMacosDatabase(dbDir);
    }
    await createDirectorySafely(dbDir);
    return Directory(dbDir);
  }

  /// One-shot migration: if a pre-existing macOS user has their database
  /// under the legacy Documents path and the new Application Support path
  /// is empty, rename it across so library / history / progress are not
  /// silently reset. Subsequent launches skip this branch because the new
  /// path already exists.
  Future<void> _migrateLegacyMacosDatabase(String newDbDir) async {
    try {
      final docs = await getApplicationDocumentsDirectory();
      final legacyDir = Directory(
        path.join(docs.path, 'Mangayomi', 'databases'),
      );
      if (!await legacyDir.exists()) return;
      final newDir = Directory(newDbDir);
      if (await newDir.exists()) {
        // Only migrate when the new location is empty — never overwrite.
        final entries = await newDir.list(followLinks: false).take(1).toList();
        if (entries.isNotEmpty) return;
      }
      await Directory(path.dirname(newDbDir)).create(recursive: true);
      await legacyDir.rename(newDbDir);
      if (kDebugMode) {
        debugPrint(
          '[storage] Migrated macOS DB from ${legacyDir.path} to $newDbDir',
        );
      }
    } catch (e) {
      // Migration is best-effort. Falling back to a fresh DB is preferable
      // to crashing on launch — the user can manually move the legacy
      // ~/Documents/Mangayomi/databases/ contents if needed.
      if (kDebugMode) {
        debugPrint('[storage] macOS DB migration skipped: $e');
      }
    }
  }

  Future<Directory?> getGalleryDirectory() async {
    String gPath;
    if (Platform.isAndroid) {
      gPath = "/storage/emulated/0/Pictures/Yuri-Reader/";
    } else {
      gPath = path.join((await getDirectory())!.path, 'Pictures');
    }
    await createDirectorySafely(gPath);
    return Directory(gPath);
  }

  Future<void> createDirectorySafely(String dirPath) async {
    final dir = Directory(dirPath);
    try {
      await dir.create(recursive: true);
    } catch (_) {
      if (await requestPermission()) {
        try {
          await dir.create(recursive: true);
        } catch (e) {
          if (kDebugMode) {
            debugPrint('Initial directory creation failed for $dirPath: $e');
          }
        }
      } else {
        if (kDebugMode) {
          debugPrint('Permission denied. Cannot create: $dirPath');
        }
      }
    }
  }

  Future<Isar> initDB(String? path, {bool inspector = false}) async {
    Directory? dir;
    if (path == null) {
      dir = await getDatabaseDirectory();
    } else {
      dir = Directory(path);
    }

    final isar = await Isar.open(
      dbSchemas,
      directory: dir!.path,
      name: "mangayomiDb",
      inspector: inspector,
    );
    try {
      final settings = await isar.settings.get(227);
      if (settings == null) {
        // TV defaults to dark on first run (a fresh library). Only the
        // initial Settings row is seeded, so switching to light later sticks.
        await isar.writeTxn(
          () async => isar.settings.put(Settings()..themeIsDark = isTv),
        );
      }
    } catch (_) {
      if (await requestPermission()) {
        try {
          final settings = await isar.settings.get(227);
          if (settings == null) {
            // TV defaults to dark on first run (a fresh library). Only the
            // initial Settings row is seeded, so switching to light later sticks.
            await isar.writeTxn(
              () async => isar.settings.put(Settings()..themeIsDark = isTv),
            );
          }
        } catch (e) {
          if (kDebugMode) {
            debugPrint("Failed after retry with permission: $e");
          }
        }
      } else {
        if (kDebugMode) {
          debugPrint("Permission denied during Database init fallback.");
        }
      }
    }

    final prefs = await isar.trackPreferences
        .filter()
        .syncIdIsNotNull()
        .findAll();
    if (prefs.isNotEmpty) {
      await isar.writeTxn(
        () => isar.trackPreferences.putAll([
          for (final pref in prefs) pref..refreshing = true,
        ]),
      );
    }

    final customButton = await isar.customButtons
        .filter()
        .idIsNotNull()
        .findFirst();
    if (customButton == null) {
      await isar.writeTxn(
        () => isar.customButtons.put(
          CustomButton(
            title: "+85 s",
            codePress: """local intro_length = mp.get_property_native("user-data/current-anime/intro-length")
aniyomi.right_seek_by(intro_length)""",
            codeLongPress: """aniyomi.int_picker("Change intro length", "%ds", 0, 255, 1, "user-data/current-anime/intro-length")""",
            codeStartup: """function update_button(_, length)
  if length ~= nil then
    if length == 0 then
	  aniyomi.hide_button()
	  return
	else
	  aniyomi.show_button()
	end
    aniyomi.set_button_title("+" .. length .. " s")
  end
end

if \$isPrimary then
  mp.observe_property("user-data/current-anime/intro-length", "number", update_button)
end""",
            isFavourite: true,
            pos: 0,
          ),
        ),
      );
    }

    return isar;
  }
}
