// SPDX-License-Identifier: GPL-3.0
// Type stubs for dependencies used by MALSync vendor code

declare module 'vue' {
  export type Component = any;
}

declare module 'marked' {
  export function parse(text: string): string;
}

declare module 'string-similarity' {
  export function compareTwoStrings(first: string, second: string): number;
}
