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
exports.getSingle = getSingle;
exports.getRulesCacheKey = getRulesCacheKey;
const slugs_1 = require("../utils/slugs");
const helper = __importStar(require("./helper"));
const Cache_1 = require("../utils/Cache");
const single_1 = require("./MyAnimeList_hybrid/single");
const single_2 = require("./MyAnimeList_api/single");
const single_3 = require("./AniList/single");
const single_4 = require("./Kitsu/single");
const single_5 = require("./MangaBaka/single");
const single_6 = require("./Simkl/single");
const single_7 = require("./Shikimori/single");
const single_8 = require("./Local/single");
function getSingle(url) {
    if (/^local:\/\//i.test(url)) {
        return new single_8.Single(url);
    }
    const slug = (0, slugs_1.urlToSlug)(url);
    if (!slug.path) {
        throw new Error(`URL not supported: ${url}`);
    }
    const syncMode = helper.getSyncMode(slug.path.type);
    if (syncMode === 'MAL') {
        return new single_1.Single(url);
    }
    if (syncMode === 'MALAPI') {
        return new single_2.Single(url);
    }
    if (syncMode === 'ANILIST') {
        return new single_3.Single(url);
    }
    if (syncMode === 'KITSU') {
        return new single_4.Single(url);
    }
    if (syncMode === 'MANGABAKA') {
        return new single_5.Single(url);
    }
    if (syncMode === 'SIMKL') {
        return new single_6.Single(url);
    }
    if (syncMode === 'SHIKI') {
        return new single_7.Single(url);
    }
    throw 'Unknown sync mode';
}
async function getRulesCacheKey(url) {
    const cacheObj = new Cache_1.Cache(`rulesCacheKey/${url}`, 7 * 24 * 60 * 60 * 1000);
    if (await cacheObj.hasValue()) {
        return cacheObj.getValue().then(res => {
            return {
                rulesCacheKey: res,
            };
        });
    }
    const singleObj = getSingle(url);
    await singleObj.update();
    cacheObj.setValue(singleObj.getRulesCacheKey());
    return {
        rulesCacheKey: singleObj.getRulesCacheKey(),
        singleObj,
    };
}
//# sourceMappingURL=singleFactory.js.map