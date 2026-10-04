import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:yuri_reader/services/m_extension_server.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';

/// Asks the user to confirm a restart, then restarts the app so a changed data
/// directory takes effect. `exit(0)` skips `dispose()`, so both background
/// services are stopped first, mirroring the window-close path.
Future<bool> confirmAndRestart(
  BuildContext context,
  WidgetRef ref, {
  required String reason,
  Future<void> Function()? onConfirmed,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (dialogContext) {
      return AlertDialog(
        title: const Text('Restart required'),
        content: Text(reason),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Restart'),
          ),
        ],
      );
    },
  );
  if (confirmed != true) return false;

  // The data-directory change is applied only after the user confirms, so
  // cancelling the restart leaves the current folder untouched.
  if (onConfirmed != null) {
    try {
      await onConfirmed();
    } catch (e, s) {
      debugPrint('[AppRestart] could not apply the change: $e\n$s');
      return false;
    }
  }

  // exit(0) below skips dispose(), so both services have to be stopped here:
  // without it the extension server's JVM and the Yuri-Sync child survive the
  // app and the next run reuses a stale process.
  try {
    await MExtensionServerPlatform(ref).stopServer();
  } catch (e) {
    debugPrint('[AppRestart] could not stop the extension server: $e');
  }
  try {
    YuriSyncService().dispose();
  } catch (e) {
    debugPrint('[AppRestart] could not stop Yuri-Sync: $e');
  }

  if (Platform.isAndroid) {
    try {
      await const MethodChannel(
        'com.mena.yurireader.restart',
      ).invokeMethod('restartApp');
    } catch (e) {
      debugPrint('[AppRestart] native restart failed: $e');
    }
    return true;
  }

  if (Platform.isLinux || Platform.isWindows || Platform.isMacOS) {
    try {
      await Process.start(
        Platform.resolvedExecutable,
        const [],
        mode: ProcessStartMode.detached,
      );
    } catch (e) {
      debugPrint('[AppRestart] could not relaunch the app: $e');
    }
    exit(0);
  }
  // iOS gives an app no way to relaunch itself. The choice is persisted, so it
  // applies on the next cold start.
  debugPrint('[AppRestart] restart is not supported on this platform');
  return true;
}
