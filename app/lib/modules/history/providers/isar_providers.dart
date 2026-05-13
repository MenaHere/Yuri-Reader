import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/update.dart';
import 'package:yuri_reader/models/history.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'isar_providers.g.dart';

@riverpod
Stream<List<History>> getAllHistoryStream(
  Ref ref, {
  required ItemType itemType,
  String search = "",
}) async* {
  yield* isar.historys
      .filter()
      .idIsNotNull()
      .and()
      .chapter((q) => q.manga((q) => q.itemTypeEqualTo(itemType)))
      .and()
      .chapter(
        (q) => q.manga((q) => q.nameContains(search, caseSensitive: false)),
      )
      .watch(fireImmediately: true);
}

@riverpod
Stream<List<Update>> getAllUpdateStream(
  Ref ref, {
  required ItemType itemType,
  String search = "",
}) async* {
  yield* isar.updates
      .filter()
      .idIsNotNull()
      .and()
      .chapter((q) => q.manga((q) => q.itemTypeEqualTo(itemType)))
      .and()
      .chapter(
        (q) => q.manga((q) => q.nameContains(search, caseSensitive: false)),
      )
      .watch(fireImmediately: true);
}
