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
exports.MetaOverview = void 0;
const metaOverviewAbstract_1 = require("../metaOverviewAbstract");
const Errors_1 = require("../Errors");
const helper = __importStar(require("./helper"));
const time_1 = require("../../utils/time");
const IntlWrapper_1 = require("../../utils/IntlWrapper");
class MetaOverview extends metaOverviewAbstract_1.MetaOverviewAbstract {
    constructor(url) {
        super(url);
        this.call = helper.call;
        this.errorHandling = helper.errorHandling;
        this.logger = this.logger.m('Simkl');
        if (url.match(/simkl\.com\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.simklId = parseInt(utils.urlPart(url, 4));
            this.malId = NaN;
            if (this.type === 'manga')
                throw 'Simkl has no manga support';
            return this;
        }
        if (url.match(/myanimelist\.net\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.malId = Number(utils.urlPart(url, 4));
            this.simklId = NaN;
            if (this.type === 'manga')
                throw 'Simkl has no manga support';
            return this;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    async _init() {
        this.logger.log('Retrieve', this.type, this.simklId ? `Simkl: ${this.simklId}` : `MAL: ${this.malId}`);
        const data = await this.getData();
        this.logger.log('Data', data);
        this.title(data);
        this.description(data);
        this.image(data);
        this.alternativeTitle(data);
        // this.characters(data);
        this.statistics(data);
        this.info(data);
        this.related(data);
        this.logger.log('Res', this.meta);
    }
    async getData() {
        let de;
        if (Number.isNaN(this.malId)) {
            de = { simkl: this.simklId };
        }
        else {
            de = { mal: this.malId };
        }
        if (Number.isNaN(this.simklId)) {
            const el = await this.call('https://api.simkl.com/search/id', de, true);
            if (!el?.length)
                throw new Errors_1.NotFoundError(`simklId: ${this.simklId}`);
            this.simklId = el[0].ids.simkl;
        }
        return this.call(`https://api.simkl.com/anime/${this.simklId}`, { extended: 'full' }, true);
    }
    title(data) {
        const { title } = data;
        if (title)
            this.meta.title = title;
    }
    description(data) {
        const description = data.overview;
        if (description)
            this.meta.description = description;
    }
    image(data) {
        const image = data.poster;
        if (image)
            this.meta.image = `https://simkl.in/posters/${image}_ca.jpg`;
        if (image)
            this.meta.imageLarge = `https://simkl.in/posters/${image}_m.jpg`;
        if (image)
            this.meta.imageBanner = `https://simkl.in/posters/${image}_w.jpg`;
    }
    alternativeTitle(data) {
        if (typeof data.en_title !== 'undefined' && data.en_title)
            this.meta.alternativeTitle.push(data.en_title);
    }
    statistics(data) {
        if (data.ratings.simkl.rating)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Score'),
                body: data.ratings.simkl.rating,
            });
        if (data.ratings.mal && data.ratings.mal.rating)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Mal_Score'),
                body: data.ratings.mal.rating,
            });
        if (data.rank && data.rank)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Ranked'),
                body: `#${data.rank}`,
            });
        if (data.ratings.simkl.votes)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Votes'),
                body: data.ratings.simkl.votes,
            });
    }
    info(data) {
        if (data.anime_type)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Format'),
                body: [{ text: data.anime_type }],
            });
        if (data.total_episodes)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Episodes'),
                body: [{ text: data.total_episodes }],
            });
        if (data.status)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Status'),
                body: [{ text: data.status }],
            });
        if (data.year)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Season'),
                body: [{ text: data.year }],
            });
        if (data.airs && data.airs.day && data.airs.time) {
            let body = [{ text: `${data.airs.day} at ${data.airs.time}` }];
            const weekDate = (0, time_1.getWeektime)(data.airs.day, data.airs.time);
            if (weekDate) {
                const broadcastDate = (0, time_1.dateFromTimezoneToTimezone)(weekDate, data.airs.timezone || 'Asia/Tokyo');
                body = [
                    {
                        date: broadcastDate,
                        type: 'weektime',
                    },
                ];
            }
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Broadcast'),
                body,
            });
        }
        if (data.network)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Licensor'),
                body: [{ text: data.network }],
            });
        const genres = [];
        data.genres.forEach(i => {
            if (genres.length < 6) {
                genres.push({
                    text: i,
                    url: `https://simkl.com/${this.type}/${i.toLowerCase()}`,
                });
            }
        });
        if (genres.length)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Genres'),
                body: genres,
            });
        if (data.runtime)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Duration'),
                body: [
                    {
                        text: `${new IntlWrapper_1.IntlDuration().setRelativeTime(data.runtime, 'minutes', 'Duration').getRelativeText()}`,
                    },
                ],
            });
        if (data.certification)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Rating'),
                body: [{ text: data.certification }],
            });
    }
    related(data) {
        const links = {};
        if (!data.relations)
            return;
        data.relations.forEach(i => {
            if (!links[i.relation_type]) {
                let title = i.relation_type.toLowerCase().replace('_', ' ');
                title = title.charAt(0).toUpperCase() + title.slice(1);
                links[i.relation_type] = {
                    type: title,
                    links: [],
                };
            }
            links[i.relation_type].links.push({
                url: `https://simkl.com/anime/${i.ids.simkl}/${i.ids.slug}`,
                title: i.title,
                type: 'anime',
                id: i.ids.simkl,
            });
        });
        this.meta.related = Object.keys(links).map(key => links[key]);
    }
}
exports.MetaOverview = MetaOverview;
//# sourceMappingURL=metaOverview.js.map