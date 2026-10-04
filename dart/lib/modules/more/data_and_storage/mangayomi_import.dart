import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar_community/isar.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:yuri_reader/eval/model/m_bridge.dart';
import 'package:yuri_reader/eval/model/source_preference.dart';
import 'package:yuri_reader/main.dart' show isar;
import 'package:yuri_reader/models/category.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/custom_button.dart';
import 'package:yuri_reader/models/download.dart';
import 'package:yuri_reader/models/history.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:yuri_reader/models/source.dart';
import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/models/track_preference.dart';
import 'package:yuri_reader/models/update.dart';
import 'package:yuri_reader/modules/more/data_and_storage/widgets/unified_restore.dart';
import 'package:yuri_reader/providers/storage_provider.dart';
import 'package:yuri_reader/utils/app_restart.dart';

/// Name of the staged library snapshot written before a restart and consumed
/// on the next launch. Kept in the app-support directory, which is fixed for
/// the install and readable before any database opens.
const _pendingImportFileName = 'pending_mangayomi_import.backup';

/// Where the existing Mangayomi install keeps its data, or null on a platform
/// where it is not looked for (iOS, whose Documents dir is the app sandbox).
String? mangayomiSourcePath() {
  if (Platform.isIOS) return null;
  if (Platform.isAndroid) return '/storage/emulated/0/Mangayomi';
  final parent =
      StorageProvider.cachedDataParentPath ?? Platform.environment['HOME'];
  if (parent == null || parent.isEmpty) return null;
  return p.join(parent, 'Mangayomi');
}

/// Whether an existing Mangayomi data folder is present that can be imported.
bool mangayomiSourceExists() {
  final source = mangayomiSourcePath();
  return source != null && Directory(source).existsSync();
}

/// Whether the existing Mangayomi data folder has downloads to bring over.
bool mangayomiDownloadsExist() {
  final source = mangayomiSourcePath();
  if (source == null) return false;
  return const ['downloads', 'mpv', 'local'].any(
    (sub) => Directory(p.join(source, sub)).existsSync(),
  );
}

/// Builds the same map `writeMangayomiBackupZip` produces, from an already
/// open Isar environment. Used for the foreign Mangayomi database and for the
/// live one when it is itself the Mangayomi database.
Map<String, dynamic> _backupFromIsar(Isar db) {
  return <String, dynamic>{
    'version': '2',
    'manga': db.mangas
        .filter()
        .idIsNotNull()
        .favoriteEqualTo(true)
        .isLocalArchiveEqualTo(false)
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'categories': db.categorys
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'chapters': db.chapters
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'downloads': db.downloads
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'tracks': db.tracks
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'history': db.historys
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'updates': db.updates
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'settings': db.settings
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'extensions_preferences': db.sourcePreferences
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'trackPreferences': db.trackPreferences
        .filter()
        .syncIdIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'extensions': db.sources
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
    'customButtons': db.customButtons
        .filter()
        .idIsNotNull()
        .findAllSync()
        .map((e) => e.toJson())
        .toList(),
  };
}

/// Reads the library out of an existing Mangayomi install and restores it into
/// this app. Returns whether the restore went through.
Future<bool> importMangayomiLibrary(
  BuildContext context,
  WidgetRef ref,
) async {
  final source = mangayomiSourcePath();
  if (source == null || !Directory(source).existsSync()) {
    if (context.mounted) botToast('No Mangayomi data folder was found.');
    return false;
  }
  final dbFile = File(p.join(source, 'databases', 'mangayomiDb.isar'));
  if (!await dbFile.exists()) {
    if (context.mounted) {
      botToast('The Mangayomi data folder has no database to import.');
    }
    return false;
  }

  Map<String, dynamic>? backup;
  Isar? foreign;
  Directory? temp;
  try {
    // Isar will not open two environments with the same name, and the live
    // database is `mangayomiDb`, so the copy gets a distinct name.
    temp = await Directory.systemTemp.createTemp('yuri_mangayomi_import_');
    final copied = await dbFile.copy(
      p.join(temp.path, 'mangayomiImportDb.isar'),
    );
    final lock = File('${dbFile.path}-lck');
    if (await lock.exists()) {
      await lock.copy('${copied.path}-lck');
    }
    foreign = await Isar.open(
      StorageProvider.dbSchemas,
      directory: temp.path,
      name: 'mangayomiImportDb',
    );
    backup = _backupFromIsar(foreign);
  } catch (e, s) {
    debugPrint(
      '[MangayomiImport] could not read the Mangayomi database: $e\n$s',
    );
    if (context.mounted) {
      botToast(
        'Could not read the Mangayomi database. It may come from an '
        'incompatible version: $e',
      );
    }
    return false;
  } finally {
    if (foreign != null) {
      try {
        await foreign.close();
      } catch (e) {
        debugPrint('[MangayomiImport] could not close the source database: $e');
      }
    }
    if (temp != null) {
      try {
        await temp.delete(recursive: true);
      } catch (e) {
        debugPrint('[MangayomiImport] could not delete the temp database: $e');
      }
    }
  }

  if (!context.mounted) return false;
  return performMangayomiFolderImport(context, ref, backup);
}

