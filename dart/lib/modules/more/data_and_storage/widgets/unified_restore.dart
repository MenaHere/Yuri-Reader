import 'dart:convert';
import 'dart:io';

import 'package:archive/archive_io.dart';
import 'package:bot_toast/bot_toast.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart' as p;
import 'package:yuri_reader/eval/model/m_bridge.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/modules/more/data_and_storage/mangayomi_import.dart';
import 'package:yuri_reader/modules/more/data_and_storage/providers/backup_decoder.dart';
import 'package:yuri_reader/modules/more/data_and_storage/providers/backup_format.dart';
import 'package:yuri_reader/modules/more/data_and_storage/providers/pre_import_backup.dart';
import 'package:yuri_reader/modules/more/data_and_storage/providers/restore.dart';
import 'package:yuri_reader/modules/more/data_and_storage/widgets/rollback_last_change_tile.dart';
import 'package:yuri_reader/modules/more/settings/sync/providers/sync_providers.dart';
import 'package:yuri_reader/modules/more/widgets/dialog_actions.dart';
import 'package:yuri_reader/providers/l10n_providers.dart';
import 'package:yuri_reader/utils/constant.dart';
import 'package:yuri_reader/utils/extensions/build_context_extensions.dart';

/// Whether there's a sync server configured to ask about (regardless of
/// whether sync is currently on or off) and, if so, whether it's on.
(bool hasServer, bool syncOn) _syncState(WidgetRef ref) {
  final syncPreference = ref.read(synchingProvider(syncId: 1));
  final hasServer =
      (syncPreference.authToken?.isNotEmpty ?? false) &&
      (syncPreference.server?.isNotEmpty ?? false);
  return (hasServer, syncPreference.syncOn);
}

/// Runs the restore flow and reports whether anything was actually restored.
///
/// False covers every way out that leaves the app as it was: no file chosen,
/// a confirmation declined, a conflict sheet dismissed. Callers that act on
/// the result, like the first-run screen, need to tell that apart from a
/// restore that went through.
Future<bool> performRestore(BuildContext context, WidgetRef ref) async {
  String? safetyBackupPath;
  try {
    final file = await FilePicker.pickFile(
      linuxOptions: const LinuxOptions(lockParentWindow: true),
    );
    if (file?.path == null || !context.mounted) return false;
    final path = file!.path!;
    // A successful restore pushes to the sync server automatically, so a
    // wrong backup here could overwrite good server data — ask first.
    final (hasServer, syncOn) = _syncState(ref);

    final backupType = peekBackupType(path);
    final isMihonFamily =
        backupType == BackupType.mihon ||
        backupType == BackupType.aniyomi ||
        backupType == BackupType.neko;

    if (backupType == BackupType.mangayomi) {
      await _performMangayomiRestore(context, ref, path);
      return true;
    }

    if (!isMihonFamily) {
      if (!context.mounted) return false;
      final confirmed = await _confirmPlainRestore(context);
      if (confirmed != true || !context.mounted) return false;
      bool? syncAfterRestore;
      if (hasServer) {
        if (!context.mounted) return false;
        syncAfterRestore = await confirmSyncAfterRestore(
          context,
          syncOn: syncOn,
        );
        if (!context.mounted) return false;
      }
      showBusyDialog(context, context.l10n.restoring_backup);
      try {
        await ref.watch(
          doRestoreProvider(
            path: path,
            context: context,
            syncAfterRestore: syncAfterRestore,
          ).future,
        );
      } finally {
        if (context.mounted) hideBusyDialog(context);
      }
      return true;
    }

    final l10n = context.l10n;
    final preview = previewTachiBkImport(path);
    if (preview == null) {
      botToast("Unsupported or unrecognized backup file.");
      return false;
    }

    if (!context.mounted) return false;
    final keepExisting = await _chooseImportMode(
      context,
      title: 'Restore backup into YuriReader',
      sourceLabel: 'this backup',
    );
    if (keepExisting == null || !context.mounted) return false;

    var categoryDecisions = const <String, bool>{};
    var sourceDecisions = const <String, int>{};

    if (keepExisting && preview.conflictingCategories.isNotEmpty) {
      if (!context.mounted) return false;
      final decisions = await _resolveCategoryConflicts(
        context,
        preview.conflictingCategories,
      );
      if (decisions == null || !context.mounted) return false;
      categoryDecisions = decisions;
    }

    if (preview.unmatchedSourceNames.isNotEmpty) {
      if (!context.mounted) return false;
      final decisions = await _resolveSourceConflicts(
        context,
        preview.unmatchedSourceNames,
      );
      if (decisions == null || !context.mounted) return false;
      sourceDecisions = decisions;
    }

    if (!context.mounted) return false;
    final proceed = keepExisting
        ? await _confirmImportSummary(context, preview)
        : await _confirmReplaceSummary(context, preview);
    if (proceed != true || !context.mounted) return false;

    bool? syncAfterRestore;
    if (hasServer) {
      if (!context.mounted) return false;
      syncAfterRestore = await confirmSyncAfterRestore(context, syncOn: syncOn);
      if (!context.mounted) return false;
    }

    final resultDescription = keepExisting
        ? l10n.import_result_message(
            preview.newSeriesCount,
            preview.updatedSeriesCount,
            preview.newChapterCount,
          )
        : l10n.replace_result_message(
            preview.newSeriesCount + preview.updatedSeriesCount,
          );

    if (!context.mounted) return false;
    showBusyDialog(context, l10n.restoring_backup);
    try {
      try {
        safetyBackupPath = await createLibrarySafetyBackup();
        await writeLastLibrarySnapshot(
          LibrarySafetySnapshot(
            backupPath: safetyBackupPath,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            description: resultDescription,
          ),
        );
      } catch (e) {
        debugPrint('[Restore] could not write the safety snapshot: $e');
        safetyBackupPath = null;
      }

      // false, not a bare return: performRestore reports whether anything was
      // actually restored, so the first-run screen can tell a cancel from a
      // completed restore. ref.watch is upstream's.
      if (!context.mounted) return false;
      await ref.watch(
        doRestoreProvider(
          path: path,
          context: context,
          merge: keepExisting,
          categoryDecisions: categoryDecisions,
          sourceDecisions: sourceDecisions,
          syncAfterRestore: syncAfterRestore,
        ).future,
      );
    } finally {
      if (context.mounted) hideBusyDialog(context);
    }
    if (!context.mounted) return false;
    ref.invalidate(lastLibrarySnapshotProvider);

    _showImportResultToast(context, ref, resultDescription, safetyBackupPath);
    return true;
  } catch (e) {
    botToast("Error restoring backup: $e");
    if (safetyBackupPath != null && context.mounted) {
      offerLibraryRollback(context, ref, safetyBackupPath);
    }
    return false;
  }
}

