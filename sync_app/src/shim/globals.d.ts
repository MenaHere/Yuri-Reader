// SPDX-License-Identifier: GPL-3.0
// Global declarations for MALSync vendor code

declare const api: typeof import('./api')['api'];
declare const con: typeof import('./console')['con'];
declare const utils: typeof import('./utils');
declare const emitter: typeof import('./emitter')['emitter'];
declare const globalEmit: typeof import('./emitter')['globalEmit'];
declare const j: typeof import('./jquery')['j'];
declare const $: typeof import('./jquery')['default'];
declare const __MAL_SYNC_KEYS__: any;

// Browser globals as values
declare const document: any;
declare const window: any;
declare const DOMParser: any;
declare const localStorage: any;
declare const sessionStorage: any;
declare const alert: any;
declare const jQuery: any;
declare const Node: any;
declare const Image: any;
declare const ShadowRoot: any;

// JQuery as any so all method calls pass
type JQuery<T = any> = any;

// Browser types used in type annotations
interface Element {}
interface HTMLElement {}
interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// chrome as both value and namespace
declare const chrome: any;
declare namespace chrome {
  namespace runtime {
    interface MessageSender {}
  }
}

// Missing modules
declare module 'fuse.js' {
  class Fuse<T = any> {
    constructor(list: T[], options?: any);
    search(pattern: string): any[];
  }
  export default Fuse;
}
declare module 'vue-dompurify-html';
declare module 'hex-to-hsl';
declare module 'webext-patterns';
declare module 'dompurify';

// Extend Intl.DateTimeFormat for formatRange
declare global {
  namespace Intl {
    interface DateTimeFormat {
      formatRange(start: Date, end: Date): string;
    }
  }
}
