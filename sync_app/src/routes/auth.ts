// Yuri-Sync — MALSync-based tracking service for Yuri-Reader
// Copyright (C) 2025
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

export function handleAuthGetUrl(params: Record<string, unknown>): Record<string, unknown> {
  const provider = params.provider as string;

  switch (provider) {
    case 'anilist':
      return {
        url: 'https://anilist.co/api/v2/oauth/authorize?client_id=1487&response_type=token',
      };
    case 'mal':
      return {
        url: 'https://myanimelist.net/v1/oauth2/authorize?response_type=code',
      };
    case 'kitsu':
      return {
        url: 'https://kitsu.io/api/oauth',
      };
    case 'simkl':
      return {
        url: 'https://simkl.com/oauth/authorize',
      };
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

export function handleAuthExchange(params: Record<string, unknown>): Record<string, unknown> {
  // TODO: Implement OAuth code exchange for each provider
  const provider = params.provider as string;
  const code = params.code as string;
  return { provider, code, status: 'not_implemented' };
}

export function handleAuthRefresh(params: Record<string, unknown>): Record<string, unknown> {
  // TODO: Implement token refresh for each provider
  const provider = params.provider as string;
  const refreshToken = params.refreshToken as string;
  return { provider, refreshToken, status: 'not_implemented' };
}
