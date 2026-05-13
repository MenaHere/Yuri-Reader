declare const __IS_FIREFOX__: boolean;

declare module "vue" {
  export type Component = any;
  export function reactive<T>(target: T): T;
}
