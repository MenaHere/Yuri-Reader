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
