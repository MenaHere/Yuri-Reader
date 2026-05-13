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
exports.SingleAbstract = void 0;
const definitions = __importStar(require("./definitions"));
const progressRelease_1 = require("../utils/progressRelease");
const releaseProgressUtils_1 = require("../background/releaseProgressUtils");
const emitter_1 = require("../utils/emitter");
const errors_1 = require("../utils/errors");
const general_1 = require("../utils/general");
const Errors_1 = require("./Errors");
const point10_1 = require("./ScoreMode/point10");
const progress_1 = require("../utils/progress");
Object.seal(emitter_1.emitter);
class SingleAbstract {
    constructor(url) {
        this.url = url;
        this.type = null;
        this.syncMethod = 'normal';
        this.askCompleted = false;
        this.rewatchingSupport = true;
        this.consideringSupport = false;
        this.datesSupport = true;
        this.ids = {
            mal: NaN,
            ani: NaN,
            kitsu: {
                id: NaN,
                slug: '',
            },
            simkl: NaN,
            baka: NaN,
        };
        this.options = null;
        this.updateProgress = false;
        this._onList = false;
        this._authenticated = false;
        this.handleUrl(url);
        this.logger = con.m('[S]', '#348fff');
        return this;
    }
    getType() {
        return this.type;
    }
    getUrl() {
        return this.url;
    }
    supportsRewatching() {
        return this.rewatchingSupport;
    }
    supportsConsidering() {
        return this.consideringSupport;
    }
    supportsDates() {
        return this.datesSupport;
    }
    getApiCacheKey() {
        return this.getKey(['ANILIST']);
    }
    getRulesCacheKey() {
        return this.getKey(['ANILIST', 'KITSU'], false);
    }
    setStatus(status) {
        status = Number(status);
        this._setStatus(status);
        return this;
    }
    getStatus() {
        if (!this.isOnList())
            return definitions.status.NoState;
        return this._getStatus();
    }
    setStartDate(startDate) {
        if (this.supportsDates()) {
            this._setStartDate(startDate);
        }
        return this;
    }
    getStartDate() {
        if (this.supportsDates()) {
            return this._getStartDate();
        }
        return null;
    }
    setFinishDate(finishDate) {
        if (this.supportsDates()) {
            this._setFinishDate(finishDate);
        }
        return this;
    }
    getFinishDate() {
        if (this.supportsDates()) {
            return this._getFinishDate();
        }
        return null;
    }
    setRewatchCount(rewatchCount) {
        if (this.supportsRewatching()) {
            this._setRewatchCount(rewatchCount);
        }
        return this;
    }
    getRewatchCount() {
        if (this.supportsRewatching()) {
            return this._getRewatchCount();
        }
        return null;
    }
    getScoreMode() {
        return point10_1.point10;
    }
    /**
     * @deprecated Use setAbsoluteScore instead
     */
    setScore(score) {
        score = parseInt(`${score}`);
        if (!score)
            score = 0;
        this._setScore(score);
        return this;
    }
    /**
     * @deprecated Use getAbsoluteScore instead
     */
    getScore() {
        const score = this._getScore();
        if (!score)
            return 0;
        return score;
    }
    setAbsoluteScore(score) {
        score = parseInt(`${score}`);
        this._setAbsoluteScore(score);
        return this;
    }
    getAbsoluteScore() {
        const score = this._getAbsoluteScore();
        if (!score)
            return 0;
        return score;
    }
    setEpisode(episode) {
        episode = parseInt(`${episode}`);
        if (this.getTotalEpisodes() && episode > this.getTotalEpisodes())
            episode = this.getTotalEpisodes();
        this._setEpisode(episode);
        return this;
    }
    getEpisode() {
        return this._getEpisode();
    }
    setVolume(volume) {
        this._setVolume(volume);
        return this;
    }
    getVolume() {
        return this._getVolume();
    }
    setStreamingUrl(streamingUrl) {
        if (this.options) {
            this.options.u = streamingUrl;
        }
        return this;
    }
    getStreamingUrl() {
        if (this.options && this.options.u) {
            return this.options.u;
        }
        return undefined;
    }
    cleanTags() {
        this.options = null;
    }
    async initProgress() {
        const xhr = await (0, releaseProgressUtils_1.predictionXhrGET)(this.getType(), this.getApiCacheKey());
        return new progressRelease_1.ProgressRelease(this.getCacheKey(), this.getType())
            .init({
            uid: this.getCacheKey(),
            apiCacheKey: this.getApiCacheKey(),
            title: this.getTitle(),
            cacheKey: this.getCacheKey(),
            progressMode: this.getProgressMode(),
            watchedEp: this.getEpisode(),
            single: this,
            xhr,
        })
            .then(progress => {
            this.updateProgress = false;
            this.progress = progress;
            this.progressXhr = xhr;
        });
    }
    getProgress() {
        if (!this.progress)
            return null;
        return this.progress;
    }
    getProgressFormatted() {
        if (!this.progressXhr || !this.progressXhr.length)
            return [];
        return this.progressXhr.map(el => new progress_1.Progress(el, this.getType()));
    }
    getProgressOptions() {
        return this.getProgressFormatted().filter(el => el.getState() !== 'complete');
    }
    getProgressCompleted() {
        return this.getProgressFormatted().filter(el => el.getState() === 'complete');
    }
    getProgressMode() {
        if (this.options && this.options.p) {
            return this.options.p;
        }
        return '';
    }
    setProgressMode(mode) {
        if (this.options) {
            this.options.p = mode;
            this.updateProgress = true;
        }
        if (!api.settings.get('malTags')) {
            utils
                .setEntrySettings(this.type, this.getCacheKey(), this.options, this._getTags())
                .then(() => this.initProgress());
        }
    }
    getProgressKey() {
        let mode = this.getProgressMode();
        if (!mode) {
            if (this.getType() === 'anime') {
                mode = api.settings.get('progressIntervalDefaultAnime');
            }
            else {
                mode = api.settings.get('progressIntervalDefaultManga');
            }
        }
        if (!mode)
            return null;
        const res = /^([^/]*)\/(.*)$/.exec(mode);
        if (!res)
            return null;
        return {
            key: mode,
            lang: res[1],
            type: res[2],
        };
    }
    getPageRelations() {
        const name = this.shortName;
        const res = [];
        if (this.ids.mal && name !== 'MAL') {
            res.push({
                name: 'MAL',
                icon: 'https://cdn.myanimelist.net/images/favicon.ico',
                link: `https://myanimelist.net/${this.type}/${this.ids.mal}`,
            });
        }
        if (this.ids.ani && name !== 'AniList') {
            res.push({
                name: 'AniList',
                icon: 'https://anilist.co/img/icons/favicon-32x32.png',
                link: `https://anilist.co/${this.type}/${this.ids.ani}`,
            });
        }
        if (this.ids.kitsu.id && name !== 'Kitsu') {
            res.push({
                name: 'Kitsu',
                icon: 'https://kitsu.app/favicon-32x32-3e0ecb6fc5a6ae681e65dcbc2bdf1f17.png',
                link: `https://kitsu.app/${this.type}/${this.ids.kitsu.id}`,
            });
        }
        if (this.ids.simkl && name !== 'Simkl') {
            res.push({
                name: 'Simkl',
                icon: 'https://eu.simkl.in/img_favicon/v2/favicon-32x32.png',
                link: `https://simkl.com/${this.type}/${this.ids.simkl}`,
            });
        }
        return res;
    }
    fillRelations() {
        return Promise.resolve();
    }
    update() {
        this.logger.log('[SINGLE]', 'Update info', this.ids);
        this.lastError = null;
        return this._update()
            .catch(e => {
            this.lastError = e;
            throw e;
        })
            .then(() => {
            this.persistenceState = this.getStateEl();
            return utils.getEntrySettings(this.type, this.getCacheKey(), this._getTags());
        })
            .then(options => {
            this.options = options;
            this.registerEvent();
            this.emitUpdate('state');
        });
    }
    async sync() {
        this.logger.log('[SINGLE]', 'Sync', this.ids);
        this.lastError = null;
        this._setTags(await utils.setEntrySettings(this.type, this.getCacheKey(), this.options, this._getTags()));
        this.fixDates();
        return this._sync()
            .catch(e => {
            this.lastError = e;
            throw e;
        })
            .then(() => {
            this.undoState = this.persistenceState;
            if (this.updateProgress)
                this.initProgress();
            this._onList = true;
            this.emitUpdate();
        });
    }
    emitUpdate(action = 'update') {
        (0, emitter_1.globalEmit)(`${action}.${this.getCacheKey()}`, {
            id: this.getPageId(),
            type: this.getType(),
            cacheKey: this.getCacheKey(),
            state: this.getStateEl(),
            meta: {
                title: this.getTitle(),
                image: this.getImage(),
                malId: this.getMalId(),
                totalEp: this.getTotalEpisodes(),
                url: this.getUrl(),
            },
        });
    }
    async delete() {
        return this._delete().then(() => {
            this._onList = false;
            (0, emitter_1.globalEmit)(`delete.${this.getCacheKey()}`, {
                id: this.getPageId(),
                type: this.getType(),
                cacheKey: this.getCacheKey(),
            });
        });
    }
    registerEvent() {
        if (!this.globalUpdateEvent) {
            this.globalUpdateEvent = emitter_1.emitter.on(`update.${this.getCacheKey()}`, data => this.updateEvent(data));
        }
    }
    updateEvent(data) {
        if (this.isDirty()) {
            this.logger.log('Ignore event');
            return;
        }
        if (data && data.state) {
            this.setStateEl(data.state);
            this.persistenceState = this.getStateEl();
            emitter_1.emitter.emit('syncPage_fillUi');
        }
    }
    isDirty() {
        return (JSON.stringify(this.persistenceState) !== JSON.stringify(this.getStateEl()) ||
            this.updateProgress);
    }
    isValueDirty(key) {
        if (!this._onList) {
            return true;
        }
        if (this.persistenceState) {
            return this.persistenceState[key] !== this.getStateEl()[key];
        }
        return false;
    }
    undo() {
        this.logger.log('[SINGLE]', 'Undo', this.undoState);
        if (!this.undoState)
            throw new errors_1.SafeError('No undo state found');
        if (!this.undoState.onList) {
            // @ts-ignore
            if (typeof this.delete === 'undefined')
                throw new Error('Deleting an entry is not supported');
            // @ts-ignore
            return this.delete().then(() => {
                this.setStateEl(this.undoState);
                this.undoState = null;
            });
        }
        this.setStateEl(this.undoState);
        return this.sync().then(() => {
            this.undoState = null;
        });
    }
    getTitle(raw = false) {
        return this._getTitle(raw);
    }
    getTotalEpisodes() {
        let eps = this._getTotalEpisodes();
        if (!eps)
            eps = 0;
        return eps;
    }
    getTotalVolumes() {
        return this._getTotalVolumes();
    }
    isOnList() {
        return this._onList;
    }
    isAuthenticated() {
        return this._authenticated;
    }
    getDisplayUrl() {
        return this._getDisplayUrl();
    }
    getMalUrl() {
        if (!Number.isNaN(this.ids.mal)) {
            return `https://myanimelist.net/${this.getType()}/${this.ids.mal}`;
        }
        return null;
    }
    getMalId() {
        if (!Number.isNaN(this.ids.mal)) {
            return this.ids.mal;
        }
        return null;
    }
    getIds() {
        return this.ids;
    }
    getImage() {
        return this._getImage();
    }
    getRating() {
        return this._getRating().then(rating => {
            if (!rating)
                return 'N/A';
            return rating;
        });
    }
    setResumeWatching(url, ep) {
        return utils.setResumeWaching(url, ep, this.type, this.getCacheKey());
    }
    getResumeWatching() {
        if (this.options && this.options.r)
            return this.options.r;
        return null;
    }
    setContinueWatching(url, ep) {
        return utils.setContinueWaching(url, ep, this.type, this.getCacheKey());
    }
    getContinueWatching() {
        if (this.options && this.options.c)
            return this.options.c;
        return null;
    }
    increaseRewatchCount() {
        //  do nothing
    }
    finishedAiring() {
        return true;
    }
    getStateEl() {
        return {
            onList: this.isOnList(),
            episode: this.getEpisode(),
            volume: this.getVolume(),
            status: this.getStatus(),
            startDate: this.getStartDate(),
            finishDate: this.getFinishDate(),
            rewatchCount: this.getRewatchCount(),
            score: this.getScore(),
            absoluteScore: this.getAbsoluteScore(),
            tags: this._getTags(),
        };
    }
    setStateEl(state) {
        this._onList = state.onList;
        this.setEpisode(state.episode);
        this.setVolume(state.volume);
        this.setStatus(state.status);
        this.setStartDate(state.startDate);
        this.setFinishDate(state.finishDate);
        this.setRewatchCount(state.rewatchCount);
        this.setScore(state.score);
        if (state.absoluteScore)
            this.setAbsoluteScore(state.absoluteScore);
    }
    getStateDiff() {
        const persistance = this.getStateEl();
        if (persistance && this.undoState) {
            const diff = {};
            for (const key in persistance) {
                if (persistance[key] !== this.undoState[key]) {
                    diff[key] = persistance[key];
                }
            }
            return diff;
        }
        return undefined;
    }
    getSyncMethod() {
        return this.syncMethod;
    }
    setSyncMethod(method) {
        this.syncMethod = method;
    }
    fixDates() {
        if (!this.supportsDates() || this.getSyncMethod() === 'listSync') {
            return;
        }
        const today = (0, general_1.returnYYYYMMDD)();
        if (this.getStartDate() === null &&
            this._getStatus() === definitions.status.Watching &&
            this._getEpisode() > 0) {
            this.setStartDate(today);
        }
        if (this.getFinishDate() === null && this._getStatus() === definitions.status.Completed) {
            this.setFinishDate(today);
            if (this.getStartDate() === null) {
                this.setStartDate(today);
            }
        }
    }
    async lifeCycleHook(state) {
        if (this.askCompleted) {
            if ((state === 'afterCheckSync' && api.settings.get('askBefore')) ||
                (state === 'beforeSync' && !api.settings.get('askBefore'))) {
                this.askCompleted = false;
                if (this.getStatus() === definitions.status.Rewatching) {
                    await this.finishRewatchingMessage();
                }
                else {
                    await this.finishWatchingMessage();
                }
            }
        }
    }
    async checkSync(episode, volume) {
        const curEpisode = this.getEpisode();
        const curStatus = this.getStatus();
        const curVolume = this.getVolume();
        if (curStatus === definitions.status.Completed) {
            if (episode === 1) {
                return this.startRewatchingMessage();
            }
            return false;
        }
        if (curEpisode >= episode &&
            // Novel Volume
            !(typeof volume !== 'undefined' &&
                (curVolume || volume > 1 || !episode) &&
                volume > curVolume)) {
            return false;
        }
        if (episode && episode === this.getTotalEpisodes() && this.finishedAiring()) {
            this.askCompleted = true;
            return true;
        }
        if (curStatus !== definitions.status.Watching && curStatus !== definitions.status.Rewatching) {
            return this.startWatchingMessage();
        }
        return true;
    }
    async startWatchingMessage() {
        return utils
            .flashConfirm(api.storage.lang(`syncPage_flashConfirm_start_${this.getType()}`), 'add')
            .then(res => {
            if (res) {
                this.setStatus(definitions.status.Watching);
                this.setStartDate((0, general_1.returnYYYYMMDD)());
            }
            return res;
        });
    }
    async finishWatchingMessage() {
        const currentScore = this.getScoreCheckboxValue();
        let checkHtml = '<div><select id="finish_score" style="margin-top:5px; color:white; background-color:#4e4e4e; border: none;">';
        this.getScoreCheckbox().forEach(el => {
            checkHtml += `<option value="${el.value}" ${currentScore === el.value ? 'selected' : ''}>${el.label}</option>`;
        });
        checkHtml += '</select></div>';
        return utils
            .flashConfirm(api.storage.lang('syncPage_flashConfirm_complete') + checkHtml, 'complete')
            .then(res => {
            if (res) {
                this.setStatus(definitions.status.Completed);
                this.setFinishDate((0, general_1.returnYYYYMMDD)());
                if (!this.getStartDate()) {
                    this.setStartDate((0, general_1.returnYYYYMMDD)());
                }
                const finishScore = Number(j.$('#finish_score').val());
                if (finishScore > 0) {
                    this.logger.log(`finish_score: ${j.$('#finish_score :selected').val()}`);
                    this.handleScoreCheckbox(j.$('#finish_score :selected').val());
                }
            }
            return res;
        });
    }
    async startRewatchingMessage() {
        return utils
            .flashConfirm(api.storage.lang(`syncPage_flashConfirm_rewatch_start_${this.getType()}`), 'add')
            .then(res => {
            if (res)
                this.setStatus(definitions.status.Rewatching);
            return res;
        });
    }
    async finishRewatchingMessage() {
        return utils
            .flashConfirm(api.storage.lang(`syncPage_flashConfirm_rewatch_finish_${this.getType()}`), 'complete')
            .then(res => {
            if (res) {
                this.setStatus(definitions.status.Completed);
                this.increaseRewatchCount();
            }
            return res;
        });
    }
    getScoreCheckbox() {
        return this.getScoreMode().getOptions();
    }
    getScoreCheckboxValue() {
        return this.getScoreMode().valueToOptionValue(this.getAbsoluteScore());
    }
    handleScoreCheckbox(value) {
        this.setAbsoluteScore(this.getScoreMode().optionValueToValue(value));
    }
    getDisplayScoreCheckbox() {
        const curScore = this.getScoreCheckboxValue();
        const labelEl = this.getScoreCheckbox().filter(el => el.value === curScore);
        if (labelEl.length)
            return labelEl[0].label;
        return '';
    }
    getStatusCheckbox() {
        const statusEs = [
            {
                value: definitions.status.Watching.toString(),
                label: api.storage.lang(`UI_Status_watching_${this.getType()}`),
            },
            {
                value: definitions.status.Completed.toString(),
                label: api.storage.lang('UI_Status_Completed'),
            },
            { value: definitions.status.Onhold.toString(), label: api.storage.lang('UI_Status_OnHold') },
            {
                value: definitions.status.Dropped.toString(),
                label: api.storage.lang('UI_Status_Dropped'),
            },
            {
                value: definitions.status.PlanToWatch.toString(),
                label: api.storage.lang(`UI_Status_planTo_${this.getType()}`),
            },
        ];
        if (this.supportsRewatching()) {
            statusEs.push({
                value: definitions.status.Rewatching.toString(),
                label: api.storage.lang(`UI_Status_Rewatching_${this.getType()}`),
            });
        }
        if (this.supportsConsidering()) {
            statusEs.push({
                value: definitions.status.Considering.toString(),
                label: api.storage.lang('UI_Status_Considering'),
            });
        }
        return statusEs;
    }
    handleStatusCheckbox(value) {
        this.setStatus(value);
    }
    getStatusCheckboxValue() {
        return this.getStatus();
    }
    getKey(allowed, forceMal = true) {
        if (forceMal && this.ids.mal)
            return this.ids.mal;
        if (this.ids.ani && allowed.includes('ANILIST'))
            return `anilist:${this.ids.ani}`;
        if (this.ids.kitsu.id && allowed.includes('KITSU'))
            return `kitsu:${this.ids.kitsu.id}`;
        if (this.ids.simkl && allowed.includes('SIMKL'))
            return `simkl:${this.ids.simkl}`;
        if (this.ids.baka && allowed.includes('MANGABAKA'))
            return `mangabaka:${this.ids.baka}`;
        return this.ids.mal;
    }
    getLastError() {
        return this.lastError;
    }
    getLastErrorMessage() {
        return this.errorMessage(this.getLastError());
    }
    flashmError(error) {
        utils.flashm(this.errorMessage(error), { error: true, type: 'error' });
    }
    errorMessage(error) {
        return (0, Errors_1.errorMessage)(error, this.authenticationUrl);
    }
}
exports.SingleAbstract = SingleAbstract;
//# sourceMappingURL=singleAbstract.js.map