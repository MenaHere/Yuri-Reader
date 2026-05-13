"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smiley3 = void 0;
exports.smiley3 = {
    ui: {
        module: 'click',
        type: 'smiley',
    },
    getOptions() {
        return [
            { value: 0, label: api.storage.lang('UI_Score_Not_Rated') },
            { value: 85, label: '🙂' },
            { value: 60, label: '😐' },
            { value: 35, label: '🙁' },
        ];
    },
    valueToOptionValue(value) {
        if (!value)
            return 0;
        if (value >= 73)
            return 85;
        if (value <= 47)
            return 35;
        return 60;
    },
    optionValueToValue(optionValue) {
        if (!optionValue)
            return 0;
        return Number(optionValue);
    },
};
//# sourceMappingURL=smiley3.js.map