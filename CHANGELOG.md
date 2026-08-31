# Yuri-Reader - Change Log

## Version 0.1.0+1

### [2026-08-31]

#### Bot
- Synced 606 commits from [mangayomi](https://github.com/kodjodevf/mangayomi), 0 commits from [malsync](https://github.com/MALSync/MALSync)

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
