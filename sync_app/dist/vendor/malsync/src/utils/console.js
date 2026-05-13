"use strict";
/* eslint-disable no-bitwise */
Object.defineProperty(exports, "__esModule", { value: true });
exports.m = exports.debug = exports.info = exports.error = exports.log = void 0;
exports.log = (function () {
    return Function.prototype.bind.call(console.log, console, '%cMAL-Sync', 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;');
})();
exports.error = (function () {
    return Function.prototype.bind.call(console.error, console, '%cMAL-Sync', 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;');
})();
exports.info = (function () {
    return Function.prototype.bind.call(console.info, console, '%cMAL-Sync', 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;');
})();
exports.debug = (function () {
    return Function.prototype.bind.call(console.debug, console, '%cMAL-Sync', 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;');
})();
const m = (name, color = '', blocks = []) => {
    let fontColor = 'white';
    if (!color)
        color = stringToColour(name);
    if (color[0] === '#')
        fontColor = getColorByBgColor(color);
    const style = `background-color: ${color}; color: ${fontColor}; padding: 2px 10px; border-radius: 3px; margin-left: -5px; border-left: 1px solid white;`;
    blocks.push({
        name,
        style,
    });
    const temp = {};
    temp.m = (name2, color2 = '') => {
        return (0, exports.m)(name2, color2, [...blocks]);
    };
    const moduleText = blocks.reduce((sum, el) => `${sum}%c${el.name}`, '');
    const moduleStyle = blocks.map(el => el.style);
    temp.log = (function () {
        return Function.prototype.bind.call(console.log, console, `%cM ${moduleText}`, 'background-color: #2e51a2; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
    })();
    temp.error = (function () {
        return Function.prototype.bind.call(console.error, console, `%cM ${moduleText}`, 'background-color: #8f0000; color: white; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
    })();
    temp.info = (function () {
        return Function.prototype.bind.call(console.info, console, `%cM ${moduleText}`, 'background-color: wheat; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
    })();
    temp.debug = (function () {
        return Function.prototype.bind.call(console.debug, console, `%cM ${moduleText}`, 'background-color: steelblue; color: black; padding: 2px 10px; border-radius: 3px;', ...moduleStyle);
    })();
    return temp;
};
exports.m = m;
function stringToColour(str) {
    if (!str)
        return '#ffffff';
    str = String(str);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let colour = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        colour += `00${value.toString(16)}`.substr(-2);
    }
    return colour;
}
function getColorByBgColor(bgColor) {
    return parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2 ? '#000' : '#fff';
}
//# sourceMappingURL=console.js.map