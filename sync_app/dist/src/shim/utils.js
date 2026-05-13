"use strict";
// SPDX-License-Identifier: GPL-3.0
// Shim for MALSync's utils global — Node.js implementation
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitExclude = exports.syncRegex = void 0;
exports.urlPart = urlPart;
exports.urlStrip = urlStrip;
exports.urlParam = urlParam;
exports.watching = watching;
exports.planTo = planTo;
exports.episode = episode;
exports.absoluteLink = absoluteLink;
exports.setResumeWaching = setResumeWaching;
exports.getResumeWaching = getResumeWaching;
exports.setContinueWaching = setContinueWaching;
exports.getContinueWaching = getContinueWaching;
exports.setEntrySettings = setEntrySettings;
exports.getEntrySettings = getEntrySettings;
exports.getUrlFromTags = getUrlFromTags;
exports.setUrlInTags = setUrlInTags;
exports.handleMalImages = handleMalImages;
exports.pageUrl = pageUrl;
exports.returnYYYYMMDD = returnYYYYMMDD;
exports.sortAlphabetically = sortAlphabetically;
exports.isDomainMatching = isDomainMatching;
exports.upperCaseFirstLetter = upperCaseFirstLetter;
exports.getStatusText = getStatusText;
exports.timeDiffToText = timeDiffToText;
exports.notifications = notifications;
exports.timeCache = timeCache;
exports.flashm = flashm;
exports.flashConfirm = flashConfirm;
exports.wait = wait;
exports.favicon = favicon;
exports.htmlDecode = htmlDecode;
exports.getBaseText = getBaseText;
exports.canHideTabs = canHideTabs;
exports.statusTag = statusTag;
exports.elementInViewport = elementInViewport;
exports.lazyload = lazyload;
exports.urlChangeDetect = urlChangeDetect;
exports.fullUrlChangeDetect = fullUrlChangeDetect;
exports.changeDetect = changeDetect;
exports.waitUntilTrue = waitUntilTrue;
exports.getAsyncWaitUntilTrue = getAsyncWaitUntilTrue;
exports.checkDoubleExecution = checkDoubleExecution;
exports.parseHtml = parseHtml;
exports.isFirefox = isFirefox;
exports.waitForPageToBeVisible = waitForPageToBeVisible;
exports.clearCache = clearCache;
exports.getselect = getselect;
const api_1 = require("./api");
function urlPart(url, part) {
    if (!url)
        return '';
    const urlParts = url.split('/');
    if (!urlParts[part])
        return '';
    return urlParts[part].replace(/[#?].*/, '');
}
function urlStrip(url) {
    return url.replace(/[#?].*/, '');
}
function urlParam(url, name) {
    const results = new RegExp(`[?&]${name}=([^&#]*)`).exec(url);
    if (results === null)
        return null;
    return decodeURI(results[1]) || 0;
}
function watching(type) {
    if (type === 'manga')
        return 'Reading';
    return 'Watching';
}
function planTo(type) {
    if (type === 'manga')
        return 'Plan to Read';
    return 'Plan to Watch';
}
function episode(type) {
    if (type === 'manga')
        return api_1.api.storage.lang('UI_Chapter');
    return api_1.api.storage.lang('UI_Episode');
}
exports.syncRegex = /(^settings\/.*|^updateCheckTime$|^tempVersion$|^local:\/\/|^list-tagSettings$)/;
exports.rateLimitExclude = /^https:\/\/api.malsync.moe\/(shark|mal\/|nc\/mal\/.*\/progress$)/i;
function absoluteLink(url, domain) {
    if (typeof url === 'undefined')
        return url;
    if (!url.startsWith('http')) {
        if (url.charAt(0) !== '/')
            url = `/${url}`;
        url = domain + url;
    }
    return url;
}
async function setResumeWaching(url, ep, type, id) {
    return api_1.api.storage.set(`resume/${type}/${id}`, { url, ep });
}
async function getResumeWaching(type, id) {
    if (!api_1.api.settings.get('malResume'))
        return undefined;
    return api_1.api.storage.get(`resume/${type}/${id}`);
}
async function setContinueWaching(url, ep, type, id) {
    return api_1.api.storage.set(`continue/${type}/${id}`, { url, ep });
}
async function getContinueWaching(type, id) {
    if (!api_1.api.settings.get('malContinue'))
        return undefined;
    return api_1.api.storage.get(`continue/${type}/${id}`);
}
async function setEntrySettings(type, id, options, tags = '') {
    const tempOptions = {};
    if (options) {
        for (const key in options) {
            switch (key) {
                case 'u':
                case 'p':
                    tempOptions[key] = options[key];
                    break;
                default:
            }
        }
        if (api_1.api.settings.get('malTags')) {
            tags = setUrlInTags(JSON.stringify(tempOptions), tags);
        }
        else {
            await api_1.api.storage.set(`tagSettings/${type}/${id}`, JSON.stringify(tempOptions));
        }
    }
    if (!Object.values(tempOptions).find(el => Boolean(el))) {
        tags = setUrlInTags('', tags);
        if (!api_1.api.settings.get('malTags')) {
            await api_1.api.storage.remove(`tagSettings/${type}/${id}`);
        }
    }
    return tags;
}
async function getEntrySettings(type, id, tags = '') {
    const tempOptions = {
        u: null,
        c: null,
        r: null,
        p: '',
    };
    if (api_1.api.settings.get('malTags')) {
        const tagString = getUrlFromTags(tags);
        if (tagString) {
            if (tagString[0] === '{') {
                try {
                    const temp = JSON.parse(tagString);
                    for (const key in tempOptions) {
                        if (temp[key])
                            tempOptions[key] = temp[key];
                    }
                }
                catch (e) {
                    console.error(e);
                }
            }
            else {
                tempOptions.u = tagString;
            }
        }
    }
    else {
        let temp = await api_1.api.storage.get(`tagSettings/${type}/${id}`);
        if (temp) {
            temp = JSON.parse(temp);
            for (const key in tempOptions) {
                if (temp[key])
                    tempOptions[key] = temp[key];
            }
        }
    }
    const continueUrlObj = await getContinueWaching(type, id);
    if (continueUrlObj)
        tempOptions.c = continueUrlObj;
    const resumeUrlObj = await getResumeWaching(type, id);
    if (resumeUrlObj)
        tempOptions.r = resumeUrlObj;
    if (!api_1.api.settings.get('usedPage'))
        tempOptions.u = null;
    return tempOptions;
}
function getUrlFromTags(tags) {
    if (/malSync::[\d\D]+::/.test(tags)) {
        return atobURL(tags.split('malSync::')[1].split('::')[0]);
    }
    if (/last::[\d\D]+::/.test(tags)) {
        return atobURL(tags.split('last::')[1].split('::')[0]);
    }
    return undefined;
    function atobURL(encoded) {
        try {
            return Buffer.from(encoded, 'base64').toString('utf-8');
        }
        catch (e) {
            return encoded;
        }
    }
}
function setUrlInTags(url, tags) {
    if (url === '') {
        tags = tags.replace(/,?(malSync|last)::[^ \n]+?::/, '');
        return tags;
    }
    if (!api_1.api.settings.get('malTags'))
        return tags;
    const addition = `malSync::${Buffer.from(url).toString('base64')}::`;
    if (/(last|malSync)::[\d\D]+::/.test(tags)) {
        tags = tags.replace(/(last|malSync)::[^^]*?::/, addition);
    }
    else {
        tags = `${tags},${addition}`;
    }
    return tags;
}
function handleMalImages(url) {
    if (url.indexOf('questionmark') !== -1)
        return api_1.api.storage.assetUrl('questionmark.gif');
    return url;
}
function pageUrl(page, type, id) {
    switch (page) {
        case 'mal':
            return `https://myanimelist.net/${type}/${id}`;
        case 'anilist':
            return `https://anilist.co/${type}/${id}`;
        case 'kitsu':
            return `https://kitsu.app/${type}/${id}`;
        case 'simkl':
            return `https://simkl.com/${type}/${id}`;
        default:
            throw `${page} not a valid page`;
    }
}
function returnYYYYMMDD(numFromToday = 0) {
    const d = new Date();
    d.setDate(d.getDate() + numFromToday);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}
function sortAlphabetically(a, b) {
    if (a.toLowerCase() < b.toLowerCase())
        return -1;
    if (a.toLowerCase() > b.toLowerCase())
        return 1;
    return 0;
}
function isDomainMatching(url, domain) {
    const urlObj = new URL(url);
    const { host } = urlObj;
    return host === domain || host.endsWith(`.${domain}`);
}
function upperCaseFirstLetter(string) {
    if (!string || string.length < 2)
        return string;
    return string.charAt(0).toUpperCase() + string.slice(1);
}
function getStatusText(type, state) {
    switch (state) {
        case 1:
            return api_1.api.storage.lang(`UI_Status_watching_${type}`);
        case 2:
            return api_1.api.storage.lang('UI_Status_Completed');
        case 3:
            return api_1.api.storage.lang('UI_Status_OnHold');
        case 4:
            return api_1.api.storage.lang('UI_Status_Dropped');
        case 6:
            return api_1.api.storage.lang(`UI_Status_planTo_${type}`);
        case 7:
            return api_1.api.storage.lang('UI_Status_All');
        case 23:
            return api_1.api.storage.lang(`UI_Status_Rewatching_${type}`);
        case 24:
            return api_1.api.storage.lang('UI_Status_Considering');
        default:
            return '';
    }
}
function timeDiffToText(delta) {
    let text = '';
    delta /= 1000;
    const diffYears = Math.floor(delta / 31536000);
    delta -= diffYears * 31536000;
    if (diffYears)
        text += `${diffYears}y `;
    const diffDays = Math.floor(delta / 86400);
    delta -= diffDays * 86400;
    if (diffDays)
        text += `${diffDays}d `;
    const diffHours = Math.floor(delta / 3600) % 24;
    delta -= diffHours * 3600;
    if (diffHours && diffDays < 2)
        text += `${diffHours}h `;
    const diffMinutes = Math.floor(delta / 60) % 60;
    delta -= diffMinutes * 60;
    if (diffMinutes && !diffDays && diffHours < 3)
        text += `${diffMinutes}min `;
    return text;
}
function notifications(url, title, message, iconUrl = '') {
    // No-op in headless mode
}
async function timeCache(key, dataFunction, ttl) {
    const value = await api_1.api.storage.get(key);
    if (typeof value === 'object' && new Date().getTime() < value.timestamp) {
        return value.data;
    }
    const result = await dataFunction();
    await api_1.api.storage.set(key, { data: result, timestamp: new Date().getTime() + ttl });
    return result;
}
function flashm(text, options) {
    console.log('[Flash]', text);
    return null;
}
async function flashConfirm(message, type, yesCall = () => { }, cancelCall = () => { }, yesNo = false) {
    // In headless mode, always confirm
    yesCall();
    return true;
}
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function favicon(domain) {
    if (!domain)
        return '';
    const res = domain.match(/^(https?:\/\/)?[^/]+/);
    if (res)
        domain = res[0];
    return `https://favicon.malsync.moe/?domain=${domain}`;
}
function htmlDecode(text) {
    // Simple HTML decode for headless mode
    return text
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}
function getBaseText(element) {
    return element.text || '';
}
function canHideTabs() {
    return false;
}
function statusTag(status, type, id) {
    return false;
}
function elementInViewport(el, horizontalOffset = 0) {
    return true;
}
function lazyload(doc, scrollElement = '.mdl-layout__content') { }
function urlChangeDetect(callback) {
    return 0;
}
function fullUrlChangeDetect(callback, strip = false) {
    return 0;
}
function changeDetect(callback, func, immediate = false) {
    if (immediate)
        callback();
    return 0;
}
function waitUntilTrue(condition, callback, interval = 200) {
    return 0;
}
function getAsyncWaitUntilTrue(condition, interval = 100) {
    return {
        asyncWaitUntilTrue: () => Promise.resolve(),
        reset: () => { },
    };
}
function checkDoubleExecution() { }
function parseHtml(text) {
    return text;
}
function isFirefox() {
    return false;
}
function waitForPageToBeVisible() {
    return Promise.resolve();
}
async function clearCache() {
    const cacheObj = await api_1.api.storage.list();
    let deleted = 0;
    for (const key in cacheObj) {
        if (!exports.syncRegex.test(key) && !/(^tagSettings\/.*)/.test(key)) {
            await api_1.api.storage.remove(key);
            deleted++;
        }
    }
    console.log(`Cache Cleared [${deleted}]`);
}
function getselect(data, name) {
    const block = data.split(`name="${name}"`)[1].split('</select>')[0];
    if (block.indexOf('selected="selected"') > -1) {
        const opts = block.split('<option');
        for (let i = 0; i < opts.length; ++i) {
            if (opts[i].indexOf('selected="selected"') > -1) {
                return opts[i].split('value="')[1].split('"')[0];
            }
        }
    }
    return '';
}
//# sourceMappingURL=utils.js.map