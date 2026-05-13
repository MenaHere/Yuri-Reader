import 'dart:async';

import 'package:yuri_reader/services/yuri_sync/yuri_sync_client.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_spawner.dart';

/// Singleton service that manages the Yuri-Sync TCP process lifecycle.
///
/// The service is started lazily on first use. Call [ensureInitialized]
/// during app boot if you want eager startup.
class YuriSyncService {
  YuriSyncService._();
  static final YuriSyncService _instance = YuriSyncService._();
  factory YuriSyncService() => _instance;

  final YuriSyncSpawner _spawner = YuriSyncSpawner();
  YuriSyncClient? _client;
  bool _starting = false;
  final _initCompleter = Completer<void>();

  /// Whether the service is ready for JSON-RPC calls.
  bool get isReady => _client != null;

  /// Returns a future that completes once the service is initialized.
  Future<void> get initialized => _initCompleter.future;

  /// Start the binary, connect the TCP client, and return when ready.
  Future<void> ensureInitialized() async {
    if (_client != null) return;
    if (_starting) return _initCompleter.future;
    _starting = true;

    try {
      final port = await _spawner.start();
      _client = YuriSyncClient(port: port);
      await _client!.connect();
      _initCompleter.complete();
    } catch (e) {
      _starting = false;
      if (!_initCompleter.isCompleted) _initCompleter.completeError(e);
      rethrow;
    }
  }

  /// Internal JSON-RPC call. Auto-starts the service if needed.
  Future<Map<String, dynamic>> _call(String method, Map<String, dynamic> params) async {
    await ensureInitialized();
    return _client!.call(method, params);
  }

  // ------------------------------------------------------------------
  // Convenience wrappers
  // ------------------------------------------------------------------

  /// Forward an OAuth token to the sync service so MALSync providers
  /// can authenticate.
  Future<void> setAuthToken(String provider, String token, {String? refreshToken}) async {
    await _call('auth.exchange', {
      'provider': provider,
      'token': token,
      'refreshToken': refreshToken,
    });
  }

  /// Set an arbitrary settings key on the sync service.
  Future<void> setSetting(String key, dynamic value) async {
    await _call('settings.set', {'key': key, 'value': value});
  }

  /// Auto-track a title: search → get/add → set progress → sync.
  ///
  /// [type] should be `'manga'` or `'anime'`.
  /// [provider] is optional; omit to use the service default.
  Future<Map<String, dynamic>> trackAuto({
    required String title,
    required String type,
    int? chapter,
    int? episode,
    String? provider,
  }) async {
    final params = <String, dynamic>{
      'title': title,
      'type': type,
      'chapter': chapter,
      'episode': episode,
      'provider': provider,
    };
    final response = await _call('track.auto', params);
    if (response['error'] != null) {
      throw Exception('track.auto failed: ${response['error']['message']}');
    }
    return response['result'] as Map<String, dynamic>;
  }

  /// Update a specific entry by URL.
  Future<Map<String, dynamic>> entryUpdate({
    required String url,
    required String type,
    int? progress,
    int? status,
    int? score,
    String? provider,
  }) async {
    final params = <String, dynamic>{
      'url': url,
      'type': type,
      'progress': progress,
      'status': status,
      'score': score,
      'provider': provider,
    };
    final response = await _call('entry.update', params);
    if (response['error'] != null) {
      throw Exception('entry.update failed: ${response['error']['message']}');
    }
    return response['result'] as Map<String, dynamic>;
  }

  /// Shut down the sync binary and clean up.
  void dispose() {
    _client?.disconnect();
    _client = null;
    _spawner.stop();
  }
}
