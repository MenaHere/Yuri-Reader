"use strict";
// SPDX-License-Identifier: GPL-3.0
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
exports.handleEntryGet = handleEntryGet;
exports.handleEntryUpdate = handleEntryUpdate;
exports.handleEntryAdd = handleEntryAdd;
exports.handleEntryDelete = handleEntryDelete;
const singleFactory_1 = require("../../vendor/malsync/src/_provider/singleFactory");
const definitions = __importStar(require("../../vendor/malsync/src/_provider/definitions"));
const api_1 = require("../shim/api");
function malUrl(type, id) {
    return `https://myanimelist.net/${type}/${id}`;
}
function anilistUrl(type, id) {
    return `https://anilist.co/${type}/${id}`;
}
function buildUrl(provider, type, mediaId) {
    switch (provider.toLowerCase()) {
        case 'anilist':
            return anilistUrl(type, mediaId);
        case 'mal':
        default:
            return malUrl(type, mediaId);
    }
}
async function setSyncMode(provider) {
    const mode = provider.toUpperCase();
    const validModes = ['MAL', 'ANILIST', 'KITSU', 'SIMKL', 'SHIKI', 'MANGABAKA'];
    if (validModes.includes(mode)) {
        await api_1.api.settings.set('syncMode', mode);
    }
}
function singleToJson(single) {
    return {
        id: single.getPageId(),
        cacheKey: single.getCacheKey(),
        url: single.getUrl(),
        displayUrl: single.getDisplayUrl(),
        title: single.getTitle(),
        image: single.getImage(),
        type: single.getType(),
        status: single.getStatus(),
        score: single.getScore(),
        absoluteScore: single.getAbsoluteScore(),
        episode: single.getEpisode(),
        volume: single.getVolume(),
        totalEpisodes: single.getTotalEpisodes(),
        totalVolumes: single.getTotalVolumes(),
        startDate: single.getStartDate(),
        finishDate: single.getFinishDate(),
        rewatchCount: single.getRewatchCount(),
        tags: single._getTags ? single._getTags() : '',
        onList: single.isOnList(),
        authenticated: single.isAuthenticated(),
        shortName: single.shortName,
    };
}
async function handleEntryGet(params) {
    const provider = params.provider || 'mal';
    const type = params.type || 'anime';
    const mediaId = params.mediaId;
    const url = params.url || buildUrl(provider, type, mediaId);
    await setSyncMode(provider);
    const single = (0, singleFactory_1.getSingle)(url);
    await single.update();
    return singleToJson(single);
}
async function handleEntryUpdate(params) {
    const provider = params.provider || 'mal';
    const type = params.type || 'anime';
    const mediaId = params.mediaId;
    const url = params.url || buildUrl(provider, type, mediaId);
    await setSyncMode(provider);
    const single = (0, singleFactory_1.getSingle)(url);
    await single.update();
    const progress = params.progress;
    const status = params.status;
    const score = params.score;
    const volume = params.volume;
    const startDate = params.startDate;
    const finishDate = params.finishDate;
    const tags = params.tags;
    if (typeof progress === 'number')
        single.setEpisode(progress);
    if (typeof volume === 'number')
        single.setVolume(volume);
    if (typeof status === 'number')
        single.setStatus(status);
    if (typeof score === 'number')
        single.setScore(score);
    if (startDate !== undefined)
        single.setStartDate(startDate);
    if (finishDate !== undefined)
        single.setFinishDate(finishDate);
    if (tags !== undefined)
        single._setTags(tags);
    await single.sync();
    return singleToJson(single);
}
async function handleEntryAdd(params) {
    const provider = params.provider || 'mal';
    const type = params.type || 'anime';
    const mediaId = params.mediaId;
    const url = params.url || buildUrl(provider, type, mediaId);
    await setSyncMode(provider);
    const single = (0, singleFactory_1.getSingle)(url);
    await single.update();
    if (!single.isOnList()) {
        single.setStatus(definitions.status.Watching);
        const progress = params.progress;
        if (typeof progress === 'number')
            single.setEpisode(progress);
        const status = params.status;
        if (typeof status === 'number')
            single.setStatus(status);
        await single.sync();
    }
    return singleToJson(single);
}
async function handleEntryDelete(params) {
    const provider = params.provider || 'mal';
    const type = params.type || 'anime';
    const mediaId = params.mediaId;
    const url = params.url || buildUrl(provider, type, mediaId);
    await setSyncMode(provider);
    const single = (0, singleFactory_1.getSingle)(url);
    await single.update();
    await single.delete();
    return { provider, mediaId, status: 'deleted' };
}
//# sourceMappingURL=entry.js.map