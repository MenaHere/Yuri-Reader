// SPDX-License-Identifier: GPL-3.0
// Shim for MALSync's utils global — Node.js implementation

import { api } from './api';

export function urlPart(url: string, part: number): string {
  if (!url) return '';
  const urlParts = url.split('/');
  if (!urlParts[part]) return '';
  return urlParts[part].replace(/[#?].*/, '');
}

export function urlStrip(url: string): string {
  return url.replace(/[#?].*/, '');
}

export function urlParam(url: string, name: string): string | number {
  const results = new RegExp(`[?&]${name}=([^&#]*)`).exec(url);
  if (results === null) return null as any;
  return decodeURI(results[1]) || 0;
}

export function watching(type: 'anime' | 'manga') {
  if (type === 'manga') return 'Reading';
  return 'Watching';
}

export function planTo(type: 'anime' | 'manga') {
  if (type === 'manga') return 'Plan to Read';
  return 'Plan to Watch';
}

export function episode(type: 'anime' | 'manga') {
  if (type === 'manga') return api.storage.lang('UI_Chapter');
  return api.storage.lang('UI_Episode');
}

export const syncRegex =
  /(^settings\/.*|^updateCheckTime$|^tempVersion$|^local:\/\/|^list-tagSettings$)/;

export const rateLimitExclude = /^https:\/\/api.malsync.moe\/(shark|mal\/|nc\/mal\/.*\/progress$)/i;

export function absoluteLink(url: string, domain: string): string {
  if (typeof url === 'undefined') return url;
  if (!url.startsWith('http')) {
    if (url.charAt(0) !== '/') url = `/${url}`;
    url = domain + url;
  }
  return url;
}

export async function setResumeWaching(url: string, ep: number, type: any, id: any) {
  return api.storage.set(`resume/${type}/${id}`, { url, ep });
}

export async function getResumeWaching(type: any, id: any): Promise<{ url?: string; ep?: number } | undefined> {
  if (!api.settings.get('malResume')) return undefined;
  return api.storage.get(`resume/${type}/${id}`);
}

export async function setContinueWaching(url: string, ep: number, type: any, id: any) {
  return api.storage.set(`continue/${type}/${id}`, { url, ep });
}

export async function getContinueWaching(type: any, id: any): Promise<{ url?: string; ep?: number } | undefined> {
  if (!api.settings.get('malContinue')) return undefined;
  return api.storage.get(`continue/${type}/${id}`);
}

export async function setEntrySettings(type: any, id: any, options: any, tags = '') {
  const tempOptions: any = {};
  if (options) {
    for (const key in options) {
      switch (key) {
        case 'u':
        case 'p':
          tempOptions[key] = options[key];
          break;
        default:
      }
    }
    if (api.settings.get('malTags')) {
      tags = setUrlInTags(JSON.stringify(tempOptions), tags);
    } else {
      await api.storage.set(`tagSettings/${type}/${id}`, JSON.stringify(tempOptions));
    }
  }
  if (!Object.values(tempOptions).find(el => Boolean(el))) {
    tags = setUrlInTags('', tags);
    if (!api.settings.get('malTags')) {
      await api.storage.remove(`tagSettings/${type}/${id}`);
    }
  }
  return tags;
}

export async function getEntrySettings(type: any, id: any, tags = '') {
  const tempOptions: any = {
    u: null,
    c: null,
    r: null,
    p: '',
  };
  if (api.settings.get('malTags')) {
    const tagString = getUrlFromTags(tags);
    if (tagString) {
      if (tagString[0] === '{') {
        try {
          const temp = JSON.parse(tagString);
          for (const key in tempOptions) {
            if (temp[key]) tempOptions[key] = temp[key];
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        tempOptions.u = tagString;
      }
    }
  } else {
    let temp: any = await api.storage.get(`tagSettings/${type}/${id}`);
    if (temp) {
      temp = JSON.parse(temp);
      for (const key in tempOptions) {
        if (temp[key]) tempOptions[key] = temp[key];
      }
    }
  }
  const continueUrlObj = await getContinueWaching(type, id);
  if (continueUrlObj) tempOptions.c = continueUrlObj;
  const resumeUrlObj = await getResumeWaching(type, id);
  if (resumeUrlObj) tempOptions.r = resumeUrlObj;
  if (!api.settings.get('usedPage')) tempOptions.u = null;
  return tempOptions;
}

export function getUrlFromTags(tags: string): string | undefined {
  if (/malSync::[\d\D]+::/.test(tags)) {
    return atobURL(tags.split('malSync::')[1].split('::')[0]);
  }
  if (/last::[\d\D]+::/.test(tags)) {
    return atobURL(tags.split('last::')[1].split('::')[0]);
  }
  return undefined;

  function atobURL(encoded: string) {
    try {
      return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch (e) {
      return encoded;
    }
  }
}

export function setUrlInTags(url: string, tags: string): string {
  if (url === '') {
    tags = tags.replace(/,?(malSync|last)::[^ \n]+?::/, '');
    return tags;
  }
  if (!api.settings.get('malTags')) return tags;
  const addition = `malSync::${Buffer.from(url).toString('base64')}::`;
  if (/(last|malSync)::[\d\D]+::/.test(tags)) {
    tags = tags.replace(/(last|malSync)::[^^]*?::/, addition);
  } else {
    tags = `${tags},${addition}`;
  }
  return tags;
}

export function handleMalImages(url: string): string {
  if (url.indexOf('questionmark') !== -1) return api.storage.assetUrl('questionmark.gif');
  return url;
}

export function pageUrl(
  page: 'mal' | 'anilist' | 'kitsu' | 'simkl',
  type: 'anime' | 'manga',
  id: string | number,
): string {
  switch (page) {
    case 'mal':
      return `https://myanimelist.net/${type}/${id}`;
    case 'anilist':
      return `https://anilist.co/${type}/${id}`;
    case 'kitsu':
      return `https://kitsu.app/${type}/${id}`;
    case 'simkl':
      return `https://simkl.com/${type}/${id}`;
    default:
      throw `${page} not a valid page`;
  }
}

export function returnYYYYMMDD(numFromToday = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + numFromToday);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function sortAlphabetically(a: string, b: string): number {
  if (a.toLowerCase() < b.toLowerCase()) return -1;
  if (a.toLowerCase() > b.toLowerCase()) return 1;
  return 0;
}

export function isDomainMatching(url: string, domain: string): boolean {
  const urlObj = new URL(url);
  const { host } = urlObj;
  return host === domain || host.endsWith(`.${domain}`);
}

export function upperCaseFirstLetter(string: string): string {
  if (!string || string.length < 2) return string;
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function getStatusText(type: 'anime' | 'manga', state: number): string {
  switch (state) {
    case 1:
      return api.storage.lang(`UI_Status_watching_${type}`);
    case 2:
      return api.storage.lang('UI_Status_Completed');
    case 3:
      return api.storage.lang('UI_Status_OnHold');
    case 4:
      return api.storage.lang('UI_Status_Dropped');
    case 6:
      return api.storage.lang(`UI_Status_planTo_${type}`);
    case 7:
      return api.storage.lang('UI_Status_All');
    case 23:
      return api.storage.lang(`UI_Status_Rewatching_${type}`);
    case 24:
      return api.storage.lang('UI_Status_Considering');
    default:
      return '';
  }
}

export function timeDiffToText(delta: number): string {
  let text = '';
  delta /= 1000;
  const diffYears = Math.floor(delta / 31536000);
  delta -= diffYears * 31536000;
  if (diffYears) text += `${diffYears}y `;
  const diffDays = Math.floor(delta / 86400);
  delta -= diffDays * 86400;
  if (diffDays) text += `${diffDays}d `;
  const diffHours = Math.floor(delta / 3600) % 24;
  delta -= diffHours * 3600;
  if (diffHours && diffDays < 2) text += `${diffHours}h `;
  const diffMinutes = Math.floor(delta / 60) % 60;
  delta -= diffMinutes * 60;
  if (diffMinutes && !diffDays && diffHours < 3) text += `${diffMinutes}min `;
  return text;
}

export function notifications(
  url: string,
  title: string,
  message: string,
  iconUrl = '',
): void {
  // No-op in headless mode
}

export async function timeCache(key: string, dataFunction: () => Promise<any>, ttl: number) {
  const value = await api.storage.get(key);
  if (typeof value === 'object' && new Date().getTime() < value.timestamp) {
    return value.data;
  }
  const result = await dataFunction();
  await api.storage.set(key, { data: result, timestamp: new Date().getTime() + ttl });
  return result;
}

export function flashm(
  text: any,
  options?: {
    error?: boolean;
    type?: string;
    permanent?: boolean;
    hoverInfo?: boolean;
    position?: 'top' | 'bottom';
    minimized?: boolean;
  },
): any {
  console.log('[Flash]', text);
  return null;
}

export async function flashConfirm(
  message: any,
  type: any,
  yesCall = () => {},
  cancelCall = () => {},
  yesNo = false,
): Promise<boolean> {
  // In headless mode, always confirm
  yesCall();
  return true;
}

export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function favicon(domain: string): string {
  if (!domain) return '';
  const res = domain.match(/^(https?:\/\/)?[^/]+/);
  if (res) domain = res[0];
  return `https://favicon.malsync.moe/?domain=${domain}`;
}

export function htmlDecode(text: string): string {
  // Simple HTML decode for headless mode
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export function getBaseText(element: any): string {
  return element.text || '';
}

export function canHideTabs(): boolean {
  return false;
}

export function statusTag(status: any, type: any, id: any): any {
  return false;
}

export function elementInViewport(el: any, horizontalOffset = 0): boolean {
  return true;
}

export function lazyload(doc: any, scrollElement = '.mdl-layout__content'): void {}

export function urlChangeDetect(callback: () => void): number {
  return 0;
}

export function fullUrlChangeDetect(callback: () => void, strip = false): number {
  return 0;
}

export function changeDetect(callback: () => void, func: () => any, immediate = false): number {
  if (immediate) callback();
  return 0;
}

export function waitUntilTrue(condition: Function, callback: Function, interval = 200): any {
  return 0;
}

export function getAsyncWaitUntilTrue(condition: Function, interval = 100): any {
  return {
    asyncWaitUntilTrue: () => Promise.resolve(),
    reset: () => {},
  };
}

export function checkDoubleExecution(): void {}

export function parseHtml(text: string): string {
  return text;
}

export function isFirefox(): boolean {
  return false;
}

export function waitForPageToBeVisible(): Promise<void> {
  return Promise.resolve();
}

export async function clearCache(): Promise<void> {
  const cacheObj = await api.storage.list();
  let deleted = 0;
  for (const key in cacheObj) {
    if (!syncRegex.test(key) && !/(^tagSettings\/.*)/.test(key)) {
      await api.storage.remove(key);
      deleted++;
    }
  }
  console.log(`Cache Cleared [${deleted}]`);
}

export function getselect(data: string, name: string): string {
  const block = data.split(`name="${name}"`)[1].split('</select>')[0];
  if (block.indexOf('selected="selected"') > -1) {
    const opts = block.split('<option');
    for (let i = 0; i < opts.length; ++i) {
      if (opts[i].indexOf('selected="selected"') > -1) {
        return opts[i].split('value="')[1].split('"')[0];
      }
    }
  }
  return '';
}
