import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/settings.dart';
import 'package:yuri_reader/models/source.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'extensions_provider.g.dart';

@riverpod
Stream<List<Source>> getExtensionsStream(Ref ref, ItemType itemType) async* {
  yield* isar.sources
      .filter()
      .idIsNotNull()
      .and()
      .group(
        (q) => q.repoIsNull().or().repo(
          (q) => q.hiddenIsNull().or().hiddenEqualTo(false),
        ),
      )
      .isActiveEqualTo(true)
      .itemTypeEqualTo(itemType)
      .watch(fireImmediately: true);
}
