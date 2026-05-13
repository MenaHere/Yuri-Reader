import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/category.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'isar_providers.g.dart';

@riverpod
Stream<List<Category>> getMangaCategorieStream(
  Ref ref, {
  required ItemType itemType,
}) async* {
  yield* isar.categorys
      .filter()
      .idIsNotNull()
      .and()
      .forItemTypeEqualTo(itemType)
      .watch(fireImmediately: true);
}
