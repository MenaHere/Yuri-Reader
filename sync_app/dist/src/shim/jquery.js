"use strict";
// SPDX-License-Identifier: GPL-3.0
// Minimal jQuery stub for MALSync provider code
Object.defineProperty(exports, "__esModule", { value: true });
exports.j = void 0;
function $(selector) {
    if (typeof selector === 'string' && selector.startsWith('<')) {
        // HTML string
        return {
            html: () => '',
            text: () => '',
            find: () => ({ each: () => { }, toArray: () => [], first: () => ({ attr: () => '', parent: () => ({ text: () => '' }) }) }),
            contents: () => ({ filter: () => ({ text: () => '' }) }),
            appendTo: () => $,
            remove: () => { },
            addClass: () => { },
            removeClass: () => { },
            css: () => { },
            slideDown: () => ({ delay: () => ({ queue: () => ({}) }), remove: () => { } }),
            slideUp: () => ({ remove: () => { } }),
            fadeOut: () => ({ remove: () => { } }),
            click: () => { },
            length: 0,
            is: () => false,
            hasClass: () => false,
        };
    }
    return {
        val: () => '',
        html: (content) => content || '',
        text: (content) => content || '',
        find: () => $(null),
        appendTo: () => $(null),
        prepend: () => $(null),
        after: () => $(null),
        remove: () => { },
        addClass: () => { },
        removeClass: () => { },
        css: () => { },
        slideDown: () => ({ delay: () => ({ queue: () => ({}) }), remove: () => { } }),
        slideUp: () => ({ remove: () => { } }),
        fadeOut: () => ({ remove: () => { } }),
        click: () => { },
        each: () => { },
        toArray: () => [],
        first: () => ({ attr: () => '', parent: () => ({ text: () => '' }), find: () => ({ text: () => '' }) }),
        parent: () => ({ text: () => '' }),
        parentsUntil: () => ({ fadeOut: () => { } }),
        filter: () => $(null),
        attr: () => '',
        length: 0,
        is: () => false,
        hasClass: () => false,
    };
}
const $fn = $;
$fn.each = (obj, callback) => {
    if (Array.isArray(obj)) {
        obj.forEach((val, i) => callback(i, val));
    }
    else if (obj) {
        Object.keys(obj).forEach(key => callback(key, obj[key]));
    }
};
$fn.param = (obj) => {
    return new URLSearchParams(Object.entries(obj)).toString();
};
$fn.parseHTML = (html) => {
    return [{ textContent: html }];
};
exports.j = {
    $: $fn,
    html: (content) => content,
};
exports.default = $fn;
//# sourceMappingURL=jquery.js.map