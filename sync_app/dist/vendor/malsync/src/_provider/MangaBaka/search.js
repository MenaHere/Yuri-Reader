"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.search = void 0;
const helper_1 = require("./helper");
const search = async function (keyword, type, options = {}, sync = false) {
    const json = (await (0, helper_1.call)(helper_1.urls.search(keyword)));
    return json.data.map(item => {
        return {
            id: item.id,
            name: item.title,
            altNames: (0, helper_1.getAlternativeTitles)(item),
            url: `https://mangabaka.org/${item.id}`,
            malUrl: () => {
                return Promise.resolve(item.source.my_anime_list?.id
                    ? `https://myanimelist.net/manga/${item.source.my_anime_list.id}`
                    : null);
            },
            image: (0, helper_1.getImageUrl)(item, 'small'),
            imageLarge: (0, helper_1.getImageUrl)(item, 'large'),
            media_type: item.type
                ? (item.type.charAt(0) + item.type.slice(1).toLowerCase()).replace('_', ' ')
                : '',
            isNovel: item.type === 'novel',
            score: item.rating?.toFixed(0) || '',
            year: String(item.year),
            totalEp: Number(item.total_chapters) || 0,
        };
    });
};
exports.search = search;
//# sourceMappingURL=search.js.map