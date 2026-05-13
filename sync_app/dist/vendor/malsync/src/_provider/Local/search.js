"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = search;
exports.miniMALSearch = miniMALSearch;
const fuse_js_1 = __importDefault(require("fuse.js"));
const list_1 = require("./list");
const Search_1 = require("../../utils/Search");
const searchFuse = {
    anime: null,
    manga: null,
};
async function search(searchterm, type) {
    if (!searchFuse[type]) {
        const localListEl = new list_1.UserList(7, type);
        const tempList = await localListEl.getCompleteList();
        searchFuse[type] = new fuse_js_1.default(tempList, {
            minMatchCharLength: 3,
            threshold: 0.4,
            keys: ['title'],
        });
    }
    const results = searchFuse[type].search(searchterm);
    return results.map(el => {
        return {
            id: 0,
            name: el.item.title,
            altNames: [],
            url: el.item.url,
            malUrl: () => Promise.resolve(null),
            image: el.item.image,
            imageLarge: el.item.image,
            media_type: el.item.type,
            isNovel: false,
            score: '',
            year: '',
            list: {
                status: el.item.status,
                score: el.item.score,
                episode: el.item.watchedEp,
            },
        };
    });
}
async function miniMALSearch(searchterm, type) {
    return [
        ...(await search(searchterm, type)).slice(0, 8),
        ...(await (0, Search_1.normalSearch)(searchterm, type)),
    ];
}
//# sourceMappingURL=search.js.map