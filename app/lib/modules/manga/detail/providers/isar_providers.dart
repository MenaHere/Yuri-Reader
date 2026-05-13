import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/chapter.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
part 'isar_providers.g.dart';

@riverpod
Stream<Manga?> getMangaDetailStream(Ref ref, {required int mangaId}) async* {
  yield* isar.mangas.watchObject(mangaId, fireImmediately: true);
}

@riverpod
Stream<List<Chapter>> getChaptersStream(
  Ref ref, {
  required int mangaId,
}) async* {
  yield* isar.chapters
      .filter()
      .manga((q) => q.idEqualTo(mangaId))
      .watch(fireImmediately: true);
}
