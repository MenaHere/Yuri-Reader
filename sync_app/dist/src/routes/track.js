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
exports.handleTrackAuto = handleTrackAuto;
const searchFactory_1 = require("../../vendor/malsync/src/_provider/searchFactory");
const singleFactory_1 = require("../../vendor/malsync/src/_provider/singleFactory");
const definitions = __importStar(require("../../vendor/malsync/src/_provider/definitions"));
async function handleTrackAuto(params) {
    const provider = params.provider || 'mal';
    const type = params.type || 'anime';
    const title = params.title;
    const chapter = params.chapter;
    const episode = params.episode;
    const progress = chapter ?? episode ?? 1;
    // 1. Search for the title
    const results = await (0, searchFactory_1.search)(title, type, {}, false, provider);
    if (!results.length) {
        return { status: 'not_found', title, type, provider };
    }
    const bestMatch = results[0];
    // 2. Get or create entry
    const single = (0, singleFactory_1.getSingle)(bestMatch.url);
    await single.update();
    const wasOnList = single.isOnList();
    if (!wasOnList) {
        single.setStatus(definitions.status.Watching);
    }
    single.setEpisode(progress);
    await single.sync();
    return {
        status: wasOnList ? 'updated' : 'added',
        title: single.getTitle(),
        url: single.getUrl(),
        progress,
        type,
        provider: single.shortName,
    };
}
//# sourceMappingURL=track.js.map