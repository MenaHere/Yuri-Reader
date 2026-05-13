// SPDX-License-Identifier: GPL-3.0
// Yuri-Sync — MALSync-based tracking service for Yuri-Reader

// MUST load shims before any MALSync vendor imports
import './shim/index';

import * as net from 'net';
import { handleMessage } from './protocol';

const HOST = '127.0.0.1';

const server = net.createServer((socket) => {
  let buffer = '';

  socket.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const message = JSON.parse(line);
        handleMessage(message).then((response) => {
          socket.write(JSON.stringify(response) + '\n');
        }).catch((err) => {
          socket.write(
            JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32603, message: err.message || String(err) },
              id: null,
            }) + '\n',
          );
        });
      } catch (e) {
        socket.write(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' },
            id: null,
          }) + '\n',
        );
      }
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('close', () => {});
});

server.listen({ host: HOST, port: 0 }, () => {
  const address = server.address() as net.AddressInfo;
  console.log(`READY:${address.port}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
