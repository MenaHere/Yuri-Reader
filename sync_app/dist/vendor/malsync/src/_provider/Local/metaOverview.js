"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaOverview = void 0;
const metaOverviewAbstract_1 = require("../metaOverviewAbstract");
class MetaOverview extends metaOverviewAbstract_1.MetaOverviewAbstract {
    constructor(url) {
        super(url);
        this.logger = this.logger.m('Local');
        this.type = utils.urlPart(url, 3) === 'anime' ? 'anime' : 'manga';
        return this;
    }
    async _init() {
        return this;
    }
}
exports.MetaOverview = MetaOverview;
//# sourceMappingURL=metaOverview.js.map