// SPDX-License-Identifier: GPL-3.0

import { handleAuthGetUrl, handleAuthExchange, handleAuthRefresh } from './routes/auth';
import { handleSettingsSet, handleSettingsGet, handleSettingsList } from './routes/settings';
import { handleSearch } from './routes/search';
import {
  handleEntryFind,
  handleEntryGet,
  handleEntryUpdate,
  handleEntryAdd,
  handleEntryDelete,
  handleEntryList,
} from './routes/entry';
import { handleEntryMeta } from './routes/meta';
import { handleTrackAuto } from './routes/track';

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: number | string | null;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: JsonRpcError;
  id?: number | string | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

/// Some of malsync's errors carry no message at all - `NotAutenticatedError`
/// is one - and an empty message reaches the app as a bare "Exception:".
function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  if (error.message) return error.message;
  if (error.name === 'NotAutenticatedError') {
    return 'not logged in to the tracking service';
  }
  return error.name;
}

export async function handleMessage(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  const { method, params, id } = request;

  try {
    let result: unknown;

    switch (method) {
      case 'health.ping':
        result = { status: 'ok', version: '0.2.0' };
        break;

      case 'auth.getUrl':
        result = handleAuthGetUrl(params || {});
        break;
      case 'auth.exchange':
        result = handleAuthExchange(params || {});
        break;
      case 'auth.refresh':
        result = handleAuthRefresh(params || {});
        break;

      case 'search.query':
        result = await handleSearch(params || {});
        break;

      case 'entry.find':
        result = await handleEntryFind(params || {});
        break;
      case 'entry.get':
        result = await handleEntryGet(params || {});
        break;
      case 'entry.list':
        result = await handleEntryList(params || {});
        break;
      case 'entry.meta':
        result = await handleEntryMeta(params || {});
        break;
      case 'entry.update':
        result = await handleEntryUpdate(params || {});
        break;
      case 'entry.add':
        result = await handleEntryAdd(params || {});
        break;
      case 'entry.delete':
        result = await handleEntryDelete(params || {});
        break;

      case 'track.auto':
        result = await handleTrackAuto(params || {});
        break;

      case 'settings.set':
        result = handleSettingsSet(params || {});
        break;
      case 'settings.get':
        result = handleSettingsGet(params || {});
        break;
      case 'settings.list':
        result = handleSettingsList();
        break;

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        };
    }

    return { jsonrpc: '2.0', result, id };
  } catch (error) {
    return {
      jsonrpc: '2.0',
      error: { code: -32603, message: errorMessage(error) },
      id,
    };
  }
}
