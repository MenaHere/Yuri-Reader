import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';

class YuriSyncSpawner {
  Process? _process;
  int? _port;

  Future<int> start() async {
    final binaryPath = await _getBinaryPath();

    _process = await Process.start(binaryPath, []);

    // Listen for READY:PORT message on stdout
    await for (final line
        in _process!.stdout.transform(utf8.decoder).transform(LineSplitter())) {
      final match = RegExp(r'^READY:(\d+)$').firstMatch(line);
      if (match != null) {
        _port = int.parse(match.group(1)!);
        return _port!;
      }
    }

    throw Exception('Yuri-Sync did not report ready');
  }

  Future<String> _getBinaryPath() async {
    if (Platform.isAndroid || Platform.isIOS) {
      final appDir = await getApplicationSupportDirectory();
      final binaryPath = '${appDir.path}/yuri-sync';

      if (!File(binaryPath).existsSync()) {
        // Extract from Flutter assets
        final byteData = await rootBundle.load('assets/yuri-sync/yuri-sync');
        final buffer = byteData.buffer.asUint8List();
        await File(binaryPath).writeAsBytes(buffer);
        await Process.run('chmod', ['+x', binaryPath]);
      }

      return binaryPath;
    }

    if (Platform.isWindows) {
      return '${File(Platform.resolvedExecutable).parent.path}/yuri-sync.exe';
    }

    // Linux / macOS
    final execDir = File(Platform.resolvedExecutable).parent.path;
    final binaryPath = '$execDir/yuri-sync';
    if (File(binaryPath).existsSync()) return binaryPath;

    // Debug fallback: flutter run puts the executable in build/linux/x64/debug/bundle/
    // but does not copy yuri-sync next to it. Check the flutter assets path.
    final assetBinary = '$execDir/data/flutter_assets/assets/yuri-sync/yuri-sync';
    if (File(assetBinary).existsSync()) return assetBinary;

    // Fallback for when binary is run from project root during development
    if (kDebugMode) {
      final projectDir = Directory.current.path;
      final debugBinary = '$projectDir/build/linux/x64/debug/bundle/yuri-sync';
      if (File(debugBinary).existsSync()) return debugBinary;
    }

    throw Exception('yuri-sync binary not found. Expected at $binaryPath or $assetBinary');
  }

  void stop() {
    _process?.kill();
    _process = null;
    _port = null;
  }

  int? get port => _port;
}
