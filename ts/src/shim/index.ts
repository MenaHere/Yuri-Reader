// SPDX-License-Identifier: GPL-3.0
// Sets up MALSync globals for Node.js headless operation

import { api } from './api';
import { con } from './console';
import * as utils from './utils';
import { emitter, globalEmit } from './emitter';
import { j } from './jquery';

// Declare globals that MALSync code expects
(global as any).api = api;
(global as any).con = con;
(global as any).utils = utils;
(global as any).emitter = emitter;
(global as any).globalEmit = globalEmit;
(global as any).j = j;
(global as any).$ = j.$;

// Webpack-defined keys for Simkl / MangaBaka
(global as any).__MAL_SYNC_KEYS__ = {
  simkl: {
    id: 'c898d1d7e4f1760f6c8cc94d95f7b92e',
    secret: '',
  },
  mangabaka: {
    id: '',
    secret: '',
  },
};

/// A promise-returning, in-memory stand-in for one `chrome.storage` area.
///
/// The vendored code is written for a browser extension, where `get`, `set` and
/// `remove` return promises and the caller chains `.catch` onto them. The
/// service keeps its own settings in `~/.yuri-sync`, so this area is only the
/// extension's scratch space: accept the write, remember it for the life of the
/// process, and settle the promise the caller awaits. Plain functions that
/// returned nothing made every call which emits an update throw
/// `Cannot read properties of undefined (reading 'catch')`, after the provider
/// had already been updated.
function memoryStorageArea(area: Record<string, unknown>) {
  const keyList = (keys: unknown): string[] => {
    if (typeof keys === 'string') return [keys];
    if (Array.isArray(keys)) return keys.map(String);
    if (keys && typeof keys === 'object') return Object.keys(keys as object);
    return [];
  };
  return {
    get: (keys?: unknown) => {
      if (keys == null) return Promise.resolve({ ...area });
      const found: Record<string, unknown> = {};
      for (const key of keyList(keys)) {
        if (key in area) found[key] = area[key];
      }
      return Promise.resolve(found);
    },
    set: (items: Record<string, unknown>) => {
      Object.assign(area, items ?? {});
      return Promise.resolve();
    },
    remove: (keys: unknown) => {
      for (const key of keyList(keys)) delete area[key];
      return Promise.resolve();
    },
    clear: () => {
      for (const key of Object.keys(area)) delete area[key];
      return Promise.resolve();
    },
  };
}

// chrome runtime stub
(global as any).chrome = {
  runtime: {
    sendMessage: () => {},
    onMessage: { addListener: () => {} },
    getManifest: () => ({ version: '0.0.0' }),
    getURL: (path: string) => path,
    lastError: null,
  },
  storage: {
    local: memoryStorageArea({}),
    sync: memoryStorageArea({}),
    onChanged: { addListener: () => {} },
  },
  i18n: {
    getMessage: (key: string) => key,
    getUILanguage: () => 'en',
  },
  permissions: {
    getAll: () => Promise.resolve({ origins: [], permissions: [] }),
    contains: () => Promise.resolve(false),
    request: () => Promise.resolve(false),
    onAdded: { addListener: () => {} },
    onRemoved: { addListener: () => {} },
  },
  scripting: {
    registerContentScripts: () => Promise.resolve(),
    unregisterContentScripts: () => Promise.resolve(),
    getRegisteredContentScripts: () => Promise.resolve([]),
  },
  tabs: {
    sendMessage: () => Promise.resolve(),
    hide: () => Promise.resolve(),
  },
  windows: {
    update: () => {},
    create: () => {},
  },
  action: {
    setBadgeText: () => {},
  },
  alarms: {
    get: () => Promise.resolve(undefined),
    clear: () => Promise.resolve(),
    create: () => {},
    onAlarm: { addListener: () => {} },
  },
  notifications: {
    create: () => {},
  },
};

// Minimal DOM globals for code that references them
(global as any).document = {
  visibilityState: 'visible',
  createElement: (tag: string) => ({ setAttribute: () => {}, appendChild: () => {}, style: {} }),
  getElementsByTagName: () => [],
  addEventListener: () => {},
  body: {},
};

(global as any).window = {
  location: { href: '' },
  history: { replaceState: () => {} },
  localStorage: undefined,
  sessionStorage: {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  },
  addEventListener: () => {},
};

// Export for TypeScript imports
export { api, con, utils, emitter, globalEmit, j };
