"use strict";
// SPDX-License-Identifier: GPL-3.0
// Minimal emitter shim for MALSync provider code
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = void 0;
exports.globalEmit = globalEmit;
const events_1 = require("events");
exports.emitter = new events_1.EventEmitter();
function globalEmit(eventName, ...params) {
    exports.emitter.emit(eventName, ...params);
}
//# sourceMappingURL=emitter.js.map