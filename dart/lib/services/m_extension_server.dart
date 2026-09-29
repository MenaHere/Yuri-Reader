import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:m_extension_server/m_extension_server.dart';
import 'package:yuri_reader/modules/more/settings/browse/providers/browse_state_provider.dart';
import 'package:yuri_reader/repositories/settings_repository.dart';
import 'package:yuri_reader/utils/platform_utils.dart';

class MExtensionServerPlatform {
  static Future<void>? _iosStartOperation;
  static String? _iosActiveBaseUrl;
  // True once this app run has started (and verified) its own server. Any
  // server answering on the stored base URL before that is a leftover from a
  // previous run and must not be reused.
  static bool _serverStartedThisRun = false;

  WidgetRef ref;
  MExtensionServerPlatform(this.ref);

  Future<bool> check() => _check(_baseUrl);

  Future<bool> _check(String baseUrl) async {
    if (baseUrl == "http://127.0.0.1:0") return false;
    try {
      final res = await http.get(Uri.parse("$baseUrl/"));
      if (res.statusCode == 200) {
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<void> startServer({bool forceLocal = false}) {
    if (!Platform.isIOS) return _startServer();

    return _iosStartOperation ??=
        _startServer(
          baseUrl: forceLocal
              ? _iosActiveBaseUrl ?? 'http://127.0.0.1:0'
              : null,
        ).whenComplete(() {
          _iosStartOperation = null;
        });
  }

  Future<void> _startServer({String? baseUrl}) async {
    try {
      var isRunning = baseUrl == null ? await check() : await _check(baseUrl);
      if (isRunning && _serverStartedThisRun) {
        // Our own server from this run is already up; keep it.
        return;
      }
      if (isRunning) {
        // A server answering on the stored base URL that this run did not
        // start can only be a leftover from a previous run: the app never
        // keeps its server across runs, and reusing one is what breaks with a
        // broken pipe (it may belong to a different storage or session, or be
        // half-dead). Kill it and start our own below.
        await _killLeftoverServer(baseUrl ?? _baseUrl);
        isRunning = false;
      }
      if (!isRunning) {
        // Binding then immediately closing just to learn a free port number
        // is inherently racy: JVM startup takes real time, and on Windows
        // especially, another process can grab that exact port before our
        // server finishes binding to it. When that happens every request
        // silently goes to whatever unrelated service ended up on the port
        // instead - which has no idea what "/dalvik" means and answers with
        // something like a bare error, uniformly breaking every extension.
        // Verify the server that comes up is actually ours before trusting
        // the port, retrying with a fresh one a few times otherwise.
        String? localBaseUrl;
        for (var attempt = 0; attempt < 3 && localBaseUrl == null; attempt++) {
          final probe = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
          final port = probe.port;
          await probe.close();
          if (isDesktop) {
            final settings = settingsRepository.currentOrNull;
            final jrePath = settings?.jrePath;
            final serverJarPath = settings?.extensionServerPath;
            if ((jrePath?.isEmpty ?? true) ||
                (serverJarPath?.isEmpty ?? true)) {
              debugPrint(
                '[ExtensionServer] JRE or extension server JAR not configured. '
                'Please set them in Settings > Browse > Extension Server.',
              );
              return;
            }
            if (!await File(jrePath!).exists() ||
                !await File(serverJarPath!).exists()) {
              debugPrint(
                '[ExtensionServer] JRE or extension server JAR not found at '
                'configured paths. Please reconfigure in Settings > Browse > Extension Server.',
              );
              return;
            }
            await MExtensionServer().startServer(
              port,
              jvmPath: jrePath,
              serverJarPath: serverJarPath,
            );
          } else {
            await MExtensionServer().startServer(port);
          }
          final candidateUrl = "http://127.0.0.1:$port";
          if (await _isOurServer(candidateUrl)) {
            localBaseUrl = candidateUrl;
          } else {
            try {
              await MExtensionServer().stopServer();
            } catch (error) {
              debugPrint(
                '[ExtensionServer] could not stop the rejected server: $error',
              );
            }
          }
        }
        if (localBaseUrl == null) return;
        if (Platform.isIOS) _iosActiveBaseUrl = localBaseUrl;
        _serverStartedThisRun = true;
        ref.read(androidProxyServerStateProvider.notifier).set(localBaseUrl);
        debugPrint(
          '[ExtensionServerTrace] ${DateTime.now().toIso8601String()} '
          'server ready baseUrl=$localBaseUrl',
        );
      }
    } catch (e) {
      debugPrint('[ExtensionServer] Failed to start server: $e');
    }
  }

  /// Confirms [baseUrl] is actually our extension server rather than some
  /// other service that happened to be handed the same port, by polling for
  /// the "/capabilities" marker unique to it while the JVM finishes starting.
  Future<bool> _isOurServer(String baseUrl) async {
    for (var i = 0; i < 20; i++) {
      try {
        final res = await http
            .get(Uri.parse("$baseUrl/capabilities"))
            .timeout(const Duration(milliseconds: 500));
        if (res.statusCode == 200 &&
            res.body.contains('"mangayomiMihonBridge"')) {
          return true;
        }
      } catch (error) {
        debugPrint(
          '[ExtensionServer] probe $baseUrl attempt ${i + 1} failed: $error',
        );
      }
      await Future.delayed(const Duration(milliseconds: 250));
    }
    return false;
  }

  /// Kills a leftover extension server JVM from a previous run that is still
  /// listening on [baseUrl]'s port.
  ///
  /// The native plugin only knows the process it started itself, so a server
  /// left behind by an earlier run has to be found by its command line: it is
  /// the JVM whose arguments name the extension server jar and this port.
  Future<void> _killLeftoverServer(String baseUrl) async {
    if (!Platform.isLinux) return;
    final port = Uri.tryParse(baseUrl)?.port;
    if (port == null || port <= 0) return;
    try {
      final procDir = Directory('/proc');
      if (!await procDir.exists()) return;
      await for (final entry in procDir.list(followLinks: false)) {
        if (entry is! Directory) continue;
        final pid = int.tryParse(entry.path.split('/').last);
        if (pid == null) continue;
        try {
          final args = File(
            '${entry.path}/cmdline',
          ).readAsStringSync().split('\u0000');
          final isExtensionServer = args.any(
            (arg) => arg.contains('MExtensionServer'),
          );
          final isOnPort = args.any((arg) => arg == port.toString());
          if (isExtensionServer && isOnPort) {
            debugPrint(
              '[ExtensionServer] killing leftover server pid=$pid port=$port',
            );
            Process.killPid(pid);
          }
        } catch (error) {
          // A short-lived process can vanish between listing /proc and reading
          // its command line; that is not a failure worth reporting.
          if (error is! PathNotFoundException) {
            debugPrint(
              '[ExtensionServer] could not read pid $pid command line: $error',
            );
          }
        }
      }
    } catch (error) {
      debugPrint(
        '[ExtensionServer] could not scan for a leftover server: $error',
      );
    }
  }

  Future<void> stopServer() async {
    try {
      if (Platform.isIOS) await _iosStartOperation;
      await MExtensionServer().stopServer();
      if (Platform.isIOS) _iosActiveBaseUrl = null;
    } catch (error) {
      debugPrint('[ExtensionServer] could not stop the server: $error');
    }
  }

  Future<bool> checkLocalServer() async =>
      _iosActiveBaseUrl != null && await _check(_iosActiveBaseUrl!);

  String get _baseUrl => ref.watch(androidProxyServerStateProvider);
}
