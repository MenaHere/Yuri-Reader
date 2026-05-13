// Yuri-Sync — MALSync-based tracking service for Yuri-Reader
// Copyright (C) 2025
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

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
        const response = handleMessage(message);
        socket.write(JSON.stringify(response) + '\n');
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

  socket.on('close', () => {
    // Client disconnected
  });
});

server.listen({ host: HOST, port: 0 }, () => {
  const address = server.address() as net.AddressInfo;
  // Print READY:PORT so parent process knows where to connect
  console.log(`READY:${address.port}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
