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
const Errors_1 = require("../Errors");
const point100_1 = require("../ScoreMode/point100");
const point10_1 = require("../ScoreMode/point10");
const smiley3_1 = require("../ScoreMode/smiley3");
const stars5_1 = require("../ScoreMode/stars5");
const point100decimal_1 = require("../ScoreMode/point100decimal");
class Single extends singleAbstract_1.SingleAbstract {
    constructor(url) {
        super(url);
        this.url = url;
        this.displayUrl = '';
        this.shortName = 'AniList';
        this.authenticationUrl = 'https://anilist.co/api/v2/oauth/authorize?client_id=1487&response_type=token';
        this.logger = con.m(this.shortName, '#3db4f2');
        return this;
    }
    handleUrl(url) {
        if (url.match(/anilist\.co\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.ids.ani = Number(utils.urlPart(url, 4));
            return;
        }
        if (url.match(/myanimelist\.net\/(anime|manga)\/\d*/i)) {
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.ids.mal = Number(utils.urlPart(url, 4));
            return;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    getCacheKey() {
        return this.getKey(['ANILIST']);
    }
    getPageId() {
        return this.ids.ani;
    }
    _getStatus() {
        return parseInt(helper.statusTranslate[this.animeInfo.mediaListEntry.status]);
    }
    _setStatus(status) {
        this.animeInfo.mediaListEntry.status = helper.statusTranslate[status];
    }
    _getStartDate() {
        return helper.parseFuzzyDate(this.animeInfo.mediaListEntry.startedAt);
    }
    _setStartDate(startDate) {
        this.animeInfo.mediaListEntry.startedAt = helper.getFuzzyDate(startDate);
    }
    _getFinishDate() {
        return helper.parseFuzzyDate(this.animeInfo.mediaListEntry.completedAt);
    }
    _setFinishDate(finishDate) {
        this.animeInfo.mediaListEntry.completedAt = helper.getFuzzyDate(finishDate);
    }
    _getRewatchCount() {
        return this.animeInfo.mediaListEntry.repeat;
    }
    _setRewatchCount(rewatchCount) {
        this.animeInfo.mediaListEntry.repeat = rewatchCount;
    }
    _getScore() {
        if (Number(this.animeInfo.mediaListEntry.score) === 0)
            return 0;
        const score = Math.round(Number(this.animeInfo.mediaListEntry.score) / 10);
        if (score === 0)
            return 1;
        return score;
    }
    _setScore(score) {
        this.animeInfo.mediaListEntry.score = score * 10;
    }
    _getAbsoluteScore() {
        return Number(this.animeInfo.mediaListEntry.score);
    }
    _setAbsoluteScore(score) {
        this.animeInfo.mediaListEntry.score = Number(score);
    }
    _getEpisode() {
        return this.animeInfo.mediaListEntry.progress;
    }
    _setEpisode(episode) {
        this.animeInfo.mediaListEntry.progress = parseInt(`${episode}`);
    }
    _getVolume() {
        return this.animeInfo.mediaListEntry.progressVolumes;
    }
    _setVolume(volume) {
        this.animeInfo.mediaListEntry.progressVolumes = volume;
    }
    _getTags() {
        let tags = this.animeInfo.mediaListEntry.notes;
        if (tags === null || tags === 'null')
            tags = '';
        return tags;
    }
    _setTags(tags) {
        this.animeInfo.mediaListEntry.notes = tags;
    }
    _getTitle() {
        return this.animeInfo.title.userPreferred;
    }
    _getTotalEpisodes() {
        const eps = this.animeInfo.episodes ? this.animeInfo.episodes : this.animeInfo.chapters;
        if (eps === null)
            return 0;
        return eps;
    }
    _getTotalVolumes() {
        const vol = this.animeInfo.volumes;
        if (!vol)
            return 0;
        return vol;
    }
    _getDisplayUrl() {
        return this.displayUrl !== '' && this.displayUrl !== null ? this.displayUrl : this.url;
    }
    _getImage() {
        return helper.imgCheck(this.animeInfo.coverImage.large);
    }
    _getRating() {
        return Promise.resolve(this.animeInfo.averageScore);
    }
    async _update() {
        let selectId = this.ids.mal;
        let selectQuery = 'idMal';
        if (Number.isNaN(this.ids.mal)) {
            selectId = this.ids.ani;
            selectQuery = 'id';
        }
        const query = `
    query ($id: Int, $type: MediaType) {
      Media (${selectQuery}: $id, type: $type) {
        id
        idMal
        siteUrl
        episodes
        chapters
        volumes
        averageScore
        coverImage{
          large
        }
        title {
          userPreferred
        }
        mediaListEntry {
          id
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
          progress
          progressVolumes
          score(format: POINT_100)
          repeat
          notes
        }
      }
    }
    `;
        const variables = {
            id: selectId,
            type: this.type.toUpperCase(),
        };
        this._authenticated = true;
        return this.apiCall(query, variables)
            .catch(e => {
            if (e instanceof Errors_1.NotAutenticatedError) {
                this._authenticated = false;
                return this.apiCall(query, variables, false);
            }
            throw e;
        })
            .then(json => {
            this.logger.log('[SINGLE]', 'Data', json);
            this.animeInfo = json.data.Media;
            this.ids.ani = this.animeInfo.id;
            if (Number.isNaN(this.ids.mal) && this.animeInfo.idMal) {
                this.ids.mal = this.animeInfo.idMal;
            }
            this.displayUrl = this.animeInfo.siteUrl;
            this._onList = true;
            if (this.animeInfo.mediaListEntry === null) {
                this._onList = false;
                this.animeInfo.mediaListEntry = {
                    notes: '',
                    progress: 0,
                    progressVolumes: 0,
                    repeat: 0,
                    score: 0,
                    status: 'PLANNING',
                    startedAt: {
                        year: null,
                        month: null,
                        day: null,
                    },
                    completedAt: {
                        year: null,
                        month: null,
                        day: null,
                    },
                };
            }
            if (!this._authenticated)
                throw new Errors_1.NotAutenticatedError('Not Authenticated');
        });
    }
    async _sync() {
        let query = `
      mutation ($mediaId: Int, $status: MediaListStatus, $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput, $progress: Int, $scoreRaw: Int, $repeat: Int, $notes: String) {
        SaveMediaListEntry (mediaId: $mediaId, status: $status, startedAt: $startedAt, completedAt: $completedAt, progress: $progress, scoreRaw: $scoreRaw, repeat: $repeat, notes: $notes) {
          id
          status
          progress
        }
      }
    `;
        const variables = {
            mediaId: this.ids.ani,
            status: this.animeInfo.mediaListEntry.status,
            startedAt: this.animeInfo.mediaListEntry.startedAt,
            completedAt: this.animeInfo.mediaListEntry.completedAt,
            progress: this.animeInfo.mediaListEntry.progress,
            scoreRaw: this.animeInfo.mediaListEntry.score,
            repeat: this.animeInfo.mediaListEntry.repeat,
            notes: this.animeInfo.mediaListEntry.notes,
            volumes: null,
        };
        if (this.type === 'manga') {
            query = `
        mutation ($mediaId: Int, $status: MediaListStatus, $startedAt: FuzzyDateInput, $completedAt: FuzzyDateInput, $progress: Int, $scoreRaw: Int, $repeat: Int, $notes: String, $volumes: Int) {
          SaveMediaListEntry (mediaId: $mediaId, status: $status, startedAt: $startedAt, completedAt: $completedAt, progress: $progress, scoreRaw: $scoreRaw, repeat: $repeat, notes: $notes, progressVolumes: $volumes) {
            id
            status
            progress
            progressVolumes
          }
        }
      `;
            variables.volumes = this.animeInfo.mediaListEntry.progressVolumes;
        }
        return this.apiCall(query, variables).then(json => {
            if (json && json.data && json.data.SaveMediaListEntry && json.data.SaveMediaListEntry.id) {
                this.animeInfo.mediaListEntry.id = json.data.SaveMediaListEntry.id;
            }
            return json;
        });
    }
    apiCall(query, variables, authentication = true) {
        return helper.apiCall(query, variables, authentication);
    }
    getScoreMode() {
        switch (api.settings.get('anilistOptions').scoreFormat) {
            case 'POINT_100':
                return point100_1.point100;
            case 'POINT_3':
                return smiley3_1.smiley3;
            case 'POINT_5':
                return stars5_1.stars5;
            case 'POINT_10_DECIMAL':
                return point100decimal_1.point100decimal;
            default:
                return point10_1.point10;
        }
    }
    _delete() {
        const query = `
      mutation ($mediaId: Int) {
        DeleteMediaListEntry(id: $mediaId) {
          deleted
        }
      }
    `;
        const variables = {
            mediaId: this.animeInfo.mediaListEntry.id,
        };
        return this.apiCall(query, variables);
    }
}
exports.Single = Single;
//# sourceMappingURL=single.js.map