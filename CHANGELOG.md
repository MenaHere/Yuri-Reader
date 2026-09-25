# Yuri-Reader - Change Log

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
