"use strict";
// SPDX-License-Identifier: GPL-3.0
// Yuri-Sync — MALSync-based tracking service for Yuri-Reader
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
// MUST load shims before any MALSync vendor imports
require("./shim/index");
const net = __importStar(require("net"));
const protocol_1 = require("./protocol");
const HOST = '127.0.0.1';
const server = net.createServer((socket) => {
    let buffer = '';
    socket.on('data', (data) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
            if (!line.trim())
                continue;
            try {
                const message = JSON.parse(line);
                (0, protocol_1.handleMessage)(message).then((response) => {
                    socket.write(JSON.stringify(response) + '\n');
                }).catch((err) => {
                    socket.write(JSON.stringify({
                        jsonrpc: '2.0',
                        error: { code: -32603, message: err.message || String(err) },
                        id: null,
                    }) + '\n');
                });
            }
            catch (e) {
                socket.write(JSON.stringify({
                    jsonrpc: '2.0',
                    error: { code: -32700, message: 'Parse error' },
                    id: null,
                }) + '\n');
            }
        }
    });
    socket.on('error', (err) => {
        console.error('Socket error:', err.message);
    });
    socket.on('close', () => { });
});
server.listen({ host: HOST, port: 0 }, () => {
    const address = server.address();
    console.log(`READY:${address.port}`);
});
process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});
//# sourceMappingURL=server.js.map