/// Restores an already-decoded mangayomi-format backup map, e.g. one read
/// directly from an existing Mangayomi installation rather than picked from a
/// file. Reuses the same merge/replace choice, conflict resolution, summary
/// and safety backup as the file-picker path. Returns whether a restore
/// actually ran.
Future<bool> performMangayomiFolderImport(
  BuildContext context,
  WidgetRef ref,
  Map<String, dynamic> backup,
) async {
  String? safetyBackupPath;
  File? temporary;
  try {
    // `doRestoreProvider` probes a path to classify the archive before it
    // looks at the pre-decoded map, so the map is written out as a real
    // mangayomi backup it can recognize.
    temporary = await _writeTempMangayomiBackup(backup);
    if (!context.mounted) return false;
    final l10n = context.l10n;
    final preview = previewMangayomiBackup(backup);

    final keepExisting = await _chooseImportMode(
      context,
      title: 'Import Mangayomi library into YuriReader',
      sourceLabel: 'the Mangayomi library',
    );
    if (keepExisting == null || !context.mounted) return false;

    var categoryDecisions = const <String, bool>{};
    var sourceDecisions = const <String, int>{};

    if (keepExisting && preview.conflictingCategories.isNotEmpty) {
      if (!context.mounted) return false;
      final decisions = await _resolveCategoryConflicts(
        context,
        preview.conflictingCategories,
      );
      if (decisions == null || !context.mounted) return false;
      categoryDecisions = decisions;
    }

    if (preview.unmatchedSourceNames.isNotEmpty) {
      if (!context.mounted) return false;
      final decisions = await _resolveSourceConflicts(
        context,
        preview.unmatchedSourceNames,
      );
      if (decisions == null || !context.mounted) return false;
      sourceDecisions = decisions;
    }

    if (!context.mounted) return false;
    final proceed = keepExisting
        ? await _confirmImportSummary(context, preview)
        : await _confirmReplaceSummary(context, preview);
    if (proceed != true || !context.mounted) return false;

    final resultDescription = keepExisting
        ? l10n.import_result_message(
            preview.newSeriesCount,
            preview.updatedSeriesCount,
            preview.newChapterCount,
          )
        : l10n.replace_result_message(
            preview.newSeriesCount + preview.updatedSeriesCount,
          );

    if (!context.mounted) return false;
    showBusyDialog(context, l10n.restoring_backup);
    try {
      try {
        safetyBackupPath = await createLibrarySafetyBackup();
        await writeLastLibrarySnapshot(
          LibrarySafetySnapshot(
            backupPath: safetyBackupPath,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            description: resultDescription,
          ),
        );
      } catch (e) {
        debugPrint('[MangayomiImport] safety backup skipped: $e');
        safetyBackupPath = null;
      }

      if (!context.mounted) return false;
      await ref.watch(
        doRestoreProvider(
          path: temporary.path,
          context: context,
          merge: keepExisting,
          categoryDecisions: categoryDecisions,
          sourceDecisions: sourceDecisions,
          decodedMangayomiBackup: backup,
        ).future,
      );
      // Self-contained Extension Server: copy the Mangayomi bundle into this
      // data folder and repoint the imported paths at the copy.
      if (context.mounted) await relocateExtensionServerBundle();
    } finally {
      if (context.mounted) hideBusyDialog(context);
    }
    if (!context.mounted) return false;
    ref.invalidate(lastLibrarySnapshotProvider);

    _showImportResultToast(context, ref, resultDescription, safetyBackupPath);
    return true;
  } catch (e, s) {
    debugPrint('[MangayomiImport] folder import failed: $e\n$s');
    if (context.mounted) botToast('Error importing from Mangayomi: $e');
    if (safetyBackupPath != null && context.mounted) {
      offerLibraryRollback(context, ref, safetyBackupPath);
    }
    return false;
  } finally {
    final parent = temporary?.parent;
    if (parent != null) {
      try {
        if (await parent.exists()) await parent.delete(recursive: true);
      } catch (e) {
        debugPrint('[MangayomiImport] could not delete the temp backup: $e');
      }
    }
  }
}

