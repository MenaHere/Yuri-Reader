"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.client_id = void 0;
exports.getAuthUrl = getAuthUrl;
exports.translateList = translateList;
exports.getCacheKey = getCacheKey;
exports.simklIdToMal = simklIdToMal;
exports.getEpisode = getEpisode;
exports.syncList = syncList;
exports.getSingle = getSingle;
exports.call = call;
exports.errorHandling = errorHandling;
const definitions_1 = require("../definitions");
const Errors_1 = require("../Errors");
exports.client_id = __MAL_SYNC_KEYS__.simkl.id;
function getAuthUrl() {
    return `https://simkl.com/oauth/authorize?response_type=code&client_id=${exports.client_id}&redirect_uri=https://simkl.com/apps/chrome/mal-sync/connected/`;
}
function translateList(simklStatus, malStatus = null) {
    const list = {
        watching: definitions_1.status.Watching,
        plantowatch: definitions_1.status.PlanToWatch,
        completed: definitions_1.status.Completed,
        notinteresting: definitions_1.status.Dropped,
        hold: definitions_1.status.Onhold,
    };
    if (malStatus !== null) {
        return Object.keys(list).find(key => list[key] === malStatus);
    }
    return list[simklStatus];
}
function getCacheKey(id, simklId) {
    if (Number.isNaN(id) || !id) {
        return `simkl:${simklId}`;
    }
    return id;
}
function simklIdToMal(simklId) {
    return this.call(`https://api.simkl.com/anime/${simklId}`, { extended: 'full' }, true).then(res => {
        if (typeof res.ids.mal === 'undefined')
            return null;
        return res.ids.mal;
    });
}
function getEpisode(episode) {
    if (typeof episode === 'number')
        return episode;
    if (episode) {
        const temp = episode.match(/e\d+/i);
        if (temp !== null) {
            const episodePart = parseInt(temp[0].replace(/\D/, ''));
            if (Number.isNaN(episodePart))
                return 0;
            return episodePart;
        }
    }
    return 0;
}
let cacheList;
async function syncList(lazy = false) {
    const logger = con.m('Simkl', '#9b7400').m('list');
    if (typeof cacheList === 'undefined') {
        cacheList = await api.storage.get('simklList');
    }
    else if (lazy) {
        return cacheList;
    }
    const lastCheck = await api.storage.get('simklLastCheck');
    const activity = await this.call('https://api.simkl.com/sync/activities');
    logger.log('Activity', lastCheck, activity.anime);
    // removed_from_list
    if (lastCheck && lastCheck.removed_from_list !== activity.anime.removed_from_list) {
        const checkRemoveList = await this.call('https://api.simkl.com/sync/all-items/anime');
        const newCacheList = {};
        if (checkRemoveList) {
            for (let i = 0; i < checkRemoveList.anime.length; i++) {
                const el = checkRemoveList.anime[i];
                if (cacheList[el.show.ids.simkl] !== undefined) {
                    newCacheList[el.show.ids.simkl] = cacheList[el.show.ids.simkl];
                }
            }
        }
        cacheList = newCacheList;
        logger.log('remove', cacheList);
    }
    // Check if update Needed
    let dateFrom = '';
    if (lastCheck && cacheList) {
        dateFrom = `date_from=${lastCheck.all}`;
        if (lastCheck.all === activity.anime.all) {
            logger.log('Up to date');
            return cacheList;
        }
    }
    if (!cacheList)
        cacheList = {};
    if (lastCheck && lastCheck.rated_at !== activity.anime.rated_at) {
        const rated = await this.call(`https://api.simkl.com/sync/ratings/anime?${dateFrom}`);
        logger.log('ratedUpdate', rated);
        if (rated) {
            for (let i = 0; i < rated.anime.length; i++) {
                const el = rated.anime[i];
                cacheList[el.show.ids.simkl] = el;
            }
        }
    }
    const list = await this.call(`https://api.simkl.com/sync/all-items/anime?${dateFrom}`);
    logger.log('listUpdate', list);
    if (list) {
        for (let i = 0; i < list.anime.length; i++) {
            const el = list.anime[i];
            cacheList[el.show.ids.simkl] = el;
        }
    }
    logger.log('totalList', cacheList);
    await api.storage.set('simklList', cacheList);
    await api.storage.set('simklLastCheck', activity.anime);
    return cacheList;
}
async function getSingle(ids, lazy = false) {
    const list = await this.syncList(lazy);
    if (ids.simkl) {
        if (list[ids.simkl] !== undefined) {
            return list[ids.simkl];
        }
    }
    else if (ids.mal) {
        // TODO: Use map for better performance
        const listVal = Object.values(list);
        for (let i = 0; i < listVal.length; i++) {
            const el = listVal[i];
            if (typeof el.show.ids.mal !== 'undefined' && Number(el.show.ids.mal) === Number(ids.mal)) {
                return el;
            }
        }
    }
    else {
        throw 'No id passed';
    }
    return null;
}
async function call(url, sData = {}, asParameter = false, method = 'GET', login = true) {
    const logger = con.m('Simkl', '#9b7400').m('call');
    if (asParameter) {
        url += `?${new URLSearchParams(Object.entries(sData))}`;
        sData = undefined;
    }
    logger.log(method, url, sData);
    const headers = {
        'simkl-api-key': exports.client_id,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
    };
    if (login)
        headers.Authorization = `Bearer ${api.settings.get('simklToken')}`;
    else
        logger.log('No login');
    if (method === 'GET') {
        sData = undefined;
    }
    return api.request
        .xhr(method, {
        url,
        headers,
        data: sData,
    })
        .then(async (response) => {
        const res = (0, Errors_1.parseJson)(response.responseText);
        this.errorHandling(res, response.status);
        return res;
    });
}
function errorHandling(res, code) {
    if ((code > 499 && code < 600) || code === 0) {
        throw new Errors_1.ServerOfflineError(`Server Offline status: ${code}`);
    }
    if (res && typeof res.error !== 'undefined') {
        this.logger.error('[SINGLE]', 'Error', res.error);
        const { error } = res;
        if (error.code) {
            switch (error.code) {
                default:
                    throw new Error(error.error);
            }
        }
        else {
            switch (error) {
                case 'user_token_failed':
                    throw new Errors_1.NotAutenticatedError('user_token_failed');
                default:
                    throw error;
            }
        }
    }
}
//# sourceMappingURL=helper.js.map