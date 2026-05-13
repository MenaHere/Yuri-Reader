import 'package:archive/archive.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'backup_compression.g.dart';

@riverpod
class BackupCompressionLevel extends _$BackupCompressionLevel {
  @override
  int build() {
    return isar.settings.getSync(227)?.backupCompressionLevel ??
        DeflateLevel.defaultCompression;
  }

  void update(int value) => state = value;

  Future<void> set(int value) async {
    state = value;
    final settings = isar.settings.getSync(227);
    if (settings == null) return;

    settings.backupCompressionLevel = value;

    await isar.writeTxn(() async {
      await isar.settings.put(settings);
    });
  }
}
