"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.point100decimal = void 0;
exports.point100decimal = {
    ui: {
        module: 'input',
        pattern: '^([0-9](\\.[0-9]?)?|10(.0)?)$',
    },
    getOptions() {
        const resArr = [{ value: 0, label: api.storage.lang('UI_Score_Not_Rated') }];
        for (let i = 1; i < 101; i++) {
            resArr.push({ value: i / 10, label: (i / 10).toFixed(1) });
        }
        return resArr;
    },
    valueToOptionValue(value) {
        if (!value)
            return 0;
        return Number(value / 10);
    },
    optionValueToValue(optionValue) {
        if (!optionValue)
            return 0;
        return Number(optionValue * 10);
    },
};
//# sourceMappingURL=point100decimal.js.map