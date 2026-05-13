# Yuri-Sync

MALSync-based tracking service for Yuri-Reader. Communicates with the main app via TCP localhost (JSON-RPC 2.0).

## License

GPL-3.0 — This component incorporates code derived from MALSync.

## Architecture

```
sync_app/
├── vendor/malsync/     ← Git submodule (MALSync upstream)
├── src/
│   ├── server.ts       ← TCP server entry point
│   ├── protocol.ts     ← JSON-RPC message router
│   ├── providers/      ← Ported/wrapped MALSync provider APIs
│   │   ├── mal/
│   │   ├── anilist/
│   │   ├── kitsu/
│   │   └── simkl/
│   ├── adapters/       ← Lightweight site adapters
│   └── routes/         ← JSON-RPC method handlers
├── dist/               ← Compiled TypeScript
└── dist/yuri-sync      ← Single binary (pkg)
```

## How the Submodule Works

`vendor/malsync` is a **Git submodule** pointing to the official MALSync repository. This means:

1. **MALSync updates are tracked independently** — we can pull latest changes without merging their entire codebase
2. **We only port what we need** — the `_provider/` directory (tracker APIs), not the browser extension code
3. **Updates are automated** — see `../sync_app_update.sh` and `.github/workflows/update-malsync.yml`

## Updating MALSync

### Manual update
```bash
cd vendor/malsync
git pull origin master
cd ../..
./sync_app_update.sh
```

### Check if update is available
```bash
./sync_app_update.sh --check
```

### Auto-update (CI)
```bash
./sync_app_update.sh --auto
```

## Provider Wrapper Generation

The `providers/` directory contains **hand-ported and maintained** wrappers around MALSync's `_provider/` APIs. When MALSync updates their provider code:

1. The update script detects changes in `vendor/malsync/src/_provider/`
2. You may need to manually update the corresponding wrapper in `src/providers/`
3. Future: automate with AST-based code generation

## Building

```bash
npm install
npm run build        # Compile TypeScript
npm run build:binary # Create single executable with pkg
```

## Running

```bash
npm start            # Run compiled JS
# or
./dist/yuri-sync     # Run binary
```

The server will print `READY:PORT` to stdout. The parent process (Yuri-Reader) connects to this port.