/// Writes a decoded mangayomi-format map out as a real `.backup` zip, only so
/// `doRestoreProvider`'s probe can classify it. File names are not encrypted,
/// so the probe never needs a password.
Future<File> _writeTempMangayomiBackup(Map<String, dynamic> backup) async {
  final dir = await Directory.systemTemp.createTemp('yuri_folder_import_');
  final jsonFile = File(p.join(dir.path, 'mangayomi_import.backup.db'));
  await jsonFile.writeAsString(jsonEncode(backup));
  final zipPath = p.join(dir.path, 'mangayomi_import.backup');
  final encoder = ZipFileEncoder();
  encoder.create(zipPath);
  await encoder.addFile(jsonFile);
  await encoder.close();
  await jsonFile.delete();
  return File(zipPath);
}

/// Native mangayomi-format restore, with the same merge/replace choice and
/// category/source conflict resolution the Mihon-family path already has -
/// the dialogs below are shared with it, not duplicated.
Future<void> _performMangayomiRestore(
  BuildContext context,
  WidgetRef ref,
  String path,
) async {
  String? safetyBackupPath;
  try {
    final Map<String, dynamic> backup;
    try {
      backup = await decodeMangayomiBackup(path, context);
    } catch (e) {
      if (context.mounted) botToast("$e");
      return;
    }
    if (!context.mounted) return;
    final l10n = context.l10n;
    final preview = previewMangayomiBackup(backup);

    final keepExisting = await _chooseImportMode(
      context,
      title: 'Restore Mangayomi backup into YuriReader',
      sourceLabel: 'this Mangayomi backup',
    );
    if (keepExisting == null || !context.mounted) return;

    var categoryDecisions = const <String, bool>{};
    var sourceDecisions = const <String, int>{};

    if (keepExisting && preview.conflictingCategories.isNotEmpty) {
      if (!context.mounted) return;
      final decisions = await _resolveCategoryConflicts(
        context,
        preview.conflictingCategories,
      );
      if (decisions == null || !context.mounted) return;
      categoryDecisions = decisions;
    }

    if (preview.unmatchedSourceNames.isNotEmpty) {
      if (!context.mounted) return;
      final decisions = await _resolveSourceConflicts(
        context,
        preview.unmatchedSourceNames,
      );
      if (decisions == null || !context.mounted) return;
      sourceDecisions = decisions;
    }

    if (!context.mounted) return;
    final proceed = keepExisting
        ? await _confirmImportSummary(context, preview)
        : await _confirmReplaceSummary(context, preview);
    if (proceed != true || !context.mounted) return;

    final resultDescription = keepExisting
        ? l10n.import_result_message(
            preview.newSeriesCount,
            preview.updatedSeriesCount,
            preview.newChapterCount,
          )
        : l10n.replace_result_message(
            preview.newSeriesCount + preview.updatedSeriesCount,
          );

    if (!context.mounted) return;
    showBusyDialog(context, l10n.restoring_backup);
    try {
      try {
        safetyBackupPath = await createLibrarySafetyBackup();
        await writeLastLibrarySnapshot(
          LibrarySafetySnapshot(
            backupPath: safetyBackupPath,
            createdAt: DateTime.now().millisecondsSinceEpoch,
            description: resultDescription,
          ),
        );
      } catch (e) {
        debugPrint('[Restore] could not write the safety snapshot: $e');
        safetyBackupPath = null;
      }

      if (!context.mounted) return;
      await ref.watch(
        doRestoreProvider(
          path: path,
          context: context,
          merge: keepExisting,
          categoryDecisions: categoryDecisions,
          sourceDecisions: sourceDecisions,
          decodedMangayomiBackup: backup,
        ).future,
      );
    } finally {
      if (context.mounted) hideBusyDialog(context);
    }
    if (!context.mounted) return;
    ref.invalidate(lastLibrarySnapshotProvider);

    _showImportResultToast(context, ref, resultDescription, safetyBackupPath);
  } catch (e) {
    botToast("Error restoring backup: $e");
    if (safetyBackupPath != null && context.mounted) {
      offerLibraryRollback(context, ref, safetyBackupPath);
    }
  }
}

