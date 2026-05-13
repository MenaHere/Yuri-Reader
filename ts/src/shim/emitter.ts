// SPDX-License-Identifier: GPL-3.0
// Minimal emitter shim for MALSync provider code

import { EventEmitter } from 'events';

export const emitter = new EventEmitter();

export function globalEmit(eventName: string, ...params: any[]) {
  emitter.emit(eventName, ...params);
}
