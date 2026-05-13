"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.urls = exports.logger = exports.authenticationUrl = exports.apiDomain = void 0;
exports.call = call;
exports.errorHandling = errorHandling;
exports.bakaStateToState = bakaStateToState;
exports.stateToBakaState = stateToBakaState;
exports.getAlternativeTitles = getAlternativeTitles;
exports.getImageUrl = getImageUrl;
exports.timestampToDate = timestampToDate;
exports.dateToTimestamp = dateToTimestamp;
const Errors_1 = require("../Errors");
const definitions_1 = require("../definitions");
exports.apiDomain = 'https://api.mangabaka.dev';
exports.authenticationUrl = 'https://malsync.moe/mangabaka/oauth';
exports.logger = con.m('MangaBaka', '#ff66aa');
exports.urls = {
    userInfo() {
        return 'https://mangabaka.org/auth/oauth2/userinfo';
    },
    series(id) {
        return `${exports.apiDomain}/v1/series/${id}`;
    },
    search(keyword, page = 1, limit = 50) {
        const data = { q: keyword, page, limit };
        return `${exports.apiDomain}/v1/series/search?${new URLSearchParams(Object.entries(data))}`;
    },
    seriesByAniId(id) {
        return `${exports.apiDomain}/v1/source/anilist/${id}`;
    },
    seriesByMalId(id) {
        return `${exports.apiDomain}/v1/source/my-anime-list/${id}`;
    },
    seriesRelated(id) {
        return `${exports.apiDomain}/v1/series/${id}/related`;
    },
    library(state = null, sortBy = 'default', page = 1, limit = 100) {
        const data = { sort_by: sortBy, page, limit };
        if (state) {
            data.state = state;
        }
        return `${exports.apiDomain}/v1/my/library?${new URLSearchParams(Object.entries(data))}`;
    },
    libraryEntry(id) {
        return `${exports.apiDomain}/v1/my/library/${id}`;
    },
};
async function call(url, sData = {}, method = 'GET', login = true) {
    exports.logger.m('api').log(method, url, sData);
    const headers = {
        client_id: __MAL_SYNC_KEYS__.mangabaka.id,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
    };
    if (login) {
        headers.Authorization = `Bearer ${api.settings.get('mangabakaToken')}`;
    }
    else
        exports.logger.m('api').log('No login');
    if (method === 'GET') {
        sData = undefined;
    }
    return api.request
        .xhr(method, {
        url,
        headers,
        data: JSON.stringify(sData),
    })
        .then(async (response) => {
        const res = (0, Errors_1.parseJson)(response.responseText);
        errorHandling(res, response.status);
        return res;
    })
        .catch(async (err) => {
        if (err instanceof Errors_1.TokenExpiredError) {
            if (await refreshToken()) {
                return call(url, sData, method, login);
            }
            throw new Errors_1.NotAutenticatedError('user_token_failed');
        }
        throw err;
    });
}
async function refreshToken() {
    const l = exports.logger.m('Refresh');
    l.log('Refresh Access Token');
    const rToken = api.settings.get('mangabakaRefresh');
    if (!rToken)
        return false;
    return api.request
        .xhr('POST', {
        url: 'https://mangabaka.org/auth/oauth2/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: `client_id=${__MAL_SYNC_KEYS__.mangabaka.id}&client_secret=${__MAL_SYNC_KEYS__.mangabaka.secret}&grant_type=refresh_token&refresh_token=${rToken}`,
    })
        .then(res => {
        return (0, Errors_1.parseJson)(res.responseText);
    })
        .then(json => {
        if (json && json.refresh_token && json.access_token) {
            api.settings.set('mangabakaToken', json.access_token);
            api.settings.set('mangabakaRefresh', json.refresh_token);
            return true;
        }
        if (json && json.error) {
            l.error(json.error, '|', json.message);
            api.settings.set('mangabakaRefresh', '');
            return false;
        }
        l.error('Something went wrong');
        return false;
    });
}
function errorHandling(res, code) {
    if ((code > 499 && code < 600) || code === 0) {
        throw new Errors_1.ServerOfflineError(`Server Offline status: ${code}`);
    }
    if (res && (res.status < 200 || res.status >= 300)) {
        switch (res.status) {
            case 401:
                throw new Errors_1.TokenExpiredError('user_token_failed');
            case 404:
                throw new Errors_1.NotFoundError(res.message || 'Not Found');
            default:
                throw new Error(res.message
                    ? `${res.message} (${res.status})`
                    : `Unknown Error, status code: ${res.status}`);
        }
    }
    // Userinfo call
    if (res && typeof res.error !== 'undefined') {
        switch (res.error) {
            case 'invalid_token':
            case 'invalid_request':
            case 'expired_token':
                throw new Errors_1.TokenExpiredError(res.error_description || 'Token Expired');
            default:
                throw new Error(res.error_description ? `${res.error_description} (${res.error})` : res.error);
        }
    }
}
function bakaStateToState(input) {
    switch (input) {
        case 'reading':
            return definitions_1.status.Watching;
        case 'completed':
            return definitions_1.status.Completed;
        case 'paused':
            return definitions_1.status.Onhold;
        case 'dropped':
            return definitions_1.status.Dropped;
        case 'plan_to_read':
            return definitions_1.status.PlanToWatch;
        case 'rereading':
            return definitions_1.status.Rewatching;
        case 'considering':
            return definitions_1.status.Considering;
        default:
            throw new Error(`Unhandled Baka State: ${input}`);
    }
}
function stateToBakaState(input) {
    switch (input) {
        case definitions_1.status.Watching:
            return 'reading';
        case definitions_1.status.Completed:
            return 'completed';
        case definitions_1.status.Onhold:
            return 'paused';
        case definitions_1.status.Dropped:
            return 'dropped';
        case definitions_1.status.PlanToWatch:
            return 'plan_to_read';
        case definitions_1.status.Rewatching:
            return 'rereading';
        case definitions_1.status.Considering:
            return 'considering';
        case definitions_1.status.All:
            return null;
        default:
            throw new Error(`Unhandled Status: ${input}`);
    }
}
function getAlternativeTitles(series) {
    const titles = [];
    if (series.title) {
        titles.push(series.title);
    }
    if (series.romanized_title) {
        titles.push(series.romanized_title);
    }
    if (series.native_title) {
        titles.push(series.native_title);
    }
    return titles;
}
function getImageUrl(series, size) {
    let url;
    if (size === 'small') {
        url = series.cover?.x150?.x2;
    }
    else {
        url = series.cover?.x350?.x2;
    }
    if (url) {
        return `${url}.avif`;
    }
    return '';
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
//# sourceMappingURL=helper.js.map