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
const IntlWrapper_1 = require("../../utils/IntlWrapper");
class MetaOverview extends metaOverviewAbstract_1.MetaOverviewAbstract {
    constructor(url) {
        super(url);
        this.kitsuId = NaN;
        this.apiCall = helper.apiCall;
        this.logger = this.logger.m('Kitsu');
        if (url.match(/kitsu\.app\/(anime|manga)\/.*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.kitsuSlug = utils.urlPart(url, 4);
            this.malId = NaN;
            return this;
        }
        if (url.match(/myanimelist\.net\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.malId = Number(utils.urlPart(url, 4));
            this.kitsuSlug = '';
            return this;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    animeI() {
        return this.animeInfo.data;
    }
    async _init() {
        this.logger.log('Retrieve', this.type, this.kitsuSlug ? `Kitsu: ${this.kitsuSlug}` : `MAL: ${this.malId}`);
        await this.getData();
        this.logger.log('Data', this.animeInfo);
        this.title();
        this.description();
        this.image();
        this.alternativeTitle();
        this.characters();
        this.statistics();
        this.info();
        this.related();
        this.logger.log('Res', this.meta);
    }
    async getData() {
        if (!this.kitsuSlug) {
            const kitsuRes = await helper.malToKitsu(this.malId, this.type);
            try {
                const relation = kitsuRes.data.find(item => item.relationships.item.data.type === this.type);
                if (!relation)
                    throw new Errors_1.NotFoundError(`No entry found for malId ${this.malId}`);
                this.kitsuId = Number(relation.relationships.item.data.id);
                kitsuRes.included.forEach(el => {
                    if (Number(el.id) === this.kitsuId) {
                        this.kitsuSlug = el.attributes.slug;
                    }
                });
                if (!this.kitsuSlug)
                    throw new Errors_1.NotFoundError(`No slug found for ${this.kitsuId}`);
            }
            catch (e) {
                throw new Errors_1.NotFoundError(e.message);
            }
        }
        return this.apiCall('GET', `https://kitsu.app/api/edge/${this.type}?filter[slug]=${this.kitsuSlug}&include=characters.character,mediaRelationships.destination,categories&fields[categories]=slug,title&nsfw=true`, {}, true).then(res => {
            try {
                res.data = res.data[0];
                // eslint-disable-next-line no-unused-expressions, @typescript-eslint/no-unused-expressions
                res.data.attributes.slug;
            }
            catch (e) {
                throw new Errors_1.NotFoundError(e.message);
            }
            this.animeInfo = res;
        });
    }
    title() {
        this.meta.title = helper.getTitle(this.animeI().attributes.titles, this.animeI().attributes.canonicalTitle);
    }
    description() {
        this.meta.description = `<span style="white-space: pre-line;">${this.animeI().attributes.synopsis.replace('—', ' ')}</span>`;
    }
    image() {
        this.meta.image =
            this.animeI().attributes.posterImage && this.animeI().attributes.posterImage.small
                ? this.animeI().attributes.posterImage.small
                : '';
        this.meta.imageLarge =
            this.animeI().attributes.posterImage && this.animeI().attributes.posterImage.original
                ? this.animeI().attributes.posterImage.original
                : '';
        this.meta.imageBanner =
            this.animeI().attributes.coverImage && this.animeI().attributes.coverImage.large
                ? this.animeI().attributes.coverImage.large
                : '';
    }
    alternativeTitle() {
        for (const prop in this.animeI().attributes.abbreviatedTitles) {
            const el = this.animeI().attributes.abbreviatedTitles[prop];
            if (el !== this.meta.title && el) {
                this.meta.alternativeTitle.push(el);
            }
        }
        for (const prop in this.animeI().attributes.titles) {
            const el = this.animeI().attributes.titles[prop];
            if (el !== this.meta.title && el) {
                this.meta.alternativeTitle.push(el);
            }
        }
    }
    characters() {
        if (this.animeInfo.included && this.animeInfo.included.length) {
            this.animeInfo.included.forEach(i => {
                if (i.type === 'characters' && this.meta.characters.length < 10) {
                    const { name } = i.attributes;
                    this.meta.characters.push({
                        img: i.attributes.image !== null ? i.attributes.image.original : '',
                        name,
                        url: `https://myanimelist.net/character/${i.attributes.malId}`,
                    });
                }
            });
        }
    }
    statistics() {
        if (this.animeI().attributes.averageRating !== null)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Score'),
                body: this.animeI().attributes.averageRating,
            });
        if (this.animeI().attributes.ratingRank !== null)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Ranked'),
                body: `#${this.animeI().attributes.ratingRank}`,
            });
        if (this.animeI().attributes.popularityRank !== null)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Popularity'),
                body: `#${this.animeI().attributes.popularityRank}`,
            });
        if (this.animeI().attributes.userCount !== null)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Members'),
                body: this.animeI().attributes.userCount,
            });
    }
    info() {
        if (typeof this.animeI().attributes.subtype !== 'undefined' &&
            this.animeI().attributes.subtype !== null) {
            let format = this.animeI().attributes.subtype.toLowerCase().replace('_', ' ');
            format = format.charAt(0).toUpperCase() + format.slice(1);
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Format'),
                body: [{ text: format }],
            });
        }
        if (typeof this.animeI().attributes.episodeCount !== 'undefined' &&
            this.animeI().attributes.episodeCount !== null)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Episodes'),
                body: [{ text: this.animeI().attributes.episodeCount }],
            });
        if (typeof this.animeI().attributes.episodeLength !== 'undefined' &&
            this.animeI().attributes.episodeLength !== null)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Duration'),
                body: [
                    {
                        text: `${new IntlWrapper_1.IntlDuration().setRelativeTime(this.animeI().attributes.episodeLength, 'minutes', 'Duration').getRelativeText()}`,
                    },
                ],
            });
        if (typeof this.animeI().attributes.status !== 'undefined' &&
            this.animeI().attributes.status !== null) {
            let status = this.animeI().attributes.status.toLowerCase().replace('_', ' ');
            status = status.charAt(0).toUpperCase() + status.slice(1);
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Status'),
                body: [{ text: status }],
            });
        }
        if (this.animeI().attributes.startDate)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Start_Date'),
                body: [
                    {
                        text: new IntlWrapper_1.IntlDateTime(this.animeI().attributes.startDate).getDateTimeText(),
                    },
                ],
            });
        if (this.animeI().attributes.endDate)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_End_Date'),
                body: [
                    {
                        text: new IntlWrapper_1.IntlDateTime(this.animeI().attributes.endDate).getDateTimeText(),
                    },
                ],
            });
        const genres = [];
        if (this.animeInfo.included && this.animeInfo.included.length) {
            this.animeInfo.included.forEach(i => {
                if (i.type === 'categories' && genres.length < 6) {
                    genres.push({
                        text: i.attributes.title,
                        url: `https://kitsu.app/${this.type}?categories=${i.attributes.slug}`,
                    });
                }
            });
        }
        if (genres.length)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Genres'),
                body: genres,
            });
        if (typeof this.animeI().attributes.ageRating !== 'undefined' &&
            this.animeI().attributes.ageRating !== null)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Rating'),
                body: [{ text: this.animeI().attributes.ageRating }],
            });
        if (this.animeI().attributes.totalLength)
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Total_Playtime'),
                body: [
                    {
                        text: `${new IntlWrapper_1.IntlDuration().setRelativeTime(this.animeI().attributes.totalLength, 'minutes', 'Duration').getRelativeText()}`,
                    },
                ],
            });
    }
    related() {
        const links = {};
        const an = [];
        if (this.animeInfo.included && this.animeInfo.included.length) {
            this.animeInfo.included.forEach(function (i) {
                if (i.type === 'manga' || i.type === 'anime') {
                    an[i.id] = {
                        url: `https://kitsu.app/${i.type}/${i.attributes.slug}`,
                        title: helper.getTitle(i.attributes.titles, i.attributes.canonicalTitle),
                        id: i.id,
                        type: i.type,
                    };
                }
            });
            this.animeInfo.included.forEach(function (i) {
                if (i.type === 'mediaRelationships') {
                    if (typeof links[i.attributes.role] === 'undefined') {
                        let title = i.attributes.role.toLowerCase().replace('_', ' ');
                        title = title.charAt(0).toUpperCase() + title.slice(1);
                        links[i.attributes.role] = {
                            type: title,
                            links: [],
                        };
                    }
                    const tempEl = an[i.relationships.destination.data.id];
                    links[i.attributes.role].links.push(tempEl);
                }
            });
        }
        this.meta.related = Object.keys(links).map(key => links[key]);
    }
}
exports.MetaOverview = MetaOverview;
//# sourceMappingURL=metaOverview.js.map