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
const listAbstract_1 = require("../listAbstract");
const helper = __importStar(require("./helper"));
const definitions = __importStar(require("../definitions"));
const pageSize = 25;
class UserList extends listAbstract_1.ListAbstract {
    constructor() {
        super(...arguments);
        this.name = 'Shiki';
        this.seperateRewatching = true;
        this.authenticationUrl = helper.authUrl;
        this.tempList = [];
    }
    getUserObject() {
        return helper.userRequest().then(res => ({
            username: res.nickname,
            picture: res.image.x80,
            href: res.url,
        }));
    }
    deauth() {
        return api.settings.set('shikiToken', '');
    }
    _getSortingOptions() {
        return [];
    }
    getSortingOptions() {
        return [];
    }
    async getPart() {
        if (this.offset < 2)
            this.offset = 0;
        con.log('[UserList][Shiki]', `username: ${this.username}`, `status: ${this.status}`, `offset: ${this.offset}`);
        if (!this.tempList.length) {
            let curSt = '';
            if (this.status !== definitions.status.All) {
                curSt = helper.statusTranslate[this.status];
            }
            const userId = await helper.userId();
            this.tempList = await helper.apiCall({
                path: 'v2/user_rates',
                type: 'GET',
                parameter: {
                    user_id: userId,
                    target_type: this.listType === 'anime' ? 'Anime' : 'Manga',
                    status: curSt,
                },
            });
        }
        const list = this.tempList.slice(this.offset, this.offset + pageSize);
        this.offset += pageSize;
        if (this.offset >= this.tempList.length) {
            this.done = true;
        }
        const ids = list.map(el => el.target_id);
        const metadata = await helper.apiCall({
            path: `${this.listType}s`,
            parameter: { ids: ids.join(','), limit: pageSize },
            type: 'GET',
        });
        const keyedMetadata = {};
        for (const key in metadata) {
            const entry = metadata[key];
            keyedMetadata[entry.id] = entry;
        }
        if (this.listType === 'manga') {
            const keyedIds = Object.keys(keyedMetadata);
            const diffArr = ids.filter((o) => !keyedIds.includes(o));
            if (diffArr.length) {
                const diffMetadata = await helper.apiCall({
                    path: 'ranobe',
                    parameter: { ids: diffArr.join(','), limit: pageSize },
                    type: 'GET',
                });
                for (const key in diffMetadata) {
                    const entry = diffMetadata[key];
                    keyedMetadata[entry.id] = entry;
                }
            }
        }
        return this.prepareData(list, keyedMetadata);
    }
    async prepareData(data, metadata) {
        const newData = [];
        for (const key in data) {
            const entry = data[key];
            const meta = metadata[entry.target_id];
            // eslint-disable-next-line no-await-in-loop
            const tempData = await this.fn({
                malId: entry.target_id,
                apiCacheKey: entry.target_id,
                uid: entry.target_id,
                cacheKey: entry.target_id,
                type: entry.target_type === 'Anime' ? 'anime' : 'manga',
                title: helper.title(meta.russian, meta.name),
                url: `${helper.domain}${meta.url}`,
                score: entry.score ? entry.score : 0,
                watchedEp: entry.target_type === 'Anime' ? entry.episodes : entry.chapters,
                readVol: entry.target_type === 'Anime' ? undefined : entry.volumes,
                totalEp: entry.target_type === 'Anime' ? meta.episodes : meta.chapters,
                totalVol: entry.target_type === 'Anime' ? undefined : meta.volumes,
                status: helper.statusTranslate[entry.status],
                rewatchCount: entry.rewatches,
                image: meta.image.original ? `${helper.domain}${meta.image.original}` : '',
                imageLarge: meta.image.original ? `${helper.domain}${meta.image.original}` : '',
                tags: entry.text,
            });
            newData.push(tempData);
        }
        return newData;
    }
}
exports.UserList = UserList;
//# sourceMappingURL=list.js.map