Future<bool?> _confirmPlainRestore(BuildContext context) {
  final l10n = context.l10n;
  return showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(l10n.restore_backup),
        content: Row(
          children: [
            Icon(Icons.info_outline_rounded, color: context.secondaryColor),
            const SizedBox(width: 8),
            Expanded(child: Text(l10n.restore_backup_warning_title)),
          ],
        ),
        actions: dialogCancelConfirmActions(
          dialogContext: dialogContext,
          confirmLabel: l10n.ok,
        ),
      );
    },
  );
}

/// Asks how an incoming library should be applied. Both choices name the
/// source and the destination, because a bare "this" left the user guessing
/// what was being imported and what "Replace" would replace.
Future<bool?> _chooseImportMode(
  BuildContext context, {
  required String title,
  required String sourceLabel,
}) {
  return showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 8,
          children: [
            ListTile(
              leading: const Icon(Icons.merge_type_rounded),
              title: Text('Merge $sourceLabel into YuriReader'),
              subtitle: Text(
                'Adds the imported series into YuriReader and updates matching '
                'ones. Nothing already in YuriReader is removed.',
                style: TextStyle(fontSize: 11, color: context.secondaryColor),
              ),
              onTap: () => Navigator.pop(dialogContext, true),
            ),
            ListTile(
              leading: const Icon(
                Icons.delete_sweep_outlined,
                color: Colors.red,
              ),
              title: Text(
                'Replace YuriReader library with $sourceLabel',
                style: const TextStyle(color: Colors.red),
              ),
              subtitle: Text(
                'Deletes everything in YuriReader, then adds the imported '
                'series.',
                style: TextStyle(fontSize: 11, color: context.secondaryColor),
              ),
              onTap: () => Navigator.pop(dialogContext, false),
            ),
          ],
        ),
        actions: dialogCancelOnlyAction(dialogContext),
      );
    },
  );
}

Future<Map<String, bool>?> _resolveCategoryConflicts(
  BuildContext context,
  List<String> conflicts,
) async {
  final l10n = context.l10n;
  final decisions = {for (final name in conflicts) name: true};
  return showDialog<Map<String, bool>>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (dialogContext, setState) {
          return AlertDialog(
            title: Text(l10n.category_conflict_title),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.category_conflict_message,
                    style: TextStyle(
                      fontSize: 12,
                      color: context.secondaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: conflicts
                          .map(
                            (name) => CheckboxListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(name),
                              subtitle: Text(
                                decisions[name]!
                                    ? l10n.category_conflict_keep
                                    : l10n.category_conflict_delete,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: context.secondaryColor,
                                ),
                              ),
                              value: decisions[name],
                              onChanged: (value) => setState(
                                () => decisions[name] = value ?? true,
                              ),
                            ),
                          )
                          .toList(),
                    ),
                  ),
                ],
              ),
            ),
            actions: dialogCancelConfirmActions(
              dialogContext: dialogContext,
              confirmLabel: l10n.ok,
              onCancel: () => Navigator.pop(dialogContext, null),
              onConfirm: () => Navigator.pop(dialogContext, decisions),
            ),
          );
        },
      );
    },
  );
}

