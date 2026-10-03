# Yuri-Reader

A manga/anime reader app built on [Mangayomi](https://github.com/kodjodevf/mangayomi),
with [MALSync](https://github.com/MALSync/MALSync)-based tracking.

## Features

- Read manga, webtoons, comics, and novels; watch anime
- Tracker support:
  - MAL-Sync: MyAnimeList, AniList, SIMKL, Trakt, Kitsu
- [Flatpak](.package/README.md)
## Quick Start

```bash
git clone --recursive https://github.com/MenaHere/Yuri-Reader.git
cd Yuri-Reader
./.scripts/build.sh linux      # or: windows, macos
```

## License

Licensed per component, not dual-licensed: each part carries exactly one
license. The app is **Apache-2.0** (`LICENSE-APACHE`); the sync service is
**GPL-3.0** (`LICENSE-GPL-3.0`). The two are separate programs that communicate
only over localhost sockets.
