// SPDX-License-Identifier: GPL-3.0
// Shim for MALSync's api global — Node.js implementation

import axios, { AxiosRequestConfig, Method } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DATA_DIR = path.join(os.homedir(), '.yuri-sync');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const STORAGE_FILE = path.join(DATA_DIR, 'storage.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadJson(file: string): any {
  ensureDir();
  if (!fs.existsSync(file)) return {};
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return {};
  }
}

function saveJson(file: string, data: any) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// --- Settings ---
const defaultSettings: Record<string, any> = {
  syncMode: 'MAL',
  syncModeSimkl: 'MAL',
  splitTracking: false,
  localSync: true,
  anilistToken: '',
  anilistOptions: { scoreFormat: 'POINT_10' },
  malToken: '',
  malRefresh: '',
  kitsuToken: '',
  kitsuOptions: { titleLanguagePreference: 'canonical' },
  simklToken: '',
  shikiToken: { access_token: '', refresh_token: '' },
  shikiOptions: { locale: 'en' },
  mangabakaToken: '',
  mangabakaRefresh: '',
  epPredictions: true,
  malTags: false,
  malContinue: true,
  malResume: true,
  usedPage: true,
  forceEnglishTitles: false,
  progressIntervalDefaultAnime: '',
  progressIntervalDefaultManga: '',
  progressNotificationsAnime: true,
  progressNotificationsManga: true,
  notificationsSticky: false,
  askBefore: true,
  videoDuration: 85,
  mangaCompletionPercentage: 90,
  autoTrackingModeanime: 'video',
  autoTrackingModemanga: 'instant',
  readerTracking: true,
  delay: 0,
  rpc: false,
  presenceLargeImage: 'cover',
  presenceShowButtons: true,
  presenceActivityName: 'title',
  theme: 'auto',
  themeSidebars: true,
  themeColor: '#000000',
  themeOpacity: 100,
  themeImage: '',
  minimalWindow: false,
  posLeft: 'left',
  miniMALonMal: false,
  floatButtonStealth: false,
  userscriptModeButton: false,
  enablePages: {},
  forceEn: false,
};

let settingsCache: Record<string, any> = { ...defaultSettings };

function loadSettings() {
  const data = loadJson(SETTINGS_FILE);
  settingsCache = { ...defaultSettings, ...data };
}

function saveSettings() {
  saveJson(SETTINGS_FILE, settingsCache);
}

loadSettings();

// --- Storage ---
let storageCache: Record<string, any> = {};

function loadStorage() {
  storageCache = loadJson(STORAGE_FILE);
}

function saveStorage() {
  saveJson(STORAGE_FILE, storageCache);
}

loadStorage();

// --- Request ---
const requestApi = {
  async xhr(
    method: string,
    url: string | { url: string; data?: any; headers?: any },
    retry = 0,
  ): Promise<any> {
    const config: AxiosRequestConfig = {
      method: method as Method,
      validateStatus: () => true,
    };

    if (typeof url === 'string') {
      config.url = url;
    } else {
      config.url = url.url;
      config.data = url.data;
      config.headers = url.headers;
    }

    try {
      const res = await axios(config);
      return {
        finalUrl: res.request?.res?.responseUrl || config.url,
        responseText: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
        status: res.status,
      };
    } catch (e: any) {
      if (retry > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return this.xhr(method, url, retry - 1);
      }
      return {
        finalUrl: typeof url === 'string' ? url : url.url,
        responseText: e.message || '',
        status: 0,
      };
    }
  },

  notification(options: any): void {
    // No-op in headless mode
  },

  database(call: string, param: object): Promise<any> {
    return Promise.resolve({});
  },
};

// --- Settings Manager ---
const settingsObj = {
  isInit: { value: true },
  options: settingsCache,

  get(name: string): any {
    return settingsCache[name];
  },

  set(name: string, value: any): Promise<void> {
    settingsCache[name] = value;
    saveSettings();
    return Promise.resolve();
  },

  getAsync(name: string): Promise<any> {
    return Promise.resolve(settingsCache[name]);
  },
};

