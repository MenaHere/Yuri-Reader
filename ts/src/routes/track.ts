// SPDX-License-Identifier: GPL-3.0

import { search } from '../../vendor/malsync/src/_provider/searchFactory';
import { getSingle } from '../../vendor/malsync/src/_provider/singleFactory';
import * as definitions from '../../vendor/malsync/src/_provider/definitions';

export async function handleTrackAuto(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  // Nothing named means the configured service, and this call must not change
  // it: an empty mode is how malsync's search asks for whatever is set. It
  // used to fall back to MyAnimeList and write that, so reading a chapter
  // could move a user onto an account they were not signed in to.
  const provider = typeof params.provider === 'string' ? (params.provider as string) : '';
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const title = params.title as string;
  const chapter = params.chapter as number | undefined;
  const episode = params.episode as number | undefined;
  const progress = chapter ?? episode ?? 1;
  // The match the user picked by hand wins over a fresh title search: writing
  // to whatever the search returns first updates a different entry than the
  // one the app shows, and the user's own entry never moves.
  const chosen = typeof params.url === 'string' ? (params.url as string) : '';
  // An explicit status (e.g. Completed after the "Set as completed?" question).
  const status = typeof params.status === 'number' ? (params.status as number) : undefined;
  // An explicit score, chosen in the "Set as completed?" bar.
  const score = typeof params.score === 'number' ? (params.score as number) : undefined;

  // 1. Resolve the entry: the chosen match, or the first title-search result.
  let targetUrl = chosen;
  if (!targetUrl) {
    const results = await search(title, type, {}, false, provider);
    if (!results.length) {
      return { status: 'not_found', title, type, provider };
    }
    targetUrl = results[0].url;
  }

  // 2. Get or create entry
  const single = getSingle(targetUrl);
  await single.update();

  const wasOnList = single.isOnList();
  if (!wasOnList) {
    single.setStatus(definitions.status.Watching);
  }
  if (status !== undefined) {
    single.setStatus(status);
  }
  if (score !== undefined) {
    single.handleScoreCheckbox(score);
  }

  single.setEpisode(progress);
  await single.sync();

  // Read the entry back: the app has to know whether the write landed, not
  // just that the call did not throw. `progress` below is what the provider
  // reports now, and `requested` is what was asked for.
  await single.update();

  return {
    status: wasOnList ? 'updated' : 'added',
    title: single.getTitle(),
    url: single.getUrl(),
    progress: single.getEpisode(),
    requested: progress,
    type,
    provider: single.shortName,
    // The entry state MAL-Sync shows in its result line:
    // Title | Status | Volume X/Y | Chapter X/Y | Score Z
    entryStatus: single.getStatus(),
    volume: single.getVolume(),
    totalVolumes: single.getTotalVolumes(),
    totalEpisodes: single.getTotalEpisodes(),
    score: single.getScore(),
  };
}
