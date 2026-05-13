// SPDX-License-Identifier: GPL-3.0

import { api } from '../shim/api';

const authUrls: Record<string, string> = {
  anilist: 'https://anilist.co/api/v2/oauth/authorize?client_id=1487&response_type=token',
  mal: 'https://malsync.moe/mal/oauth',
  kitsu: 'https://kitsu.app/404?mal-sync=authentication',
  simkl: 'https://simkl.com/oauth/authorize?response_type=code&client_id=c898d1d7e4f1760f6c8cc94d95f7b92e&redirect_uri=https://simkl.com/apps/chrome/mal-sync/connected/',
  shikimori: 'https://shikimori.one/oauth/authorize?client_id=z3NJ84kK9iy5NU6SnhdCDB38rr4-jFIJ67bMIUDzdoo&redirect_uri=https%3A%2F%2Fmalsync.moe%2Fshikimori%2Foauth&response_type=code&scope=user_rates',
  mangabaka: 'https://malsync.moe/mangabaka/oauth',
};

export function handleAuthGetUrl(params: Record<string, unknown>): Record<string, unknown> {
  const provider = params.provider as string;
  const url = authUrls[provider];
  if (!url) throw new Error(`Unknown provider: ${provider}`);
  return { url };
}

export function handleAuthExchange(params: Record<string, unknown>): Record<string, unknown> {
  const provider = params.provider as string;
  const token = params.token as string;
  const refreshToken = params.refreshToken as string;

  // Store tokens in settings
  switch (provider) {
    case 'anilist':
      api.settings.set('anilistToken', token);
      break;
    case 'mal':
      api.settings.set('malToken', token);
      if (refreshToken) api.settings.set('malRefresh', refreshToken);
      break;
    case 'kitsu':
      api.settings.set('kitsuToken', token);
      break;
    case 'simkl':
      api.settings.set('simklToken', token);
      break;
    case 'shikimori':
      api.settings.set('shikiToken', { access_token: token, refresh_token: refreshToken || '' });
      break;
    case 'mangabaka':
      api.settings.set('mangabakaToken', token);
      if (refreshToken) api.settings.set('mangabakaRefresh', refreshToken);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return { provider, status: 'ok' };
}

export function handleAuthRefresh(params: Record<string, unknown>): Record<string, unknown> {
  const provider = params.provider as string;
  const refreshToken = params.refreshToken as string;
  return { provider, refreshToken, status: 'not_implemented' };
}
