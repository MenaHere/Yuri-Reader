// SPDX-License-Identifier: GPL-3.0
// Shim for MALSync's con global — Node.js implementation

export const log = (...args: any[]) => console.log('[MAL-Sync]', ...args);
export const error = (...args: any[]) => console.error('[MAL-Sync]', ...args);
export const info = (...args: any[]) => console.info('[MAL-Sync]', ...args);
export const debug = (...args: any[]) => console.debug('[MAL-Sync]', ...args);

export const m = (name: string, color = '', blocks: { name: string; style: string }[] = []) => {
  const prefix = blocks.map(b => `[${b.name}]`).join('') + `[${name}]`;

  const temp: any = {};

  temp.m = (name2: string, color2 = '') => {
    return m(name2, color2, [...blocks, { name, style: color }]);
  };

  temp.log = (...args: any[]) => console.log(prefix, ...args);
  temp.error = (...args: any[]) => console.error(prefix, ...args);
  temp.info = (...args: any[]) => console.info(prefix, ...args);
  temp.debug = (...args: any[]) => console.debug(prefix, ...args);

  return temp;
};

export const con = { log, error, info, debug, m };
