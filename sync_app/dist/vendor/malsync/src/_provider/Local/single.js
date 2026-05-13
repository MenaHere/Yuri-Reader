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
const Errors_1 = require("../Errors");
const definitions = __importStar(require("../definitions"));
// local://crunchyroll/anime/nogamenolife
class Single extends singleAbstract_1.SingleAbstract {
    constructor(url) {
        super(url);
        this.url = url;
        this.shortName = 'Local';
        this.authenticationUrl = '';
        this.rewatchingSupport = false;
        this.datesSupport = false;
        this.logger = con.m(this.shortName, 'black');
        return this;
    }
    handleUrl(url) {
        if (url.match(/local:\/\/.*/i)) {
            this.id = utils.urlPart(url, 4);
            this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
            this.page = utils.urlPart(url, 2);
            this.key = `local://${this.page}/${this.type}/${this.id}`;
            if (utils.urlPart(url, 5)) {
                this.title = decodeURIComponent(utils.urlPart(url, 5));
            }
            else {
                this.title = 'Unknown';
            }
            return;
        }
        throw new Errors_1.UrlNotSupportedError(url);
    }
    getCacheKey() {
        return `local:${this.id}:${this.page}`;
    }
    getPageId() {
        return this.getCacheKey();
    }
    _getStatus() {
        return this.animeInfo.status;
    }
    _setStatus(status) {
        if (status === definitions.status.Rewatching && !this.supportsRewatching()) {
            status = definitions.status.Watching;
        }
        if (status === definitions.status.Considering && !this.supportsConsidering()) {
            status = definitions.status.PlanToWatch;
        }
        this.animeInfo.status = status;
    }
    _getStartDate() {
        throw new Error('Local sync does not support Start Date');
    }
    _setStartDate(startDate) {
        throw new Error('Local sync does not support Start Date');
    }
    _getFinishDate() {
        throw new Error('Local sync does not support Finish Date');
    }
    _setFinishDate(finishDate) {
        throw new Error('Local sync does not support Finish Date');
    }
    _getRewatchCount() {
        throw new Error('Local sync does not support Rewatch Count');
    }
    _setRewatchCount(rewatchCount) {
        throw new Error('Local sync does not support Rewatch Count');
    }
    _getScore() {
        return this.animeInfo.score;
    }
    _setScore(score) {
        this.animeInfo.score = score;
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
        return this.animeInfo.progress;
    }
    _setEpisode(episode) {
        this.animeInfo.progress = parseInt(`${episode}`);
    }
    _getVolume() {
        return this.animeInfo.volumeprogress;
    }
    _setVolume(volume) {
        this.animeInfo.volumeprogress = volume;
    }
    _getTags() {
        let { tags } = this.animeInfo;
        if (!tags)
            tags = '';
        return tags;
    }
    _setTags(tags) {
        this.animeInfo.tags = tags;
    }
    _getTitle(raw = false) {
        if (raw)
            return this.animeInfo.name;
        return `[L] ${this.animeInfo.name}`;
    }
    _getTotalEpisodes() {
        return 0;
    }
    _getTotalVolumes() {
        return 0;
    }
    _getDisplayUrl() {
        return 'https://github.com/MALSync/MALSync/wiki/Local-Sync';
    }
    _getImage() {
        if (this.animeInfo && this.animeInfo.image)
            return this.animeInfo.image;
        return '';
    }
    setImage(url) {
        const hasImage = Boolean(this.animeInfo.image);
        this.animeInfo.image = url;
        if (this._onList && !hasImage)
            this.sync();
    }
    _getRating() {
        return Promise.resolve('Local');
    }
    async _update() {
        this._authenticated = true;
        this.animeInfo = await api.storage.get(this.key);
        this._onList = true;
        if (!this.animeInfo) {
            this._onList = false;
            this.animeInfo = {
                name: this.title,
                tags: '',
                sUrl: '',
                image: '',
                progress: 0,
                volumeprogress: 0,
                score: 0,
                status: definitions.status.PlanToWatch,
            };
        }
    }
    async _sync() {
        return api.storage.set(this.key, this.animeInfo);
    }
    _delete() {
        return api.storage.remove(this.key);
    }
    // Overload
    setStreamingUrl(streamingUrl) {
        if (this.animeInfo && streamingUrl)
            this.animeInfo.sUrl = streamingUrl;
        return super.setStreamingUrl(streamingUrl);
    }
    getStreamingUrl() {
        if (this.animeInfo && this.animeInfo.sUrl)
            return this.animeInfo.sUrl;
        return super.getStreamingUrl();
    }
}
exports.Single = Single;
//# sourceMappingURL=single.js.map