import 'dart:async';

import 'package:flutter/material.dart';
import 'package:isar_community/isar.dart';
import 'package:yuri_reader/main.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/modules/malsync/malsync_style.dart';
import 'package:yuri_reader/modules/tracker_library/tracker_library_screen.dart';
import 'package:yuri_reader/services/yuri_sync/yuri_sync_service.dart';
import 'package:yuri_reader/utils/cached_network.dart';

/// The malsync track row for a title, when it has one.
///
/// The bridge matches a title by searching for it every time; this row is where
/// a match the user picked by hand is kept, so the panel reads that same entry
/// back on the next visit.
Track? malSyncTrackForManga(int mangaId) => isar.tracks
    .filter()
    .mangaIdEqualTo(mangaId)
    .syncIdEqualTo(TrackerProviders.malsync.syncId)
    .findFirstSync();

/// Keeps [url] as the match for [manga], making the track row when the title
/// has none yet. This is what the correction panel writes when the automatic
/// match picked the wrong entry.
void setMalSyncMatch({
  required Manga manga,
  required String url,
  required String title,
}) {
  final isManga = manga.itemType != ItemType.anime;
  final existing = malSyncTrackForManga(manga.id!);
  final track =
      existing ??
      Track(
        score: 0,
        syncId: TrackerProviders.malsync.syncId,
        mediaId: 0,
        lastChapterRead: 0,
        totalChapter: 0,
        status: isManga ? TrackStatus.planToRead : TrackStatus.planToWatch,
        startedReadingDate: 0,
        finishedReadingDate: 0,
      );
  track
    ..mangaId = manga.id
    ..itemType = manga.itemType
    ..syncId = TrackerProviders.malsync.syncId
    ..title = title
    ..trackingUrl = url
    ..updatedAt = DateTime.now().millisecondsSinceEpoch;
  isar.writeTxnSync(() => isar.tracks.putSync(track));
}

/// malsync's own correction panel: the entry this title matched, and a search
/// to pick a different one when the match is wrong.
///
/// The automatic match is a title search, so it can land on the wrong title -
/// and a title the service lists under another name matches nothing at all.
/// Picking a result here is kept on the title's malsync row, and the panel on
/// the title's page reads it back.
Future<void> showMalSyncCorrection(
  BuildContext context, {
  required Manga manga,
}) async {
  final type = manga.itemType == ItemType.anime ? 'anime' : 'manga';
  await showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: MalSyncStyle.background(context),
    builder: (context) => Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: _MalSyncCorrection(manga: manga, type: type),
    ),
  );
}

class _MalSyncCorrection extends StatefulWidget {
  const _MalSyncCorrection({required this.manga, required this.type});

  final Manga manga;
  final String type;

  @override
  State<_MalSyncCorrection> createState() => _MalSyncCorrectionState();
}

class _MalSyncCorrectionState extends State<_MalSyncCorrection> {
  final TextEditingController _query = TextEditingController();
  Map<String, dynamic>? _current;
  List<Map<String, dynamic>> _results = const [];
  bool _loading = true;
  bool _searching = false;
  String? _error;

  String get _title => widget.manga.name ?? '';

  @override
  void initState() {
    super.initState();
    unawaited(_loadCurrent());
  }

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  /// The match in force, which is the hand-picked one when there is one.
  Future<void> _loadCurrent() async {
    try {
      final result = await YuriSyncService().entryFind(
        title: _title,
        type: widget.type,
        url: malSyncTrackForManga(widget.manga.id!)?.trackingUrl,
      );
      if (!mounted) return;
      setState(() {
        _loading = false;
        final entry = result['entry'];
        _current = result['found'] == true && entry is Map
            ? entry.cast<String, dynamic>()
            : null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst(RegExp(r'^Exception: '), '');
      });
    }
  }

  Future<void> _search() async {
    final query = _query.text.trim();
    if (query.length < 3 || _searching) return;
    setState(() {
      _searching = true;
      _error = null;
    });
    try {
      final results = await YuriSyncService().searchQuery(
        query: query,
        type: widget.type,
      );
      if (!mounted) return;
      setState(() {
        _searching = false;
        _results = results;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _searching = false;
        _error = e.toString().replaceFirst(RegExp(r'^Exception: '), '');
      });
    }
  }

