# Yuri-Reader - Change Log

## Version 0.1.0

### [2026-05-13]

#### Added
- Standalone Yuri-Sync tracking service (TypeScript, GPL-3.0): JSON-RPC 2.0 over TCP localhost; providers anilist, mal, kitsu, simkl, shikimori, mangabaka
- Yuri-Sync bridge in the app: spawn at startup, auto-sync on chapter read, OAuth token forwarding
- MAL-Sync tracker: login and sync in the tracker library and track settings
- Crop-borders provider for the reader

#### Fixed
- Webview back navigation on newer Flutter (PopScope migration)
- Reader scroll-adjustment guard flag
