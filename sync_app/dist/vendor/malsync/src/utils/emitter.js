"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitter = void 0;
exports.globalEmit = globalEmit;
const eventemitter2_1 = require("eventemitter2");
const scriptId = Math.floor(Math.random() * 1000000000);
exports.emitter = new eventemitter2_1.EventEmitter2({
    wildcard: true,
});
function globalEmit(eventName, ...params) {
    con
        .m('Global')
        .m('Emit')
        .debug(eventName, ...params);
    exports.emitter.emit(`${eventName}`, ...params);
    if (typeof api !== 'undefined' && api && api.type === 'webextension') {
        chrome.runtime.sendMessage({
            name: 'emitter',
            item: { event: eventName, params, id: scriptId },
        });
    }
}
if (typeof api !== 'undefined' && api && api.type === 'webextension') {
    chrome.runtime.sendMessage({
        name: 'registerEmitter',
    });
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.name && message.name === 'emitter') {
            con.m('Global').m('Event').debug(message.item.id, message.item.event, message.item.params);
            if (message.item.id !== scriptId) {
                exports.emitter.emit(message.item.event, ...message.item.params);
            }
        }
    });
}
//# sourceMappingURL=emitter.js.map