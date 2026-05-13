// SPDX-License-Identifier: GPL-3.0

import { handleAuthGetUrl, handleAuthExchange, handleAuthRefresh } from './routes/auth';
import { handleSettingsSet, handleSettingsGet } from './routes/settings';
import { handleSearch } from './routes/search';
import { handleEntryGet, handleEntryUpdate, handleEntryAdd, handleEntryDelete } from './routes/entry';
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

      case 'entry.get':
        result = await handleEntryGet(params || {});
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

      default:
        return {
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id,
        };
    }

    return { jsonrpc: '2.0', result, id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      jsonrpc: '2.0',
      error: { code: -32603, message },
      id,
    };
  }
}
