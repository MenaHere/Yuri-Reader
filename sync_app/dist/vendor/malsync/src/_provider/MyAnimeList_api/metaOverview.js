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
/* eslint-disable no-shadow */
const metaOverviewAbstract_1 = require("../metaOverviewAbstract");
const Errors_1 = require("../Errors");
const helper = __importStar(require("./helper"));
const time_1 = require("../../utils/time");
const IntlWrapper_1 = require("../../utils/IntlWrapper");
var mediaTypeDefinition;
(function (mediaTypeDefinition) {
    mediaTypeDefinition["unknown"] = "Unknown";
    mediaTypeDefinition["tv"] = "TV";
    mediaTypeDefinition["ova"] = "OVA";
    mediaTypeDefinition["movie"] = "Movie";
    mediaTypeDefinition["special"] = "Special";
    mediaTypeDefinition["ona"] = "ONA";
    mediaTypeDefinition["music"] = "Music";
    mediaTypeDefinition["manga"] = "Manga";
    mediaTypeDefinition["novel"] = "Novel";
    mediaTypeDefinition["one_shot"] = "One shot";
    mediaTypeDefinition["doujinshi"] = "Doujinshi";
    mediaTypeDefinition["manhwa"] = "Manhwa";
    mediaTypeDefinition["manhua"] = "Manhua";
    mediaTypeDefinition["oel"] = "OEL";
})(mediaTypeDefinition || (mediaTypeDefinition = {}));
var airingStatusDefinition;
(function (airingStatusDefinition) {
    airingStatusDefinition["finished_airing"] = "Finished Airing";
    airingStatusDefinition["currently_airing"] = "Currently Airing";
    airingStatusDefinition["not_yet_aired"] = "Not Yet Aired";
    airingStatusDefinition["finished"] = "Finished";
    airingStatusDefinition["currently_publishing"] = "Currently Publishing";
    airingStatusDefinition["not_yet_published"] = "Not Yet Published";
})(airingStatusDefinition || (airingStatusDefinition = {}));
var sourceDefinition;
(function (sourceDefinition) {
    sourceDefinition["other"] = "Other";
    sourceDefinition["original"] = "Original";
    sourceDefinition["manga"] = "Manga";
    sourceDefinition["4_koma_manga"] = "4 Koma Manga";
    sourceDefinition["web_manga"] = "Web Manga";
    sourceDefinition["digital_manga"] = "Digital Manga";
    sourceDefinition["novel"] = "Novel";
    sourceDefinition["light_novel"] = "Light Novel";
    sourceDefinition["visual_novel"] = "Visual Novel";
    sourceDefinition["game"] = "Game";
    sourceDefinition["card_game"] = "Card Game";
    sourceDefinition["book"] = "Book";
    sourceDefinition["picture_book"] = "Picture Book";
    sourceDefinition["radio"] = "Radio";
    sourceDefinition["music"] = "Music";
})(sourceDefinition || (sourceDefinition = {}));
var ratingDefinition;
(function (ratingDefinition) {
    ratingDefinition["g"] = "G - All Ages";
    ratingDefinition["pg"] = "PG - Children";
    ratingDefinition["pg_13"] = "PG 13 - Teens 13 and Older";
    ratingDefinition["r"] = "R - 17+ (violence & profanity)";
    ratingDefinition["r+"] = "R+ - Profanity & Mild Nudity";
    ratingDefinition["rx"] = "Rx - Hentai";
})(ratingDefinition || (ratingDefinition = {}));
class MetaOverview extends metaOverviewAbstract_1.MetaOverviewAbstract {
    constructor(url) {
        super(url);
        this.apiCall = helper.apiCall;
        this.logger = this.logger.m('MAL');
        if (url.match(/myanimelist\.net\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.malId = Number(utils.urlPart(url, 4));
            return;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    async _init() {
        this.logger.log('Retrieve', this.type, this.malId);
        const data = await this.getData();
        this.logger.log('Data', data);
        this.title(data);
        this.description(data);
        this.image(data);
        this.alternativeTitle(data);
        this.statistics(data);
        this.info(data);
        this.related(data);
        this.logger.log('Res', this.meta);
    }
    async getData() {
        return this.apiCall({
            type: 'GET',
            path: `${this.type}/${this.malId}`,
            fields: [
                'synopsis',
                'alternative_titles',
                'mean',
                'rank',
                'popularity',
                'num_list_users',
                'num_scoring_users',
                'related_anime',
                'related_manga',
                // Info
                'media_type',
                'num_episodes',
                'num_chapters',
                'num_volumes',
                'status',
                'start_date',
                'end_date',
                'start_season',
                'broadcast',
                'studios',
                'authors{first_name,last_name}',
                'source',
                'genres',
                'average_episode_duration',
                'rating',
                'serialization',
            ],
        });
    }
    title(data) {
        const useAltTitle = api.settings.get('forceEnglishTitles');
        if (useAltTitle) {
            this.meta.title = data.alternative_titles.en || data.title;
        }
        else {
            this.meta.title = data.title;
        }
    }
    description(data) {
        if (data.synopsis)
            this.meta.description = data.synopsis;
    }
    image(data) {
        if (data.main_picture && data.main_picture.medium)
            this.meta.image = data.main_picture.medium;
        this.meta.imageLarge = data.main_picture?.large || data.main_picture?.medium || '';
    }
    alternativeTitle(data) {
        if (data.alternative_titles) {
            for (const prop in data.alternative_titles) {
                const el = data.alternative_titles[prop];
                if (Array.isArray(el)) {
                    this.meta.alternativeTitle = this.meta.alternativeTitle.concat(el);
                }
                else if (el)
                    this.meta.alternativeTitle.push(el);
            }
        }
    }
    statistics(data) {
        if (data.mean)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Score'),
                body: data.mean,
            });
        if (data.rank)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Ranked'),
                body: `#${data.rank}`,
            });
        if (data.popularity)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Popularity'),
                body: `#${data.popularity}`,
            });
        if (data.num_list_users)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Members'),
                body: data.num_list_users.toLocaleString(),
            });
        if (data.num_scoring_users)
            this.meta.statistics.push({
                title: api.storage.lang('overview_sidebar_Votes'),
                body: data.num_scoring_users.toLocaleString(),
            });
    }
    info(data) {
        if (data.media_type) {
            const format = mediaTypeDefinition[data.media_type];
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Format'),
                body: [
                    {
                        text: format ?? data.media_type,
                        url: `https://myanimelist.net/top${this.type}.php?type=${data.media_type}`,
                    },
                ],
            });
        }
        if (data.num_episodes) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Episodes'),
                body: [{ text: data.num_episodes }],
            });
        }
        else if (data.num_episodes === 0) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Episodes'),
                body: [{ text: 'Unknown' }],
            });
        }
        if (data.num_chapters) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Chapters'),
                body: [{ text: data.num_chapters }],
            });
        }
        else if (data.num_chapters === 0) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Chapters'),
                body: [{ text: 'Unknown' }],
            });
        }
        if (data.num_volumes) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Volumes'),
                body: [{ text: data.num_volumes }],
            });
        }
        else if (data.num_volumes === 0) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Volumes'),
                body: [{ text: 'Unknown' }],
            });
        }
        if (data.status) {
            const format = airingStatusDefinition[data.status];
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Status'),
                body: [{ text: format ?? data.status }],
            });
        }
        if (data.start_date) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Aired'),
                body: [
                    {
                        text: new IntlWrapper_1.IntlRange(data.start_date, data.end_date).getDateTimeRangeText(),
                    },
                ],
            });
        }
        if (data.start_season) {
            let format = '';
            if (data.start_season.season)
                format += `${data.start_season.season} `;
            if (data.start_season.year)
                format += data.start_season.year;
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Season'),
                body: [
                    {
                        url: `https://myanimelist.net/${this.type}/season/${data.start_season.year}/${data.start_season.season}`,
                        text: format,
                    },
                ],
            });
        }
        if (data.broadcast) {
            let format = '';
            if (data.broadcast.day_of_the_week)
                format += `${data.broadcast.day_of_the_week} `;
            if (data.broadcast.day_of_the_week && data.broadcast.start_time)
                format += 'at ';
            if (data.broadcast.start_time)
                format += `${data.broadcast.start_time} (JST)`;
            let body = [{ text: format }];
            if (data.broadcast.day_of_the_week && data.broadcast.start_time) {
                const weekDate = (0, time_1.getWeektime)(data.broadcast.day_of_the_week, data.broadcast.start_time);
                if (weekDate) {
                    const broadcastDate = (0, time_1.dateFromTimezoneToTimezone)(weekDate, 'Asia/Tokyo');
                    body = [
                        {
                            date: broadcastDate,
                            type: 'weektime',
                        },
                    ];
                }
            }
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Broadcast'),
                body,
            });
        }
        if (data.studios) {
            const studios = [];
            data.studios.forEach(function (i, index) {
                studios.push({
                    text: i.name,
                    url: `https://myanimelist.net/anime/producer/${i.id}`,
                });
            });
            if (studios.length)
                this.meta.info.push({
                    title: api.storage.lang('overview_sidebar_Studios'),
                    body: studios,
                });
        }
        if (data.authors) {
            const authors = [];
            data.authors.forEach(function (i, index) {
                authors.push({
                    text: `${i.node.last_name ?? ''}${i.node.last_name && i.node.first_name ? ',' : ''} ${i.node.first_name ?? ''}`,
                    url: `https://myanimelist.net/people/${i.node.id}`,
                    subtext: i.role || '',
                });
            });
            if (authors.length)
                this.meta.info.push({
                    title: api.storage.lang('overview_sidebar_Authors'),
                    body: authors,
                });
        }
        if (data.source) {
            const format = sourceDefinition[data.source];
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Source'),
                body: [{ text: format ?? data.source }],
            });
        }
        if (data.genres) {
            const genres = [];
            data.genres.forEach((i, index) => {
                genres.push({
                    text: i.name,
                    url: `https://myanimelist.net/${this.type}/genre/${i.id}`,
                });
            });
            if (genres.length)
                this.meta.info.push({
                    title: api.storage.lang('overview_sidebar_Genres'),
                    body: genres,
                });
        }
        if (data.average_episode_duration) {
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Duration'),
                body: [
                    {
                        text: `${new IntlWrapper_1.IntlDuration().setRelativeTime(data.average_episode_duration, 'seconds', 'Duration').getRelativeText()}`,
                    },
                ],
            });
        }
        if (data.rating) {
            const format = ratingDefinition[data.rating];
            this.meta.info.push({
                title: api.storage.lang('overview_sidebar_Rating'),
                body: [{ text: format ?? data.rating }],
            });
        }
        if (data.serialization) {
            const serialization = [];
            data.serialization.forEach(function (i, index) {
                serialization.push({
                    text: i.node.name,
                    url: `https://myanimelist.net/manga/magazine/${i.node.id}`,
                });
            });
            if (serialization.length)
                this.meta.info.push({
                    title: api.storage.lang('overview_sidebar_Serialization'),
                    body: serialization,
                });
        }
    }
    related(data) {
        const links = {};
        if (data.related_anime.length) {
            data.related_anime.forEach(el => {
                if (typeof links[el.relation_type] === 'undefined') {
                    links[el.relation_type] = {
                        type: el.relation_type_formatted,
                        links: [],
                    };
                }
                links[el.relation_type].links.push({
                    url: `https://myanimelist.net/anime/${el.node.id}`,
                    title: el.node.title,
                    id: el.node.id,
                    type: 'anime',
                });
            });
        }
        if (data.related_manga.length) {
            data.related_manga.forEach(el => {
                if (typeof links[el.relation_type] === 'undefined') {
                    links[el.relation_type] = {
                        type: el.relation_type_formatted,
                        links: [],
                    };
                }
                links[el.relation_type].links.push({
                    url: `https://myanimelist.net/manga/${el.node.id}`,
                    title: el.node.title,
                    id: el.node.id,
                    type: 'manga',
                });
            });
        }
        this.meta.related = Object.keys(links).map(key => links[key]);
    }
}
exports.MetaOverview = MetaOverview;
//# sourceMappingURL=metaOverview.js.map