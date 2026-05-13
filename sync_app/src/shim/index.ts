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
    local: { get: () => {}, set: () => {}, remove: () => {} },
    sync: { get: () => {}, set: () => {}, remove: () => {} },
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
