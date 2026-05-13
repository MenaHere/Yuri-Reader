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
exports.Single = void 0;
const singleAbstract_1 = require("../singleAbstract");
const helper = __importStar(require("./helper"));
const definitions = __importStar(require("../definitions"));
const Errors_1 = require("../Errors");
class Single extends singleAbstract_1.SingleAbstract {
    constructor(url) {
        super(url);
        this.url = url;
        this.episodeUpdate = false;
        this.statusUpdate = false;
        this.ratingUpdate = false;
        this.minWatchedEp = 1;
        this.curWatchedEp = 0;
        this.shortName = 'Simkl';
        this.authenticationUrl = helper.getAuthUrl();
        this.rewatchingSupport = false;
        this.datesSupport = false;
        this.syncList = helper.syncList;
        this.getSingle = helper.getSingle;
        this.call = helper.call;
        this.errorHandling = helper.errorHandling;
        this.logger = con.m(this.shortName, '#9b7400');
        return this;
    }
    handleUrl(url) {
        if (url.match(/simkl\.com\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.ids.simkl = parseInt(utils.urlPart(url, 4));
            if (this.type === 'manga')
                throw 'Simkl has no manga support';
            return;
        }
        if (url.match(/myanimelist\.net\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.ids.mal = Number(utils.urlPart(url, 4));
            if (this.type === 'manga')
                throw 'Simkl has no manga support';
            return;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    getCacheKey() {
        return this.getKey(['SIMKL']);
    }
    getPageId() {
        return this.ids.simkl;
    }
    _getStatus() {
        return parseInt(helper.translateList(this.animeInfo.status));
    }
    _setStatus(status) {
        if (status === definitions.status.Rewatching) {
            status = definitions.status.Watching;
        }
        status = helper.translateList(status, parseInt(status.toString()));
        if (status !== this.animeInfo.status) {
            this.statusUpdate = true;
        }
        this.animeInfo.status = status;
    }
    _getStartDate() {
        throw new Error('Simkl does not support Start Date');
    }
    _setStartDate(startDate) {
        throw new Error('Simkl does not support Start Date');
    }
    _getFinishDate() {
        throw new Error('Simkl does not support Finish Date');
    }
    _setFinishDate(finishDate) {
        throw new Error('Simkl does not support Finish Date');
    }
    _getRewatchCount() {
        throw new Error('Simkl does not support Rewatch Count');
    }
    _setRewatchCount(rewatchCount) {
        throw new Error('Simkl does not support Rewatch Count');
    }
    _getScore() {
        const score = this.animeInfo.user_rating;
        if (score === null)
            return 0;
        return score;
    }
    _setScore(score) {
        if (score === 0)
            score = null;
        if (score !== this.animeInfo.user_rating)
            this.ratingUpdate = true;
        this.animeInfo.user_rating = score;
    }
    _getAbsoluteScore() {
        return this.getScore() * 10;
    }
    _setAbsoluteScore(score) {
        if (!score) {
            this.setScore(0);
            return;
        }
        if (score < 10) {
            this.setScore(1);
            return;
        }
        this.setScore(Math.round(score / 10));
    }
    _getEpisode() {
        if (this._getStatus() === definitions.status.Completed) {
            return this._getTotalEpisodes();
        }
        return this.curWatchedEp;
    }
    _setEpisode(episode) {
        if (episode !== this.curWatchedEp)
            this.episodeUpdate = true;
        this.curWatchedEp = episode;
    }
    _getVolume() {
        return 0;
    }
    _setVolume(volume) {
        this.logger.error('You cant set Volumes for animes');
    }
    _getTags() {
        let tags = this.animeInfo.private_memo;
        if (tags === null || tags === 'null')
            tags = '';
        return tags;
    }
    _setTags(tags) {
        this.animeInfo.private_memo = tags;
    }
    _getTitle() {
        return this.animeInfo.show.title;
    }
    _getTotalEpisodes() {
        const eps = this.animeInfo.total_episodes_count;
        if (eps === null)
            return 0;
        return eps;
    }
    _getTotalVolumes() {
        return 0;
    }
    _getDisplayUrl() {
        return `https://simkl.com/${this.getType()}/${this.ids.simkl}`;
    }
    _getImage() {
        return `https://simkl.in/posters/${this.animeInfo.show.poster}_ca.jpg`;
    }
    async _getRating() {
        try {
            const el = await this.call('https://api.simkl.com/ratings', { simkl: this.ids.simkl }, true);
            return el.simkl.rating;
        }
        catch (e) {
            this.logger.error(e);
            return 'N/A';
        }
    }
    async _update() {
        let de;
        if (Number.isNaN(this.ids.mal)) {
            de = { simkl: this.ids.simkl };
        }
        else {
            de = { mal: this.ids.mal };
        }
        this._authenticated = true;
        return this.getSingle(de)
            .catch(e => {
            if (e instanceof Errors_1.NotAutenticatedError) {
                this._authenticated = false;
                return '';
            }
            throw e;
        })
            .then(async (res) => {
            this.logger.log(res);
            this.episodeUpdate = false;
            this.statusUpdate = false;
            this.ratingUpdate = false;
            this.animeInfo = res;
            this._onList = true;
            if (!this.animeInfo) {
                this._onList = false;
                let el;
                if (de.simkl) {
                    el = await this.call(`https://api.simkl.com/anime/${de.simkl}`, { extended: 'full' }, true);
                    if (!el)
                        throw new Errors_1.NotFoundError('Anime not found');
                }
                else {
                    el = await this.call('https://api.simkl.com/search/id', de, true);
                    if (!el?.length)
                        throw new Errors_1.NotFoundError('Anime not found');
                    if (el[0].mal && el[0].mal.type && el[0].mal.type === 'Special')
                        throw new Error('Is a special');
                    el = el[0];
                }
                this.animeInfo = {
                    last_watched: '',
                    last_watched_at: '',
                    next_to_watch: '',
                    not_aired_episodes_count: 0,
                    private_memo: '',
                    status: 'plantowatch',
                    total_episodes_count: 0,
                    user_rating: null,
                    watched_episodes_count: 0,
                    show: el,
                };
                this.logger.log('Add anime', this.animeInfo);
            }
            if (Number.isNaN(this.ids.simkl)) {
                this.ids.simkl = parseInt(this.animeInfo.show.ids.simkl);
            }
            if (Number.isNaN(this.ids.mal) && typeof this.animeInfo.show.ids.mal !== 'undefined') {
                this.ids.mal = this.animeInfo.show.ids.mal;
            }
            this.curWatchedEp = helper.getEpisode(this.animeInfo.last_watched);
            if (!this.curWatchedEp && this.animeInfo.next_to_watch) {
                const next = helper.getEpisode(this.animeInfo.next_to_watch);
                if (next)
                    this.curWatchedEp = next - 1;
            }
            this.minWatchedEp = this.curWatchedEp + 1;
            if (!this._authenticated)
                throw new Errors_1.NotAutenticatedError('Not Authenticated');
        });
    }
    async _sync() {
        this.logger.log('[SET] Object:', this.animeInfo, 'status', this.statusUpdate, 'episode', this.episodeUpdate, 'rating', this.ratingUpdate, 'minWatchedEp', this.minWatchedEp, 'curWatchedEp', this.curWatchedEp);
        // Status
        if (this.statusUpdate || !this.isOnList()) {
            const response = await this.call('https://api.simkl.com/sync/add-to-list', JSON.stringify({
                shows: [
                    {
                        to: this.animeInfo.status,
                        ids: {
                            simkl: this.ids.simkl,
                        },
                    },
                ],
            }), false, 'POST');
            this.logger.log('Status response', response);
        }
        // Episode and memo
        if (this.episodeUpdate || !this.isOnList()) {
            const curEp = this.curWatchedEp;
            const episodes = [];
            if (this.minWatchedEp <= curEp) {
                if (curEp) {
                    for (let i = this.minWatchedEp; i <= curEp; i++) {
                        episodes.push({
                            number: i,
                        });
                    }
                    const response = await this.call('https://api.simkl.com/sync/history', JSON.stringify({
                        shows: [
                            {
                                ids: {
                                    simkl: this.ids.simkl,
                                },
                                private_memo: this.animeInfo.private_memo,
                                seasons: [
                                    {
                                        number: 1,
                                        episodes,
                                    },
                                ],
                            },
                        ],
                    }), false, 'POST');
                    this.logger.log('Episode response', response);
                }
            }
            else {
                for (let i = this.minWatchedEp - 1; i > curEp; i -= 1) {
                    episodes.push({
                        number: i,
                    });
                }
                const response = await this.call('https://api.simkl.com/sync/history/remove', JSON.stringify({
                    shows: [
                        {
                            ids: {
                                simkl: this.ids.simkl,
                            },
                            seasons: [
                                {
                                    number: 1,
                                    episodes,
                                },
                            ],
                        },
                    ],
                }), false, 'POST');
                this.logger.log('Episode remove response', response);
            }
            this.minWatchedEp = curEp + 1;
        }
        // Rating
        if (this.ratingUpdate) {
            if (this.animeInfo.user_rating) {
                const response = await this.call('https://api.simkl.com/sync/ratings', JSON.stringify({
                    shows: [
                        {
                            rating: this.animeInfo.user_rating,
                            ids: {
                                simkl: this.ids.simkl,
                            },
                        },
                    ],
                }), false, 'POST');
                this.logger.log('Rating response', response);
            }
            else {
                const response = await this.call('https://api.simkl.com/sync/ratings/remove', JSON.stringify({
                    shows: [
                        {
                            ids: {
                                simkl: this.ids.simkl,
                            },
                        },
                    ],
                }), false, 'POST');
                this.logger.log('Rating remove response', response);
            }
        }
        this.episodeUpdate = false;
        this.statusUpdate = false;
        this.ratingUpdate = false;
    }
    _delete() {
        return this.call('https://api.simkl.com/sync/history/remove', JSON.stringify({
            shows: [
                {
                    ids: {
                        simkl: this.ids.simkl,
                    },
                },
            ],
        }), false, 'POST');
    }
}
exports.Single = Single;
//# sourceMappingURL=single.js.map