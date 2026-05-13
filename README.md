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

### Build the sync service
```bash
cd sync_app
npm install
npm run build
npm run build:binary   # Creates dist/yuri-sync
```

### Copy binary to app assets
```bash
cp sync_app/dist/yuri-sync app/assets/yuri-sync/
```

### Run the Flutter app
```bash
cd app
flutter run
```

## How It Works

1. On startup, the Flutter app spawns `yuri-sync` as a subprocess
2. `yuri-sync` binds to `127.0.0.1:0` (OS picks a free port)
3. It prints `READY:PORT` to stdout
4. The Flutter app parses the port and connects via TCP
5. All tracker communication goes through JSON-RPC over TCP

## Features

- ✅ TCP localhost IPC (cross-platform)
- ✅ JSON-RPC 2.0 protocol
- ✅ Process spawner with binary extraction (mobile)
- ✅ Health check endpoint
- 🔄 Provider APIs (AniList, MAL, Kitsu, Simkl) — in progress
- 🔄 Auto-tracking from reader — in progress
- 🔄 Site adapters — in progress

## TODO

- [ ] Port MALSync provider APIs (AniList, MAL, Kitsu, Simkl)
- [ ] Create lightweight site adapters
- [ ] Implement auto-track service in Flutter app
- [ ] Google Drive backup/restore sync