  void _pick(Map<String, dynamic> result) {
    final url = '${result['url'] ?? ''}';
    if (url.isEmpty) return;
    setMalSyncMatch(
      manga: widget.manga,
      url: url,
      title: '${result['name'] ?? _title}',
    );
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(MalSyncStyle.spacerHalf),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'MAL-Sync',
                  style: TextStyle(
                    color: MalSyncStyle.text(context),
                    fontSize: MalSyncStyle.baseFontSize,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    Icons.close,
                    size: 20,
                    color: MalSyncStyle.lightText(context),
                  ),
                ),
              ],
            ),
            Text(
              'Matched',
              style: TextStyle(
                color: MalSyncStyle.lightText(context),
                fontSize: MalSyncStyle.smallText,
              ),
            ),
            const SizedBox(height: MalSyncStyle.labelRowGap),
            _currentMatch(context),
            const SizedBox(height: MalSyncStyle.spacerHalf),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _query,
                    onSubmitted: (_) => _search(),
                    style: TextStyle(
                      color: MalSyncStyle.text(context),
                      fontSize: MalSyncStyle.smallText,
                    ),
                    decoration: InputDecoration(
                      isDense: true,
                      hintText: 'Search the service',
                      hintStyle: TextStyle(
                        color: MalSyncStyle.lightText(context),
                        fontSize: MalSyncStyle.smallText,
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 10,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: MalSyncStyle.backdrop(context),
                          width: MalSyncStyle.controlBorderWidth,
                        ),
                        borderRadius: BorderRadius.circular(
                          MalSyncStyle.controlRadius,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: const BorderSide(
                          color: MalSyncStyle.primary,
                          width: MalSyncStyle.controlBorderWidth,
                        ),
                        borderRadius: BorderRadius.circular(
                          MalSyncStyle.controlRadius,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                TextButton(
                  onPressed: _searching ? null : _search,
                  child: const Text('Search'),
                ),
              ],
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  _error!,
                  style: TextStyle(color: MalSyncStyle.secondaryText(context)),
                ),
              ),
            if (_searching)
              const Padding(
                padding: EdgeInsets.only(top: 12),
                child: LinearProgressIndicator(minHeight: 2),
              ),
            if (_results.isNotEmpty)
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  padding: const EdgeInsets.only(top: 8),
                  itemCount: _results.length,
                  itemBuilder: (context, index) {
                    final result = _results[index];
                    return ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: SizedBox(
                        width: 36,
                        height: 52,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(3),
                          child: Image(
                            image: coverProvider('${result['image'] ?? ''}'),
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const SizedBox.shrink(),
                          ),
                        ),
                      ),
                      title: Text(
                        '${result['name'] ?? ''}',
                        style: TextStyle(
                          color: MalSyncStyle.text(context),
                          fontSize: MalSyncStyle.smallText,
                        ),
                      ),
                      subtitle: Text(
                        [
                          '${result['year'] ?? ''}',
                          '${result['media_type'] ?? ''}',
                        ].where((value) => value.isNotEmpty).join(' - '),
                        style: TextStyle(
                          color: MalSyncStyle.lightText(context),
                          fontSize: MalSyncStyle.tinyText,
                        ),
                      ),
                      onTap: () => _pick(result),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _currentMatch(BuildContext context) {
    if (_loading) {
      return Text(
        'Loading',
        style: TextStyle(
          color: MalSyncStyle.lightText(context),
          fontSize: MalSyncStyle.smallText,
        ),
      );
    }
    final entry = _current;
    if (entry == null) {
      return Text(
        'Nothing matched',
        style: TextStyle(
          color: MalSyncStyle.lightText(context),
          fontSize: MalSyncStyle.smallText,
        ),
      );
    }
    final progress = (entry['episode'] as num?)?.toInt() ?? 0;
    final total = (entry['totalEpisodes'] as num?)?.toInt() ?? 0;
    return Row(
      children: [
        SizedBox(
          width: 36,
          height: 52,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(3),
            child: Image(
              image: coverProvider('${entry['image'] ?? ''}'),
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => const SizedBox.shrink(),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${entry['title'] ?? ''}',
                style: TextStyle(
                  color: MalSyncStyle.text(context),
                  fontSize: MalSyncStyle.smallText,
                ),
              ),
              Text(
                'Chapter $progress${total > 0 ? ' / $total' : ''}',
                style: TextStyle(
                  color: MalSyncStyle.lightText(context),
                  fontSize: MalSyncStyle.tinyText,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
