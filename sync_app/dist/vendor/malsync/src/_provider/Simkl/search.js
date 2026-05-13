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
exports.simklIdToMal = simklIdToMal;
const Errors_1 = require("../Errors");
const helper = __importStar(require("./helper"));
const search = async function (keyword, type, options = {}, sync = false) {
    return call(`https://api.simkl.com/search/${type}`, { q: keyword }, true).then(res => {
        const resItems = [];
        con.log('search', res);
        j.$.each(res, function (index, item) {
            resItems.push({
                id: item.ids.simkl_id,
                name: item.title,
                altNames: [],
                url: `https://simkl.com/${type}/${item.ids.simkl_id}/${item.ids.slug}`,
                malUrl: async () => {
                    const malId = await simklIdToMal(item.ids.simkl_id);
                    return malId ? `https://myanimelist.net/${type}/${malId}` : null;
                },
                image: `https://simkl.in/posters/${item.poster}_ca.jpg`,
                imageLarge: `https://simkl.in/posters/${item.poster}_m.jpg`,
                imageBanner: `https://simkl.in/posters/${item.poster}_w.jpg`,
                media_type: item.type,
                isNovel: false,
                score: null,
                year: item.year,
            });
        });
        return resItems;
    });
};
exports.search = search;
async function call(url, sData = {}, asParameter = false, methode = 'GET', login = true) {
    if (asParameter) {
        url += `?${j.$.param(sData)}`;
    }
    con.log('call', methode, url, sData);
    const headers = {
        Authorization: login ? `Bearer ${api.settings.get('simklToken')}` : undefined,
        'simkl-api-key': helper.client_id,
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/json',
    };
    if (!login) {
        con.log('No login');
    }
    if (methode === 'GET') {
        sData = undefined;
    }
    return api.request
        .xhr(methode, {
        url,
        headers,
        data: sData,
    })
        .then(async (response) => {
        switch (response.status) {
            case 200:
            case 201:
            case 204:
            case 302:
                break;
            case 401:
                if (login) {
                    return call(url, sData, asParameter, methode, false);
                    break;
                }
                utils.flashm(`Please Authenticate <a target="_blank" href="${helper.getAuthUrl()}">Here</a>`, { error: true, type: 'error' });
                throw getThrowError();
                break;
            default:
                utils.flashm(`Simkl: ${getErrorText()}`, {
                    error: true,
                    type: 'error',
                });
                throw getThrowError();
        }
        try {
            return (0, Errors_1.parseJson)(response.responseText);
        }
        catch (e) {
            con.error(response);
            throw e;
        }
        function getErrorText() {
            return (0, Errors_1.parseJson)(response.responseText).error;
        }
        function getThrowError() {
            return new Error(getErrorText());
        }
    });
}
function simklIdToMal(simklId) {
    return call(`https://api.simkl.com/anime/${simklId}`, { extended: 'full' }, true).then(res => {
        if (typeof res.ids.mal === 'undefined')
            return null;
        return res.ids.mal;
    });
}
//# sourceMappingURL=search.js.map