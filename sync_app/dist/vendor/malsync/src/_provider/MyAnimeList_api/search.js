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
const tempObj = {
    apiCall: helper.apiCall,
    logger: con.m('MAL Search'),
    type: 'anime',
};
const search = async function (keyword, type, options = {}, sync = false) {
    tempObj.type = type;
    keyword = keyword.trim();
    if (keyword.length > 64) {
        keyword = keyword.substr(0, 64);
    }
    if (!keyword)
        return [];
    if (keyword.length < 3) {
        throw new Error('Search term must be at least 3 characters long');
    }
    return tempObj
        .apiCall({
        type: 'GET',
        path: `${type}?q=${keyword}&limit=15&nsfw=true`,
        fields: [
            'start_date',
            'mean',
            'alternative_titles',
            'media_type',
            'num_episodes',
            'num_chapters',
        ],
    })
        .then(json => {
        const resItems = [];
        json.data.forEach(function (item) {
            let alt = [item.node.title];
            if (item.node.alternative_titles) {
                if (item.node.alternative_titles.en)
                    alt.push(item.node.alternative_titles.en);
                if (item.node.alternative_titles.ja)
                    alt.push(item.node.alternative_titles.ja);
                if (item.node.alternative_titles.synonyms)
                    alt = alt.concat(item.node.alternative_titles.synonyms);
            }
            resItems.push({
                id: item.node.id,
                name: item.node.title,
                altNames: alt,
                url: `https://myanimelist.net/${type}/${item.node.id}`,
                malUrl: () => {
                    return `https://myanimelist.net/${type}/${item.node.id}`;
                },
                image: item.node.main_picture?.medium ?? '',
                imageLarge: item.node.main_picture?.large || item.node.main_picture?.medium || '',
                media_type: item.node.media_type
                    ? (item.node.media_type.charAt(0) + item.node.media_type.slice(1).toLowerCase()).replace('_', ' ')
                    : '',
                isNovel: item.node.media_type.toLowerCase().includes('novel'),
                score: item.node.mean,
                year: item.node.start_date,
                totalEp: item.node.num_episodes || item.node.num_chapters || 0,
            });
        });
        tempObj.logger.log(resItems);
        return resItems;
    });
};
exports.search = search;
//# sourceMappingURL=search.js.map