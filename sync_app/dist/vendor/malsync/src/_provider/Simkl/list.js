"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserList = void 0;
const Errors_1 = require("../Errors");
const listAbstract_1 = require("../listAbstract");
const helper = __importStar(require("./helper"));
const definitions = __importStar(require("../definitions"));
class UserList extends listAbstract_1.ListAbstract {
    constructor() {
        super(...arguments);
        this.name = 'Simkl';
        this.authenticationUrl = helper.getAuthUrl();
        this.errorHandling = helper.errorHandling;
        this.syncList = helper.syncList;
        this.translateList = helper.translateList;
        this.getCacheKey = helper.getCacheKey;
        this.getEpisode = helper.getEpisode;
        this.call = helper.call;
    }
    async getUserObject() {
        return this.call('https://api.simkl.com/users/settings').then(res => {
            if (res && res.user && typeof res.user.name !== 'undefined') {
                return {
                    username: res.user.name,
                    picture: res.user.avatar || '',
                    href: `https://simkl.com/${res.account.id}`,
                };
            }
            throw new Errors_1.NotAutenticatedError('Not Authenticated');
        });
    }
    deauth() {
        return api.settings.set('simklToken', '');
    }
    _getSortingOptions() {
        return [];
    }
    async getPart() {
        con.log('[UserList][Simkl]', `status: ${this.status}`);
        if (this.listType === 'manga')
            throw new Error('Does not support manga');
        return this.syncList().then(async (list) => {
            this.done = true;
            const data = await this.prepareData(Object.values(list), this.listType, this.status);
            con.log(data);
            return data;
        });
    }
    async prepareData(data, listType, status) {
        const newData = [];
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            const st = this.translateList(el.status);
            if (status !== definitions.status.All && parseInt(st) !== status) {
                continue;
            }
            let curep = this.getEpisode(el.last_watched);
            if (st === definitions.status.Completed) {
                curep = el.total_episodes_count;
            }
            if (listType === 'anime') {
                const tempData = await this.fn({
                    malId: el.show.ids.mal,
                    apiCacheKey: el.show.ids.mal,
                    uid: el.show.ids.simkl,
                    cacheKey: this.getCacheKey(el.show.ids.mal, el.show.ids.simkl),
                    type: listType,
                    title: el.show.title,
                    url: `https://simkl.com/${listType}/${el.show.ids.simkl}`,
                    score: el.user_rating ? el.user_rating : 0,
                    watchedEp: curep,
                    totalEp: el.total_episodes_count,
                    status: st,
                    image: `https://simkl.in/posters/${el.show.poster}_ca.jpg`,
                    imageLarge: `https://simkl.in/posters/${el.show.poster}_m.jpg`,
                    imageBanner: `https://simkl.in/posters/${el.show.poster}_w.jpg`,
                    tags: el.private_memo,
                    airingState: el.anime_airing_status,
                });
                newData.push(tempData);
            }
            else {
                // placeholder
            }
        }
        return newData;
    }
}
exports.UserList = UserList;
//# sourceMappingURL=list.js.map