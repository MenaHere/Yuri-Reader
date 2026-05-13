"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.localStore = void 0;
let store;
if (checkLocalStorageIsAvailable()) {
    store = localStorage;
}
else {
    let storage = {};
    store = {
        getItem(key) {
            return key in storage ? storage[key] : null;
        },
        setItem(key, value) {
            storage[key] = value;
        },
        removeItem(key) {
            if (key in storage)
                delete storage[key];
        },
        clear() {
            storage = {};
        },
    };
}
exports.localStore = store;
function checkLocalStorageIsAvailable() {
    if (typeof localStorage === 'undefined')
        return false;
    try {
        localStorage.getItem('x');
        return true;
    }
    catch (e) {
        con.info('Local storage is not available', e);
        return false;
    }
}
//# sourceMappingURL=localStore.js.map