"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheSeries = cacheSeries;
exports.cacheSeriesList = cacheSeriesList;
exports.getSeries = getSeries;
const helper_1 = require("./helper");
const Cache_1 = require("../../utils/Cache");
const relationCache = new Cache_1.Cache('mangabaka/series/relations/v1', 7 * 24 * 60 * 60 * 1000);
function getSeriesCache(bakaId) {
    return new Cache_1.Cache(`mangabaka/series/v1/${bakaId}`, 2 * 24 * 60 * 60 * 1000);
}
async function cacheSeries(series) {
    const seriesCache = getSeriesCache(series.id);
    if (await seriesCache.hasValue()) {
        return;
    }
    await seriesCache.setValue(series);
    let relations;
    if (await relationCache.hasValue()) {
        relations = (await relationCache.getValue());
    }
    else {
        relations = { ani: {}, mal: {} };
    }
    if (series.source?.anilist?.id) {
        relations.ani[series.source.anilist.id] = series.id;
    }
    if (series.source?.my_anime_list?.id) {
        relations.mal[series.source.my_anime_list.id] = series.id;
    }
    await relationCache.setValue(relations);
}
async function cacheSeriesList(seriesList) {
    await Promise.all(seriesList.map(series => cacheSeries(series)));
    return seriesList;
}
async function getSeries(ids) {
    if (!ids.baka && (await relationCache.hasValue())) {
        if (ids.ani) {
            const relations = await relationCache.getValue();
            if (relations && relations.ani[ids.ani]) {
                ids.baka = relations.ani[ids.ani];
            }
        }
        else if (ids.mal) {
            const relations = await relationCache.getValue();
            if (relations && relations.mal[ids.mal]) {
                ids.baka = relations.mal[ids.mal];
            }
        }
    }
    let seriesEntry;
    if (ids.baka) {
        const seriesCache = getSeriesCache(ids.baka);
        if (await seriesCache.hasValue()) {
            return seriesCache.getValue();
        }
        seriesEntry = (await (0, helper_1.call)(helper_1.urls.series(ids.baka))).data;
    }
    else if (ids.ani) {
        seriesEntry = (await (0, helper_1.call)(helper_1.urls.seriesByAniId(ids.ani))).data.series[0];
    }
    else if (ids.mal) {
        seriesEntry = (await (0, helper_1.call)(helper_1.urls.seriesByMalId(ids.mal))).data.series[0];
    }
    else {
        throw new Error('No valid ID found');
    }
    await cacheSeries(seriesEntry);
    return seriesEntry;
}
//# sourceMappingURL=seriesService.js.map