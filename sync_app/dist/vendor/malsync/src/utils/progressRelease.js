"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressRelease = void 0;
const releaseProgressUtils_1 = require("../background/releaseProgressUtils");
const progress_1 = require("./progress");
class ProgressRelease {
    constructor(cacheKey, type) {
        this.cacheKey = cacheKey;
        this.type = type;
        this.logger = con.m('progress').m(cacheKey.toString());
        return this;
    }
    async init(live = false) {
        await this.initReleaseProgress(live);
        if (this.releaseItem) {
            this.progressItem = new progress_1.Progress(this.releaseItem.value, this.type);
        }
        else {
            this.progressItem = new progress_1.Progress(null, this.type);
        }
        return this;
    }
    async initReleaseProgress(liveData) {
        if (liveData)
            await (0, releaseProgressUtils_1.single)(liveData, this.type, liveData.progressMode);
        const releaseItem = await api.storage.get(`release/${this.type}/${this.cacheKey}`);
        this.logger.m('Init Release').log(releaseItem);
        if (!releaseItem)
            return;
        if ((0, releaseProgressUtils_1.progressIsOld)(releaseItem)) {
            this.logger.log('Too old');
            return;
        }
        this.releaseItem = releaseItem;
    }
    isProgressFinished() {
        const re = this.releaseItem;
        if (re && re.finished)
            return true;
        return false;
    }
    progress() {
        return this.progressItem;
    }
    isFinished() {
        return this.isProgressFinished();
    }
    isAiring() {
        return !this.isFinished();
    }
    getColor() {
        return '#f57c00';
    }
}
exports.ProgressRelease = ProgressRelease;
//# sourceMappingURL=progressRelease.js.map