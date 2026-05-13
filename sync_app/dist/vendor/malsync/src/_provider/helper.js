"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSyncMode = getSyncMode;
exports.getProviderOption = getProviderOption;
exports.allProviders = allProviders;
exports.providerSecondaryMode = providerSecondaryMode;
exports.providerOptions = providerOptions;
exports.providerTitle = providerTitle;
function getSyncMode(type = '') {
    const primaryMode = api.settings.get('syncMode');
    const secondaryMode = api.settings.get('syncModeSimkl');
    const primaryProvider = getProviderOption(primaryMode);
    if (type === 'anime' && !primaryProvider.anime) {
        return secondaryMode;
    }
    if (type === 'manga' && !primaryProvider.manga) {
        return secondaryMode;
    }
    if (type === 'manga' &&
        primaryProvider.manga &&
        primaryProvider.anime &&
        api.settings.get('splitTracking')) {
        return secondaryMode;
    }
    return primaryMode;
}
const providers = {
    MAL: { title: 'MyAnimeList', value: 'MAL', anime: true, manga: true, short: true },
    ANILIST: { title: 'AniList', value: 'ANILIST', anime: true, manga: true, short: true },
    KITSU: { title: 'Kitsu', value: 'KITSU', anime: true, manga: true, short: true },
    MANGABAKA: { title: 'MangaBaka', value: 'MANGABAKA', anime: false, manga: true, short: true },
    SIMKL: { title: 'Simkl', value: 'SIMKL', anime: true, manga: false, short: true },
    SHIKI: { title: 'Shikimori', value: 'SHIKI', anime: true, manga: true, short: true },
    MALAPI: {
        title: 'MyAnimeList (API) [WORSE]',
        value: 'MALAPI',
        anime: true,
        manga: true,
        short: false,
    },
};
function getProviderOption(value) {
    return providers[value];
}
function allProviders() {
    const currentMode = api.settings.get('syncMode');
    const currentOption = Object.values(providers).find(o => o.value === currentMode);
    const splitTracking = api.settings.get('splitTracking');
    let secondaryMode = null;
    if (!currentOption.manga) {
        secondaryMode = 'manga';
    }
    else if (!currentOption.anime) {
        secondaryMode = 'anime';
    }
    else if (splitTracking) {
        secondaryMode = 'manga';
    }
    let secondaryOptions = [];
    if (secondaryMode) {
        secondaryOptions = Object.values(providers).filter(el => el[secondaryMode]);
    }
    return {
        primary: Object.values(providers),
        secondary: secondaryOptions,
        secondaryMode,
    };
}
function providerSecondaryMode() {
    const providers = allProviders();
    return providers.secondaryMode;
}
function providerOptions(mode = 'primary', short = false) {
    const providers = allProviders();
    let optionsList = mode === 'primary' ? providers.primary : providers.secondary;
    if (short) {
        optionsList = optionsList.filter(o => o.short);
    }
    return optionsList.map(o => ({
        title: o.title,
        value: o.value,
    }));
}
function providerTitle(mode = 'primary') {
    const secondaryMode = providerSecondaryMode();
    if (mode === 'primary' && !secondaryMode) {
        return api.storage.lang('settings_Mode');
    }
    let type = secondaryMode;
    if (mode === 'primary') {
        type = secondaryMode === 'anime' ? 'manga' : 'anime';
    }
    return `${api.storage.lang('settings_Mode')} (${api.storage.lang(type === 'anime' ? 'Anime' : 'Manga')})`;
}
//# sourceMappingURL=helper.js.map