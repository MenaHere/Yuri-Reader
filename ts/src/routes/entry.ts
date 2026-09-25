// SPDX-License-Identifier: GPL-3.0

import { getSingle } from '../../vendor/malsync/src/_provider/singleFactory';
import { getList } from '../../vendor/malsync/src/_provider/listFactory';
import type { listElement } from '../../vendor/malsync/src/_provider/listAbstract';
import * as definitions from '../../vendor/malsync/src/_provider/definitions';
import { api } from '../shim/api';

/// One entry of the tracked list, in the shape a list needs: what to draw
/// (title, cover, progress) and how to open it (url, mediaId).
function listEntryToJson(entry: listElement): Record<string, unknown> {
  const isAnime = entry.type === 'anime';
  return {
    uid: entry.uid,
    malId: entry.malId,
    type: entry.type,
    title: entry.title,
    url: entry.url,
    score: entry.score,
    progress: isAnime ? entry.watchedEp : entry.readVol ?? 0,
    total: isAnime ? entry.totalEp : entry.totalVol ?? 0,
    volume: isAnime ? null : entry.readVol ?? 0,
    totalVolume: isAnime ? null : entry.totalVol ?? 0,
    status: entry.status,
    startDate: entry.startDate,
    finishDate: entry.finishDate,
    rewatchCount: entry.rewatchCount,
    image: entry.image,
    tags: entry.tags,
    airingState: entry.airingState ?? null,
  };
}

/// The tracked list for one provider, the same list the MAL-Sync app itself
/// shows: malsync's own list classes do the fetching. [status] is malsync's
/// numbering (1 watching, 2 completed, 3 on hold, 4 dropped, 6 plan to watch,
/// 7 everything).
///
/// Reading the list is not a reason to change the sync mode: malsync's list
/// classes pick the configured one themselves. [provider] is only honoured
/// when it is actually given.
export async function handleEntryList(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const provider = typeof params.provider === 'string' && params.provider ? (params.provider as string) : null;
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const status =
    typeof params.status === 'number' ? (params.status as number) : definitions.status.All;

  if (provider) await setSyncMode(provider);
  const list = await getList(status, type);
  const entries = await list.getCompleteList();

  return { provider, type, status, results: entries.map(listEntryToJson) };
}

function malUrl(type: 'anime' | 'manga', id: number | string): string {
  return `https://myanimelist.net/${type}/${id}`;
}

function anilistUrl(type: 'anime' | 'manga', id: number | string): string {
  return `https://anilist.co/${type}/${id}`;
}

function buildUrl(provider: string, type: 'anime' | 'manga', mediaId: string | number): string {
  switch (provider.toLowerCase()) {
    case 'anilist':
      return anilistUrl(type, mediaId);
    case 'mal':
    default:
      return malUrl(type, mediaId);
  }
}

async function setSyncMode(provider: string) {
  const mode = provider.toUpperCase();
  const validModes = ['MAL', 'ANILIST', 'KITSU', 'SIMKL', 'SHIKI', 'MANGABAKA'];
  if (validModes.includes(mode)) {
    await api.settings.set('syncMode', mode);
  }
}

function singleToJson(single: any): Record<string, unknown> {
  return {
    id: single.getPageId(),
    cacheKey: single.getCacheKey(),
    url: single.getUrl(),
    displayUrl: single.getDisplayUrl(),
    title: single.getTitle(),
    image: single.getImage(),
    type: single.getType(),
    status: single.getStatus(),
    score: single.getScore(),
    absoluteScore: single.getAbsoluteScore(),
    episode: single.getEpisode(),
    volume: single.getVolume(),
    totalEpisodes: single.getTotalEpisodes(),
    totalVolumes: single.getTotalVolumes(),
    startDate: single.getStartDate(),
    finishDate: single.getFinishDate(),
    rewatchCount: single.getRewatchCount(),
    tags: single._getTags ? single._getTags() : '',
    onList: single.isOnList(),
    authenticated: single.isAuthenticated(),
    shortName: single.shortName,
  };
}

export async function handleEntryGet(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const provider = (params.provider as string) || 'mal';
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const mediaId = params.mediaId as string | number;
  const url = (params.url as string) || buildUrl(provider, type, mediaId);

  await setSyncMode(provider);
  const single = getSingle(url);
  await single.update();
  return singleToJson(single);
}

export async function handleEntryUpdate(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const provider = (params.provider as string) || 'mal';
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const mediaId = params.mediaId as string | number;
  const url = (params.url as string) || buildUrl(provider, type, mediaId);

  await setSyncMode(provider);
  const single = getSingle(url);
  await single.update();

  const progress = params.progress as number | undefined;
  const status = params.status as number | undefined;
  const score = params.score as number | undefined;
  const volume = params.volume as number | undefined;
  const startDate = params.startDate as string | null | undefined;
  const finishDate = params.finishDate as string | null | undefined;
  const tags = params.tags as string | undefined;

  if (typeof progress === 'number') single.setEpisode(progress);
  if (typeof volume === 'number') single.setVolume(volume);
  if (typeof status === 'number') single.setStatus(status);
  if (typeof score === 'number') single.setScore(score);
  if (startDate !== undefined) single.setStartDate(startDate);
  if (finishDate !== undefined) single.setFinishDate(finishDate);
  if (tags !== undefined) single._setTags(tags);

  await single.sync();
  return singleToJson(single);
}

export async function handleEntryAdd(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const provider = (params.provider as string) || 'mal';
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const mediaId = params.mediaId as string | number;
  const url = (params.url as string) || buildUrl(provider, type, mediaId);

  await setSyncMode(provider);
  const single = getSingle(url);
  await single.update();

  if (!single.isOnList()) {
    single.setStatus(definitions.status.Watching);
    const progress = params.progress as number | undefined;
    if (typeof progress === 'number') single.setEpisode(progress);
    const status = params.status as number | undefined;
    if (typeof status === 'number') single.setStatus(status);
    await single.sync();
  }

  return singleToJson(single);
}

export async function handleEntryDelete(params: Record<string, unknown>): Promise<Record<string, unknown>> {
  const provider = (params.provider as string) || 'mal';
  const type = (params.type as 'anime' | 'manga') || 'anime';
  const mediaId = params.mediaId as string | number;
  const url = (params.url as string) || buildUrl(provider, type, mediaId);

  await setSyncMode(provider);
  const single = getSingle(url);
  await single.update();
  await single.delete();

  return { provider, mediaId, status: 'deleted' };
}
