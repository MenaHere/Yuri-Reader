import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/page.dart';
import 'package:yuri_reader/providers/storage_provider.dart';
import 'package:yuri_reader/utils/extensions/others.dart';

/// Disk cache for chapter page lists.
///
/// URLs returned by the Mihon bridge can point at its local image proxy, for
/// example `http://127.0.0.1:12345/image/<id>`. Both the port and IDs belong to
/// that extension-server process; after it restarts, the cached URLs refuse
/// connections. Cache stable source URLs, but fetch a fresh list for proxy URLs.
class ChapterCache {
  static final ChapterCache _instance = ChapterCache._internal();
  ChapterCache._internal();
  factory ChapterCache() => _instance;

  static const String cacheFolderName = 'chapter_disk_cache';

  @visibleForTesting
  Directory? customCacheDir;

  Future<Directory> _getCacheDirectory() async {
    if (customCacheDir != null) {
      if (!await customCacheDir!.exists()) {
        await customCacheDir!.create(recursive: true);
      }
      return customCacheDir!;
    }
    final dir = await StorageProvider().getCacheDirectory(cacheFolderName);
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  String getKey(Chapter chapter) => '${chapter.mangaId}_${chapter.url}';

  Future<File> _getCacheFile(Chapter chapter) async {
    final dir = await _getCacheDirectory();
    return File('${dir.path}/${keyToMd5(getKey(chapter))}.json');
  }

  // TODO: temp fix, awaiting upstream merge. The extension server's image
  // proxy URLs die with the process that issued them; upstream cached them to
  // disk anyway, so a list saved in an earlier run pointed at a dead address.
  /// A URL issued by the in-process Mihon image proxy is only valid for the
  /// server process that created its token. It must never survive in the disk
  /// page-list cache.
  @visibleForTesting
  static bool isProcessLocalImageUrl(String value) {
    final uri = Uri.tryParse(value);
    if (uri == null || !uri.hasAuthority) return false;
    final host = uri.host.toLowerCase();
    final loopback =
        host == '127.0.0.1' || host == 'localhost' || host == '::1';
    return loopback &&
        uri.pathSegments.length >= 2 &&
        uri.pathSegments.first == 'image';
  }

  Future<List<PageUrl>?> getPageListFromCache(Chapter chapter) async {
    try {
      final file = await _getCacheFile(chapter);
      if (!await file.exists()) return null;

      final content = await file.readAsString();
      if (content.isEmpty) return null;
      final dynamic decoded = jsonDecode(content);
      if (decoded is! Map<String, dynamic>) return null;
      final pagesRaw = decoded['pages'] as List?;
      if (pagesRaw == null || pagesRaw.isEmpty) return null;

      final pageUrls = <PageUrl>[];
      for (final item in pagesRaw) {
        if (item is Map<String, dynamic>) {
          final url = item['url'] as String? ?? '';
          final headers = (item['headers'] as Map?)?.cast<String, String>();
          pageUrls.add(PageUrl(url, headers: headers));
        } else if (item is String) {
          pageUrls.add(PageUrl(item));
        }
      }

      if (pageUrls.any((page) => isProcessLocalImageUrl(page.url))) {
        if (kDebugMode) {
          debugPrint(
            '[ChapterCache] discard process-local URLs '
            'chapter=${chapter.id} url=${chapter.url}',
          );
        }
        try {
          await file.delete();
        } catch (error) {
          debugPrint(
            '[ChapterCache] could not delete a stale page list: $error',
          );
        }
        return null;
      }

      return pageUrls.isNotEmpty ? pageUrls : null;
    } catch (error) {
      if (kDebugMode)
        debugPrint('ChapterCache.getPageListFromCache error: $error');
      return null;
    }
  }

  Future<void> putPageListToCache(Chapter chapter, List<PageUrl> pages) async {
    try {
      if (pages.isEmpty || pages.every((page) => page.url.isEmpty)) return;
      if (pages.any((page) => isProcessLocalImageUrl(page.url))) {
        if (kDebugMode) {
          debugPrint(
            '[ChapterCache] skip process-local URLs '
            'chapter=${chapter.id} url=${chapter.url}',
          );
        }
        return;
      }

      final file = await _getCacheFile(chapter);
      final data = {
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'chapterUrl': chapter.url,
        'pages': pages
            .map(
              (page) => {
                'url': page.url,
                if (page.headers != null) 'headers': page.headers,
              },
            )
            .toList(),
      };
      await file.writeAsString(jsonEncode(data), flush: true);
      await trimCache();
    } catch (error) {
      if (kDebugMode)
        debugPrint('ChapterCache.putPageListToCache error: $error');
    }
  }

  static const int maxCacheSizeBytes = 100 * 1024 * 1024;

  Future<void> remove(Chapter chapter) async {
    try {
      final file = await _getCacheFile(chapter);
      if (await file.exists()) await file.delete();
    } catch (error) {
      debugPrint('[ChapterCache] could not remove a page list: $error');
    }
  }

  Future<void> trimCache({int maxBytes = maxCacheSizeBytes}) async {
    try {
      final dir = await _getCacheDirectory();
      if (!await dir.exists()) return;
      final files = dir
          .listSync()
          .whereType<File>()
          .where((file) => file.path.endsWith('.json'))
          .toList();

      int currentSize = 0;
      final fileStats = <({File file, int size, DateTime modified})>[];
      for (final file in files) {
        try {
          final stat = file.statSync();
          currentSize += stat.size;
          fileStats.add((file: file, size: stat.size, modified: stat.modified));
        } catch (error) {
          debugPrint('[ChapterCache] could not stat a cache file: $error');
        }
      }
      if (currentSize <= maxBytes) return;
      fileStats.sort((a, b) => a.modified.compareTo(b.modified));
      for (final item in fileStats) {
        if (currentSize <= maxBytes) break;
        try {
          await item.file.delete();
          currentSize -= item.size;
        } catch (error) {
          debugPrint('[ChapterCache] could not evict a cache file: $error');
        }
      }
    } catch (error) {
      debugPrint('[ChapterCache] trim failed: $error');
    }
  }

  Future<int> clear() async {
    int deletedCount = 0;
    try {
      final dir = await _getCacheDirectory();
      if (await dir.exists()) {
        for (final entity in dir.listSync()) {
          if (entity is File && entity.path.endsWith('.json')) {
            try {
              await entity.delete();
              deletedCount++;
            } catch (error) {
              debugPrint(
                '[ChapterCache] could not delete a cache file: $error',
              );
            }
          }
        }
      }
    } catch (error) {
      debugPrint('[ChapterCache] clear failed: $error');
    }
    return deletedCount;
  }
}
