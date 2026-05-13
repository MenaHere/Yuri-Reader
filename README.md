# Yuri-Reader

A manga/anime reader app forked from [Mangayomi](https://github.com/kodjodevf/mangayomi), with a standalone MALSync-based tracking service.

## Architecture

```
Yuri-Reader/
├── app/              ← Flutter app (Apache-2.0)
│   ├── lib/
│   │   └── services/yuri_sync/   ← TCP client + process spawner
│   └── assets/yuri-sync/         ← Bundled sync binary
│
└── sync_app/         ← Yuri-Sync tracking service (GPL-3.0)
    ├── src/          ← TypeScript source
    └── dist/         ← Compiled output + pkg binary
```

## License Separation

- **app/**: Apache-2.0 (Mangayomi fork)
- **sync_app/**: GPL-3.0 (MALSync-derived tracker providers)

The two components communicate via **TCP localhost sockets** (JSON-RPC 2.0). They are separate programs — the main app does not include or link to any MALSync code.

## Quick Start

### Clone
- It contains a **git submodule**, so use `--recursive` or run `git submodule update --init --recursive` after cloning

    ```bash
    git clone --recursive https://github.com/MenaHere/Yuri-Reader.git
    ```
- Or with SSH:

    ```bash
    git clone --recursive git@github.com:MenaHere/Yuri-Reader.git
    ```

### Build the sync service

```bash
cd sync_app
npm install
npm run build
npm run build:binary   # Creates dist/binaries/yuri-sync
```

### Copy binary to app assets

```bash
cp sync_app/dist/binaries/yuri-sync app/assets/yuri-sync/
```

### Run the Flutter app

```bash
cd app
flutter pub get
dart pub get --directory=rust_builder/cargokit/build_tool
flutter run
```

## How It Works

1. On startup, the Flutter app spawns `yuri-sync` as a subprocess
2. `yuri-sync` binds to `127.0.0.1:0` (OS picks a free port)
3. It prints `READY:PORT` to stdout
4. The Flutter app parses the port and connects via TCP
5. All tracker communication goes through JSON-RPC over TCP

## JSON-RPC API

### Health

| Method        | Params | Returns                  |
|---------------|--------|--------------------------|
| `health.ping` | —      | `{status, version}`      |

### Authentication

| Method         | Params                           | Returns        |
|----------------|----------------------------------|----------------|
| `auth.getUrl`  | `{provider}`                     | `{url}`        |
| `auth.exchange`| `{provider, token, refreshToken}`| `{status}`     |

Supported providers: `anilist`, `mal`, `kitsu`, `simkl`, `shikimori`, `mangabaka`

### Search

| Method         | Params                        | Returns               |
|----------------|-------------------------------|-----------------------|
| `search.query` | `{query, type, provider}`     | `{provider, query, type, results}` |

### Entry Management

| Method          | Params                                    | Returns        |
|-----------------|-------------------------------------------|----------------|
| `entry.get`     | `{url, type, provider, mediaId}`          | entry object   |
| `entry.update`  | `{url, type, provider, progress, status, score, volume, startDate, finishDate, tags}` | entry object |
| `entry.add`     | `{url, type, provider, progress, status}` | entry object   |
| `entry.delete`  | `{url, type, provider, mediaId}`          | `{status}`     |

### Auto-Track

| Method        | Params                              | Returns                  |
|---------------|-------------------------------------|--------------------------|
| `track.auto`  | `{title, type, chapter, episode, provider}` | `{status, title, url, progress}` |

Searches for the title, gets/creates the entry, sets progress, and syncs.

### Settings

| Method           | Params          | Returns        |
|------------------|-----------------|----------------|
| `settings.set`   | `{key, value}`  | `{key, status}`|
| `settings.get`   | `{key}`         | `{key, value}` |

## Features

- ✅ TCP localhost IPC (cross-platform)
- ✅ JSON-RPC 2.0 protocol
- ✅ Process spawner with binary extraction (mobile)
- ✅ Health check endpoint
- ✅ Provider search (AniList, MAL, Kitsu, Simkl, Shikimori)
- ✅ Entry get/update/add/delete
- ✅ Auto-tracking from reader progress
- ✅ OAuth token forwarding from native trackers
- ✅ Settings get/set for runtime configuration

## Integration Points

### Reader → Tracker Sync

When a chapter is read, `updateTrackChapterRead()` in `lib/utils/extensions/chapter_extensions.dart`:

1. Updates native trackers (AniList, MAL, etc.) as before
2. Calls `YuriSyncService.trackAuto()` to sync via MALSync providers

### Auth Token Forwarding

When a user logs into AniList or MyAnimeList in the app, the OAuth tokens are automatically forwarded to the sync service via `YuriSyncService.setAuthToken()`.

## Submodule

MALSync is included as a Git submodule:

```bash
git submodule update --remote sync_app/vendor/malsync
```

## TODO

- [x] TCP server with JSON-RPC 2.0
- [x] Process spawner (desktop + mobile)
- [x] Search via MALSync providers
- [x] Entry get/update/add/delete
- [x] Auto-track from reader
- [x] Auth token forwarding
- [x] Settings get/set
- [ ] Site adapters for chapter recognition
- [ ] Google Drive backup/restore sync
