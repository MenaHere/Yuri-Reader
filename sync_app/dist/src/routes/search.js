"use strict";
// SPDX-License-Identifier: GPL-3.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSearch = handleSearch;
const searchFactory_1 = require("../../vendor/malsync/src/_provider/searchFactory");
async function handleSearch(params) {
    const query = params.query;
    const type = params.type || 'anime';
    const syncMode = params.syncMode || '';
    if (!query || query.length < 3) {
        throw new Error('Search term must be at least 3 characters long');
    }
    const results = await (0, searchFactory_1.search)(query, type, {}, false, syncMode);
    const mapped = [];
    for (const r of results) {
        mapped.push({
            id: r.id,
            name: r.name,
            altNames: r.altNames,
            url: r.url,
            malUrl: typeof r.malUrl === 'function' ? await r.malUrl() : r.malUrl,
            image: r.image,
            imageLarge: r.imageLarge,
            imageBanner: r.imageBanner,
            media_type: r.media_type,
            isNovel: r.isNovel,
            score: r.score,
            year: r.year,
            totalEp: r.totalEp,
        });
    }
    return { results: mapped };
}
//# sourceMappingURL=search.js.map