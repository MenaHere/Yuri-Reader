import 'package:flutter/material.dart';
import 'package:yuri_reader/models/manga.dart';
import 'package:yuri_reader/models/track.dart';
import 'package:yuri_reader/providers/l10n_providers.dart';

const defaultUserAgent =
    "Mozilla/5.0 (Linux; Android 13; 22081212UG Build/TKQ1.220829.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/114.0.5735.131 Mobile Safari/537.36";

/// Used only for requests to AniList, imdbapi.dev, subtitle/watch-order services
/// NOT sent to installed sources. Those Cloudflare-protected APIs reject
/// non-browser UAs, and the user's configurable [defaultUserAgent]-derived
/// setting is tuned for source scraping, not guaranteed to pass Cloudflare's
/// checks. Fixed here intentionally; bump when it starts getting rejected.
const metadataApiUserAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

/// `icon-black.png`, `icon-red.png`, `icon.png`
const appIconAssets = [
  'assets/app_icons/icon-black.png',
  'assets/app_icons/icon-red.png',
  'assets/app_icons/icon.png',
];

/// `transparent.png`
const transparentAsset = 'assets/transparent.png';

String getMangaStatusName(Status status, BuildContext context) {
  final l10n = l10nLocalizations(context)!;
  return switch (status) {
    Status.ongoing => l10n.ongoing,
    Status.onHiatus => l10n.on_hiatus,
    Status.canceled => l10n.canceled,
    Status.completed => l10n.completed,
    Status.publishingFinished => l10n.publishing_finished,
    _ => l10n.unknown,
  };
}

IconData getMangaStatusIcon(Status status) {
  return switch (status) {
    Status.ongoing => Icons.schedule_rounded,
    Status.onHiatus => Icons.pause_circle_rounded,
    Status.canceled => Icons.cancel_rounded,
    Status.completed => Icons.done_all_outlined,
    Status.publishingFinished => Icons.done,
    _ => Icons.block_outlined,
  };
}

String getTrackStatus(TrackStatus status, BuildContext context) {
  final l10n = l10nLocalizations(context)!;
  return switch (status) {
    TrackStatus.watching => l10n.watching,
    TrackStatus.reWatching => l10n.re_watching,
    TrackStatus.planToWatch => l10n.plan_to_watch,
    TrackStatus.reading => l10n.reading,
    TrackStatus.completed => l10n.completed,
    TrackStatus.onHold => l10n.on_hold,
    TrackStatus.dropped => l10n.dropped,
    TrackStatus.planToRead => l10n.plan_to_read,
    TrackStatus.reReading => l10n.re_reading,
  };
}

TrackStatus toTrackStatus(TrackStatus status, ItemType itemType, int syncId) {
  return itemType == ItemType.anime && syncId == 2
      ? switch (status) {
          TrackStatus.reading => TrackStatus.watching,
          TrackStatus.planToRead => TrackStatus.planToWatch,
          TrackStatus.reReading => TrackStatus.reWatching,
          _ => status,
        }
      : status;
}

/// MAL-Sync's own web app: the anime/manga it is tracking, and its settings
/// (its nav bar has the gear). The app opens this page instead of drawing
/// MAL-Sync screens of its own, so the list and the settings are the ones
/// MAL-Sync maintains. `#/book/anime/1`, `#/book/manga/1` and `#/settings` are
/// the pages behind it.
const malsyncPwaUrl = 'https://malsync.moe/pwa/';

(String, String, Color) trackInfos(int id) {
  return switch (id) {
    1 => (
      "assets/trackers_icons/tracker_mal.webp",
      "MyAnimeList",
      const Color.fromRGBO(46, 81, 162, 1),
    ),
    2 => (
      "assets/trackers_icons/tracker_anilist.webp",
      "Anilist",
      const Color.fromRGBO(51, 37, 50, 1),
    ),
    3 => (
      "assets/trackers_icons/tracker_kitsu.webp",
      "Kitsu",
      const Color.fromRGBO(18, 25, 35, 1),
    ),
    4 => (
      "assets/trackers_icons/tracker_simkl.webp",
      "Simkl",
      const Color.fromRGBO(8, 8, 8, 1),
    ),
    5 => (
      "assets/trackers_icons/tracker_trakt.webp",
      "Trakt",
      const Color.fromRGBO(175, 54, 162, 1),
    ),
    6 => (
      // MAL-Sync is a tool, not one of the tracker services. It has no site of
      // its own, so it has no icon of its own either, and borrowing
      // MyAnimeList's would read as "another MAL" rather than "the sync
      // layer". The row draws a glyph instead, in a neutral colour: see
      // trackerIcon below.
      "",
      "MAL-Sync",
      const Color.fromRGBO(69, 90, 100, 1),
    ),
    _ => (
      "assets/trackers_icons/tracker_trakt.webp",
      "Trakt",
      const Color.fromRGBO(175, 54, 162, 1),
    ),
  };
}

/// The mark a tracker shows in a list: its own icon asset when it has one, a
/// drawn glyph when it does not. Lives here so every screen that lists a
/// tracker (tracking settings, the tracker library, manage trackers) draws it
/// the same way instead of each deciding for itself.
///
/// [size] is the drawn size of the glyph; [imageHeight] the height the icon
/// asset is drawn at, or null to let the asset fill the box it is in (the
/// manage-trackers grid does that).
Widget trackerIcon(int id, {double size = 30, double? imageHeight = 30}) {
  final iconPath = trackInfos(id).$1;
  if (iconPath.isEmpty) {
    return Icon(Icons.sync_alt, size: size, color: Colors.white);
  }
  return Image.asset(iconPath, height: imageHeight);
}

String toImgUrl(String url) {
  return url.isEmpty ? _emptyImg : url;
}

const _emptyImg =
    "https://upload.wikimedia.org/wikipedia/commons/1/12/White_background.png";
