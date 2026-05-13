"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusTranslate = exports.domain = exports.authUrl = void 0;
exports.apiCall = apiCall;
exports.authRequest = authRequest;
exports.userRequest = userRequest;
exports.userId = userId;
exports.title = title;
const Errors_1 = require("../Errors");
const Cache_1 = require("../../utils/Cache");
const clientId = 'z3NJ84kK9iy5NU6SnhdCDB38rr4-jFIJ67bMIUDzdoo';
exports.authUrl = `https://shikimori.one/oauth/authorize?client_id=${clientId}&redirect_uri=https%3A%2F%2Fmalsync.moe%2Fshikimori%2Foauth&response_type=code&scope=user_rates`;
const apiDomain = 'https://shikimori.one/api/';
exports.domain = 'https://shikimori.one';
async function apiCall(options) {
    const type = options.type || 'GET';
    const token = api.settings.get('shikiToken');
    if (!token && !token.access_token && !options.auth) {
        throw new Errors_1.NotAutenticatedError('No token set');
    }
    let url = apiDomain + options.path;
    if (options.parameter && Object.keys(options.parameter).length) {
        url += url.includes('?') ? '&' : '?';
        const params = [];
        for (const key in options.parameter) {
            params.push(`${key}=${options.parameter[key]}`);
        }
        url += params.join('&');
    }
    const headers = {
        Authorization: `Bearer ${token.access_token}`,
        'User-Agent': 'MAL-Sync',
        'Content-Type': 'application/json',
    };
    let data = '';
    if (options.dataObj) {
        data = JSON.stringify(options.dataObj);
    }
    if (options.auth) {
        delete headers.Authorization;
        url = 'https://shikimori.one/oauth/token';
    }
    return api.request
        .xhr(type, {
        url,
        headers,
        data,
    })
        .then(async (response) => {
        if ((response.status > 499 && response.status < 600) || response.status === 0) {
            throw new Errors_1.ServerOfflineError(`Server Offline status: ${response.status}`);
        }
        let res = null;
        if (response.responseText) {
            res = JSON.parse(response.responseText);
        }
        if (response.status === 401) {
            if (options.auth)
                throw new Errors_1.NotAutenticatedError(res.message ?? res.error);
            await refreshToken(token.refresh_token);
            return apiCall(options);
        }
        if (res && res.error) {
            switch (res.error) {
                case 'forbidden':
                case 'invalid_token':
                    if (options.auth)
                        throw new Errors_1.NotAutenticatedError(res.message ?? res.error);
                    await refreshToken(token.refresh_token);
                    return apiCall(options);
                case 'not_found':
                    throw new Errors_1.NotFoundError(res.message ?? res.error);
                default:
                    throw new Error(res.message ?? res.error);
            }
        }
        switch (response.status) {
            case 400:
                throw new Error('Invalid Parameters');
            case 403:
            default:
        }
        return res;
    });
}
function authRequest(data) {
    const dataObj = {
        client_id: clientId,
        client_secret: '6vkFaJN_wxQHmBoq23ac1z6tZKiAD7xqsXGudkkOqTg',
        redirect_uri: 'https://malsync.moe/shikimori/oauth',
    };
    if ('code' in data) {
        dataObj.code = data.code;
        dataObj.grant_type = 'authorization_code';
    }
    if ('refresh_token' in data) {
        dataObj.refresh_token = data.refresh_token;
        dataObj.grant_type = 'refresh_token';
    }
    return apiCall({
        type: 'POST',
        path: 'oauth/token',
        auth: true,
        dataObj,
    });
}
async function refreshToken(refresh_token) {
    const res = await authRequest({ refresh_token }).catch(err => {
        if (err.message === 'invalid_request') {
            api.settings.set('shikiToken', '');
        }
        throw err;
    });
    await api.settings.set('shikiToken', {
        access_token: res.access_token,
        refresh_token: res.refresh_token,
    });
}
function userRequest() {
    return apiCall({
        type: 'GET',
        path: 'users/whoami',
    }).then(res => {
        if (res.locale) {
            api.settings.set('shikiOptions', {
                locale: res.locale,
            });
        }
        return res;
    });
}
async function userId() {
    const cacheObj = new Cache_1.Cache('shiki/userId', 4 * 60 * 60 * 1000);
    if (await cacheObj.hasValue()) {
        return cacheObj.getValue();
    }
    const res = await userRequest();
    if (res.id) {
        cacheObj.setValue(res.id);
    }
    return res.id;
}
function title(rus, eng, headline = false) {
    const options = api.settings.get('shikiOptions');
    const locale = options && options.locale ? options.locale : 'ru';
    if (locale === 'ru')
        return rus || eng;
    if (headline && eng && rus)
        return `${eng} / ${rus}`;
    return eng || rus;
}
// eslint-disable-next-line no-shadow
var statusTranslate;
(function (statusTranslate) {
    statusTranslate[statusTranslate["watching"] = 1] = "watching";
    statusTranslate[statusTranslate["planned"] = 6] = "planned";
    statusTranslate[statusTranslate["completed"] = 2] = "completed";
    statusTranslate[statusTranslate["dropped"] = 4] = "dropped";
    statusTranslate[statusTranslate["on_hold"] = 3] = "on_hold";
    statusTranslate[statusTranslate["rewatching"] = 23] = "rewatching";
})(statusTranslate || (exports.statusTranslate = statusTranslate = {}));
//# sourceMappingURL=helper.js.map