// --- Storage Manager ---
const storageObj = {
  async set(key: string, value: any): Promise<void> {
    storageCache[key] = value;
    saveStorage();
  },

  async get(key: string): Promise<any> {
    return storageCache[key];
  },

  async remove(key: string): Promise<void> {
    delete storageCache[key];
    saveStorage();
  },

  async list(type = 'local'): Promise<Record<string, any>> {
    return { ...storageCache };
  },

  lang(selector: string, args?: string[]): string {
    // Minimal i18n stub — return the key or a generic message
    const langMap: Record<string, string> = {
      'Error_Authenticate': 'Please authenticate with {0}',
      'Error_Blocked': '{0} is blocked',
      'UI_Status_watching_anime': 'Watching',
      'UI_Status_watching_manga': 'Reading',
      'UI_Status_Completed': 'Completed',
      'UI_Status_OnHold': 'On Hold',
      'UI_Status_Dropped': 'Dropped',
      'UI_Status_planTo_anime': 'Plan to Watch',
      'UI_Status_planTo_manga': 'Plan to Read',
      'UI_Status_Rewatching_anime': 'Rewatching',
      'UI_Status_Rewatching_manga': 'Rereading',
      'UI_Status_Considering': 'Considering',
      'UI_Status_All': 'All',
      'UI_Episode': 'Episode',
      'UI_Chapter': 'Chapter',
      'UI_Score_Not_Rated': 'Not Rated',
      'UI_Score_Masterpiece': 'Masterpiece',
      'UI_Score_Great': 'Great',
      'UI_Score_VeryGood': 'Very Good',
      'UI_Score_Good': 'Good',
      'UI_Score_Fine': 'Fine',
      'UI_Score_Average': 'Average',
      'UI_Score_Bad': 'Bad',
      'UI_Score_VeryBad': 'Very Bad',
      'UI_Score_Horrible': 'Horrible',
      'UI_Score_Appalling': 'Appalling',
      'list_sorting_alpha': 'Alphabetical',
      'list_sorting_history': 'Last Updated',
      'list_sorting_score': 'Score',
      'list_sorting_airing_date': 'Airing Date',
      'list_sorting_unread': 'Unread',
      'list_sorting_latest_release': 'Latest Release',
      'settings_progress_default': 'Default',
      'settings_Mode': 'Sync Mode',
      'Anime': 'Anime',
      'Manga': 'Manga',
      'overview_sidebar_Score': 'Score',
      'overview_sidebar_Favorites': 'Favorites',
      'overview_sidebar_Popularity': 'Popularity',
      'overview_sidebar_Ranked': 'Ranked',
      'overview_sidebar_Format': 'Format',
      'overview_sidebar_Episodes': 'Episodes',
      'overview_sidebar_Duration': 'Duration',
      'overview_sidebar_Status': 'Status',
      'overview_sidebar_Start_Date': 'Start Date',
      'overview_sidebar_End_Date': 'End Date',
      'overview_sidebar_Season': 'Season',
      'overview_sidebar_Studios': 'Studios',
      'overview_sidebar_Authors': 'Authors',
      'overview_sidebar_Source': 'Source',
      'overview_sidebar_Genres': 'Genres',
      'overview_sidebar_external_links': 'External Links',
      'overview_sidebar_Type': 'Type',
      'overview_sidebar_Rating': 'Rating',
      'overview_sidebar_Licensors': 'Licensors',
      'overview_sidebar_Published': 'Published',
      'overview_sidebar_Aired': 'Aired',
      'search_Year': 'Year',
      'bookmarksItem_now': 'Now',
      'prediction_Episode_anime': 'Next episode {0}',
      'prediction_Episode_manga': 'Next chapter {0}',
      'prediction_Last_anime': 'Last episode {0}',
      'prediction_Last_manga': 'Last chapter {0}',
      'syncPage_flashConfirm_start_anime': 'Start watching?',
      'syncPage_flashConfirm_start_manga': 'Start reading?',
      'syncPage_flashConfirm_complete': 'Mark as completed?',
      'syncPage_flashConfirm_rewatch_start_anime': 'Start rewatching?',
      'syncPage_flashConfirm_rewatch_start_manga': 'Start rereading?',
      'syncPage_flashConfirm_rewatch_finish_anime': 'Finish rewatching?',
      'syncPage_flashConfirm_rewatch_finish_manga': 'Finish rereading?',
      'Ok': 'OK',
      'Cancel': 'Cancel',
      'Yes': 'Yes',
      'No': 'No',
      'correction_DBRequest': 'Send correction to database?',
      'correction_NewUrl': 'New URL: {0}',
    };
    let text = langMap[selector] || selector;
    if (args) {
      args.forEach((arg, i) => {
        text = text.replace(`{${i}}`, arg);
      });
    }
    return text;
  },

  langDirection(): 'ltr' | 'rtl' {
    return 'ltr';
  },

  assetUrl(filename: string): string {
    return filename;
  },

  addStyle(css: string): Promise<void> {
    return Promise.resolve();
  },

  injectCssResource(res: string, head: any, code?: string | null): void {},

  injectjsResource(res: string, head: any): void {},

  addProxyScriptToTag(tag: any, name: string): any {
    return tag;
  },

  updateDom(head: any): void {},

  storageOnChanged(cb: any): any {
    return () => {};
  },
};

export const api = {
  request: requestApi,
  storage: storageObj,
  settings: settingsObj,
  type: 'webextension' as const,
};
