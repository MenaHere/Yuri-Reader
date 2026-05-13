"use strict";
// SPDX-License-Identifier: GPL-3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessage = handleMessage;
const auth_1 = require("./routes/auth");
const search_1 = require("./routes/search");
const entry_1 = require("./routes/entry");
const track_1 = require("./routes/track");
async function handleMessage(request) {
    const { method, params, id } = request;
    try {
        let result;
        switch (method) {
            case 'health.ping':
                result = { status: 'ok', version: '0.2.0' };
                break;
            case 'auth.getUrl':
                result = (0, auth_1.handleAuthGetUrl)(params || {});
                break;
            case 'auth.exchange':
                result = (0, auth_1.handleAuthExchange)(params || {});
                break;
            case 'auth.refresh':
                result = (0, auth_1.handleAuthRefresh)(params || {});
                break;
            case 'search.query':
                result = await (0, search_1.handleSearch)(params || {});
                break;
            case 'entry.get':
                result = await (0, entry_1.handleEntryGet)(params || {});
                break;
            case 'entry.update':
                result = await (0, entry_1.handleEntryUpdate)(params || {});
                break;
            case 'entry.add':
                result = await (0, entry_1.handleEntryAdd)(params || {});
                break;
            case 'entry.delete':
                result = await (0, entry_1.handleEntryDelete)(params || {});
                break;
            case 'track.auto':
                result = await (0, track_1.handleTrackAuto)(params || {});
                break;
            default:
                return {
                    jsonrpc: '2.0',
                    error: { code: -32601, message: `Method not found: ${method}` },
                    id,
                };
        }
        return { jsonrpc: '2.0', result, id };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
            jsonrpc: '2.0',
            error: { code: -32603, message },
            id,
        };
    }
}
//# sourceMappingURL=protocol.js.map