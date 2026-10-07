# Yuri-Reader - Change Log

## Unreleased

### [2026-10-07]

#### Fixed
- The upstream sync no longer renames a pending `## Unreleased` section into a
  release; it records the sync under `## Unreleased` and releases only when the
  newest section is already a version. It also no longer drops its sync line
  into an old release

## Version 0.7.3+1

### [2026-10-07]

#### Bot
- Synced 14 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 0 commits from [malsync](https://github.com/MALSync/MALSync)

#### Fixed
- The scheduled upstream sync no longer rebuilds and republishes every platform
  when there are no upstream updates

## Version 0.7.3

### [2026-10-04]

#### Added
- Data directory is now `Yuri-Reader` on every platform that allows it (Android
  `/storage/emulated/0/Yuri-Reader/` and `Pictures/Yuri-Reader/`, desktop
  `<Documents>/Yuri-Reader`), persisted in a marker file in app support
- First run offers a three-way choice when an existing Mangayomi folder is
  found: import it into Yuri-Reader, keep running directly on the Mangayomi
  folder, or start fresh
- "Import from Mangayomi" and "Import downloads from Mangayomi" actions in
  More -> Data and storage; the downloads offer follows a successful library
  import
- A "Data directory" tile in Data and storage shows the resolved folder and
  switches between Yuri-Reader and Mangayomi, restarting after confirmation

#### Changed
- Onboarding and the startup gate now appear for existing installs that have
  not yet chosen a data directory
- Switching the data directory asks before restarting instead of closing the
  app silently

### [2026-10-04]

#### Fixed
- OAuth sign-in on mobile failed because the Dart redirect URI and callback
  scheme still used `mangayomi` while the Android/iOS/macOS configs register
  `yurireader`; the AniList and MyAnimeList logins now use the registered
  `yurireader` scheme
- The Android device, torrent-server and local-directory-access method
  channels still used `com.kodjodevf.mangayomi.*` while the composed Kotlin
  registers `com.mena.yurireader.*`, so the calls failed silently; the Dart
  callers now match
- Local libraries stored under the new `Yuri-Reader/local` data folder were not
  recognized: the library queries and the stored-path resolver now accept both
  `Yuri-Reader/local` and the legacy `Mangayomi/local`
- The Linux build warned that libavif headers were missing and shipped without
  AVIF decoding: the CI now installs `libavif-dev`, and the bundle copies the
  `dlopen`ed libavif (which is not in libmpv's closure) so AVIF chapter images
  decode
- Cancelling the data-directory restart still applied the new folder on the
  next launch: the folder is now changed only after the user confirms the
  restart, and a cancelled import drops its staged snapshot
- The first-run screen still titled itself "Welcome to Mangayomi" and offered a
  redundant "Import from Mangayomi" button beside the import choice; the title
  is now "Welcome to Yuri-Reader", the redundant button is gone, and the
  "Use Mangayomi settings directly" choice is hidden on Android, where the
  Mangayomi database is app-private
- The first-run screen only scrolled when the pointer was over the narrow
  middle column, and its card repeated the "Start fresh" action already offered
  by "Skip for now"; the scroll view now fills the width and the duplicate
  button is gone
- The "Import downloads as well?" and restart dialogs closed on a tap outside
  them, so an accidental tap threw the offer away; they now close only on their
  own buttons
- "Import into Yuri-Reader" left the restart dialog invisible and the app on an
  empty library: resolving the data-directory choice unmounted the first-run
  screen (and the Navigator that owns the dialog) before the dialog could be
  answered; the choice is now resolved only after the flow finishes
- The import dialog asked only "How should this be imported?", leaving "this"
  undefined; every choice now names the source and the destination
- Importing a Mangayomi library raised a spurious "Sources not found" prompt and
  left the imported series without a live source: the preview ignored the
  sources the backup carries, and a merge bound each manga to its source before
  those sources were restored
- The imported Extension Server (JRE + server JAR) and Android proxy server were
  dropped, because the restore kept the current device's empty values; both now
  come across with the rest of the settings
- The extension-server bundle is now copied into the Yuri-Reader data folder and
  the imported paths repointed at the copy, so the imported Extension Server no
  longer depends on the Mangayomi folder remaining
- Opening MAL-Sync threw a `Container` assertion and a large overflow: the
  Anime/Manga pill carried a negative margin, which Flutter rejects

#### Changed
- Discord Rich Presence self-labels now read "Yuri-Reader" and link to the
  fork instead of upstream

## Version 0.7.2

### [2026-10-03]

#### Changed
- The Flatpak now grants network and audio (`--share=network`,
  `--socket=pulseaudio`), so online features, font downloads and sound work
  instead of failing inside the sandbox

#### Fixed
- The More and About screens showed a solid black block where the app logo
  should be: the UI tints the logo to the theme colour, but the icon carried
  the cream square, so the tint filled it. The UI now uses a transparent-glyph
  variant of the ユ
- The Linux bundle and the Flatpak now carry every library the app needs that
  the Flatpak runtime lacks (libmpv, the codec stack, libjpeg, libXpresent,
  libxml2, ...) and none that it provides, so the app launches instead of dying
  on a missing library. The runtime's own library list drives the bundling, so a
  runtime update cannot leave a gap; the media_kit video plugin's stale build
  rpath is repointed too, so it finds the bundled libmpv

## Version 0.7.1

### [2026-10-03]

#### Fixed
- The Linux bundle and the Flatpak now ship `libmpv.so.2` and its codec stack.
  media_kit links libmpv at build time but a raw Flutter bundle omits it, so the
  app died at launch with "libmpv.so.2: cannot open shared object file" on any
  host without mpv installed

#### Changed
- The Flatpak remote file is `yurireader.flatpakrepo`; re-add the remote if you
  added an earlier URL

## Version 0.7.0

### [2026-10-03]

#### Added
- A new app icon: the katakana ユ in orange on cream, replacing the mangayomi
  icon on Android, Linux and the Flatpak. The Linux `.desktop` now resolves its
  icon (it asked for `yurireader` while the shipped files were `mangayomi`)
- A signed Android release: `android.yml` builds the release APK and attaches
  it to the release (needs the keystore secrets)
- A Flatpak remote: a signed GitHub Pages repository (`yurireader.flatpakrepo`)
  built from the Linux bundle with static deltas, drag-exif style

#### Changed
- The app id is now `com.mena.yurireader` (was `com.kodjodevf.yurireader`), so
  the Android application id, the Linux app id, the Kotlin package and the
  on-disk data path all move under `com.mena` - existing installs start fresh
- Releases are changelog-driven: a commit lands under `## Unreleased` and does
  not release; renaming that section to a version (and bumping `pubspec.yaml`)
  is what creates the release

## Version 0.6.9

### [2026-10-03]

#### Fixed
- The Windows installer metadata pointed its URL, support URL and update URL at
  `kodjodevf/yuri_reader` instead of the fork's own repository, so the update
  check and the About links led to a repository that does not exist

#### Changed
- The reader's stale-page-list fix and the Linux WebP support were merged
  upstream (PR #1031), so the fork dropped its own copies of those overlays and
  now builds them from upstream. The overlays upstream moved under the same
  bump (the reader, AniList, the tracker library and its state) were rebased
  onto upstream, which also brings their newer fixes: AniList's outage
  short-circuit and 429 retry, and the reader's remembered-page jump

## Version 0.6.8+1

### [2026-10-03]

#### Bot
- Synced 28 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 2 commits from [malsync](https://github.com/MALSync/MALSync)

## Version 0.6.8

### [2026-09-29]

#### Added
- MAL-Sync's own feedback bars in the reader: a result bar at the bottom after
  a sync, showing the title and the fields it changed, with pink `Undo` /
  `Wrong?` buttons, and a question bar at the top that asks "Start reading?"
  and "Set as completed?" (carrying the score dropdown), the way the extension
  does
- The manga completion percentage in MAL-Sync settings, the share of a chapter
  read before the tracker bumps (default 90)

#### Changed
- The tracker bump fires once, when the configured share of the chapter has
  been read, instead of at the last page

## Version 0.6.7

### [2026-09-29]

#### Fixed
- The tracker now bumps when you read a chapter to its last page or watch an
  episode to its threshold, even if the chapter or episode was already marked
  read in the app. Previously the reader skipped already-read chapters, so
  re-reading one never updated the tracker
- The bump now goes to the entry you picked as the match, not to whatever a
  fresh title search returns first (which could be a different entry, so your
  own entry never moved)
- The MAL-Sync panel re-reads the entry after a sync, so the bumped chapter
  shows without leaving and re-opening the page

## Version 0.6.6

### [2026-09-29]

#### Fixed
- The app could reuse an extension server left behind by a previous run
  instead of starting its own. Requests to that stale server failed with a
  broken pipe, and every extension screen showed "Something went wrong". It
  now stops a leftover server before starting a fresh one, and stops its own
  server when the window closes so it does not leave one behind

## Version 0.6.5

### [2026-09-29]

#### Fixed
- A chapter page list saved to disk could point at the extension server's own
  image proxy (`http://127.0.0.1:<port>/image/<id>`), whose port and tokens
  belong to one server process. After that process restarted, every page of the
  chapter failed to load and the reader's Retry kept repeating the same dead
  request. Page lists from the proxy are no longer cached, and one already on
  disk is dropped, so the list is fetched fresh
- The reader's top-bar Refresh invalidated the reader before removing the
  cached page list, so the rebuild reused the stale list. It now removes the
  cache and invalidates the page-list provider first
- WebP chapter images now decode on Linux (the decoder only handled jpeg, png
  and avif, so WebP chapters failed there while Android's platform decoder
  opened them)

## Version 0.6.4

### [2026-09-27]

#### Changed
- Synchronize and Remove now live on the MAL-Sync entry update screen, where MAL-Sync's original `overview-update-ui` puts them, not in the inline panel on the manga chapter-list page. Add remains on the entry screen when it is off-list; the inline panel keeps its Add action for an off-list match

## Version 0.6.3

### [2026-09-27]

#### Fixed
- On Linux, closing the Webview from its top-left button could close and remove the native window twice: once on Back and again during teardown. That invalidated the Webview's GTK view and crashed the app. The Webview now closes and pops the route at most once, and stops its cookie timer on teardown

#### Changed
- The MAL-Sync manga panel now shows Synchronize and Remove for an entry on the list, and Add instead when it is not. Synchronize pulls the current provider values; Remove deletes the provider entry; Add uses MAL-Sync's manga default, Plan to Read. The locally chosen match is kept after Remove, so Add targets the same entry

## Version 0.6.2

### [2026-09-27]

#### Fixed
- The Linux release now ships the reader's native image decoder, and it can decode WebP chapter images such as Dynasty Scans serves. The WebP decoder is a temporary local addition while waiting for upstream; its source is marked `TODO: tmp fix, awaiting upstream fix`

## Version 0.6.1

### [2026-09-26]

#### Changed
- The correction search opens with the title already in its box and the search already running, which is how MAL-Sync's own correction search opens: the right entry is one tap away instead of a typed query away. The title is cleaned the way its own search cleans it first - the audio, subtitle, novel and Blu-ray marks a site adds to a name are dropped, because the service lists the title without them. Typing re-searches after the same short pause its own search waits for, and the row this title is on now is marked so it is clear what picking another would change

## Version 0.6.0

### [2026-09-26]

#### Added
- A manga's page carries MAL-Sync's own panel, in the band under the title block and above the action row: the rating it shows for the title, then Status, Volume, Chapter and Your Score, each saving as it changes. It is one wrapping row, so on a narrow window the second line starts at the left edge instead of in the middle. It appears for manga and novels, and only while MAL-Sync is one of the trackers
- The Tracking button on that page becomes MAL-Sync's: it takes the arrow mark, and opens its correction panel - the entry the title matched, and a search to pick a different one when the automatic title match landed on the wrong title. A hand-picked match is kept on the title's MAL-Sync row, and the panel reads it back on the next visit
- The bridge gained `entry.find`: a read-only lookup, by title or by a hand-picked entry, which is what the panel reads. It never adds a status, a progress or an entry, so opening a page cannot change the list

#### Fixed
- Entry reads and writes finished with an error, and the write never ran. The service stands in for a browser extension, and its stand-in storage returned nothing where the vendored code waits on a promise, so every provider update threw on the way out. Opening an entry, saving a score, a status or progress, adding or deleting an entry, and the reader's own automatic tracking all reported an error and stopped there. The stand-in now settles its promises, so they finish; released 0.5.7 carries the fault

## Version 0.5.7

### [2026-09-26]

#### Bot
- [2026-09-26] Synced 13 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 32 commits from [malsync](https://github.com/MALSync/MALSync)

#### Fixed
- The reader follows upstream's new page-loaded callback. The sync added a required one to the page content widget, which this fork's copy of the reader did not pass, so the synced tree did not build - neither the bot's own run nor 0.5.7 could finish. This fork's reader now answers it, making its remembered-page jump only once that page's image has loaded
- The title data reads its own wording. Where MAL-Sync builds a string for itself - a run time, a status, a date - the service answered with the key it looked the text up by, so an anime's duration showed as `bookmarkitems_min` and the details list showed its labels as keys. It now reads MAL-Sync's own English text, which the service carries with it
- Recommendations are gone from the entry page

## Version 0.5.6

### [2026-09-26]

#### Fixed
- Signing in decides which service the tracked list is read from, and nothing else does. Saving progress or score, or reading a chapter, fell back to MyAnimeList whenever the call did not name a service, and then wrote that fallback over the service already chosen - so an AniList login could look like being signed out. Signing in to a service now chooses it, and every other call keeps whatever is chosen
- The tracked list says which service it is reading from, under its title, and the no-login message names it too, so a list that cannot load no longer looks the same as a login that is gone

## Version 0.5.5

### [2026-09-25]

#### Added
- The entry page shows what the site says about a title, not only our controls: the score, favourites, popularity and rank row; the description; a "Synonyms" button listing every other name it goes by; the cast with covers and roles; related titles; recommendations with how many people made them; reviews; and the details list (format, status, start date, authors, source, genres, external links). It is MAL-Sync's own title data, read by the provider class the sync mode already selects, so nothing is fetched or reshaped twice; a section the provider has nothing for is simply not there
- The bridge gained `entry.meta` for it, which returns the same title data MAL-Sync's own page is built from

## Version 0.5.4

### [2026-09-25]

#### Fixed
- Only one of the two sync paths writes progress now. Reading a chapter called both the MAL-Sync bridge and the app's own trackers, and the two read the chapter number differently - the bridge searches by title, the trackers use this app's recognition - so the same title was pushed twice and the two views could end up disagreeing about it. When MAL-Sync is enabled it owns that update and the native trackers are left to it

## Version 0.5.3

### [2026-09-25]

#### Added
- When the MAL-Sync list says there is no login, it now says so as its own state and offers a button straight to the tracking settings, since that is where the login happens. Before it showed the bridge's error and a retry, which could not help

## Version 0.5.2

### [2026-09-25]

#### Added
- MAL-Sync has a tab of its own in the main navigation, between Browse and More, opening the same screen the gear on the Tracking row opens. It is in the desktop rail and the phone bar, and it opens over the current tab instead of becoming one, so the tab that was selected stays selected
- The fork overlaid `main_view/main_screen.dart`, `appearance/custom_navigation_settings.dart` and `reader/providers/reader_state_provider.dart` to place it and to name it. A navigation item added since the order was last saved now goes where the default order puts it, instead of at the end of the rail

## Version 0.5.1

### [2026-09-25]

#### Changed
- The entry page is drawn the way MAL-Sync's app draws it, from its own stylesheet rather than by eye: the cover is a 300px card (10px corners, 225 by 350, a soft shadow) and the controls sit under it once the window is 900px wide, with the title beside it at 1.5x and the state dot. The controls take its shapes - 2px outlined surfaces, 5px corners on the small count fields, 30px pills for the status and score - and its rhythm: sections 15px apart on a 60px minimum, a 2px divider. The state dot is 16px and outlined rather than filled when an entry has no state

## Version 0.5.0

### [2026-09-25]

#### Added
- An entry's own page, opened by tapping a cover in the MAL-Sync list, the way MAL-Sync's app opens it: the cover and the state it is in, then the controls that write back through the bridge - the episode or chapter count with a step button and a slider, a volume row for manga, the status dropdown and the score. A change is saved as it is made, and the list is re-read when the page closes
- The tracked list reports an entry's volumes, and the app can set them

## Version 0.4.2

### [2026-09-25]

#### Fixed
- The MAL-Sync screen loads instead of spinning. The app read the service's start-up line by returning out of the loop over its output, and returning closes that pipe; the service writes its log there, so its first log line killed it in the middle of the request and no reply ever came. The app now keeps reading both pipes for as long as the service runs, reports a service that dies before it is ready instead of waiting, and drops a dead service so the next attempt starts a fresh one instead of writing into a closed socket

## Version 0.4.1

### [2026-09-25]

#### Fixed
- The sync service starts again. 0.4.0's list call pulled in malsync's list classes, which require Vue, and the packaged service had no Vue in it: it exited at startup with `Cannot find module 'vue'`, so every tracker stopped working, not only the new screen. The service now carries the stub its build always assumed (`ts/shims/vue`), and the packaged binary was checked to start and to answer `settings.list` and `entry.list` again
- A failure that carries no message of its own reaches the app with words. malsync's "not logged in" error has an empty message, so the MAL-Sync screen showed a bare "Exception:"; it now reads "not logged in to the tracking service"

## Version 0.4.0

### [2026-09-24]

#### Added
- MAL-Sync's list and settings are in the app. The gear on the MAL-Sync row in Tracking, and its tile in Manage Trackers, open the tracked list: the anime/manga switch, the state dropdown and the cover cards, laid out the way MAL-Sync's own app lays them out, with its palette and its state colours. The gear there opens the settings the bridge acts on. Both read through the bridge, which runs malsync's own list classes, so the list is the one its app shows
- The bridge gained `entry.list` (the tracked list for a provider, by state) and `settings.list` (the settings it holds, credentials excluded)

#### Fixed
- The MAL-Sync button opens those screens instead of MAL-Sync's web page. 0.3.0 pointed it at `malsync.moe/pwa`, which is an empty shell: its content is injected by the MAL-Sync browser extension, so without that extension the page is blank and the button opened nothing

## Version 0.3.0

### [2026-09-24]

#### Added
- MAL-Sync opens its own web app. The MAL-Sync row in the Tracking screen now has a settings button (left of the green tick), and its tile in Manage Trackers opens the same place: MAL-Sync's page at `malsync.moe/pwa`, where the anime and manga it tracks and all of its settings live. Both used to lead to an in-app page listing only what the local bridge had stored, which is not what MAL-Sync shows
- The in-app browser takes a `captureCookies` flag. Copying a page's cookies and its user agent into the app's HTTP settings is only right for extension pages, which feed the resolver that retries a blocked request. It was not scoped to the page: it wrote the app-wide user agent and kept the page's cookies for that host. A page that is not an extension, such as MAL-Sync's, no longer does either

## Version 0.2.11

### [2026-09-24]

#### Changed
- MAL-Sync sits in its own "Sync Tools" section at the top of the Tracking screen, instead of being the last row of the Services list. It is the sync layer the service rows hand off to, not another service, and sitting under "Services" made it read as one
- The MAL-Sync row no longer borrows MyAnimeList's icon. It draws a sync glyph in a neutral colour, so it no longer looks like a second MyAnimeList entry. The Tracker Library header and the Manage Trackers grid draw the same glyph for it

## Version 0.2.10

### [2026-09-21]

#### Fixed
- The Browse extension list fills up again. Mangayomi's extension index states the app version every extension needs (`appMinVerReq`, currently 0.5.0), and the app compared that with its own version - which the fork numbers on its own scale - so every extension was discarded and the list came out empty, while the same repository filled up on upstream mangayomi 0.9.6. The comparison now uses the mangayomi version the tree is built from, read from the vendored manifest by `compose.sh`, and `compose.sh` fails loudly if upstream reshapes the lines it edits. The fork's own numbering, and the update check that reads it, are untouched

## Version 0.2.9

### [2026-09-20]

#### Fixed
- The "What's new" view no longer reads as an update that does not exist. It opens the same dialog the update check uses, handing it its own title and the latest release without comparing versions, but the dialog's rewrite in 0.2.8 had replaced the title with a hardcoded "New update available" and added a `current -> target` version pair. On an up-to-date app that produced "New update available  v0.2.8 -> v0.2.8" with a Download button. The dialog shows the title it is given again, and the version pair is drawn only when the two versions actually differ

## Version 0.2.8

### [2026-09-20]

#### Bot
- Synced 151 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 107 commits from [malsync](https://github.com/MALSync/MALSync)

#### Fixed
- Ported the fork overlay to mangayomi v0.9.6 (upstream advanced 151 commits from v0.9.2). Of the 25 overlaid files, 13 had also changed upstream: 5 merged by themselves, 8 needed a hand merge. The two largest (`utils/constant.dart` and `browse/settings/providers/browse_state_provider.dart`) merged cleanly and restore the definitions upstream's code expects (`appIconAssets`, `transparentAsset`, `developerModeStateProvider`, `ShowNavDoubleTapTooltipState`) - the weekly sync had been failing on exactly those
- The reader follows upstream's new list API: the fork's `scrollable_positioned_list` import is gone (upstream dropped the package), along with a stale `crash_report_banner` import whose only caller upstream's rewrite had already removed

## Version 0.2.7

### [2026-09-20]

#### Fixed
- The sync bot writes its changelog entry again. The released/unreleased decision was computed inside a command, where it silently evaluated to nothing, so the failed sync committed the upstream bump and the synced pubspec but no `## Unreleased` entry. It now uses the step status functions in the step conditions, the only place they are valid

## Version 0.2.6

### [2026-09-20]

#### Changed
- Releases are create-only in both workflows: when the version's tag already has a release, the run refuses and leaves it alone instead of replacing the bundle and the notes. A change that deserves a release gets a new version; an existing release is never rewritten

## Version 0.2.5

### [2026-09-20]

#### Changed
- The sync bot commits the upstream sync whether or not the build works. A failed sync now leaves `main` on the new upstream, so the code can be fixed against it: the changelog gets a `## Unreleased` section and the version is left alone, and the next green run turns that section into the released version. A green sync still bumps the version and releases, as before
- Bot commits carry GitHub's skip marker, and `ci.yml` skips commits authored by `github-actions[bot]`, so `ci` builds human pushes only. It had been rebuilding the version the bot had just released and replacing that release's bundle with its own build

## Version 0.2.4

### [2026-09-20]

#### Fixed
- Build: the CI Flutter version is no longer pinned by hand. Both workflows now use upstream's own setup (`channel: stable`, no version), so the toolchain follows the Dart requirement in the inherited `pubspec.yaml` automatically

#### Changed
- Removed the duplicate "Cache Flutter SDK" step, whose key was a literal version and could therefore never follow an upgrade (the Flutter action caches the SDK itself, keyed by version)
- The sync workflow's combined step is split into `Compose`, `Flutter pub get`, `Cargokit pub get` and `Flutter analyze`, so a failure names the command that failed instead of always reporting "Flutter analyze"

## Version 0.2.3

### [2026-09-20]

#### Fixed
- Build: pinned Flutter 3.47.2 -> 3.47.5 (Dart 3.13.2 -> 3.13.4); upstream mangayomi's pubspec now requires Dart ^3.13.3, so the weekly sync failed at `flutter pub get`

## Version 0.2.2

### [2026-09-06]

#### Changed
- Linux rendering restored to Impeller (the interim Skia override from the 0.2.1 build was reverted; the black-content issue was an environment problem, not the renderer)

## Version 0.2.1

### [2026-08-31]

#### Changed
- About screen: link row with 4 labeled links (Yuri-Reader black, Mangayomi green, MALSync blue, Discord purple), each icon centered over a small subtitle

## Version 0.2.0

### [2026-08-31]

#### Changed
- Ported the fork overlay to mangayomi 0.9.0 (new reader, repositories layer, native crop-borders)
- App branding: window title, About links and Discord RPC now say YuriReader; the update check points at Yuri-Reader releases (Linux asset detection fixed for the tar.gz bundle)
- "What's new" in About shows Yuri-Reader release notes with a wrapped, collapsible Mangayomi changelog section
- Data folder: new installs use Documents/Yuri-Reader; existing Mangayomi folders are still used (fallback, no data loss)

## Version 0.1.0+1

### [2026-08-31]

#### Bot
- Synced 606 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 0 commits from [malsync](https://github.com/MALSync/MALSync)

#### Changed
- App branding: window title, About links and Discord RPC now say YuriReader; the update check points at Yuri-Reader releases (Linux asset detection fixed for the tar.gz bundle)
- "What's new" in About shows Yuri-Reader release notes with a wrapped, collapsible Mangayomi changelog section
- Data folder: new installs use Documents/Yuri-Reader; existing Mangayomi folders are still used (fallback, no data loss)

## Version 0.1.0

### [2026-08-31]

#### Added
- The sync bot now syncs `dart/pubspec.yaml` dependencies from the mangayomi submodule, so upstream dep bumps and new deps flow into the fork automatically

#### Fixed
- Sync bot force mode: the submodule bump step no longer runs with empty SHAs (would fail the run)

### [2026-08-30]

#### Changed
- Restructured the repo: mangayomi and malsync are pinned submodules, the bridge code lives in `dart/` + `ts/` (each with its own vendor), combined only at build time
- Added the weekend sync + release bot (BotYYYYMMDDnnn commits, version bumps, GitHub Releases)
- Split the license: Apache-2.0 (app) + GPL-3.0 (sync)
- Linux-only builds and releases for the testing loop

### [2026-05-13]

#### Added
- Standalone Yuri-Sync tracking service (TypeScript, GPL-3.0): JSON-RPC 2.0 over TCP localhost; providers anilist, mal, kitsu, simkl, shikimori, mangabaka
- Yuri-Sync bridge in the app: spawn at startup, auto-sync on chapter read, OAuth token forwarding
- MAL-Sync tracker: login and sync in the tracker library and track settings
- Crop-borders provider for the reader

#### Fixed
- Webview back navigation on newer Flutter (PopScope migration)
- Reader scroll-adjustment guard flag
