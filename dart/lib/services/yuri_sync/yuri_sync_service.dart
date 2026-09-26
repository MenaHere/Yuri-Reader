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
  Completer<void>? _starting;

  /// Whether the service is ready for JSON-RPC calls.
  bool get isReady => _client != null;

  /// Returns a future that completes once the service is initialized, starting
  /// it if needed.
  Future<void> get initialized => ensureInitialized();

  /// Start the binary, connect the TCP client, and return when ready.
  Future<void> ensureInitialized() async {
    if (_client != null) return;
    final inFlight = _starting;
    if (inFlight != null) return inFlight.future;

    final starting = Completer<void>();
    _starting = starting;
    try {
      final port = await _spawner.start();
      final client = YuriSyncClient(port: port);
      await client.connect();
      _client = client;
      // A dead service cannot answer on that socket. Dropping the client when
      // it exits means the next call starts a fresh one, instead of writing
      // into a dead pipe and waiting for a reply that cannot come.
      unawaited(
        _spawner.exitCode.then((_) {
          if (identical(_client, client)) {
            client.disconnect();
            _client = null;
          }
        }),
      );
      starting.complete();
    } catch (error, stack) {
      // A failed start must not be permanent: the next call tries again, so
      // this future is not what callers keep looking at.
      starting.future.ignore();
      starting.completeError(error, stack);
      rethrow;
    } finally {
      _starting = null;
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
    int? volume,
    String? provider,
  }) async {
    final params = <String, dynamic>{
      'url': url,
      'type': type,
      'progress': progress,
      'status': status,
      'score': score,
      'volume': volume,
      'provider': provider,
    };
    final response = await _call('entry.update', params);
    if (response['error'] != null) {
      throw Exception('entry.update failed: ${response['error']['message']}');
    }
    return response['result'] as Map<String, dynamic>;
  }

  /// The tracked list for one provider, the same list the MAL-Sync app itself
  /// shows. [type] is `'manga'` or `'anime'`, [status] is malsync's numbering:
  /// 1 watching/reading, 2 completed, 3 on hold, 4 dropped, 6 plan to watch,
  /// 7 everything.
  Future<List<Map<String, dynamic>>> entryList({
    required String type,
    int status = 7,
    String? provider,
  }) async {
    final response = await _call('entry.list', {
      'type': type,
      'status': status,
      'provider': provider,
    });
    if (response['error'] != null) {
      throw Exception('entry.list failed: ${response['error']['message']}');
    }
    final result = response['result'] as Map<String, dynamic>;
    return (result['results'] as List).cast<Map<String, dynamic>>();
  }

  /// What the site itself says about an entry: description, score and
  /// popularity, other names, cast, related and recommended titles, reviews,
  /// and the details list. [url] is the entry's page on the provider.
  Future<Map<String, dynamic>> entryMeta({
    required String url,
    required String type,
    String? provider,
  }) async {
    final response = await _call('entry.meta', {
      'url': url,
      'type': type,
      'provider': provider,
    });
    if (response['error'] != null) {
      throw Exception('entry.meta failed: ${response['error']['message']}');
    }
    final result = response['result'] as Map<String, dynamic>;
    return result['meta'] as Map<String, dynamic>;
  }

  /// The entry a title currently matches, without changing the list.
  ///
  /// This is what a title's own page asks when it opens, so it can show that
  /// title's controls: it searches by title and reads, and never adds a status,
  /// a progress or an entry. Pass [url] for a match the user picked by hand;
  /// that one wins over a fresh title search. The reply carries the entry (or
  /// `found: false`), the rating the service shows and the option lists its own
  /// dropdowns use.
  Future<Map<String, dynamic>> entryFind({
    required String title,
    required String type,
    String? url,
    String? provider,
  }) async {
    final response = await _call('entry.find', {
      'title': title,
      'type': type,
      'url': url,
      'provider': provider,
    });
    if (response['error'] != null) {
      throw Exception('entry.find failed: ${response['error']['message']}');
    }
    return response['result'] as Map<String, dynamic>;
  }

  /// The service's own title search, which the correction panel offers: the
  /// same search the bridge uses to match a title, so the user can pick the
  /// entry the automatic match got wrong.
  Future<List<Map<String, dynamic>>> searchQuery({
    required String query,
    required String type,
  }) async {
    final response = await _call('search.query', {
      'query': query,
      'type': type,
    });
    if (response['error'] != null) {
      throw Exception('search.query failed: ${response['error']['message']}');
    }
    final result = response['result'] as Map<String, dynamic>;
    return (result['results'] as List).cast<Map<String, dynamic>>();
  }

  /// The settings the bridge holds. Credentials are left out.
  Future<Map<String, dynamic>> settingsList() async {
    final response = await _call('settings.list', {});
    if (response['error'] != null) {
      throw Exception('settings.list failed: ${response['error']['message']}');
    }
    final result = response['result'] as Map<String, dynamic>;
    return result['settings'] as Map<String, dynamic>;
  }

  /// Shut down the sync binary and clean up.
  void dispose() {
    _client?.disconnect();
    _client = null;
    _spawner.stop();
  }
}
