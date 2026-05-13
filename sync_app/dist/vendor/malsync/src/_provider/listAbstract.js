"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAbstract = void 0;
const Cache_1 = require("../utils/Cache");
const progressRelease_1 = require("../utils/progressRelease");
const emitter_1 = require("../utils/emitter");
const Errors_1 = require("./Errors");
Object.seal(emitter_1.emitter);
class ListAbstract {
    constructor(status = 1, listType = 'anime', sort = 'default') {
        this.status = status;
        this.listType = listType;
        this.sort = sort;
        this.done = false;
        this.loading = false;
        this.firstLoaded = false;
        this.seperateRewatching = false;
        this.consideringSupport = false;
        // Modes
        this.modes = {
            frontend: false,
            sortAiring: false,
            initProgress: false,
            cached: false,
        };
        this.username = '';
        this.offset = 0;
        this.templist = [];
        this.api = api;
        this.cacheObj = undefined;
        this.status = Number(this.status);
        this.logger = con.m('[S]', '#348fff');
        return this;
    }
    setTemplist(list) {
        this.templist = list;
        return this;
    }
    getTemplist() {
        return this.templist;
    }
    setSort(sort) {
        if (this.firstLoaded || this.loading)
            throw 'To late to change sort';
        this.sort = sort;
    }
    isDone() {
        return this.done;
    }
    isLoading() {
        return this.loading;
    }
    isFirstLoaded() {
        return this.firstLoaded;
    }
    async getCompleteList() {
        do {
            // eslint-disable-next-line no-await-in-loop
            await this.getNext();
        } while (!this.done);
        if (this.modes.sortAiring)
            await this.sortAiringList();
        if (this.modes.cached)
            this.getCache().setValue(this.templist.slice(0, 18));
        this.firstLoaded = true;
        return this.templist;
    }
    async getNextPage() {
        if (this.done)
            return this.templist;
        if (this.modes.frontend &&
            this.status === 1 &&
            ['default', 'unread', 'latest_release'].includes(this.sort)) {
            this.modes.sortAiring = true;
            return this.getCompleteList();
        }
        await this.getNext();
        if (this.modes.cached)
            this.getCache().setValue(this.templist.slice(0, 24));
        this.firstLoaded = true;
        return this.templist;
    }
    async getNext() {
        this.loading = true;
        const retList = await this.getPart();
        this.templist = this.templist.concat(retList);
        this.loading = false;
    }
    async getCached() {
        if (await this.getCache().hasValue()) {
            const cachelist = await this.getCache().getValue();
            cachelist.forEach(item => {
                item = this.fn(item);
                item.watchedEp = '';
                item.score = '';
            });
            return cachelist;
        }
        return [];
    }
    initFrontendMode() {
        this.modes.frontend = true;
        this.updateListener = emitter_1.emitter.on('update.*', data => {
            con.log('update', data);
            if (data.cacheKey) {
                const item = this.templist.find(el => el.cacheKey === data.cacheKey);
                con.log(item);
                if (item && data.state) {
                    item.watchedEp = data.state.episode;
                    item.score = data.state.score;
                    item.status = data.state.status;
                }
            }
        }, { objectify: true });
    }
    destroy() {
        if (this.updateListener) {
            this.updateListener.off();
        }
    }
    getUsername() {
        return this.getUserObject().then(user => user.username);
    }
    getSortingOptions(simple = false) {
        const res = [
            {
                icon: 'filter_list',
                title: api.storage.lang('settings_progress_default'),
                value: 'default',
            },
        ];
        if (this.status === 1 && this.listType === 'manga') {
            res.push({
                icon: 'adjust',
                title: api.storage.lang('list_sorting_unread'),
                value: 'unread',
            });
        }
        res.push({
            icon: 'fiber_new',
            title: api.storage.lang('list_sorting_latest_release'),
            value: 'latest_release',
        });
        const options = this._getSortingOptions();
        options.forEach(el => {
            if (!simple) {
                if (el.asc) {
                    const asc = { ...el };
                    delete asc.asc;
                    asc.value += '_asc';
                    asc.title += ' Ascending';
                    res.push(asc);
                }
                delete el.asc;
            }
            res.push(el);
        });
        return res;
    }
    flashmError(error) {
        utils.flashm(this.errorMessage(error), { error: true, type: 'error' });
    }
    errorMessage(error) {
        return (0, Errors_1.errorMessage)(error, this.authenticationUrl);
    }
    // itemFunctions;
    async fn(
    // TODO: Remove 'startDate' | 'finishDate' | 'rewatchCount' from Omit when all providers are updated
    passedItem, streamurl = '') {
        let continueUrlTemp = null;
        const item = passedItem;
        item.fn = {
            continueUrl: () => {
                if (continueUrlTemp !== null)
                    return continueUrlTemp;
                return utils.getContinueWaching(item.type, item.cacheKey).then(obj => {
                    const curEp = parseInt(item.watchedEp.toString());
                    if (obj === undefined || obj.ep !== curEp + 1)
                        return '';
                    continueUrlTemp = obj.url;
                    return continueUrlTemp;
                });
            },
            initProgress: () => {
                return new progressRelease_1.ProgressRelease(item.cacheKey, item.type).init().then(progress => {
                    item.fn.progress = progress;
                });
            },
            progress: null,
        };
        item.options = await utils.getEntrySettings(item.type, item.cacheKey, item.tags);
        if (streamurl)
            item.options.u = streamurl;
        if (this.modes.sortAiring || this.modes.initProgress)
            await item.fn.initProgress();
        return item;
    }
    // Modes
    async initProgress() {
        const listP = [];
        this.templist.forEach(item => {
            listP.push(item.fn.initProgress());
        });
        await Promise.all(listP);
    }
    async sortAiringList() {
        if (this.sort === 'unread') {
            this.sortUnread();
            return;
        }
        if (this.sort === 'latest_release') {
            this.templist = this.templist.sort(sortItemsByLastTimestamp);
            return;
        }
        const normalItems = [];
        let preItems = [];
        let watchedItems = [];
        this.templist.forEach(item => {
            const prediction = item.fn.progress;
            if (this.listType === 'anime') {
                if (prediction?.isAiring() && prediction.progress()?.getCurrentEpisode()) {
                    if (item.watchedEp < prediction.progress().getCurrentEpisode()) {
                        preItems.push(item);
                    }
                    else {
                        watchedItems.push(item);
                    }
                }
                else {
                    normalItems.push(item);
                }
            }
            else if (
            // Manga only if less than 5 chapters to read
            prediction?.isAiring() &&
                prediction.progress()?.getCurrentEpisode() &&
                item.watchedEp &&
                item.watchedEp < prediction.progress().getCurrentEpisode() &&
                item.watchedEp + 6 > prediction.progress().getCurrentEpisode()) {
                preItems.push(item);
            }
            else {
                normalItems.push(item);
            }
        });
        if (this.listType === 'anime') {
            preItems = orderItems(preItems, true);
            watchedItems = orderItems(watchedItems, false);
        }
        else {
            preItems = orderItems(preItems, false);
            watchedItems = orderItems(watchedItems, false);
        }
        this.templist = preItems.concat(watchedItems, normalItems);
        function orderItems(items, reverse = false) {
            const itemsWithPrediction = [];
            const itemsWithLastTimestamp = [];
            const itemsWithoutTimestamp = [];
            items.forEach(item => {
                if (item.fn.progress?.progress()?.getPredictionTimestamp()) {
                    itemsWithPrediction.push(item);
                }
                else if (item.fn.progress?.progress()?.getLastTimestamp()) {
                    itemsWithLastTimestamp.push(item);
                }
                else {
                    itemsWithoutTimestamp.push(item);
                }
            });
            itemsWithPrediction.sort(sortItemsByPrediction);
            itemsWithLastTimestamp.sort(sortItemsByLastTimestamp);
            if (reverse) {
                itemsWithPrediction.reverse();
                itemsWithLastTimestamp.reverse();
            }
            return [...itemsWithPrediction, ...itemsWithLastTimestamp, ...itemsWithoutTimestamp];
        }
        function sortItemsByLastTimestamp(a, b) {
            const valA = a.fn.progress?.progress()?.getLastTimestamp();
            const valB = b.fn.progress?.progress()?.getLastTimestamp();
            if (!valA || !a.fn.progress?.isAiring())
                return 1;
            if (!valB || !b.fn.progress?.isAiring())
                return -1;
            return valB - valA;
        }
        function sortItemsByPrediction(a, b) {
            let valA = a.fn.progress?.progress()?.getPredictionTimestamp();
            let valB = b.fn.progress?.progress()?.getPredictionTimestamp();
            if (!valA)
                valA = 999999999999;
            if (!valB)
                valB = valA;
            return valA - valB;
        }
    }
    sortUnread() {
        this.templist = this.templist.sort(function (a, b) {
            let valA = 10000;
            let valB = 10000;
            if (a.fn.progress?.isAiring() && a.fn.progress.progress()?.getCurrentEpisode()) {
                const tempA = a.fn.progress.progress().getCurrentEpisode() - a.watchedEp;
                if (tempA > 0)
                    valA = tempA;
            }
            if (b.fn.progress?.isAiring() && b.fn.progress.progress()?.getCurrentEpisode()) {
                const tempB = b.fn.progress.progress().getCurrentEpisode() - b.watchedEp;
                if (tempB > 0)
                    valB = tempB;
            }
            return valA - valB;
        });
    }
    getCache() {
        if (this.cacheObj)
            return this.cacheObj;
        this.cacheObj = new Cache_1.Cache(`list/${this.name}/${this.listType}/${this.status}/${this.sort}`, 48 * 60 * 60 * 1000);
        return this.cacheObj;
    }
}
exports.ListAbstract = ListAbstract;
//# sourceMappingURL=listAbstract.js.map