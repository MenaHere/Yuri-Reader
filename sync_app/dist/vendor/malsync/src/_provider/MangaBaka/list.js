"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserList = void 0;
const listAbstract_1 = require("../listAbstract");
const definitions_1 = require("../definitions");
const helper_1 = require("./helper");
const seriesService_1 = require("./seriesService");
class UserList extends listAbstract_1.ListAbstract {
    constructor() {
        super(...arguments);
        this.name = 'MangaBaka';
        this.authenticationUrl = helper_1.authenticationUrl;
        this.seperateRewatching = true;
        this.consideringSupport = true;
        this.limit = 100;
    }
    async getUserObject() {
        const json = (await (0, helper_1.call)(helper_1.urls.userInfo()));
        console.log(json);
        return {
            username: json.name || this.name,
            picture: 'https://mangabaka.org/images/logo.png',
            href: json.preferred_username
                ? `https://mangabaka.org/u/${json.preferred_username}`
                : 'https://mangabaka.org',
        };
    }
    deauth() {
        return api.settings
            .set('mangabakaToken', '')
            .then(() => api.settings.set('mangabakaRefresh', ''));
    }
    _getSortingOptions() {
        return [
            {
                icon: 'sort_by_alpha',
                title: api.storage.lang('list_sorting_alpha'),
                value: 'alpha',
                asc: true,
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
            case 'alpha_asc':
                return 'series_title_asc';
            case 'alpha':
                return 'series_title_desc';
            case 'updated_asc':
                return 'updated_at_asc';
            case 'updated':
                return 'updated_at_desc';
            case 'score_asc':
                return 'my_rating_asc';
            case 'score':
                return 'my_rating_desc';
            default:
                if (this.status === definitions_1.status.Watching)
                    return this.getOrder('updated');
                if (this.status === definitions_1.status.PlanToWatch)
                    return this.getOrder('updated');
                return 'default';
        }
    }
    async getPart() {
        if (this.listType !== 'manga') {
            throw new Error('MangaBaka only supports manga');
        }
        this.limit = 100;
        this.offset = Math.max(1, this.offset);
        if (this.modes.frontend && !this.modes.sortAiring) {
            this.limit = 24;
        }
        const json = (await (0, helper_1.call)(helper_1.urls.library((0, helper_1.stateToBakaState)(this.status), this.getOrder(this.sort), this.offset, this.limit)));
        console.log(json);
        if (json.pagination.next) {
            this.offset += 1;
        }
        else {
            this.done = true;
        }
        return this.prepareData(json.data);
    }
    async cacheList(data) {
        const series = data.map(el => el.Series);
        await (0, seriesService_1.cacheSeriesList)(series);
    }
    async prepareData(data) {
        if (this.modes.frontend) {
            this.cacheList(data); // Fire and forget
        }
        const newData = [];
        for (let i = 0; i < data.length; i++) {
            const el = data[i];
            const item = await this.fn({
                uid: el.series_id,
                malId: el.Series.source.my_anime_list.id || null,
                apiCacheKey: el.Series.source.my_anime_list.id ||
                    el.Series.source.anilist.id ||
                    `mangabaka:${el.series_id}`,
                cacheKey: el.Series.source.my_anime_list.id || `mangabaka:${el.series_id}`,
                type: this.listType,
                title: el.Series.title,
                url: `https://mangabaka.org/${el.series_id}`,
                score: el.rating ? Math.round(el.rating / 10) : 0,
                watchedEp: el.progress_chapter || 0,
                readVol: el.progress_volume || 0,
                totalEp: Number(el.Series.total_chapters) || 0,
                totalVol: Number(el.Series.final_volume) || 0,
                status: (0, helper_1.bakaStateToState)(el.state),
                startDate: el.start_date ? (0, helper_1.timestampToDate)(el.start_date) : null,
                finishDate: el.finish_date ? (0, helper_1.timestampToDate)(el.finish_date) : null,
                rewatchCount: el.number_of_rereads || 0,
                image: (0, helper_1.getImageUrl)(el.Series, 'small'),
                imageLarge: (0, helper_1.getImageUrl)(el.Series, 'large'),
                tags: el.note || '',
                airingState: el.Series.status || '',
            });
            if (el.read_link) {
                item.options.u = el.read_link;
            }
            newData.push(item);
        }
        return newData;
    }
}
exports.UserList = UserList;
//# sourceMappingURL=list.js.map