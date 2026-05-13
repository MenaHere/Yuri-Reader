import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'state_provider.g.dart';

@riverpod
class MangaHomeDisplayTypeState extends _$MangaHomeDisplayTypeState {
  @override
  DisplayType build() {
    final settings = isar.settings.getSync(227)!;
    return settings.mangaHomeDisplayType;
  }

  void setMangaHomeDisplayType(DisplayType displayType) {
    final settings = isar.settings.getSync(227)!;

    state = displayType;

    isar.writeTxnSync(() {
      isar.settings.putSync(
        settings
          ..mangaHomeDisplayType = displayType
          ..updatedAt = DateTime.now().millisecondsSinceEpoch,
      );
    });
  }
}
