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
class UserList extends listAbstract_1.ListAbstract {
    constructor() {
        super(...arguments);
        this.name = 'AniList';
        this.compact = false;
        this.seperateRewatching = true;
        this.authenticationUrl = 'https://anilist.co/api/v2/oauth/authorize?client_id=1487&response_type=token';
    }
    getUserObject() {
        const query = `
    query {
      Viewer {
        name
        id
        avatar {
          large
        }
        options {
          displayAdultContent
        }
        mediaListOptions {
          scoreFormat
        }
      }
    }
    `;
        return helper.apiCall(query, [], true).then(res => {
            if (res.data.Viewer.options && res.data.Viewer.mediaListOptions) {
                const opt = api.settings.get('anilistOptions');
                opt.displayAdultContent = res.data.Viewer.options.displayAdultContent;
                opt.scoreFormat = res.data.Viewer.mediaListOptions.scoreFormat;
                api.settings.set('anilistOptions', opt);
            }
            return {
                username: res.data.Viewer.name,
                picture: res.data.Viewer.avatar.large || '',
                href: `https://anilist.co/user/${res.data.Viewer.id}`,
            };
        });
    }
    deauth() {
        return api.settings.set('anilistToken', '');
    }
    accessToken() {
        return this.api.settings.get('anilistToken');
    }
    _getSortingOptions() {
        return [
            {
                icon: 'sort_by_alpha',
                title: api.storage.lang('list_sorting_alpha'),
                value: 'alpha',
            },
            {
                icon: 'history',
                title: api.storage.lang('list_sorting_history'),
                value: 'updated',
                asc: true,
            },
            {
                icon: 'score',
                title: api.storage.lang('list_sorting_score'),
                value: 'score',
                asc: true,
            },
        ];
    }
    getOrder(sort) {
        switch (sort) {
            case 'alpha':
                return 'MEDIA_TITLE_ENGLISH';
            case 'updated':
                return 'UPDATED_TIME_DESC';
            case 'updated_asc':
                return 'UPDATED_TIME';
            case 'score':
                return 'SCORE_DESC';
            case 'score_asc':
                return 'SCORE';
            default:
                if (this.status === definitions.status.Watching)
                    return this.getOrder('updated');
                if (this.status === definitions.status.PlanToWatch)
                    return this.getOrder('updated');
                // TODO: remove when fixed in anilist
                return this.getOrder('updated');
                return this.getOrder('alpha');
        }
    }
    async getPart() {
        if (this.offset < 1)
            this.offset = 1;
        con.log('[UserList][AniList]', `username: ${this.username}`, `status: ${this.status}`, `offset: ${this.offset}`);
        if (!this.username) {
            this.username = await this.getUsername();
        }
        let query = `
    query ($page: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $sort: [MediaListSort] ) {
      Page (page: $page, perPage: 100) {
        pageInfo {
          hasNextPage
        }
        mediaList (status: $status, type: $type, userName: $userName, sort: $sort) {
          status
          startedAt {
            year
            month
            day
          }
          completedAt {
            year
            month
            day
          }
          repeat
          score(format: POINT_100)
          progress
          progressVolumes
          notes
          media {
            siteUrl
            id
            idMal
            episodes
            chapters
            volumes
            status
            averageScore
            coverImage{
              large
              extraLarge
            }
            bannerImage
            title {
              userPreferred
            }
          }
        }
      }
    }
    `;
        if (this.compact) {
            query = `
      query ($page: Int, $userName: String, $type: MediaType, $status: MediaListStatus, $sort: [MediaListSort]) {
        Page (page: $page, perPage: 100) {
          pageInfo {
            hasNextPage
          }
          mediaList (status: $status, type: $type, userName: $userName, sort: $sort) {
            progress
            media {
              id
              idMal
            }
          }
        }
      }
      `;
        }
        const variables = {
            page: this.offset,
            userName: this.username,
            type: this.listType.toUpperCase(),
            status: helper.statusTranslate[parseInt(this.status.toString())],
            sort: null,
        };
        const order = this.getOrder(this.sort);
        if (order) {
            // @ts-ignore
            variables.sort = order;
        }
        return helper.apiCall(query, variables, true).then(res => {
            con.log('res', res);
            const data = res.data.Page.mediaList;
            this.offset += 1;
            if (!res.data.Page.pageInfo.hasNextPage) {
                this.done = true;
            }
            return this.prepareData(data, this.listType);
        });
    }
    async prepareData(data, listType) {
        const newData = [];
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            let tempData;
            if (listType === 'anime') {
                tempData = await this.fn({
                    uid: el.media.id,
                    malId: el.media.idMal,
                    apiCacheKey: el.media.idMal ?? `anilist:${el.media.id}`,
                    cacheKey: helper.getCacheKey(el.media.idMal, el.media.id),
                    type: listType,
                    title: el.media.title.userPreferred,
                    url: el.media.siteUrl,
                    score: Math.round(el.score / 10),
                    watchedEp: el.progress,
                    totalEp: el.media.episodes,
                    status: helper.translateList(el.status),
                    startDate: helper.parseFuzzyDate(el.startedAt),
                    finishDate: helper.parseFuzzyDate(el.completedAt),
                    rewatchCount: el.repeat,
                    image: helper.imgCheck(el.media.coverImage.large),
                    imageLarge: helper.imgCheck(el.media.coverImage.extraLarge),
                    imageBanner: helper.imgCheck(el.media.bannerImage),
                    tags: el.notes,
                    airingState: el.anime_airing_status,
                });
            }
            else {
                tempData = await this.fn({
                    uid: el.media.id,
                    malId: el.media.idMal,
                    apiCacheKey: el.media.idMal ?? `anilist:${el.media.id}`,
                    cacheKey: helper.getCacheKey(el.media.idMal, el.media.id),
                    type: listType,
                    title: el.media.title.userPreferred,
                    url: el.media.siteUrl,
                    score: Math.round(el.score / 10),
                    watchedEp: el.progress,
                    readVol: el.progressVolumes,
                    totalEp: el.media.chapters,
                    totalVol: el.media.volumes,
                    status: helper.translateList(el.status),
                    startDate: helper.parseFuzzyDate(el.startedAt),
                    finishDate: helper.parseFuzzyDate(el.completedAt),
                    rewatchCount: el.repeat,
                    image: helper.imgCheck(el.media.coverImage.large),
                    imageLarge: helper.imgCheck(el.media.coverImage.extraLarge),
                    imageBanner: helper.imgCheck(el.media.bannerImage),
                    tags: el.notes,
                    airingState: el.anime_airing_status,
                });
            }
            if (tempData.totalEp === null) {
                tempData.totalEp = 0;
            }
            newData.push(tempData);
        }
        return newData;
    }
    prepareCompact(data, listType) {
        const newData = [];
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            newData.push({
                malid: el.media.idMal,
                id: el.media.id,
                watchedEp: el.progress,
                cacheKey: helper.getCacheKey(el.media.idMal, el.media.id),
            });
        }
        return newData;
    }
}
exports.UserList = UserList;
//# sourceMappingURL=list.js.map