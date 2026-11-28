# Yuri-Reader

## What this project is (3 parts)

1. **mangayomi part** - upstream app (submodule `dart/vendor/mangayomi`, Apache-2.0)
2. **malsync part** - upstream tracker service (submodule `ts/vendor/malsync`, GPL-3.0)
3. **my bridge part** - `dart/` + `ts/`:
   - `dart/` - my dart bridge, **compiled with mangayomi** (overlaid onto the
     mangayomi tree at compose time; mangayomi submodule at `dart/vendor/`)
   - `ts/` - my ts bridge, **compiled with malsync** (imports it at build;
     malsync submodule at `ts/vendor/`)

## Build
```bash
./.scripts/build.sh linux      # or: windows, macos, android, etc
```
- **Do not build a release locally.** It takes too long. For dev testing, use debug build mode.

## Commit convention

The subject line is **only** the code below without a free-text summary. 
The description goes in the body, after the first line. Read commit history if you did not understand.

| Code | Use for |
|------|---------|
| `DevYYYYMMDDnnn` | code development |
| `FixYYYYMMDDnnn` | bug fixes |
| `BotYYYYMMDDnnn` | bot sync commits, incrementing per same-day run |
| `PrYYYYMMDDnnn`| pull requests merged |
| `docs` | documentation updates |
| `chore` | everything else, but only small changes |

- `YYYYMMDD` is the **development day**, not the commit day: work developed on
  0513 is `Dev20260513000` even when committed later. Except PrYYYYMMDDnnn, which 
  is date that PR is merged. All PRs should be stashed and merged.
- `nnn` increments per day, starting at `000`.
- `chore` covers only small changes: no new function, no bug fix, no doc
  update. A new workflow or script counts as a new function, so it is `Dev`.
- A commit that mixes a fix and a feature is two commits, not one.

## Changelog

`CHANGELOG.md` lists the newest entry first. A human entry is a dated section
under `## Unreleased`, with its items grouped as `#### Added`, `#### Changed`
or `#### Fixed`. The bot prepends its own dated section holding a `#### Bot`
item that names the upstream commits it synced.

- Newest on top; human entries use `#### Added` / `#### Changed` / `#### Fixed`
- The bot prepends its entry (version + date + `#### Bot` + the sync line)

## Version scheme

- **Commits do NOT bump the version.** A human change adds its entry under
  `## Unreleased` (newest on top, `### [YYYY-MM-DD]`) and is committed without
  a version bump; `ci.yml` then builds but creates no release. The version is
  bumped only when renamnig `## Unreleased` to
  `## Version X.Y.Z`, bump `dart/pubspec.yaml`, and commit - that push makes
  `ci.yml` call `release.yml`, which builds every platform and releases all
  assets and republishes the Flatpak remote.
- Each bot update bumps only the last place: `0.1.0` -> `0.1.0+1` -> `0.1.0+2`
- A **failed sync** commits the upstream bump with the changelog marked
  `## Unreleased` and no version bump; a human names the version later (the bot
  never renames `## Unreleased` itself)
- Do not change the version, only add under `## Unreleased`, unless explicit approved 
  to move to the next version.

## Before pushing
`dart analyze` on the composed tree is the fast gate:
`./.scripts/compose.sh && cd .build/app && flutter pub get && dart analyze`.
`flutter clean` - it throws away the Rust build cache. Avoid it to reduce build time.
Changes with `./AGENTS.md`,`./README.md` or must not be pushed without human approval.