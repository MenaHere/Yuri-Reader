"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalSearch = normalSearch;
const searchFactory_1 = require("../_provider/searchFactory");
async function normalSearch(searchterm, type) {
    return (0, searchFactory_1.search)(searchterm, type).then(res => Promise.all(res.map(async (el) => {
        const dbEntry = await api.request.database('entry', { id: el.id, type });
        if (dbEntry) {
            el.list = {
                status: dbEntry.status,
                score: dbEntry.score,
                episode: dbEntry.watchedEp,
            };
        }
        return el;
    })));
}
//# sourceMappingURL=Search.js.map