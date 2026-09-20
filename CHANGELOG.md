# Yuri-Reader - Change Log

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
