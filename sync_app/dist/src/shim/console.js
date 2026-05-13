"use strict";
// SPDX-License-Identifier: GPL-3.0
// Shim for MALSync's con global — Node.js implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.con = exports.m = exports.debug = exports.info = exports.error = exports.log = void 0;
const log = (...args) => console.log('[MAL-Sync]', ...args);
exports.log = log;
const error = (...args) => console.error('[MAL-Sync]', ...args);
exports.error = error;
const info = (...args) => console.info('[MAL-Sync]', ...args);
exports.info = info;
const debug = (...args) => console.debug('[MAL-Sync]', ...args);
exports.debug = debug;
const m = (name, color = '', blocks = []) => {
    const prefix = blocks.map(b => `[${b.name}]`).join('') + `[${name}]`;
    const temp = {};
    temp.m = (name2, color2 = '') => {
        return (0, exports.m)(name2, color2, [...blocks, { name, style: color }]);
    };
    temp.log = (...args) => console.log(prefix, ...args);
    temp.error = (...args) => console.error(prefix, ...args);
    temp.info = (...args) => console.info(prefix, ...args);
    temp.debug = (...args) => console.debug(prefix, ...args);
    return temp;
};
exports.m = m;
exports.con = { log: exports.log, error: exports.error, info: exports.info, debug: exports.debug, m: exports.m };
//# sourceMappingURL=console.js.map