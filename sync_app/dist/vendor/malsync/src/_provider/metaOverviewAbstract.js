"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaOverviewAbstract = void 0;
const Cache_1 = require("../utils/Cache");
class MetaOverviewAbstract {
    constructor(url) {
        this.url = url;
        this.run = false;
        this.meta = {
            title: '',
            alternativeTitle: [],
            description: '',
            image: '',
            imageLarge: '',
            characters: [],
            statistics: [],
            info: [],
            openingSongs: [],
            endingSongs: [],
            related: [],
        };
        this.cacheObj = undefined;
        this.logger = con.m('Meta [O]', 'green');
        return this;
    }
    async init() {
        if (this.run)
            return this;
        const cache = this.getCache();
        if (await cache.hasValueAndIsNotEmpty()) {
            this.logger.log('Cached');
            this.meta = await cache.getValue();
            this.run = true;
            await this.fillOverviewState();
            return this;
        }
        await this._init();
        this.run = true;
        await cache.setValue(this.getMeta());
        await this.fillOverviewState();
        return this;
    }
    async fillOverviewState() {
        for (const relation in this.meta.related) {
            for (const link in this.meta.related[relation].links) {
                // eslint-disable-next-line no-await-in-loop
                const dbEntry = await api.request.database('entry', {
                    id: this.meta.related[relation].links[link].id,
                    type: this.meta.related[relation].links[link].type,
                });
                if (dbEntry) {
                    this.meta.related[relation].links[link].list = {
                        status: dbEntry.status,
                        score: dbEntry.score,
                        episode: dbEntry.watchedEp,
                    };
                }
            }
        }
    }
    getMeta() {
        return this.meta;
    }
    getCache() {
        if (this.cacheObj)
            return this.cacheObj;
        this.cacheObj = new Cache_1.Cache(`v4/${api.storage.lang('locale')}/${this.url}`, 5 * 24 * 60 * 60 * 1000);
        return this.cacheObj;
    }
}
exports.MetaOverviewAbstract = MetaOverviewAbstract;
//# sourceMappingURL=metaOverviewAbstract.js.map