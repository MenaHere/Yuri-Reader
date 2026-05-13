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
exports.UserList = void 0;
const listAbstract_1 = require("../listAbstract");
const helper = __importStar(require("./helper"));
const definitions = __importStar(require("../definitions"));
class UserList extends listAbstract_1.ListAbstract {
    constructor() {
        super(...arguments);
        this.name = 'local';
        this.authenticationUrl = '';
        this.getRegex = helper.getRegex;
        this.getSyncList = helper.getSyncList;
        this.getCacheKey = helper.getCacheKey;
    }
    async getUserObject() {
        return Promise.resolve({ username: 'local', picture: '', href: '' });
    }
    _getSortingOptions() {
        return [];
    }
    async getPart() {
        con.log('[UserList][Local]', `status: ${this.status}`);
        this.done = true;
        const data = await this.prepareData(await this.getSyncList(), this.listType, this.status);
        return data;
    }
    async prepareData(data, listType, status) {
        const newData = [];
        for (const key in data) {
            if (this.getRegex(listType).test(key)) {
                const el = data[key];
                con.log(key, el);
                if (status !== definitions.status.All && parseInt(el.status) !== status) {
                    continue;
                }
                if (listType === 'anime') {
                    newData.push(await this.fn({
                        uid: key,
                        cacheKey: this.getCacheKey(utils.urlPart(key, 4), utils.urlPart(key, 2)),
                        type: 'anime',
                        airingState: 2,
                        image: el.image ?? '',
                        imageLarge: el.image ?? '',
                        malId: 0,
                        apiCacheKey: 0,
                        tags: el.tags,
                        title: `[L] ${el.name}`,
                        url: key,
                        score: el.score,
                        watchedEp: el.progress,
                        totalEp: 0,
                        status: el.status,
                    }, el.sUrl));
                }
                else {
                    newData.push(await this.fn({
                        uid: key,
                        cacheKey: this.getCacheKey(utils.urlPart(key, 4), utils.urlPart(key, 2)),
                        type: 'manga',
                        airingState: 2,
                        image: el.image ?? '',
                        imageLarge: el.image ?? '',
                        malId: 0,
                        apiCacheKey: 0,
                        tags: el.tags,
                        title: `[L] ${el.name}`,
                        url: key,
                        score: el.score,
                        watchedEp: el.progress,
                        readVol: el.volumeprogress,
                        totalEp: 0,
                        totalVol: 0,
                        status: el.status,
                    }, el.sUrl));
                }
            }
        }
        con.log('data', newData);
        return newData;
    }
}
exports.UserList = UserList;
//# sourceMappingURL=list.js.map