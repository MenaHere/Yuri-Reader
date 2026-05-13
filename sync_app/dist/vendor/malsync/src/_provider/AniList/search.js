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
    const query = `
    query ($search: String) {
      ${type}: Page (perPage: 25) {
        pageInfo {
          total
        }
        results: media (type: ${type.toUpperCase()}, search: $search) {
          id
          siteUrl
          idMal
          episodes
          chapters
          title {
            userPreferred
            romaji
            english
            native
          }
          coverImage {
            large
            extraLarge
          }
          bannerImage
          type
          format
          averageScore
          startDate {
            year
          }
          synonyms
        }
      }
    }
  `;
    const variables = {
        search: keyword,
    };
    const res = await helper.apiCall(query, variables, false);
    con.log(res);
    const resItems = [];
    j.$.each(res.data[type].results, function (index, item) {
        resItems.push({
            id: item.id,
            name: item.title.userPreferred,
            altNames: Object.values(item.title).concat(item.synonyms),
            url: item.siteUrl,
            malUrl: () => {
                return item.idMal ? `https://myanimelist.net/${type}/${item.idMal}` : null;
            },
            image: helper.imgCheck(item.coverImage.large),
            imageLarge: helper.imgCheck(item.coverImage.extraLarge),
            imageBanner: helper.imgCheck(item.bannerImage),
            media_type: item.format
                ? (item.format.charAt(0) + item.format.slice(1).toLowerCase()).replace('_', ' ')
                : '',
            isNovel: item.format === 'NOVEL',
            score: item.averageScore,
            year: item.startDate.year,
            totalEp: item.episodes || item.chapters || 0,
        });
    });
    return resItems;
};
exports.search = search;
//# sourceMappingURL=search.js.map