/// Recursively merges the Mangayomi downloads, mpv and local folders into the
/// resolved data directory, skipping files already present.
Future<void> importMangayomiDownloads(
  BuildContext context,
  WidgetRef ref,
) async {
  final source = mangayomiSourcePath();
  final target = await StorageProvider().getDefaultDirectory();
  if (source == null || !Directory(source).existsSync() || target == null) {
    if (context.mounted) botToast('No Mangayomi folder to import from.');
    return;
  }

  var copied = 0;
  var skipped = 0;
  var failed = 0;
  for (final sub in const ['downloads', 'mpv', 'local']) {
    final sourceDir = Directory(p.join(source, sub));
    if (!await sourceDir.exists()) continue;
    final targetDir = Directory(p.join(target.path, sub));
    await for (final entity in sourceDir.list(
      recursive: true,
      followLinks: false,
    )) {
      if (entity is! File) continue;
      final relative = p.relative(entity.path, from: sourceDir.path);
      final destination = File(p.join(targetDir.path, relative));
      try {
        if (await destination.exists()) {
          skipped++;
          continue;
        }
        await destination.parent.create(recursive: true);
        await entity.copy(destination.path);
        copied++;
      } catch (e) {
        failed++;
        debugPrint('[MangayomiImport] could not copy ${entity.path}: $e');
      }
    }
  }
  debugPrint(
    '[MangayomiImport] downloads: copied $copied, skipped $skipped, '
    'failed $failed',
  );
  if (!context.mounted) return;
  botToast(
    failed == 0
        ? 'Downloads imported: $copied copied, $skipped already present.'
        : 'Downloads imported with $failed errors: $copied copied, '
              '$skipped already present.',
  );
}

/// Offers the downloads import after a successful library import. The design
/// is a button, not a checkbox: once declined there is no second chance here.
Future<void> promptImportMangayomiDownloads(
  BuildContext context,
  WidgetRef ref,
) async {
  if (!mangayomiDownloadsExist()) return;
  final accepted = await showDialog<bool>(
    context: context,
    // Only the buttons close this: an accidental tap outside must not throw the
    // offer away before the user can answer it.
    barrierDismissible: false,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Import downloads as well?'),
        content: const Text(
          'Mangayomi also holds downloaded chapters, mpv files and local '
          'files. Copy them into Yuri-Reader now?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Import downloads'),
          ),
        ],
      );
    },
  );
  if (accepted != true || !context.mounted) return;
  await importMangayomiDownloads(context, ref);
}

Future<File> _pendingImportFile() async {
  final support = await getApplicationSupportDirectory();
  return File(p.join(support.path, _pendingImportFileName));
}

/// Stages the live database for import on the next launch, writing to a temp
/// file first so a crash mid-write cannot leave a half-written snapshot.
Future<void> writePendingMangayomiImport(Map<String, dynamic> backup) async {
  final support = await getApplicationSupportDirectory();
  await Directory(support.path).create(recursive: true);
  final file = File(p.join(support.path, _pendingImportFileName));
  final temp = File('${file.path}.tmp');
  await temp.writeAsString(jsonEncode(backup));
  await temp.rename(file.path);
  debugPrint('[MangayomiImport] staged a pending library import at ${file.path}');
}

Future<Map<String, dynamic>?> readPendingMangayomiImport() async {
  final file = await _pendingImportFile();
  if (!await file.exists()) return null;
  try {
    final decoded = jsonDecode(await file.readAsString());
    if (decoded is Map<String, dynamic>) return decoded;
    debugPrint('[MangayomiImport] pending snapshot is not a JSON object');
    return null;
  } catch (e) {
    debugPrint('[MangayomiImport] could not read the pending snapshot: $e');
    return null;
  }
}

Future<void> clearPendingMangayomiImport() async {
  final file = await _pendingImportFile();
  try {
    if (await file.exists()) await file.delete();
  } catch (e) {
    debugPrint('[MangayomiImport] could not delete the pending snapshot: $e');
  }
}

/// Choice (a) of the first-run data-directory offer: import the live Mangayomi
/// database into a fresh Yuri-Reader folder. The live database is the
/// Mangayomi one, so it is snapshotted, the data directory is switched, and
/// the import runs after the restart. When already on Yuri-Reader the snapshot
/// is imported immediately.
Future<void> startOnboardingImportIntoYuriReader(
  BuildContext context,
  WidgetRef ref,
) async {
  try {
    await writePendingMangayomiImport(_backupFromIsar(isar));
  } catch (e, s) {
    debugPrint('[MangayomiImport] could not stage the library import: $e\n$s');
    if (context.mounted) botToast('Could not prepare the import: $e');
    return;
  }
  if (StorageProvider.dataDirLeaf != 'Yuri-Reader') {
    if (!context.mounted) return;
    final restarted = await confirmAndRestart(
      context,
      ref,
      reason:
          'Your library was prepared for import. Restarting now switches to '
          'the Yuri-Reader data folder and imports it.',
      onConfirmed: () async {
        StorageProvider.setDataDirectory('Yuri-Reader');
      },
    );
    // Cancelling leaves the current folder untouched; drop the staged snapshot
    // so it cannot trigger an import on the next cold start.
    if (!restarted) await clearPendingMangayomiImport();
    return;
  }
  if (!context.mounted) return;
  final pending = await readPendingMangayomiImport();
  if (pending == null || !context.mounted) return;
  final restored = await performMangayomiFolderImport(context, ref, pending);
  if (restored) await clearPendingMangayomiImport();
}
