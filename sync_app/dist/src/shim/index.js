"use strict";
// SPDX-License-Identifier: GPL-3.0
// Sets up MALSync globals for Node.js headless operation
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.j = exports.globalEmit = exports.emitter = exports.utils = exports.con = exports.api = void 0;
const api_1 = require("./api");
Object.defineProperty(exports, "api", { enumerable: true, get: function () { return api_1.api; } });
const console_1 = require("./console");
Object.defineProperty(exports, "con", { enumerable: true, get: function () { return console_1.con; } });
const utils = __importStar(require("./utils"));
exports.utils = utils;
const emitter_1 = require("./emitter");
Object.defineProperty(exports, "emitter", { enumerable: true, get: function () { return emitter_1.emitter; } });
Object.defineProperty(exports, "globalEmit", { enumerable: true, get: function () { return emitter_1.globalEmit; } });
const jquery_1 = require("./jquery");
Object.defineProperty(exports, "j", { enumerable: true, get: function () { return jquery_1.j; } });
// Declare globals that MALSync code expects
global.api = api_1.api;
global.con = console_1.con;
global.utils = utils;
global.emitter = emitter_1.emitter;
global.globalEmit = emitter_1.globalEmit;
global.j = jquery_1.j;
global.$ = jquery_1.j.$;
// Webpack-defined keys for Simkl / MangaBaka
global.__MAL_SYNC_KEYS__ = {
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
global.chrome = {
    runtime: {
        sendMessage: () => { },
        onMessage: { addListener: () => { } },
        getManifest: () => ({ version: '0.0.0' }),
        getURL: (path) => path,
        lastError: null,
    },
    storage: {
        local: { get: () => { }, set: () => { }, remove: () => { } },
        sync: { get: () => { }, set: () => { }, remove: () => { } },
        onChanged: { addListener: () => { } },
    },
    i18n: {
        getMessage: (key) => key,
        getUILanguage: () => 'en',
    },
    permissions: {
        getAll: () => Promise.resolve({ origins: [], permissions: [] }),
        contains: () => Promise.resolve(false),
        request: () => Promise.resolve(false),
        onAdded: { addListener: () => { } },
        onRemoved: { addListener: () => { } },
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
        update: () => { },
        create: () => { },
    },
    action: {
        setBadgeText: () => { },
    },
    alarms: {
        get: () => Promise.resolve(undefined),
        clear: () => Promise.resolve(),
        create: () => { },
        onAlarm: { addListener: () => { } },
    },
    notifications: {
        create: () => { },
    },
};
// Minimal DOM globals for code that references them
global.document = {
    visibilityState: 'visible',
    createElement: (tag) => ({ setAttribute: () => { }, appendChild: () => { }, style: {} }),
    getElementsByTagName: () => [],
    addEventListener: () => { },
    body: {},
};
global.window = {
    location: { href: '' },
    history: { replaceState: () => { } },
    localStorage: undefined,
    sessionStorage: {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
    },
    addEventListener: () => { },
};
//# sourceMappingURL=index.js.map