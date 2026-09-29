import 'package:flutter_test/flutter_test.dart';
import 'package:yuri_reader/services/chapter_cache.dart';

void main() {
  group('process-local chapter image URLs', () {
    test('recognizes the Mihon image proxy on IPv4 loopback', () {
      expect(
        ChapterCache.isProcessLocalImageUrl(
          'http://127.0.0.1:44097/image/a-page-token',
        ),
        isTrue,
      );
    });

    test('recognizes loopback aliases but not ordinary source URLs', () {
      expect(
        ChapterCache.isProcessLocalImageUrl(
          'http://localhost:8080/image/a-page-token',
        ),
        isTrue,
      );
      expect(
        ChapterCache.isProcessLocalImageUrl(
          'http://[::1]:8080/image/a-page-token',
        ),
        isTrue,
      );
      expect(
        ChapterCache.isProcessLocalImageUrl(
          'https://dynasty-scans.com/images/page.webp',
        ),
        isFalse,
      );
      expect(
        ChapterCache.isProcessLocalImageUrl('http://127.0.0.1:44097/health'),
        isFalse,
      );
    });
  });
}
