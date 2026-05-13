import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/track_search.dart';

class TrackLibrarySection {
  String name;
  Future<List<TrackSearch>?> Function() func;
  ItemType itemType;
  int syncId;
  bool isSearch;

  TrackLibrarySection({
    required this.name,
    required this.func,
    required this.syncId,
    this.itemType = ItemType.manga,
    this.isSearch = false,
  });
}
