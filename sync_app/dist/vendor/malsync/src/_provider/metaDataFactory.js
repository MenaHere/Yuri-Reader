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
exports.getOverview = getOverview;
const helper = __importStar(require("./helper"));
const metaOverview_1 = require("./Local/metaOverview");
const metaOverview_2 = require("./MyAnimeList_hybrid/metaOverview");
const metaOverview_3 = require("./MyAnimeList_api/metaOverview");
const metaOverview_4 = require("./AniList/metaOverview");
const metaOverview_5 = require("./Kitsu/metaOverview");
const metaOverview_6 = require("./MangaBaka/metaOverview");
const metaOverview_7 = require("./Simkl/metaOverview");
const metaOverview_8 = require("./Shikimori/metaOverview");
function getOverview(url, type, syncMode = '') {
    if (!syncMode) {
        syncMode = helper.getSyncMode(type);
    }
    if (/^local:\/\//i.test(url)) {
        return new metaOverview_1.MetaOverview(url);
    }
    if (syncMode === 'ANILIST') {
        return new metaOverview_4.MetaOverview(url);
    }
    if (syncMode === 'KITSU') {
        return new metaOverview_5.MetaOverview(url);
    }
    if (syncMode === 'MANGABAKA') {
        return new metaOverview_6.MetaOverview(url);
    }
    if (syncMode === 'SIMKL') {
        return new metaOverview_7.MetaOverview(url);
    }
    if (syncMode === 'SHIKI') {
        return new metaOverview_8.MetaOverview(url);
    }
    if (syncMode === 'MAL') {
        return new metaOverview_2.MetaOverview(url);
    }
    if (syncMode === 'MALAPI') {
        return new metaOverview_3.MetaOverview(url);
    }
    throw 'Unknown sync mode';
}
//# sourceMappingURL=metaDataFactory.js.map