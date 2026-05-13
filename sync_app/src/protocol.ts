// Yuri-Sync — MALSync-based tracking service for Yuri-Reader
// Copyright (C) 2025
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

import { handleAuthGetUrl, handleAuthExchange, handleAuthRefresh } from './routes/auth';
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

export function handleMessage(request: JsonRpcRequest): JsonRpcResponse {
  const { method, params, id } = request;

  try {
    let result: unknown;

    switch (method) {
      case 'health.ping':
        result = { status: 'ok', version: '0.1.0' };
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
        result = handleSearch(params || {});
        break;

      case 'entry.get':
        result = handleEntryGet(params || {});
        break;
      case 'entry.update':
        result = handleEntryUpdate(params || {});
        break;
      case 'entry.add':
        result = handleEntryAdd(params || {});
        break;
      case 'entry.delete':
        result = handleEntryDelete(params || {});
        break;

      case 'track.auto':
        result = handleTrackAuto(params || {});
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
