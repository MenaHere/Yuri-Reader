// SPDX-License-Identifier: GPL-3.0

import { search } from '../../vendor/malsync/src/_provider/searchFactory';

export async function handleSearch(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const query = params.query as string;
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const syncMode = (params.syncMode as string) || '';

  if (!query || query.length < 3) {
    throw new Error('Search term must be at least 3 characters long');
  }

  const results = await search(query, type, {}, false, syncMode);

  const mapped = [];
  for (const r of results) {
    mapped.push({
      id: r.id,
      name: r.name,
      altNames: r.altNames,
      url: r.url,
      malUrl: typeof r.malUrl === 'function' ? await r.malUrl() : r.malUrl,
      image: r.image,
      imageLarge: r.imageLarge,
      imageBanner: r.imageBanner,
      media_type: r.media_type,
      isNovel: r.isNovel,
      score: r.score,
      year: r.year,
      totalEp: r.totalEp,
    });
  }

  return { results: mapped };
}
