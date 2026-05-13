"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusTranslate = void 0;
exports.translateList = translateList;
exports.parseFuzzyDate = parseFuzzyDate;
exports.getFuzzyDate = getFuzzyDate;
exports.aniListToMal = aniListToMal;
exports.malToAnilist = malToAnilist;
exports.getCacheKey = getCacheKey;
exports.apiCall = apiCall;
exports.imgCheck = imgCheck;
/* eslint-disable no-shadow */
const definitions_1 = require("../definitions");
const Errors_1 = require("../Errors");
const logger = con.m('anilist', '#3db4f2');
function translateList(aniStatus, malStatus = null) {
    const list = {
        CURRENT: definitions_1.status.Watching,
        PLANNING: definitions_1.status.PlanToWatch,
        COMPLETED: definitions_1.status.Completed,
        DROPPED: definitions_1.status.Dropped,
        PAUSED: definitions_1.status.Onhold,
        REPEATING: definitions_1.status.Watching,
    };
    if (malStatus !== null) {
        return Object.keys(list).find(key => list[key] === malStatus);
    }
    return list[aniStatus];
}
var statusTranslate;
(function (statusTranslate) {
    statusTranslate[statusTranslate["CURRENT"] = 1] = "CURRENT";
    statusTranslate[statusTranslate["PLANNING"] = 6] = "PLANNING";
    statusTranslate[statusTranslate["COMPLETED"] = 2] = "COMPLETED";
    statusTranslate[statusTranslate["DROPPED"] = 4] = "DROPPED";
    statusTranslate[statusTranslate["PAUSED"] = 3] = "PAUSED";
    statusTranslate[statusTranslate["REPEATING"] = 23] = "REPEATING";
})(statusTranslate || (exports.statusTranslate = statusTranslate = {}));
function parseFuzzyDate(date) {
    if (!date?.year || !date?.month || !date?.day) {
        return null;
    }
    const year = String(date.year).padStart(4, '0');
    const month = String(date.month).padStart(2, '0');
    const day = String(date.day).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function getFuzzyDate(date) {
    const fuzzyDate = {
        year: null,
        month: null,
        day: null,
    };
    // ES6 doesn't support named capture groups
    const regexMatch = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (regexMatch?.[1] && regexMatch?.[2] && regexMatch?.[3]) {
        fuzzyDate.year = parseInt(regexMatch[1]);
        fuzzyDate.month = parseInt(regexMatch[2]);
        fuzzyDate.day = parseInt(regexMatch[3]);
    }
    return fuzzyDate;
}
function aniListToMal(anilistId, type) {
    const query = `
  query ($id: Int, $type: MediaType) {
    Media (id: $id, type: $type) {
      id
      idMal
    }
  }
  `;
    const variables = {
        id: anilistId,
        type: type.toUpperCase(),
    };
    return api.request
        .xhr('POST', {
        url: 'https://graphql.anilist.co',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        data: JSON.stringify({
            query,
            variables,
        }),
    })
        .then(response => {
        const res = (0, Errors_1.parseJson)(response.responseText);
        con.log(res);
        return res.data.Media.idMal;
    });
}
function malToAnilist(malId, type) {
    const query = `
  query ($id: Int, $type: MediaType) {
    Media (idMal: $id, type: $type) {
      id
      idMal
    }
  }
  `;
    const variables = {
        id: malId,
        type: type.toUpperCase(),
    };
    return api.request
        .xhr('POST', {
        url: 'https://graphql.anilist.co',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        data: JSON.stringify({
            query,
            variables,
        }),
    })
        .then(response => {
        if (response.status === 404)
            return NaN;
        const res = (0, Errors_1.parseJson)(response.responseText);
        con.log(res);
        return res.data.Media.id;
    });
}
function getCacheKey(id, kitsuId) {
    if (Number.isNaN(id) || !id) {
        return `anilist:${kitsuId}`;
    }
    return id;
}
async function apiCall(query, variables, requiresAuthentication = true) {
    if (requiresAuthentication && !api.settings.get('anilistToken')) {
        throw new Errors_1.NotAutenticatedError('No token found');
    }
    const headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (api.settings.get('anilistToken'))
        headers.Authorization = `Bearer ${api.settings.get('anilistToken')}`;
    return api.request
        .xhr('POST', {
        url: 'https://graphql.anilist.co',
        headers,
        data: JSON.stringify({
            query,
            variables,
        }),
    })
        .then(response => {
        try {
            const res = (0, Errors_1.parseJson)(response.responseText);
            if (typeof res.errors !== 'undefined' && res.errors.length) {
                logger.error('[SINGLE]', 'Error', res.errors);
                const error = res.errors[0];
                switch (error.status) {
                    case 400:
                        if (error.message === 'Invalid token' && !requiresAuthentication) {
                            api.settings.set('anilistToken', null);
                            return apiCall(query, variables, requiresAuthentication);
                        }
                        if (error.message === 'validation')
                            throw new Error('Wrong request format');
                        if (error.message.includes('invalid'))
                            throw new Error('Wrong request format');
                        throw new Errors_1.NotAutenticatedError(error.message);
                    case 404:
                        throw new Errors_1.NotFoundError(error.message);
                    default:
                        throw new Error(error.message);
                }
            }
            return res;
        }
        catch (err) {
            if (err instanceof Errors_1.UnexpectedResponseError) {
                if ((response.status > 499 && response.status < 600) || response.status === 0) {
                    throw new Errors_1.ServerOfflineError(`Server Offline status: ${response.status}`);
                }
                if (response.status === 403) {
                    throw new Error(api.storage.lang('Error_Blocked', ['AniList']));
                }
            }
            throw err;
        }
    });
}
function imgCheck(url) {
    if (!url || url.endsWith('/default.jpg'))
        return '';
    return url;
}
//# sourceMappingURL=helper.js.map