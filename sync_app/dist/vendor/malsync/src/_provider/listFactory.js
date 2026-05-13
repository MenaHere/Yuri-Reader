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
exports.getList = getList;
exports.getOnlyList = getOnlyList;
exports.getListbyType = getListbyType;
const helper = __importStar(require("./helper"));
const list_1 = require("./MyAnimeList_hybrid/list");
const list_2 = require("./MyAnimeList_api/list");
const list_3 = require("./AniList/list");
const list_4 = require("./Kitsu/list");
const list_5 = require("./MangaBaka/list");
const list_6 = require("./Simkl/list");
const list_7 = require("./Shikimori/list");
const list_8 = require("./Local/list");
async function getList(...args) {
    let tempList = [];
    if (api.settings.get('localSync')) {
        const [status, listType] = args;
        const localListEl = new list_8.UserList(status, listType);
        localListEl.modes.initProgress = true;
        tempList = await localListEl.getCompleteList();
    }
    const list = getListObj(args);
    list.setTemplist(tempList);
    return list;
}
function getOnlyList(...args) {
    return getListObj(args);
}
function getListbyType(syncMode, args = []) {
    return getListObj(args, syncMode);
}
function getListObj(args, syncMode = '') {
    if (!syncMode) {
        syncMode = helper.getSyncMode(args[1] ? args[1] : 'anime');
    }
    const [status, listType, sorting] = args;
    if (syncMode === 'MAL') {
        return new list_1.UserList(status, listType, sorting);
    }
    if (syncMode === 'MALAPI') {
        return new list_2.UserList(status, listType, sorting);
    }
    if (syncMode === 'ANILIST') {
        return new list_3.UserList(status, listType, sorting);
    }
    if (syncMode === 'KITSU') {
        return new list_4.UserList(status, listType, sorting);
    }
    if (syncMode === 'MANGABAKA') {
        return new list_5.UserList(status, listType, sorting);
    }
    if (syncMode === 'SIMKL') {
        return new list_6.UserList(status, listType, sorting);
    }
    if (syncMode === 'SHIKI') {
        return new list_7.UserList(status, listType, sorting);
    }
    throw 'Unknown sync mode';
}
//# sourceMappingURL=listFactory.js.map