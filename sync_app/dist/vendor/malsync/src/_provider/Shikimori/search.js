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
exports.search = void 0;
const helper = __importStar(require("./helper"));
const search = async function (keyword, type, options = {}, sync = false) {
    const list = await helper.apiCall({
        path: `${type}s`,
        parameter: { limit: 25, search: keyword },
        type: 'GET',
    });
    return list.map(item => {
        return {
            id: item.id,
            name: helper.title(item.russian, item.name),
            altNames: [item.name, item.russian].filter(el => el),
            url: helper.domain + item.url,
            malUrl: () => {
                return Promise.resolve(item.id ? `https://myanimelist.net/${type}/${item.id}` : null);
            },
            image: helper.domain + item.image.preview,
            imageLarge: helper.domain + item.image.original,
            media_type: item.kind,
            isNovel: item.kind === 'light_novel',
            score: Number(item.score) ? item.score : '',
            year: item.aired_on,
            totalEp: item.episodes || item.chapters || 0,
        };
    });
};
exports.search = search;
//# sourceMappingURL=search.js.map