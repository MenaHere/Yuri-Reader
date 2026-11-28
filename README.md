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
./build.sh                  # host platform, debug
./build.sh android          # another platform
./build.sh linux --release  # explicit release
```

## License

You may distribute the whole app in [GPL-v3](LICENSE-GPL-3.0), or only the (dart/flutter)[./dart/] part in [Apache-2.0](LICENSE-APACHE) License.
