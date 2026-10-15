# Project Design

## Repo layout (Yuri-Reader/)

```
dart/                    my dart bridge + its upstream
  vendor/mangayomi/      pinned upstream submodule
  lib/, pubspec.yaml...  my dart code (replaces/adds to mangayomi files)
ts/                      my ts bridge + its upstream
  vendor/malsync/        pinned upstream submodule
  src/, package.json...  my ts code (the Yuri-Sync service)
.scripts/compose.sh      mangayomi + renames + dart/ -> .build/app
.scripts/build.sh        compose + yuri-sync binary + flutter build
.github/workflows/upstream-sync.yml   sync bot
...
```

## JSON-RPC API (app <-> yuri-sync)

- `health.ping` -> `{status, version}`
- `auth.getUrl` `{provider}` -> `{url}`; `auth.exchange` `{provider, token, refreshToken}` -> `{status}`
- `search.query` `{query, type, provider}` -> `{provider, query, type, results}`
- `entry.get/update/add/delete` - entry management
- `entry.list` `{type, status?, provider?}` -> `{provider, type, status, results}` - the tracked list, fetched by malsync's own list classes
- `entry.find` `{title, type, url?, provider?}` -> `{provider, type, found, entry, rating, statusOptions, scoreOptions}` - a **read-only** lookup: the entry a title currently matches, or the entry named by `url` (a match the user picked by hand). It never adds a status, a progress or an entry, so a page that is merely opened cannot change the list
- `entry.meta` `{url, type, provider?}` -> `{url, type, meta}` - everything the site says about a title (description, statistics, other names, cast, related, recommendations, reviews, details), via malsync's `metaDataFactory`
- `track.auto` `{title, type, chapter, episode, provider}` - search, get/create entry, set progress, sync
- `settings.set/get` `{key, value}`; `settings.list` -> the settings held, credentials excluded
- Providers: anilist, mal, kitsu, simkl, shikimori, mangabaka
- Handshake: binary prints `READY:PORT` on stdout; app connects to that port
- **Only signing in changes which service is used.** `auth.exchange` sets
  `syncMode` to that provider; every other call uses the configured one and must
  never write it. A missing `provider` must not fall back to `mal` and persist
  that - doing so once made saving progress look like being logged out
- The service process must keep both of its pipes drained for its whole life;
  see `code-thread-program`. The spawner's `READY` read used to close stdout,
  which killed the service mid-request and left the app waiting forever

## Workflows (release and CI are separate)

- **`ci.yml`** (push to main) is pure CI: it composes the app and runs
  `flutter analyze` on every human push and never touches a release. Bot sync
  commits are skipped.
- **`release.yml`** builds every platform (Linux + Android + Flatpak) and
  attaches the assets to the release. It runs on a push to main, can be called
  (`workflow_call`), and can be dispatched by hand. A `gate` job decides: a
  release is created/updated only when the changelog's newest section is a
  released `## Version X.Y.Z`, unless a `version` input names one. Its
  `workflow_call` inputs are `linux` / `android` / `flatpak` (which platforms to
  build), `version` (publish under this version), `ref` (build a different ref)
  and `replace` (overwrite existing assets). Linux and Android build in
  parallel; `release` attaches their assets; `flatpak` runs after `release` and
  republishes the Pages remote. Callers pass secrets with `secrets: inherit`.
- **`pack.yml`** is the manual dispatcher: tick `linux` / `android` / `flatpak`,
  optionally name a `version` and a `ref`, and tick `replace` to overwrite that
  release's assets. It calls `release.yml` with those inputs, so a Linux-only
  re-pack never waits on the ~30-minute Android build. Nothing calls it
  automatically.
- **`upstream-sync.yml`** (the bot) only syncs: bump submodules -> sync
  dependency manifests (`.scripts/sync-deps.sh` copies mangayomi's pubspec.yaml
  and re-applies the 6 fork substitutions: name, version, rust_lib name,
  yuri-sync asset, app name, repo URLs) -> `flutter analyze` as the green/red
  gate -> changelog -> commit `BotYYYYMMDDnnn` -> push -> then calls
  `release.yml` (`secrets: inherit`) to build and release all platforms when it
  made a release. The changelog step branches on the newest section first:
  when it is already a version (`## Version X`), the sync bumps the next build
  number and releases; when it is `## Unreleased`, the sync is recorded under a
  fresh `#### Bot` heading in that section and nothing is bumped or released (a
  pending `## Unreleased` may be a major human release - never ship it as a
  `+1`). A no-op run (no upstream updates and not forced) does not call
  `release.yml` at all.