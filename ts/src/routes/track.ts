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

  // 1. Search for the title
  const results = await search(title, type, {}, false, provider);
  if (!results.length) {
    return { status: 'not_found', title, type, provider };
  }

  const bestMatch = results[0];

  // 2. Get or create entry
  const single = getSingle(bestMatch.url);
  await single.update();

  const wasOnList = single.isOnList();
  if (!wasOnList) {
    single.setStatus(definitions.status.Watching);
  }

  single.setEpisode(progress);
  await single.sync();

  return {
    status: wasOnList ? 'updated' : 'added',
    title: single.getTitle(),
    url: single.getUrl(),
    progress,
    type,
    provider: single.shortName,
  };
}
