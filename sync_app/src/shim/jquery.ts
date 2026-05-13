// SPDX-License-Identifier: GPL-3.0
// Minimal jQuery stub for MALSync provider code

function $(selector: any): any {
  if (typeof selector === 'string' && selector.startsWith('<')) {
    // HTML string
    return {
      html: () => '',
      text: () => '',
      find: () => ({ each: () => {}, toArray: () => [], first: () => ({ attr: () => '', parent: () => ({ text: () => '' }) }) }),
      contents: () => ({ filter: () => ({ text: () => '' }) }),
      appendTo: () => $,
      remove: () => {},
      addClass: () => {},
      removeClass: () => {},
      css: () => {},
      slideDown: () => ({ delay: () => ({ queue: () => ({}) }), remove: () => {} }),
      slideUp: () => ({ remove: () => {} }),
      fadeOut: () => ({ remove: () => {} }),
      click: () => {},
      length: 0,
      is: () => false,
      hasClass: () => false,
    };
  }
  return {
    val: () => '',
    html: (content?: string) => content || '',
    text: (content?: string) => content || '',
    find: () => $(null),
    appendTo: () => $(null),
    prepend: () => $(null),
    after: () => $(null),
    remove: () => {},
    addClass: () => {},
    removeClass: () => {},
    css: () => {},
    slideDown: () => ({ delay: () => ({ queue: () => ({}) }), remove: () => {} }),
    slideUp: () => ({ remove: () => {} }),
    fadeOut: () => ({ remove: () => {} }),
    click: () => {},
    each: () => {},
    toArray: () => [],
    first: () => ({ attr: () => '', parent: () => ({ text: () => '' }), find: () => ({ text: () => '' }) }),
    parent: () => ({ text: () => '' }),
    parentsUntil: () => ({ fadeOut: () => {} }),
    filter: () => $(null),
    attr: () => '',
    length: 0,
    is: () => false,
    hasClass: () => false,
  };
}

const $fn: any = $;
$fn.each = (obj: any, callback: any) => {
  if (Array.isArray(obj)) {
    obj.forEach((val, i) => callback(i, val));
  } else if (obj) {
    Object.keys(obj).forEach(key => callback(key, obj[key]));
  }
};
$fn.param = (obj: any) => {
  return new URLSearchParams(Object.entries(obj)).toString();
};
$fn.parseHTML = (html: string) => {
  return [{ textContent: html }];
};

export const j = {
  $: $fn,
  html: (content: string) => content,
};
export default $fn;