Future<Map<String, int>?> _resolveSourceConflicts(
  BuildContext context,
  Map<String, ItemType> unmatched,
) async {
  final l10n = context.l10n;
  final selections = <String, int?>{
    for (final name in unmatched.keys) name: null,
  };
  return showDialog<Map<String, int>>(
    context: context,
    builder: (dialogContext) {
      return StatefulBuilder(
        builder: (dialogContext, setState) {
          return AlertDialog(
            title: Text(l10n.source_conflict_title),
            content: SizedBox(
              width: double.maxFinite,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    l10n.source_conflict_message,
                    style: TextStyle(
                      fontSize: 12,
                      color: context.secondaryColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      children: unmatched.entries.map((entry) {
                        final name = entry.key;
                        final itemType = entry.value;
                        final options = installedSourcesFor(itemType);
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 6),
                          child: DropdownButtonFormField<int?>(
                            initialValue: selections[name],
                            isExpanded: true,
                            decoration: InputDecoration(
                              label: Text(
                                name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              isDense: true,
                              filled: true,
                              fillColor: Color.alphaBlend(
                                context.primaryColor.withValues(alpha: 0.05),
                                Theme.of(context).scaffoldBackgroundColor,
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 12,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: context.primaryColor.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: context.primaryColor.withValues(
                                    alpha: 0.2,
                                  ),
                                ),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: context.primaryColor,
                                  width: 2,
                                ),
                              ),
                            ),
                            items: [
                              DropdownMenuItem<int?>(
                                value: null,
                                child: Text(
                                  l10n.source_conflict_keep,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              ...options.map(
                                (s) => DropdownMenuItem<int?>(
                                  value: s.id,
                                  child: Text(
                                    "${s.name} (${s.lang})",
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ),
                            ],
                            onChanged: (value) =>
                                setState(() => selections[name] = value),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
            actions: dialogCancelConfirmActions(
              dialogContext: dialogContext,
              confirmLabel: l10n.ok,
              onCancel: () => Navigator.pop(dialogContext, null),
              onConfirm: () => Navigator.pop(dialogContext, {
                for (final e in selections.entries)
                  if (e.value != null) e.key: e.value!,
              }),
            ),
          );
        },
      );
    },
  );
}

Future<bool?> _confirmImportSummary(
  BuildContext context,
  TachiBkImportPreview preview,
) {
  final l10n = context.l10n;
  return showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(l10n.import_summary_title),
        content: Text(
          l10n.import_summary_message(
            preview.newSeriesCount,
            preview.updatedSeriesCount,
            preview.newChapterCount,
          ),
        ),
        actions: dialogCancelConfirmActions(
          dialogContext: dialogContext,
          confirmLabel: l10n.import_summary_confirm,
        ),
      );
    },
  );
}

Future<bool?> _confirmReplaceSummary(
  BuildContext context,
  TachiBkImportPreview preview,
) {
  final l10n = context.l10n;
  final currentCount = currentFavoriteMangaCount();
  final backupCount = preview.newSeriesCount + preview.updatedSeriesCount;
  return showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: Text(l10n.replace_summary_title),
        content: Text(l10n.replace_summary_message(currentCount, backupCount)),
        actions: dialogCancelConfirmActions(
          dialogContext: dialogContext,
          confirmLabel: l10n.replace_summary_confirm,
          confirmColor: Colors.red,
        ),
      );
    },
  );
}

void _showImportResultToast(
  BuildContext context,
  WidgetRef ref,
  String resultDescription,
  String? safetyBackupPath,
) {
  final l10n = context.l10n;
  BotToast.showNotification(
    animationDuration: const Duration(milliseconds: 200),
    animationReverseDuration: const Duration(milliseconds: 200),
    duration: const Duration(seconds: 8),
    backButtonBehavior: BackButtonBehavior.none,
    leading: (_) => Image.asset(appIconAssets[1], height: 32),
    title: (_) => Text(
      resultDescription,
      style: const TextStyle(fontWeight: FontWeight.bold),
    ),
    trailing: safetyBackupPath == null
        ? null
        : (_) => UnconstrainedBox(
            alignment: Alignment.topLeft,
            child: TextButton(
              onPressed: () =>
                  offerLibraryRollback(context, ref, safetyBackupPath),
              child: Text(
                l10n.roll_back,
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
    enableSlideOff: true,
    onlyOne: true,
    crossPage: true,
  );
}
