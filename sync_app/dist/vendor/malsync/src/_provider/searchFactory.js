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
exports.search = search;
const helper = __importStar(require("./helper"));
const search_1 = require("./MyAnimeList_hybrid/search");
const search_2 = require("./MyAnimeList_api/search");
const search_3 = require("./AniList/search");
const search_4 = require("./Kitsu/search");
const search_5 = require("./MangaBaka/search");
const search_6 = require("./Simkl/search");
const search_7 = require("./Shikimori/search");
function search(keyword, type, options = {}, sync = false, syncMode = '') {
    if (!syncMode) {
        syncMode = helper.getSyncMode(type);
    }
    if (syncMode === 'KITSU') {
        return (0, search_4.search)(keyword, type, options, sync);
    }
    if (syncMode === 'ANILIST') {
        return (0, search_3.search)(keyword, type, options, sync);
    }
    if (syncMode === 'MANGABAKA') {
        return (0, search_5.search)(keyword, type, options, sync);
    }
    if (syncMode === 'SIMKL') {
        return (0, search_6.search)(keyword, type, options, sync);
    }
    if (syncMode === 'SHIKI') {
        return (0, search_7.search)(keyword, type, options, sync);
    }
    if (syncMode === 'MALAPI') {
        return (0, search_2.search)(keyword, type, options, sync);
    }
    return (0, search_1.search)(keyword, type, options, sync);
}
//# sourceMappingURL=searchFactory.js.map