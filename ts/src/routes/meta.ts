// SPDX-License-Identifier: GPL-3.0

import { getOverview } from '../../vendor/malsync/src/_provider/metaDataFactory';

/// Everything the site itself says about a title: the description, the score
/// and popularity row, the other names it goes by, the cast, related and
/// recommended titles, reviews, and the details list (format, status, dates,
/// authors, genres, links, ongoing).
///
/// This is malsync's own overview data, fetched by the provider class the sync
/// mode selects - the same call its app makes for this page. The provider
/// caches it for five days, so opening an entry again costs nothing.
///
/// `url` is the entry's page on the provider; `type` picks the sync mode when
/// one is not given, exactly as the list does.
export async function handleEntryMeta(
  params: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = params.url as string;
  if (!url) throw new Error('Missing url parameter');
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const provider =
    typeof params.provider === 'string' && params.provider
      ? (params.provider as string)
      : '';

  const overview = getOverview(url, type, provider);
  await overview.init();

  return { url, type, meta: overview.getMeta() };
}
