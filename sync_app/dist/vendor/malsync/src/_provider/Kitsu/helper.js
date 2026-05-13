"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateList = translateList;
exports.timestampToDate = timestampToDate;
exports.dateToTimestamp = dateToTimestamp;
exports.getTitle = getTitle;
exports.getCacheKey = getCacheKey;
exports.malToKitsu = malToKitsu;
exports.kitsuToMal = kitsuToMal;
exports.apiCall = apiCall;
const definitions_1 = require("../definitions");
const Errors_1 = require("../Errors");
const logger = con.m('kitsu', '#d65e43');
function translateList(aniStatus, malStatus = null) {
    const list = {
        current: definitions_1.status.Watching,
        planned: definitions_1.status.PlanToWatch,
        completed: definitions_1.status.Completed,
        dropped: definitions_1.status.Dropped,
        on_hold: definitions_1.status.Onhold,
    };
    if (malStatus !== null) {
        return Object.keys(list).find(key => list[key] === malStatus);
    }
    return list[aniStatus];
}
function timestampToDate(timestamp) {
    if (typeof timestamp !== 'string') {
        return null;
    }
    return timestamp.substring(0, 10);
}
function dateToTimestamp(date) {
    if (typeof date !== 'string') {
        return null;
    }
    return `${date}T00:00:00.000Z`;
}
function getTitle(titles, canonicalTitle) {
    let title;
    switch (api.settings.get('kitsuOptions').titleLanguagePreference) {
        case 'english':
            title = titles.en;
            break;
        case 'romanized':
            title = titles.en_jp;
            break;
        case 'canonical':
        default:
            title = canonicalTitle;
    }
    if (typeof title === 'undefined' || !title)
        title = titles.en;
    if (typeof title === 'undefined' || !title)
        title = titles.en_jp;
    if (typeof title === 'undefined' || !title)
        title = titles.ja_jp;
    if (typeof title === 'undefined' || !title) {
        const keys = Object.keys(titles);
        if (!keys.length) {
            return 'No Title';
        }
        title = titles[keys[0]];
    }
    return title;
}
function getCacheKey(id, kitsuId) {
    if (Number.isNaN(id) || !id) {
        return `kitsu:${kitsuId}`;
    }
    return id;
}
function malToKitsu(malid, type) {
    return apiCall('GET', `https://kitsu.app/api/edge/mappings?filter[externalSite]=myanimelist/${type}&filter[externalId]=${malid}&include=item&fields[item]=id`, {}, false);
}
function kitsuToMal(kitsuId, type) {
    return api.request
        .xhr('GET', {
        url: `https://kitsu.app/api/edge/${type}/${kitsuId}/mappings?filter[externalSite]=myanimelist/${type}`,
        headers: {
            'Content-Type': 'application/vnd.api+json',
            Accept: 'application/vnd.api+json',
        },
    })
        .then(response => {
        const res = JSON.parse(response.responseText);
        con.log('[KtoM]', res);
        if (typeof res.data === 'undefined' || !res.data.length)
            return null;
        return Number(res.data[0].attributes.externalId);
    });
}
function apiCall(mode, url, variables = {}, authentication = true) {
    const headers = {
        'Content-Type': 'application/vnd.api+json',
        Accept: 'application/vnd.api+json',
    };
    if (authentication)
        headers.Authorization = `Bearer ${api.settings.get('kitsuToken')}`;
    return api.request
        .xhr(mode, {
        url,
        headers,
        data: mode !== 'GET' ? JSON.stringify(variables) : undefined,
    })
        .then(response => {
        if ((response.status > 499 && response.status < 600) || response.status === 0) {
            throw new Errors_1.ServerOfflineError(`Server Offline status: ${response.status}`);
        }
        if (response.status === 204) {
            return {};
        }
        const res = (0, Errors_1.parseJson)(response.responseText);
        if (typeof res.errors !== 'undefined' && res.errors.length) {
            logger.error('[SINGLE]', 'Error', res.errors);
            const error = res.errors[0];
            switch (parseInt(error.status)) {
                case 401:
                case 403:
                    throw new Errors_1.NotAutenticatedError(error.detail);
                case 404:
                    throw new Errors_1.NotFoundError(error.detail);
                default:
                    throw new Error(error.detail);
            }
        }
        return res;
    });
}
//# sourceMappingURL=helper.js.map