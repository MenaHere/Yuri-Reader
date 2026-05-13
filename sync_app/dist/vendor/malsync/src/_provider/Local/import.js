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
exports.exportData = exportData;
exports.importData = importData;
const helper = __importStar(require("./helper"));
async function exportData() {
    const data = await helper.getSyncList();
    const newData = {};
    for (const key in data) {
        if (helper.getRegex('(anime|manga)').test(key)) {
            newData[key] = data[key];
        }
    }
    return newData;
}
async function importData(newData) {
    const data = await helper.getSyncList();
    // Delete old data
    for (const key in data) {
        if (helper.getRegex('(anime|manga)').test(key)) {
            con.log('Remove', key);
            await api.storage.remove(key).catch(e => {
                if (e.message) {
                    if (e.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE')) {
                        utils.flashm('Max write operations per minute hit. Import stopped for 1 minute. Just keep this window open.');
                        return new Promise(resolve => {
                            setTimeout(() => {
                                resolve(api.storage.remove(key));
                            }, 60 * 1000);
                        });
                    }
                }
                throw e;
            });
        }
    }
    // import Data
    for (const k in newData) {
        con.log('Set', k, newData[k]);
        await api.storage.set(k, newData[k]).catch(e => {
            if (e.message) {
                if (e.message.includes('MAX_WRITE_OPERATIONS_PER_MINUTE')) {
                    utils.flashm('Max write operations per minute hit. Import stopped for 1 minute. Just keep this window open.');
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve(api.storage.set(k, newData[k]));
                        }, 60 * 1000);
                    });
                }
            }
            throw e;
        });
    }
    return 1;
}
//# sourceMappingURL=import.js.map