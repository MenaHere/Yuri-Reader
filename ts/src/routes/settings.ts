// SPDX-License-Identifier: GPL-3.0

import { api } from '../shim/api';

export function handleSettingsSet(params: Record<string, unknown>): Record<string, unknown> {
  const key = params.key as string;
  const value = params.value;
  if (!key) throw new Error('Missing key parameter');
  api.settings.set(key, value);
  return { key, status: 'ok' };
}

export function handleSettingsGet(params: Record<string, unknown>): Record<string, unknown> {
  const key = params.key as string;
  if (!key) throw new Error('Missing key parameter');
  const value = api.settings.get(key);
  return { key, value };
}

/// Credentials and anything that only exists to hold one. A settings screen
/// shows what can be changed, not the tokens behind the logins.
const SECRET = /token|refresh|secret|password|apikey/i;

export function handleSettingsList(): Record<string, unknown> {
  const options = (api.settings.options ?? {}) as Record<string, unknown>;
  const settings: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (SECRET.test(key)) continue;
    settings[key] = value;
  }
  return { settings };
}
