// [emulator.ts] 主控制器 — 模拟生命周期编排与各层协调
// 职责：下载 ROM → 解压 → 选文件 → 初始化 WASM → 启动循环 → 协调 ui/ input/ core/ engine/ 各层
// 不负责：具体 UI DOM 构建（由 ui/ 处理）、引擎内部逻辑（由 engine/GameManager.js 处理）、输入捕获（由 input/ 处理）

import { EJS_Cache, EJS_CacheItem, EJS_FileItem, EJS_Download } from "./engine/cache.js";
import { EJS_COMPRESSION } from "./engine/compression.js";
import { EJS_GameManager } from "./engine/GameManager.js";
import { GamepadHandler } from "./gamepad.js";
import { EJS_STORAGE, EJS_DUMMYSTORAGE } from "./engine/storage.js";
import { cyrb53 } from "./utils.js";
import { EJS_SETUP } from "./core/setup.js";
import { Netplay } from "./engine/netplay.js";
import { EJS_license } from "./engine/license.js";
import * as CONSTS from "./consts.js";

import { createElement, addEventListener, removeEventListener } from "./ui/dom.js";
import { createPopup, createSubPopup, displayMessage, showInputPrompt } from "./ui/popup.js";
import { setupAds, adBlocked } from "./ui/ads.js";
import { createLink, buildButtonOptions } from "./ui/menu.js";
import { setVirtualGamepad as setVirtualGamepadFn } from "./ui/gamepad.js";
import { createCheatsMenu as createCheatsMenuFn } from "./ui/cheats.js";
import { setupSettingsMenu as setupSettingsMenuFn } from "./ui/settings.js";
import { setupDisksMenu as setupDisksMenuFn } from "./ui/disks.js";
import { initControlVars as initControlVarsFn, createControlSettingMenu as createControlSettingMenuFn } from "./ui/controls.js";
import { populateCacheList as populateCacheListFn, openCacheMenu as openCacheMenuFn } from "./ui/cacheMenu.js";
import { createBottomMenuBar as createBottomMenuBarFn } from "./ui/bottomBar.js";
import { createContextMenu as createContextMenuFn } from "./ui/contextMenu.js";
import { keyLookup as inputKeyLookup, keyChange as inputKeyChange } from "./input/keyboard.js";
import { gamepadEvent as inputGamepadEvent } from "./input/gamepad.js";
import { getAutofireInterval, isAutofireEnabled, startAutofire, stopAutofire, stopAllAutofire } from "./input/autofire.js";
import { screenshot as screenshotFn, takeScreenshot as takeScreenshotFn } from "./ui/screenshot.js";
import { on as onEvent, off as offEvent, callEvent as callEventFn } from "./core/events.js";
import { preGetSetting as preGetSettingFn, menuOptionChanged as menuOptionChangedFn, getSettingValue as getSettingValueFn } from "./core/config.js";
import { StateStore } from "./core/state.js";

import "./vendor/nipplejs.js";
import "./vendor/socket.io.min.js";

class EmulatorJS {
    Module: any;
    allSettings: any;
    analogAxes: any;
    autofireIntervals: any;
    canvas: any;
    capture: any;
    cheatMenu: any;
    cheats: any;
    compression: any;
    config: any;
    controlMenu: any;
    controlPopup: any;
    controls: any;
    coreName: any;
    createBottomMenuBarListeners: any;
    currentPopup: any;
    debug: any;
    defaultAutoFireInterval: any;
    defaultCoreOpts: any;
    downloadType: any;
    downloader: any;
    ejs_version: any;
    elements: any;
    // === StateStore-backed UI state (getter/setter delegation) ===
    _stateStore: StateStore;
    get started() { return this._stateStore.get('started'); }
    set started(v: boolean) { this._stateStore.set('started', v); }
    get paused() { return this._stateStore.get('paused'); }
    set paused(v: boolean) { this._stateStore.set('paused', v); }
    get failedToStart() { return this._stateStore.get('failedToStart'); }
    set failedToStart(v: boolean) { this._stateStore.set('failedToStart', v); }
    get isFastForward() { return this._stateStore.get('isFastForward'); }
    set isFastForward(v: boolean) { this._stateStore.set('isFastForward', v); }
    get isSlowMotion() { return this._stateStore.get('isSlowMotion'); }
    set isSlowMotion(v: boolean) { this._stateStore.set('isSlowMotion', v); }
    get rewindEnabled() { return this._stateStore.get('rewindEnabled'); }
    set rewindEnabled(v: boolean) { this._stateStore.set('rewindEnabled', v); }
    get volume() { return this._stateStore.get('volume'); }
    set volume(v: number) { this._stateStore.set('volume', v); }
    get muted() { return this._stateStore.get('muted'); }
    set muted(v: boolean) { this._stateStore.set('muted', v); }
    get touch() { return this._stateStore.get('touch'); }
    set touch(v: boolean) { this._stateStore.set('touch', v); }
    get enableMouseLock() { return this._stateStore.get('enableMouseLock'); }
    set enableMouseLock(v: boolean) { this._stateStore.set('enableMouseLock', v); }
    get lightgunActive() { return this._stateStore.get('lightgunActive'); }
    set lightgunActive(v: boolean) { this._stateStore.set('lightgunActive', v); }
    get settingsLoaded() { return this._stateStore.get('settingsLoaded'); }
    set settingsLoaded(v: boolean) { this._stateStore.set('settingsLoaded', v); }

    // === non-managed properties ===
    extensions: any;
    fileName: any;
    functions: any;
    game: any;
    gameManager: any;
    gamepad: any;
    gamepadLabels: any;
    gamepadSelection: any;
    handleSettingsResize: any;
    hasTouchScreen: any;
    initializeGameManager: any;
    isMobile: any;
    isSafari: any;
    license: any;
    missingLang: any;
    netplay: any;
    netplayEnabled: any;
    processCore: any;
    repository: any;
    requiresWebGL2: any;
    resetTimeout: any;
    retroarchOpts: any;
    saveFileExt: any;
    saveSaveInterval: any;
    settingsMenu: any;
    setup: any;
    storage: any;
    storageCache: any;
    supportsWebgl2: any;
    textElem: any;
    toggleFullscreen: any;
    toggleVirtualGamepad: any;
    toggleVirtualGamepadLeftHanded: any;
    videoRotation: any;
    videoRotationChanged: any;
    webgl2Enabled: any;
    getCores() {
        let rv = CONSTS.cores;
        if (this.isSafari && this.isMobile) {
            rv.n64 = rv.n64.reverse();
        }
        return rv;
    }
    requiresThreads(core) {
        return CONSTS.requiresThreads.includes(core);
    }
    requiresWebGL2(core) {
        return CONSTS.requiresWebGL2.includes(core);
    }
    getCore(generic) {
        const cores = this.getCores();
        const core = this.config.system;
        if (generic) {
            for (const k in cores) {
                if (cores[k].includes(core)) {
                    return k;
                }
            }
            return core;
        }
        const gen = this.getCore(true);
        if (cores[gen] && cores[gen].includes(this.preGetSetting("retroarch_core"))) {
            return this.preGetSetting("retroarch_core");
        }
        if (cores[core]) {
            return cores[core][0];
        }
        return core;
    }
    createElement(type) {
        return createElement(type);
    }
    addEventListener(element, listener, callback) {
        return addEventListener(element, listener, callback);
    }
    removeEventListener(data) {
        removeEventListener(data);
    }
    /**
     * Downloads a file from the specified path.
     * Helper method that delegates to EJS_Download system for all URL-based downloads.
     * Handles direct data objects (ArrayBuffer, Uint8Array, Blob) and constructs proper paths.
     * @param {*} path The path to the file to download.
     * @param {*} type The expected type of the file.
     * @param {*} progress A callback function for progress updates.
     * @param {*} notWithPath Whether to exclude the base path.
     * @param {*} opts Additional options for the download.
     * @param {boolean} forceExtract Whether to force extraction of compressed files regardless of extension (default is false).
     * @param {boolean} dontCache If true, the downloaded file will not be cached (default is false).
     * @param {boolean} dontExtract If true, the downloaded file will not be extracted, but will still be cached (default is false, overridden by forceExtract).
     * @returns A promise that resolves with the downloaded file data.
     */
    downloadFile(path, type, progress, notWithPath, opts, forceExtract = false, dontCache = false, dontExtract = false) {
        if (this.debug) console.log("[EJS " + type + "] Downloading " + path);
        return new Promise<any>(async (resolve) => {
            // Handle direct data objects (ArrayBuffer, Uint8Array, Blob)
            const data = this.toData(path);
            if (data) {
                data.then((game) => {
                    if (opts.method === "HEAD") {
                        resolve({ headers: {} });
                    } else {
                        resolve({ headers: {}, data: game });
                    }
                });
                return;
            }

            // Construct the full path/URL
            const basePath = notWithPath ? "" : this.config.dataPath;
            let fullPath = basePath + path;
            if (!notWithPath && this.config.filePaths && typeof this.config.filePaths[path.split("/").pop()] === "string") {
                fullPath = this.config.filePaths[path.split("/").pop()];
            }

            // Delegate all URL downloads (http, https, blob, data, etc.) to EJS_Download
            try {
                const onProgress = progress instanceof Function ? (status, percentage, loaded, total) => {
                    if (status === "downloading") {
                        const progressText = total ? " " + Math.floor(percentage).toString() + "%" : " " + (loaded / 1048576).toFixed(2) + "MB";
                        progress(progressText);
                    }
                } : null;

                const onComplete = (success, result) => {
                    if (!success) {
                        console.error("Download failed in onComplete:", result);
                    }
                };

                const responseType = opts.responseType || "arraybuffer";
                const method = opts.method || "GET";
                const headers = {};
                const timeout = 30000;

                const cacheItem = await this.downloader.downloadFile(
                    fullPath,
                    type,
                    method,
                    headers,
                    null,
                    onProgress,
                    onComplete,
                    timeout,
                    responseType,
                    forceExtract,
                    dontCache,
                    dontExtract
                );

                // Handle HEAD requests (returns null)
                if (!cacheItem) {
                    resolve({ headers: {} });
                    return;
                }

                // Extract the data from the cache item
                if (cacheItem.files && cacheItem.files.length > 0) {
                    // If there are files, return the entire cache item
                    // so the caller can access all extracted files
                    if (cacheItem.files.length > 0) {
                        resolve({
                            data: cacheItem,
                            headers: {
                                "content-length": cacheItem.files.reduce((sum, f) => sum + (f.bytes.byteLength || 0), 0)
                            }
                        });
                    } else {
                        let data = cacheItem.files[0].bytes;
                        
                        // Convert to appropriate format based on responseType
                        if (responseType === "text" || (opts.type && opts.type.toLowerCase() === "text")) {
                            const decoder = new TextDecoder();
                            data = decoder.decode(data);
                            try { data = JSON.parse(data) } catch(e) {}
                        }

                        resolve({
                            data: data,
                            headers: {
                                "content-length": data.byteLength || data.length
                            }
                        });
                    }
                } else {
                    console.error("Invalid cache item returned:", cacheItem);
                    resolve(-1);
                }
            } catch(error) {
                console.error("Download error:", error);
                resolve(-1);
            }
        });
    }
    toData(data, rv) {
        if (!(data instanceof ArrayBuffer) && !(data instanceof Uint8Array) && !(data instanceof Blob)) return null;
        if (rv) return true;
        return new Promise<any>(async (resolve) => {
            if (data instanceof ArrayBuffer) {
                resolve(new Uint8Array(data));
            } else if (data instanceof Uint8Array) {
                resolve(data);
            } else if (data instanceof Blob) {
                resolve(new Uint8Array(await data.arrayBuffer()));
            }
            resolve(undefined);
        })
    }
    checkForUpdates() {
        if (this.ejs_version.endsWith("-beta")) {
            console.warn("Using EmulatorJS beta. Not checking for updates. This instance may be out of date. Using stable is highly recommended unless you build and ship your own cores.");
            return;
        }
        fetch("https://cdn.emulatorjs.org/stable/data/version.json").then(response => {
            if (response.ok) {
                response.text().then(body => {
                    try {
                        let version = JSON.parse(body);
                        if (this.versionAsInt(this.ejs_version) < this.versionAsInt(version.version)) {
                            console.log(`Using EmulatorJS version ${this.ejs_version} but the newest version is ${version.current_version}\nopen https://github.com/EmulatorJS/EmulatorJS to update`);
                        }
                    } catch (e) { /* invalid version json, ignore */ }
                }).catch(() => { /* response.text() failed, ignore */ })
            }
        }).catch(() => { /* version check network error, ignore */ })
    }
    versionAsInt(ver) {
        if (ver.endsWith("-beta")) {
            return 99999999;
        }
        if (ver.endsWith("-pre")) {
            ver = ver.substring(0, ver.length - 4);
        }
        let rv = ver.split(".");
        if (rv[rv.length - 1].length === 1) {
            rv[rv.length - 1] = "0" + rv[rv.length - 1];
        }
        return parseInt(rv.join(""));
    }
    /**
     * 创建 EmulatorJS 实例。
     * @param {string} element - 挂载目标元素的 CSS 选择器（如 "#game"）
     * @param {object} config - 用户配置，支持 system、gameUrl、volume、threads 等选项（详见 types/index.ts EmulatorConfig）
     */
    constructor(element, config) {
        this.ejs_version = CONSTS.version;
        this.extensions = [];
        this.allSettings = {};
        this.initControlVars();
        this.debug = config.debug;
        if (this.debug || (window.location && ["localhost", "127.0.0.1"].includes(location.hostname))) {
            this.checkForUpdates();
        }
        this.netplayEnabled = true;
        this.config = config;

        this.setup = new EJS_SETUP(this);
        this.setup.checkDeprecatedSettings();
        this.setup.cacheDefaults();
        this.setup.browserMode();
        this.setup.shaders();
        
        this.config.buttonOpts = this.buildButtonOptions(this.config.buttonOpts);
        this.config.settingsLanguage = window.EJS_settingsLanguage || false;

        this._stateStore = new StateStore({
            volume: (typeof this.config.volume === "number") ? this.config.volume : 0.5,
            rewindEnabled: this.preGetSetting("rewindEnabled") === "enabled",
        });

        this.currentPopup = null;
        this.cheats = [];
        if (this.config.defaultControllers) {
            // Merge user config with defaults instead of replacing
            for (const [player, buttons] of Object.entries(this.config.defaultControllers)) {
                this.defaultControllers[player] = this.defaultControllers[player] || {};

                for (const [button, config] of Object.entries(buttons)) {
                    this.defaultControllers[player][button] = {
                        ...(this.defaultControllers[player][button] || {}),
                        ...config
                    };
                }
            }
        }
        this.defaultAutoFireInterval = 100;
        this.autofireIntervals = {};
        this.missingLang = [];
        this.setElements(element);
        this.setColor(this.config.color || "");
        this.config.alignStartButton = (typeof this.config.alignStartButton === "string") ? this.config.alignStartButton : "bottom";
        this.config.backgroundColor = (typeof this.config.backgroundColor === "string") ? this.config.backgroundColor : "rgb(51, 51, 51)";
        if (this.config.adUrl) {
            this.config.adSize = (Array.isArray(this.config.adSize)) ? this.config.adSize : ["300px", "250px"];
            this.setupAds(this.config.adUrl, this.config.adSize[0], this.config.adSize[1]);
        }
        this.isMobile = (() => {
            // browserMode can be either a 1 (force mobile), 2 (force desktop) or undefined (auto detect)
            switch (this.config.browserMode) {
                case 1:
                    return true;
                case 2:
                    return false;
            }

            let check = false;
            (function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
            return check;
        })();
        this.hasTouchScreen = (function() {
            if (window.PointerEvent && ("maxTouchPoints" in navigator)) {
                if (navigator.maxTouchPoints > 0) {
                    return true;
                }
            } else {
                if (window.matchMedia && window.matchMedia("(any-pointer:coarse)").matches) {
                    return true;
                } else if (window.TouchEvent || ("ontouchstart" in window)) {
                    return true;
                }
            }
            return false;
        })();
        this.canvas = this.createElement("canvas");
        this.canvas.classList.add("ejs-canvas");
        this.videoRotation = ([0, 1, 2, 3].includes(this.config.videoRotation)) ? this.config.videoRotation : this.preGetSetting("videoRotation") || 0;
        this.videoRotationChanged = false;
        this.capture = this.capture || {};
        this.capture.photo = this.capture.photo || {};
        this.capture.photo.source = ["canvas", "retroarch"].includes(this.capture.photo.source) ? this.capture.photo.source : "canvas";
        this.capture.photo.format = (typeof this.capture.photo.format === "string") ? this.capture.photo.format : "png";
        this.capture.photo.upscale = (typeof this.capture.photo.upscale === "number") ? this.capture.photo.upscale : 1;
        this.capture.video = this.capture.video || {};
        this.capture.video.format = (typeof this.capture.video.format === "string") ? this.capture.video.format : "detect";
        this.capture.video.upscale = (typeof this.capture.video.upscale === "number") ? this.capture.video.upscale : 1;
        this.capture.video.fps = (typeof this.capture.video.fps === "number") ? this.capture.video.fps : 30;
        this.capture.video.videoBitrate = (typeof this.capture.video.videoBitrate === "number") ? this.capture.video.videoBitrate : 2.5 * 1024 * 1024;
        this.capture.video.audioBitrate = (typeof this.capture.video.audioBitrate === "number") ? this.capture.video.audioBitrate : 192 * 1024;
        this.bindListeners();
        if (this.netplayEnabled) {
            this.netplay = new Netplay(this);
        }

        if ((this.isMobile || this.hasTouchScreen) && this.virtualGamepad) {
            this.virtualGamepad.classList.add("ejs-vgamepad-active");
            this.canvas.classList.add("ejs-canvas-no-pointer");
        }

        this.supportsWebgl2 = !!document.createElement("canvas").getContext("webgl2") && (this.config.forceLegacyCores !== true);
        this.webgl2Enabled = (() => {
            let setting = this.preGetSetting("webgl2Enabled");
            if (setting === "disabled" || !this.supportsWebgl2) {
                return false;
            } else if (setting === "enabled") {
                return true;
            }
            return null;
        })();
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

        this.storage = {}
    
        if (this.config.disableDatabases === true) {
            this.config.cacheConfig.enabled = false;
        }
        
        // Populate downloadTypes
        this.downloadType = {
            "rom": { "name": "ROM", "dontCache": false, "dontExtractIfCore": ["arcade", "fbneo", "fbalpha2012_cps1", "fbalpha2012_cps2", "same_cdi", "mame", "mame2003_plus", "mame2003"] },
            "core": { "name": "Core", "dontCache": false },
            "bios": { "name": "BIOS", "dontCache": false, "dontExtractIfCore": ["arcade", "fbneo", "fbalpha2012_cps1", "fbalpha2012_cps2", "same_cdi", "mame", "mame2003_plus", "mame2003"] },
            "parent": { "name": "Parent", "dontCache": false },
            "patch": { "name": "Patch", "dontCache": false },
            "reports": { "name": "Reports", "dontCache": true },
            "states": { "name": "States", "dontCache": true },
            "support": { "name": "Support", "dontCache": true },
            "unknown": { "name": "Unknown", "dontCache": true }
        }

        // Initialize storage cache
        this.storageCache = new EJS_Cache(
            this.config.cacheConfig.enabled,
            "EmulatorJS-Cache",
            this.config.cacheConfig.cacheMaxSizeMB,
            this.config.cacheConfig.cacheMaxAgeMins || 7200,
            this.debug
        );

        // Initialize downloader with cache
        this.downloader = new EJS_Download(this.storageCache, this);
        
        // This is not cache. This is save data
        this.storage.states = new EJS_STORAGE("EmulatorJS-states", "states");

        this.game.classList.add("ejs-game");
        if (typeof this.config.backgroundImg === "string") {
            this.game.classList.add("ejs-game_background");
            if (this.config.backgroundBlur) this.game.classList.add("ejs-game_background_blur");
            this.game.setAttribute("style", `--ejs-background-image: url("${this.config.backgroundImg}"); --ejs-background-color: ${this.config.backgroundColor};`);
            this.on("start", () => {
                this.game.classList.remove("ejs-game_background");
                if (this.config.backgroundBlur) this.game.classList.remove("ejs-game_background_blur");
            })
        } else {
            this.game.setAttribute("style", "--ejs-background-color: " + this.config.backgroundColor + ";");
        }

        if (Array.isArray(this.config.cheats)) {
            for (let i = 0; i < this.config.cheats.length; i++) {
                const cheat = this.config.cheats[i];
                if (Array.isArray(cheat) && cheat[0] && cheat[1]) {
                    this.cheats.push({
                        desc: cheat[0],
                        checked: false,
                        code: cheat[1],
                        is_permanent: true
                    })
                }
            }
        }

        this.createStartButton();
        this.handleResize();

        if (this.config.fixedSaveInterval) {
            this.startSaveInterval(this.config.fixedSaveInterval);
        }
    }

    startSaveInterval(period) {
        if (this.saveSaveInterval) {
            clearInterval(this.saveSaveInterval);
            this.saveSaveInterval = null;
        }
        // Disabled
        if (period === 0 || isNaN(period)) return;
        if (this.started) this.gameManager.saveSaveFiles();
        if (this.debug) console.log("Saving every", period, "miliseconds");
        this.saveSaveInterval = setInterval(() => {
            if (this.started) this.gameManager.saveSaveFiles();
        }, period);
    }

    setColor(color) {
        if (typeof color !== "string") color = "";
        let getColor = function(color) {
            color = color.toLowerCase();
            if (color && /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(color)) {
                if (color.length === 4) {
                    let rv = "#";
                    for (let i = 1; i < 4; i++) {
                        rv += color.slice(i, i + 1) + color.slice(i, i + 1);
                    }
                    color = rv;
                }
                let rv = [];
                for (let i = 1; i < 7; i += 2) {
                    rv.push(parseInt("0x" + color.slice(i, i + 2), 16));
                }
                return rv.join(", ");
            }
            return null;
        }
        if (!color || getColor(color) === null) {
            this.elements.parent.setAttribute("style", "--ejs-primary-color: 26,175,255;");
            return;
        }
        this.elements.parent.setAttribute("style", "--ejs-primary-color:" + getColor(color) + ";");
    }
    setupAds(ads, width, height) {
        return setupAds(this, ads, width, height);
    }
    adBlocked(url, del) {
        return adBlocked(this, url, del);
    }
    /** 订阅事件。@param {string} event - 事件名（如 "start"、"exit"） @param {Function} func - 回调 */
    on(event, func) {
        return onEvent(this, event, func);
    }
    /** 发布事件。@param {string} event @param {*} data */
    callEvent(event, data) {
        return callEventFn(this, event, data);
    }
    /** 取消订阅。@param {string} event @param {Function} func */
    off(event, func) {
        return offEvent(this, event, func);
    }
    setElements(element) {
        const game = this.createElement("div");
        const elem = document.querySelector(element);
        elem.innerHTML = "";
        elem.appendChild(game);
        this.game = game;

        this.elements = {
            main: this.game,
            parent: elem
        }
        this.elements.parent.classList.add("ejs-parent");
        this.elements.parent.setAttribute("tabindex", -1);
    }
    // Start button
    createStartButton() {
        const button = this.createElement("div");
        button.classList.add("ejs-start_button");
        let border = 0;
        if (typeof this.config.backgroundImg === "string") {
            button.classList.add("ejs-start_button_border");
            border = 1;
        }
        button.innerText = (typeof this.config.startBtnName === "string") ? this.config.startBtnName : this.localization("Start Game");
        if (this.config.alignStartButton == "top") {
            button.style.bottom = "calc(100% - 20px)";
        } else if (this.config.alignStartButton == "center") {
            button.style.bottom = "calc(50% + 22.5px + " + border + "px)";
        }
        this.elements.parent.appendChild(button);
        this.addEventListener(button, "touchstart", () => {
            this.touch = true;
        })
        this.addEventListener(button, "click", this.startButtonClicked.bind(this));
        if (this.config.startOnLoad === true) {
            this.startButtonClicked(button);
        }
        setTimeout(() => {
            this.callEvent("ready");
        }, 20);
    }
    startButtonClicked(e) {
        this.callEvent("start-clicked");
        if (e.pointerType === "touch") {
            this.touch = true;
        }
        if (e.preventDefault) {
            e.preventDefault();
            e.target.remove();
        } else {
            e.remove();
        }
        this.createText();
        this.downloadGameCore();
    }
    // End start button
    createText() {
        this.textElem = this.createElement("div");
        this.textElem.classList.add("ejs-loading_text");
        if (typeof this.config.backgroundImg === "string") this.textElem.classList.add("ejs-loading_text_glow");
        this.textElem.innerText = this.localization("Loading...");
        this.elements.parent.appendChild(this.textElem);
    }
    localization(text, log) {
        if (typeof text === "undefined" || text.length === 0) return;
        text = text.toString();
        if (text.includes("EmulatorJS v")) return text;
        if (this.config.langJson) {
            if (typeof log === "undefined") log = true;
            if (!this.config.langJson[text] && log) {
                if (!this.missingLang.includes(text)) this.missingLang.push(text);
                if (this.debug) console.log(`Translation not found for '${text}'. Language set to '${this.config.language}'`);
            }
            return this.config.langJson[text] || text;
        }
        return text;
    }
    checkCoreCompatibility(version) {
        if (this.versionAsInt(version.minimumEJSVersion) > this.versionAsInt(this.ejs_version)) {
            this.startGameError(this.localization("Outdated EmulatorJS version"));
            throw new Error("Core requires minimum EmulatorJS version of " + version.minimumEJSVersion);
        }
    }
    /** 显示启动失败错误并停止加载流程。@param {string} message - 错误信息 */
    startGameError(message) {
        console.log(message);
        this.textElem.innerText = message;
        this.textElem.classList.add("ejs-error_text");

        this.setupSettingsMenu();
        this.loadSettings();

        this.menu.failedToStart();
        this.handleResize();
        this.failedToStart = true;
    }
    /** 下载模拟核心（ROM 文件解压后的 *.js + *.wasm），包含线程/WebGL2 检测和 CDN 回退。 */
    downloadGameCore() {
        this.textElem.innerText = this.localization("Download Game Core");
        if (!this.config.threads && this.requiresThreads(this.getCore())) {
            this.startGameError(this.localization("Error for site owner") + "\n" + this.localization("Check console"));
            console.warn("This core requires threads, but EJS_threads is not set!");
            return;
        }
        if (!this.supportsWebgl2 && this.requiresWebGL2(this.getCore())) {
            this.startGameError(this.localization("Outdated graphics driver"));
            return;
        }
        if (this.config.threads && typeof window.SharedArrayBuffer !== "function") {
            this.startGameError(this.localization("Error for site owner") + "\n" + this.localization("Check console"));
            console.warn("Threads is set to true, but the SharedArrayBuffer function is not exposed. Threads requires 2 headers to be set when sending you html page. See https://stackoverflow.com/a/68630724");
            return;
        }
        const gotCore = (data) => {
            this.defaultCoreOpts = {};
            
            let decompressedData = {};
            
            // Check if data is already a cache item with extracted files
            if (data && data.files && Array.isArray(data.files)) {
                console.log("[EJS Core] Data is already decompressed cache item");
                // Convert cache item files array to object keyed by filename
                for (const file of data.files) {
                    decompressedData[file.filename] = file.bytes;
                }
                this.processCore(decompressedData);
            } else {
                // Data is still compressed, need to decompress
                console.log("[EJS Core] Data needs decompression");
                if (!this.compression) {
                    this.compression = new EJS_COMPRESSION(this);
                }
                
                this.textElem.innerText = this.localization("Decompress Game Core");
                
                this.compression.decompress(new Uint8Array(data), (m, appendMsg) => {
                    this.textElem.innerText = appendMsg ? (this.localization("Decompress Game Core") + m) : m;
                }, null).then(async (decompressedData) => {
                    this.processCore(decompressedData);
                });
            }
        }
        
        this.processCore = (decompressedData) => {
            if (this.debug) console.log("[EJS Core] Decompressed files:", Object.keys(decompressedData));
            let js, thread, wasm;
            for (let k in decompressedData) {
                if (k.endsWith(".wasm")) {
                    wasm = decompressedData[k];
                } else if (k.endsWith(".worker.js")) {
                    thread = decompressedData[k];
                } else if (k.endsWith(".js")) {
                    js = decompressedData[k];
                } else if (k === "build.json") {
                    this.checkCoreCompatibility(JSON.parse(new TextDecoder().decode(decompressedData[k])));
                } else if (k === "core.json") {
                    let core = JSON.parse(new TextDecoder().decode(decompressedData[k]));
                    this.extensions = core.extensions;
                    this.coreName = core.name;
                    this.repository = core.repo;
                    this.defaultCoreOpts = core.options;
                    this.enableMouseLock = core.options.supportsMouse;
                    this.retroarchOpts = core.retroarchOpts;
                    this.saveFileExt = core.save;
                } else if (k === "license.txt") {
                    this.license = new TextDecoder().decode(decompressedData[k]);
                }
            }

            if (this.saveFileExt === false) {
                this.elements.bottomBar.saveSavFiles[0].style.display = "none";
                this.elements.bottomBar.loadSavFiles[0].style.display = "none";
            }

            if (this.debug) console.log("[EJS Core] Core decompression complete");
            if (this.debug) console.log("[EJS Core] js size:", js?.byteLength, "wasm size:", wasm?.byteLength, "thread size:", thread?.byteLength);

            this.initGameCore(js, wasm, thread);
        }

        const report = "cores/reports/" + this.getCore() + ".json";
        // Add cache-busting parameter periodically to ensure we get updated build versions
        // This ensures that when cores are updated, we'll eventually get the new buildStart value
        const cacheBustInterval = 1000 * 60 * 60; // 1 hour
        const cacheBustParam = Math.floor(Date.now() / cacheBustInterval);
        const reportUrl = `${report}?v=${cacheBustParam}`;

        this.downloadFile(reportUrl, this.downloadType.reports.name, null, false, { responseType: "text", method: "GET" }, false, this.downloadType.reports.dontCache).then(async rep => {
            if (rep === -1 || typeof rep === "string" || typeof rep.data === "string") {
                rep = {};
            } else {
                rep = rep.data;
            }
            if (!rep.buildStart) {
                console.warn("Could not fetch core report JSON at " + reportUrl + "! Core caching will be disabled!");
                rep.buildStart = Math.random() * 100;
            }
            if (this.webgl2Enabled === null) {
                this.webgl2Enabled = rep.options ? rep.options.defaultWebGL2 : false;
            }
            if (this.requiresWebGL2(this.getCore())) {
                this.webgl2Enabled = true;
            }
            let threads = false;
            if (typeof window.SharedArrayBuffer === "function") {
                const opt = this.preGetSetting("ejs_threads");
                if (opt) {
                    threads = (opt === "enabled");
                } else {
                    threads = this.config.threads;
                }
            }

            let legacy = (this.supportsWebgl2 && this.webgl2Enabled ? "" : "-legacy");
            let filename = this.getCore() + (threads ? "-thread" : "") + legacy + "-wasm.data";

            // Download the core
            console.log("[EJS Core] Downloading core:", filename);
            const corePath = "cores/" + filename;
            let res = await this.downloadFile(corePath, this.downloadType.core.name, (progress) => {
                this.textElem.innerText = this.localization("Download Game Core") + progress;
            }, false, { responseType: "arraybuffer", method: "GET" }, true, this.downloadType.core.dontCache);
            if (res === -1) {
                console.log("File not found, attemping to fetch from emulatorjs cdn.");
                console.error("**THIS METHOD IS A FAILSAFE, AND NOT OFFICIALLY SUPPORTED. USE AT YOUR OWN RISK**");
                let version = this.ejs_version.endsWith("-beta") ? "nightly" : this.ejs_version;
                res = await this.downloadFile(`https://cdn.emulatorjs.org/${version}/data/${corePath}`, this.downloadType.core.name, (progress) => {
                    this.textElem.innerText = this.localization("Download Game Core") + progress;
                }, true, { responseType: "arraybuffer", method: "GET" }, true, this.downloadType.core.dontCache);
                if (res === -1) {
                    if (!this.supportsWebgl2) {
                        this.startGameError(this.localization("Outdated graphics driver"));
                    } else {
                        this.startGameError(this.localization("Error downloading core") + " (" + filename + ")");
                    }
                    return;
                }
                console.warn("File was not found locally, but was found on the emulatorjs cdn.\nIt is recommended to download the stable release from here: https://cdn.emulatorjs.org/releases/");
            }

            // Core download and caching handled by EJS_Download
            gotCore(res.data);
        });
    }
    initGameCore(js, wasm, thread) {
        let script = this.createElement("script");
        script.src = URL.createObjectURL(new Blob([js], { type: "application/javascript" }));
        script.addEventListener("load", () => {
            this.initModule(wasm, thread);
        });
        document.body.appendChild(script);
    }
    getBaseFileName(force) {
        //Only once game and core is loaded
        if (!this.started && !force) return null;
        if (force && this.config.gameUrl !== "game" && !this.config.gameUrl.startsWith("blob:")) {
            return this.config.gameUrl.split("/").pop().split("#")[0].split("?")[0];
        }
        if (typeof this.config.gameName === "string") {
            const invalidCharacters = /[#<$+%>!`&*'|{}/\\?"=@:^\r\n]/ig;
            const name = this.config.gameName.replace(invalidCharacters, "").trim();
            if (name) return name;
        }
        if (!this.fileName) return "game";
        let parts = this.fileName.split(".");
        parts.splice(parts.length - 1, 1);
        return parts.join(".");
    }
    saveInBrowserSupported() {
        return !!window.indexedDB && (typeof this.config.gameName === "string" || !this.config.gameUrl.startsWith("blob:"));
    }
    displayMessage(message, time) {
        return displayMessage(this, message, time);
    }
    downloadStartState() {
        return new Promise<any>((resolve, reject) => {
            if (typeof this.config.loadState !== "string" && !this.toData(this.config.loadState, true)) {
                resolve(undefined);
                return;
            }
            this.textElem.innerText = this.localization("Download Game State");

            this.downloadFile(this.config.loadState, this.downloadType.states.name, (progress) => {
                this.textElem.innerText = this.localization("Download Game State") + progress;
            }, true, { responseType: "arraybuffer", method: "GET" }, false, this.downloadType.states.dontCache).then((res) => {
                if (res === -1) {
                    this.startGameError(this.localization("Error downloading game state"));
                    return;
                }
                this.on("start", () => {
                    setTimeout(() => {
                        this.gameManager.loadState(new Uint8Array(res.data.files[0].bytes));
                    }, 10);
                })
                resolve(undefined);
            });
        })
    }

    /**
     * Download a file, with caching and File object support
     * @param {*} url The URL or File object to download
     * @param {*} type The download type (from this.downloadType)
     * @returns 
     */
    download(url, type) {
        if (url === undefined || url === null || url === "") {
            if (this.debug) console.log("[EJS " + type.name.toUpperCase() + "] No URL provided, skipping download.");
            return new Promise<any>((resolve) => {
                resolve(url);
            });
        }

        if (!this.compression) {
            this.compression = new EJS_COMPRESSION(this);
        }

        let dontExtract = false;
        if (type.dontExtractIfCore?.includes(this.getCore())) {
            dontExtract = true;
            console.log(`[EJS ${type.name.toUpperCase()}] Core ${this.getCore()} requires special handling, will not attempt to extract if compressed.`);
        } else {
            console.log(`[EJS ${type.name.toUpperCase()}] Core ${this.getCore()} does not require special handling, will attempt to extract if compressed.`);
        }

        return new Promise<any>(async (resolve, reject) => {
            let returnData;

            // check if url is a file object, and if so convert it to an EJS_CacheItem
            if (typeof url === "object" && url instanceof File) {
                if (this.debug) console.log("[EJS " + type.name.toUpperCase() + "] Requested download for File object " + url.name);

                // Convert File to Uint8Array
                const arrayBuffer = await url.arrayBuffer();
                const inData = new Uint8Array(arrayBuffer);

                // check cache
                let key = this.storageCache.generateCacheKey(inData);
                let cachedItem = await this.storageCache.get(key);
                if (cachedItem) {
                    if (this.debug) console.log("[EJS " + type.name.toUpperCase() + "] Using cached content for " + url.name);
                    returnData = cachedItem;
                } else {
                    // Not in cache - decompress
                    let files = [];
                    if (dontExtract === false) {
                        const decompressedData = await this.compression.decompress(inData, (m, appendMsg) => {
                            this.textElem.innerText = appendMsg ? (this.localization("Decompress Game Core") + m) : m;
                        }, (fileName, fileData) => {
                            // Use file callback to collect files during decompression
                            let bytes;
                            if (fileData instanceof Uint8Array) {
                                bytes = fileData;
                            } else if (fileData instanceof ArrayBuffer) {
                                bytes = new Uint8Array(fileData);
                            } else if (fileData && typeof fileData === 'object') {
                                // Handle case where it might be an object with numeric keys
                                bytes = new Uint8Array(Object.values(fileData));
                            } else {
                                console.error("Unknown file data type:", typeof fileData, fileData);
                                return;
                            }

                            if (fileName === "!!notCompressedData") {
                                files.push(new EJS_FileItem(url.name, bytes));
                            } else if (!fileName.endsWith("/")) {
                                files.push(new EJS_FileItem(fileName, bytes));
                            }
                        });
                    } else {
                        // If we shouldn't extract, just treat the whole file as a single item
                        files.push(new EJS_FileItem(url.name, inData));
                    }

                    // construct EJS_CacheItem
                    let data = new EJS_CacheItem(
                        key,
                        files,
                        Date.now(),
                        type.name,
                        "arraybuffer",
                        url.name,
                        url.name,
                        Date.now() + 5 * 24 * 60 * 60 * 1000 // 5 days expiration
                    );

                    this.storageCache.put(data);

                    returnData = data;
                }
            } else {
                // download using a url
                if (this.debug) console.log("[EJS " + type.name.toUpperCase() + "] Requested download for " + url);
                // download the content
                const data = await this.downloadFile(
                    url,
                    type.name,
                    (progress) => {
                        this.textElem.innerText = this.localization("Download Game Data") + progress;
                    },
                    true,
                    { responseType: "arraybuffer", method: "GET" },
                    false,
                    type.dontCache,
                    dontExtract
                );
                // check for error
                if (data === -1) {
                    this.startGameError(this.localization("Network Error"));
                    return;
                }
                // check for content type
                if (this.config.gameUrl instanceof File) {
                    this.config.gameUrl = this.config.gameUrl.name;
                } else if (this.toData(this.config.gameUrl, true)) {
                    this.config.gameUrl = type.name.toLowerCase();
                }

                returnData = data.data;
            }

            if (this.debug) console.log("[EJS " + type.name.toUpperCase() + "] Downloaded content:", returnData);

            const writeFilesToFS = (fileName, fileData) => {
                if (fileName.includes("/")) {
                    const paths = fileName.split("/");
                    let cp = "";
                    for (let i = 0; i < paths.length - 1; i++) {
                        if (paths[i] === "") continue;
                        cp += `/${paths[i]}`;
                        if (!this.gameManager.FS.analyzePath(cp).exists) {
                            this.gameManager.FS.mkdir(cp);
                        }
                    }
                }
                if (fileName.endsWith("/")) {
                    if (!this.gameManager.FS.analyzePath(fileName).exists) {
                        this.gameManager.FS.mkdir(fileName);
                    }
                    return null;
                }
                this.gameManager.FS.writeFile(`/${fileName}`, fileData);
                return fileName;
            };

            // extract to the file system
            if (returnData && returnData.files) {
                for (let i = 0; i < returnData.files.length; i++) {
                    writeFilesToFS(returnData.files[i].filename, returnData.files[i].bytes)
                }
            }

            resolve(returnData);
        });
    }
    /**
     * Initialize GameManager and load external files and file systems
     */
    async initializeGameManager() {
        this.gameManager = new EJS_GameManager(this.Module, this);
        await this.gameManager.loadExternalFiles();
        await this.gameManager.mountFileSystems();
        this.callEvent("saveDatabaseLoaded", this.gameManager.FS);
        if (this.getCore() === "ppsspp") {
            try {
                await this.gameManager.loadPpssppAssets();
            } catch (e) {
                console.error("Failed to load PPSSPP assets:", e);
                this.startGameError(this.localization("Network Error"));
                throw e;
            }
        }
    }

    /**
     * Determine CUE file handling settings based on core type and configuration
     */
    determineCueSettings() {
        const coresThatNeedCueHandling = ["pcsx_rearmed", "genesis_plus_gx", "picodrive", "mednafen_pce", "smsplus", "vice_x64", "vice_x64sc", "vice_x128", "vice_xvic", "vice_xpet", "puae"];
        let disableCue = false;

        if (coresThatNeedCueHandling.includes(this.getCore()) && this.config.disableCue === undefined) {
            disableCue = true;
        } else {
            disableCue = this.config.disableCue;
        }

        if (this.debug) console.log("Disable CUE handling:", disableCue);
        return disableCue;
    }

    /**
     * Check if extension is supported by the current core
     */
    supportsExtension(ext) {
        if (!this.extensions) return false;
        return this.extensions.includes(ext);
    }

    /**
     * Select the most appropriate ROM file from available files
     */
    selectRomFile(fileNames, coreName) {
        const cueGenerationCores = ["mednafen_psx_hw"];
        const prioritizeExtensions = ["cue", "ccd", "toc", "m3u"];

        let createCueFile = cueGenerationCores.includes(this.getCore());
        if (this.determineCueSettings()) {
            createCueFile = false;
        }

        let isoFile = null;
        let supportedFile = null;
        let cueFile = null;

        fileNames.forEach(fileName => {
            const ext = fileName.split(".").pop().toLowerCase();
            if (supportedFile === null && this.supportsExtension(ext)) {
                supportedFile = fileName;
            }
            if (isoFile === null && ["iso", "cso", "chd", "elf"].includes(ext)) {
                isoFile = fileName;
            }
            if (prioritizeExtensions.includes(ext)) {
                const currentCueExt = (cueFile === null) ? null : cueFile.split(".").pop().toLowerCase();
                if (coreName === "psx") {
                    // Always prefer m3u files for psx cores
                    if (currentCueExt !== "m3u") {
                        if (cueFile === null || ext === "m3u") {
                            cueFile = fileName;
                        }
                    }
                } else {
                    const priority = ["cue", "ccd"]
                    // Prefer cue or ccd files over toc or m3u
                    if (!priority.includes(currentCueExt)) {
                        if (cueFile === null || priority.includes(ext)) {
                            cueFile = fileName;
                        }
                    }
                }
            }
        });

        // Set the primary file selection with priority order
        if (supportedFile !== null) {
            this.fileName = supportedFile;
        } else {
            this.fileName = fileNames[0];
        }

        // ISO files take priority if supported
        if (isoFile !== null && this.supportsExtension(isoFile.split(".").pop().toLowerCase())) {
            this.fileName = isoFile;
        }

        // CUE/CCD files take priority if supported, or create a CUE file if needed
        if (cueFile !== null && this.supportsExtension(cueFile.split(".").pop().toLowerCase())) {
            this.fileName = cueFile;
        } else if (createCueFile && this.supportsExtension("m3u") && this.supportsExtension("cue")) {
            this.fileName = this.gameManager.createCueFile(fileNames);
        }

        // Special handling for DOS
        if (this.getCore(true) === "dos" && !this.config.disableBatchBootup) {
            this.fileName = this.gameManager.writeBootupBatchFile();
        }
    }

    /**
     * Extract file names from downloaded ROM data and start game
     */
    startGameFromDownload(romData) {
        const fileNames = [];
        for (const file of romData.files) {
            if (file.filename.endsWith("/")) {
                continue;
            }
            fileNames.push(file.filename);
        }
        this.selectRomFile(fileNames, this.getCore());
        this.startGame();
    }

    /**
     * Download all necessary files and start the game
     */
    downloadFiles() {
        (async () => {
            await this.initializeGameManager();
            
            const romData = await this.download(this.config.gameUrl, this.downloadType.rom);
            await this.download(this.config.biosUrl, this.downloadType.bios);
            await this.downloadStartState();
            await this.download(this.config.gameParentUrl, this.downloadType.parent);
            await this.download(this.config.gamePatchUrl, this.downloadType.patch);

            this.determineCueSettings();
            this.startGameFromDownload(romData);
        })();
    }
    /** 初始化 Emscripten WASM 模块，挂载虚拟文件系统并启动模拟循环。@param {*} wasmData @param {*} threadData */
    initModule(wasmData, threadData) {
        if (typeof window.EJS_Runtime !== "function") {
            console.warn("EJS_Runtime is not defined!");
            this.startGameError(this.localization("Error loading EmulatorJS runtime"));
            throw new Error("EJS_Runtime is not defined!");
        }
        window.EJS_Runtime({
            noInitialRun: true,
            onRuntimeInitialized: null,
            arguments: [],
            preRun: [],
            postRun: [],
            canvas: this.canvas,
            callbacks: {},
            parent: this.elements.parent,
            print: (msg) => {
                if (this.debug) {
                    console.log(msg);
                }
            },
            printErr: (msg) => {
                if (this.debug) {
                    console.log(msg);
                }
            },
            totalDependencies: 0,
            locateFile: function (fileName) {
                if (this.debug) console.log(fileName);
                if (fileName.endsWith(".wasm")) {
                    return URL.createObjectURL(new Blob([wasmData], { type: "application/wasm" }));
                } else if (fileName.endsWith(".worker.js")) {
                    return URL.createObjectURL(new Blob([threadData], { type: "application/javascript" }));
                }
            },
            getSavExt: () => {
                if (this.saveFileExt) {
                    return "." + this.saveFileExt;
                }
                return ".srm";
            },
            getInputText: (options) => {
                return this.showInputPrompt(options);
            }
        }).then(module => {
            this.Module = module;
            this.downloadFiles();
        }).catch(e => {
            console.warn(e);
            this.startGameError(this.localization("Failed to start game"));
        });
    }
    /** 启动游戏主流程：挂载文件系统 → 加载存档 → 设置着色器 → 写入配置文件 → 启动 WASM 主循环。 */
    startGame() {
        try {
            const args = [];
            if (this.debug) args.push("-v");
            args.push("/" + this.fileName);
            if (this.debug) console.log(args);
            this.Module.callMain(args);
            if (typeof this.config.softLoad === "number" && this.config.softLoad > 0) {
                this.resetTimeout = setTimeout(() => {
                    this.gameManager.restart();
                }, this.config.softLoad * 1000);
            }
            this.Module.resumeMainLoop();
            this.checkSupportedOpts();
            this.setupDisksMenu();
            // hide the disks menu if the disk count is not greater than 1
            if (!(this.gameManager.getDiskCount() > 1)) {
                this.diskParent.style.display = "none";
            }
            this.setupSettingsMenu();
            this.loadSettings();
            this.updateCheatUI();
            this.updateGamepadLabels();
            if (!this.muted) this.setVolume(this.volume);
            if (this.config.noAutoFocus !== true) this.elements.parent.focus();
            this.textElem.remove();
            this.textElem = null;
            this.game.classList.remove("ejs-game");
            this.game.classList.add("ejs-canvas_parent");
            this.game.appendChild(this.canvas);
            this.handleResize();
            this.started = true;
            this.paused = false;
            if (this.touch) {
                this.virtualGamepad.style.display = "";
            }
            this.handleResize();
            if (this.config.fullscreenOnLoad) {
                try {
                    this.toggleFullscreen(true);
                } catch(e) {
                    if (this.debug) console.warn("Could not fullscreen on load");
                }
            }
            this.menu.open();
            if (this.isSafari && this.isMobile) {
                //Safari is --- funny
                this.checkStarted();
            }

            // debug list directory structure
            if (this.debug && this.gameManager && this.gameManager.FS) {
                console.log("File system directory");
                this.gameManager.listDir("/");
            }
        } catch(e) {
            console.warn("Failed to start game", e);
            this.startGameError(this.localization("Failed to start game"));
            this.callEvent("exit");
            return;
        }
        this.callEvent("start");
    }
    checkStarted() {
        (async () => {
            let sleep = (ms) => new Promise<any>(r => setTimeout(r, ms));
            let state = "suspended";
            let popup;
            while (state === "suspended") {
                if (!this.Module.AL) return;
                this.Module.AL.currentCtx.sources.forEach(ctx => {
                    state = ctx.gain.context.state;
                });
                if (state !== "suspended") break;
                if (!popup) {
                    popup = this.createPopup("", {});
                    const button = this.createElement("button");
                    button.innerText = this.localization("Click to resume Emulator");
                    button.classList.add("ejs-menu_button");
                    button.style.width = "25%";
                    button.style.height = "25%";
                    popup.appendChild(button);
                    popup.style["text-align"] = "center";
                    popup.style["font-size"] = "28px";
                }
                await sleep(10);
            }
            if (popup) this.closePopup();
        })();
    }
    bindListeners() {
        this.createContextMenu();
        this.createBottomMenuBar();
        this.createControlSettingMenu();
        this.createCheatsMenu();
        this.setVirtualGamepad();
        this.addEventListener(this.elements.parent, "keydown keyup", this.keyChange.bind(this));
        this.addEventListener(this.elements.parent, "mousedown touchstart", (e) => {
            if (document.activeElement !== this.elements.parent && this.config.noAutoFocus !== true) this.elements.parent.focus();
        })
        this.addEventListener(window, "resize", this.handleResize.bind(this));
        this.addEventListener(window, "blur", () => this.stopAllAutofire());

        let counter = 0;
        this.elements.statePopupPanel = this.createPopup("", {}, true);
        this.elements.statePopupPanel.innerText = this.localization("Drop save state here to load");
        this.elements.statePopupPanel.style["text-align"] = "center";
        this.elements.statePopupPanel.style["font-size"] = "28px";

        //to fix a funny apple bug
        this.addEventListener(window, "webkitfullscreenchange mozfullscreenchange fullscreenchange MSFullscreenChange", () => {
            setTimeout(() => {
                this.handleResize.bind(this);
                if (this.config.noAutoFocus !== true) this.elements.parent.focus();
            }, 0);
        });
        this.addEventListener(window, "beforeunload", (e) => {
            if (this.config.disableAutoUnload) {
                e.preventDefault();
                e.returnValue = "";
                return
            } 
            if (!this.started) return;
            this.callEvent("exit");
        });
        this.addEventListener(this.elements.parent, "dragenter", (e) => {
            e.preventDefault();
            if (!this.started) return;
            counter++;
            this.elements.statePopupPanel.parentElement.style.display = "block";
        });
        this.addEventListener(this.elements.parent, "dragover", (e) => {
            e.preventDefault();
        });
        this.addEventListener(this.elements.parent, "dragleave", (e) => {
            e.preventDefault();
            if (!this.started) return;
            counter--;
            if (counter === 0) {
                this.elements.statePopupPanel.parentElement.style.display = "none";
            }
        });
        this.addEventListener(this.elements.parent, "dragend", (e) => {
            e.preventDefault();
            if (!this.started) return;
            counter = 0;
            this.elements.statePopupPanel.parentElement.style.display = "none";
        });

        this.addEventListener(this.elements.parent, "drop", (e) => {
            e.preventDefault();
            if (!this.started) return;
            this.elements.statePopupPanel.parentElement.style.display = "none";
            counter = 0;
            const items = e.dataTransfer.items;
            let file;
            for (let i = 0; i < items.length; i++) {
                if (items[i].kind !== "file") continue;
                file = items[i];
                break;
            }
            if (!file) return;
            const fileHandle = file.getAsFile();
            fileHandle.arrayBuffer().then(data => {
                this.gameManager.loadState(new Uint8Array(data));
            })
        });

        this.gamepad = new GamepadHandler(); //https://github.com/ethanaobrien/Gamepad
        this.gamepad.on("connected", (e) => {
            if (!this.gamepadLabels) return;
            for (let i = 0; i < this.gamepadSelection.length; i++) {
                if (this.gamepadSelection[i] === "") {
                    this.gamepadSelection[i] = this.gamepad.gamepads[e.gamepadIndex].id + "_" + this.gamepad.gamepads[e.gamepadIndex].index;
                    break;
                }
            }
            this.updateGamepadLabels();
        })
        this.gamepad.on("disconnected", (e) => {
            const gamepadIndex = this.gamepad.gamepads.indexOf(this.gamepad.gamepads.find(f => f.index == e.gamepadIndex));
            const gamepadSelection = this.gamepad.gamepads[gamepadIndex].id + "_" + this.gamepad.gamepads[gamepadIndex].index;
            for (let i = 0; i < this.gamepadSelection.length; i++) {
                if (this.gamepadSelection[i] === gamepadSelection) {
                    this.gamepadSelection[i] = "";
                }
            }
            setTimeout(this.updateGamepadLabels.bind(this), 10);
        })
        this.gamepad.on("axischanged", this.gamepadEvent.bind(this));
        this.gamepad.on("buttondown", this.gamepadEvent.bind(this));
        this.gamepad.on("buttonup", this.gamepadEvent.bind(this));
    }
    checkSupportedOpts() {
        if (!this.gameManager.supportsStates()) {
            this.elements.bottomBar.saveState[0].style.display = "none";
            this.elements.bottomBar.loadState[0].style.display = "none";
            this.elements.bottomBar.netplay[0].style.display = "none";
            this.elements.contextMenu.save.style.display = "none";
            this.elements.contextMenu.load.style.display = "none";
        }
        if (typeof this.config.gameId !== "number" || !this.config.netplayUrl || this.netplayEnabled === false) {
            this.elements.bottomBar.netplay[0].style.display = "none";
        }
    }
    updateGamepadLabels() {
        for (let i = 0; i < this.gamepadLabels.length; i++) {
            this.gamepadLabels[i].innerHTML = ""
            const def = this.createElement("option");
            def.setAttribute("value", "notconnected");
            def.innerText = "Not Connected";
            this.gamepadLabels[i].appendChild(def);
            for (let j = 0; j < this.gamepad.gamepads.length; j++) {
                const opt = this.createElement("option");
                opt.setAttribute("value", this.gamepad.gamepads[j].id + "_" + this.gamepad.gamepads[j].index);
                opt.innerText = this.gamepad.gamepads[j].id + "_" + this.gamepad.gamepads[j].index;
                this.gamepadLabels[i].appendChild(opt);
            }
            this.gamepadLabels[i].value = this.gamepadSelection[i] || "notconnected";
        }
    }
    createLink(elem, link, text, useP) {
        return createLink(this, elem, link, text, useP);
    }
    buildButtonOptions(buttonUserOpts) {
        return buildButtonOptions(this, buttonUserOpts);
    }
    createContextMenu() {
        return createContextMenuFn(this);
    }
    closePopup() {
        if (this.currentPopup !== null) {
            try {
                this.currentPopup.remove();
            } catch(e) {}
            this.currentPopup = null;
        }
    }
    //creates a full box popup.
    createPopup(popupTitle, buttons, hidden) {
        return createPopup(this, popupTitle, buttons, hidden);
    }
    showInputPrompt(opts) {
        return showInputPrompt(this, opts);
    }
    selectFile() {
        return new Promise<any>((resolve, reject) => {
            const file = this.createElement("input");
            file.type = "file";
            this.addEventListener(file, "change", (e) => {
                resolve(e.target.files[0]);
            })
            file.click();
        })
    }
    isPopupOpen() {
        return (this.cheatMenu && this.cheatMenu.style.display !== "none") ||
               (this.netplay && this.netplay.isMenuOpen()) ||
               (this.controlMenu && this.controlMenu.style.display !== "none") ||
               this.currentPopup !== null;
    }
    isChild(first, second) {
        if (!first || !second) return false;
        const adown = first.nodeType === 9 ? first.documentElement : first;

        if (first === second) return true;

        if (adown.contains) {
            return adown.contains(second);
        }

        return first.compareDocumentPosition && first.compareDocumentPosition(second) & 16;
    }
    createBottomMenuBar() {
        return createBottomMenuBarFn(this);
    }
    openCacheMenu() {
        return openCacheMenuFn(this);
    }

    populateCacheList(tbody, getSize, getTypeName) {
        return populateCacheListFn(this, tbody, getSize, getTypeName);
    }

    getControlScheme() {
        if (this.config.controlScheme && typeof this.config.controlScheme === "string") {
            return this.config.controlScheme;
        } else {
            return this.getCore(true);
        }
    }
    createControlSettingMenu() {
        return createControlSettingMenuFn(this);
    }
    initControlVars() {
        return initControlVarsFn(this);
    }
    setupKeys() {
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 30; j++) {
                if (this.controls[i][j]) {
                    this.controls[i][j].value = parseInt(this.keyLookup(this.controls[i][j].value));
                    if (this.controls[i][j].value === -1 && this.debug) {
                        delete this.controls[i][j].value;
                        if (this.debug) console.warn("Invalid key for control " + j + " player " + i);
                    }
                }
            }
        }
    }
    keyLookup(controllerkey) {
        return inputKeyLookup(this, controllerkey);
    }
    getAutofireInterval(playerIndex, buttonIndex) {
        return getAutofireInterval(this, playerIndex, buttonIndex);
    }
    isAutofireEnabled(playerIndex, buttonIndex) {
        return isAutofireEnabled(this, playerIndex, buttonIndex);
    }
    startAutofire(playerIndex, buttonIndex, inputValue) {
        return startAutofire(this, playerIndex, buttonIndex, inputValue);
    }
    stopAutofire(playerIndex, buttonIndex) {
        return stopAutofire(this, playerIndex, buttonIndex);
    }
    stopAllAutofire() {
        return stopAllAutofire(this);
    }
    keyChange(e) {
        return inputKeyChange(this, e);
    }
    gamepadEvent(e) {
        return inputGamepadEvent(this, e);
    }
    setVirtualGamepad() {
        return setVirtualGamepadFn(this);
    }
    handleResize() {
        if (this.virtualGamepad) {
            if (this.virtualGamepad.style.display === "none") {
                this.virtualGamepad.style.opacity = 0;
                this.virtualGamepad.style.display = "";
                setTimeout(() => {
                    this.virtualGamepad.style.display = "none";
                    this.virtualGamepad.style.opacity = "";
                }, 250)
            }
        }
        const positionInfo = this.elements.parent.getBoundingClientRect();
        this.game.parentElement.classList.toggle("ejs-small_screen", positionInfo.width <= 575);
        //This wouldnt work using :not()... strange.
        this.game.parentElement.classList.toggle("ejs-big_screen", positionInfo.width > 575);

        if (!this.handleSettingsResize) return;
        this.handleSettingsResize();
    }
    getElementSize(element) {
        let elem = element.cloneNode(true);
        elem.style.position = "absolute";
        elem.style.opacity = 0;
        elem.removeAttribute("hidden");
        element.parentNode.appendChild(elem);
        const res = elem.getBoundingClientRect();
        elem.remove();
        return {
            "width": res.width,
            "height": res.height
        };
    }
    /** 将当前设置、手柄映射和金手指持久化到 localStorage。 */
    saveSettings() {
        if (!window.localStorage || this.config.disableLocalStorage || !this.settingsLoaded) return;
        if (!this.started && !this.failedToStart) return;
        const coreSpecific = {
            controlSettings: this.controls,
            settings: this.settings,
            cheats: this.cheats
        }
        const ejs_settings = {
            volume: this.volume,
            muted: this.muted
        }
        localStorage.setItem("ejs-settings", JSON.stringify(ejs_settings));
        localStorage.setItem(this.getLocalStorageKey(), JSON.stringify(coreSpecific));
    }
    getLocalStorageKey() {
        let identifier = (this.config.gameId || 1) + "-" + this.getCore(true);
        if (typeof this.config.gameName === "string") {
            identifier += "-" + this.config.gameName;
        } else if (typeof this.config.gameUrl === "string" && !this.config.gameUrl.toLowerCase().startsWith("blob:")) {
            identifier += "-" + this.config.gameUrl;
        } else if (this.config.gameUrl instanceof File) {
            identifier += "-" + this.config.gameUrl.name;
        } else if (typeof this.config.gameId !== "number") {
            console.warn("gameId (EJS_gameID) is not set. This may result in settings persisting across games.");
        }
        return "ejs-" + identifier + "-settings";
    }
    preGetSetting(setting) {
        return preGetSettingFn(this, setting);
    }
    getCoreSettings() {
        if (!window.localStorage || this.config.disableLocalStorage) {
            if (this.config.defaultOptions) {
                let rv = "";
                for (const k in this.config.defaultOptions) {
                    let value = isNaN(this.config.defaultOptions[k]) ? `"${this.config.defaultOptions[k]}"` : this.config.defaultOptions[k];
                    rv += `${k} = ${value}\n`;
                }
                return rv;
            }
            return "";
        };
        let coreSpecific = localStorage.getItem(this.getLocalStorageKey());
        if (coreSpecific) {
            try {
                coreSpecific = JSON.parse(coreSpecific);
                if (!(coreSpecific.settings instanceof Object)) throw new Error("Not a JSON object");
                let rv = "";
                for (const k in coreSpecific.settings) {
                    let value = isNaN(coreSpecific.settings[k]) ? `"${coreSpecific.settings[k]}"` : coreSpecific.settings[k];
                    rv += `${k} = ${value}\n`;
                }
                for (const k in this.config.defaultOptions) {
                    if (rv.includes(k)) continue;
                    let value = isNaN(this.config.defaultOptions[k]) ? `"${this.config.defaultOptions[k]}"` : this.config.defaultOptions[k];
                    rv += `${k} = ${value}\n`;
                }
                return rv;
            } catch(e) {
                console.warn("Could not load previous settings", e);
            }
        }
        return "";
    }
    /** 从 localStorage 恢复设置、手柄映射和金手指，并更新 UI。 */
    loadSettings() {
        if (!window.localStorage || this.config.disableLocalStorage) return;
        this.settingsLoaded = true;
        let ejs_settings = localStorage.getItem("ejs-settings");
        let coreSpecific = localStorage.getItem(this.getLocalStorageKey());
        if (coreSpecific) {
            try {
                coreSpecific = JSON.parse(coreSpecific);
                if (!(coreSpecific.controlSettings instanceof Object) || !(coreSpecific.settings instanceof Object) || !Array.isArray(coreSpecific.cheats)) return;
                this.controls = coreSpecific.controlSettings;
                this.checkGamepadInputs();
                for (const k in coreSpecific.settings) {
                    this.changeSettingOption(k, coreSpecific.settings[k]);
                }
                for (let i = 0; i < coreSpecific.cheats.length; i++) {
                    const cheat = coreSpecific.cheats[i];
                    let includes = false;
                    for (let j = 0; j < this.cheats.length; j++) {
                        if (this.cheats[j].desc === cheat.desc && this.cheats[j].code === cheat.code) {
                            this.cheats[j].checked = cheat.checked;
                            includes = true;
                            break;
                        }
                    }
                    if (includes) continue;
                    this.cheats.push(cheat);
                }

            } catch(e) {
                console.warn("Could not load previous settings", e);
            }
        }
        if (ejs_settings) {
            try {
                ejs_settings = JSON.parse(ejs_settings);
                if (typeof ejs_settings.volume !== "number" || typeof ejs_settings.muted !== "boolean") return;
                this.volume = ejs_settings.volume;
                this.muted = ejs_settings.muted;
                this.setVolume(this.muted ? 0 : this.volume);
            } catch(e) {
                console.warn("Could not load previous settings", e);
            }
        }
    }
    /** 处理特殊设置选项的分发（快进/慢动作/倒带/视频旋转/鼠标锁定/光枪等）。@param {string} option @param {string} value */
    handleSpecialOptions(option, value) {
        if (option === "shader") {
            this.enableShader(value);
        } else if (option === "disk") {
            this.gameManager.setCurrentDisk(value);
        } else if (option === "virtual-gamepad") {
            this.toggleVirtualGamepad(value !== "disabled");
        } else if (option === "menu-bar-button") {
            this.elements.menuToggle.style.display = "";
            this.elements.menuToggle.style.opacity = value === "visible" ? 0.5 : 0;
        } else if (option === "virtual-gamepad-left-handed-mode") {
            this.toggleVirtualGamepadLeftHanded(value !== "disabled");
        } else if (option === "ff-ratio") {
            if (this.isFastForward) this.gameManager.toggleFastForward(0);
            if (value === "unlimited") {
                this.gameManager.setFastForwardRatio(0);
            } else if (!isNaN(value)) {
                this.gameManager.setFastForwardRatio(parseFloat(value));
            }
            setTimeout(() => {
                if (this.isFastForward) this.gameManager.toggleFastForward(1);
            }, 10)
        } else if (option === "fastForward") {
            if (value === "enabled") {
                this.isFastForward = true;
                this.gameManager.toggleFastForward(1);
            } else if (value === "disabled") {
                this.isFastForward = false;
                this.gameManager.toggleFastForward(0);
            }
        } else if (option === "sm-ratio") {
            if (this.isSlowMotion) this.gameManager.toggleSlowMotion(0);
            this.gameManager.setSlowMotionRatio(parseFloat(value));
            setTimeout(() => {
                if (this.isSlowMotion) this.gameManager.toggleSlowMotion(1);
            }, 10);
        } else if (option === "slowMotion") {
            if (value === "enabled") {
                this.isSlowMotion = true;
                this.gameManager.toggleSlowMotion(1);
            } else if (value === "disabled") {
                this.isSlowMotion = false;
                this.gameManager.toggleSlowMotion(0);
            }
        } else if (option === "rewind-granularity") {
            if (this.rewindEnabled) {
                this.gameManager.setRewindGranularity(parseInt(value));
            }
        } else if (option === "vsync") {
            this.gameManager.setVSync(value === "enabled");
        } else if (option === "videoRotation") {
            value = parseInt(value);
            if (this.videoRotationChanged === true || value !== 0) {
                this.gameManager.setVideoRotation(value);
                this.videoRotationChanged = true;
            } else if (this.videoRotationChanged === true && value === 0) {
                this.gameManager.setVideoRotation(0);
                this.videoRotationChanged = true;
            }
        } else if (option === "save-save-interval" && !this.config.fixedSaveInterval) {
            value = parseInt(value);
            this.startSaveInterval(value * 1000);
        } else if (option === "menubarBehavior") {
            this.createBottomMenuBarListeners();
        } else if (option === "keyboardInput") {
            this.gameManager.setKeyboardEnabled(value === "enabled");
        } else if (option === "altKeyboardInput") {
            this.gameManager.setAltKeyEnabled(value === "enabled");
        } else if (option === "lockMouse") {
            this.enableMouseLock = (value === "enabled");
        } else if (option === "autofireInterval") {
            this.defaultAutoFireInterval = parseInt(value);
        } else if (option.startsWith("controller-port-device-p")) {
            const port = parseInt(option.replace("controller-port-device-p", "")) - 1;
            const deviceId = parseInt(value);
            this.gameManager.setControllerPortDevice(port, deviceId);
            /* RETRO_DEVICE_LIGHTGUN = 4; subclass mask = 0xFF */
            const isLightgun = (deviceId & 0xFF) === 4;
            if (isLightgun) {
                this.lightgunActive = true;
            } else {
                /* Re-check all ports */
                this.lightgunActive = false;
                for (const k in this.allSettings) {
                    if (k.startsWith("controller-port-device-p")) {
                        const v = parseInt(this.allSettings[k]);
                        if ((v & 0xFF) === 4) this.lightgunActive = true;
                    }
                }
            }
            if (this.canvas) {
                this.canvas.style.cursor = this.lightgunActive ? "none" : "";
            }
        }
    }
    menuOptionChanged(option, value) {
        return menuOptionChangedFn(this, option, value);
    }
    setupDisksMenu() {
        return setupDisksMenuFn(this);
    }
    getSettingValue(id) {
        return getSettingValueFn(this, id);
    }
    setupSettingsMenu() {
        return setupSettingsMenuFn(this);
    }
    createSubPopup(hidden) {
        return createSubPopup(this, hidden);
    }
    createCheatsMenu() {
        return createCheatsMenuFn(this);
    }
    updateCheatUI() {
        if (!this.gameManager) return;
        this.elements.cheatRows.innerHTML = "";

        const addToMenu = (desc, checked, code, is_permanent, i) => {
            const row = this.createElement("div");
            row.classList.add("ejs-cheat_row");
            const input = this.createElement("input");
            input.type = "checkbox";
            input.checked = checked;
            input.value = i;
            input.id = "ejs_cheat_switch_" + i;
            row.appendChild(input);
            const label = this.createElement("label");
            label.for = "ejs_cheat_switch_" + i;
            label.innerText = desc;
            row.appendChild(label);
            label.addEventListener("click", (e) => {
                input.checked = !input.checked;
                this.cheats[i].checked = input.checked;
                this.cheatChanged(input.checked, code, i);
                this.saveSettings();
            });
            if (!is_permanent) {
                const close = this.createElement("a");
                close.classList.add("ejs-cheat_row_button");
                close.innerText = "×";
                row.appendChild(close);
                close.addEventListener("click", (e) => {
                    this.cheatChanged(false, code, i);
                    this.cheats.splice(i, 1);
                    this.updateCheatUI();
                    this.saveSettings();
                });
            }
            this.elements.cheatRows.appendChild(row);
            this.cheatChanged(checked, code, i);
        };
        this.gameManager.resetCheat();
        for (let i = 0; i < this.cheats.length; i++) {
            addToMenu(
                this.cheats[i].desc,
                this.cheats[i].checked,
                this.cheats[i].code,
                this.cheats[i].is_permanent,
                i,
            );
        }
    }
    cheatChanged(checked, code, index) {
        if (!this.gameManager) return;
        this.gameManager.setCheat(index, checked, code);
    }

    enableShader(name) {
        if (!this.gameManager) return;
        try {
            this.Module.FS.unlink("/shader/shader.glslp");
        } catch(e) {}

        if (name === "disabled" || !this.shaders[name]) {
            this.gameManager.toggleShader(0);
            return;
        }

        const shaderConfig = this.shaders[name];

        if (typeof shaderConfig === "string") {
            this.Module.FS.writeFile("/shader/shader.glslp", shaderConfig, {}, "w+");
        } else {
            const shader = shaderConfig.shader;
            this.Module.FS.writeFile("/shader/shader.glslp", shader.type === "base64" ? atob(shader.value) : shader.value, {}, "w+");
            if (Array.isArray(shaderConfig.resources)) {
                shaderConfig.resources.forEach(resource => {
                    this.Module.FS.writeFile(`/shader/${resource.name}`, resource.type === "base64" ? atob(resource.value) : resource.value, {}, "w+");
                });
            }
        }

        this.gameManager.toggleShader(1);
    }

    screenshot(callback, source, format, upscale) {
        return screenshotFn(this, callback, source, format, upscale);
    }

    takeScreenshot(source, format, upscale) {
        return takeScreenshotFn(this, source, format, upscale);
    }

    collectScreenRecordingMediaTracks(canvasEl, fps) {
        let videoTrack = null;
        const videoTracks = canvasEl.captureStream(fps).getVideoTracks();
        if (videoTracks.length !== 0) {
            videoTrack = videoTracks[0];
        } else {
            if (this.debug) console.error("Unable to capture video stream");
            return null;
        }

        let audioTrack = null;
        if (this.Module.AL && this.Module.AL.currentCtx && this.Module.AL.currentCtx.audioCtx) {
            const alContext = this.Module.AL.currentCtx;
            const audioContext = alContext.audioCtx;

            const gainNodes = [];
            for (let sourceIdx in alContext.sources) {
                gainNodes.push(alContext.sources[sourceIdx].gain);
            }

            const merger = audioContext.createChannelMerger(gainNodes.length);
            gainNodes.forEach(node => node.connect(merger));

            const destination = audioContext.createMediaStreamDestination();
            merger.connect(destination);

            const audioTracks = destination.stream.getAudioTracks();
            if (audioTracks.length !== 0) {
                audioTrack = audioTracks[0];
            }
        }

        const stream = new MediaStream();
        if (videoTrack && videoTrack.readyState === "live") {
            stream.addTrack(videoTrack);
        }
        if (audioTrack && audioTrack.readyState === "live") {
            stream.addTrack(audioTrack);
        }
        return stream;
    }

    screenRecord() {
        const captureFps = this.getSettingValue("screenRecordingFPS") || this.capture.video.fps;
        const captureFormat = this.getSettingValue("screenRecordFormat") || this.capture.video.format;
        const captureUpscale = this.getSettingValue("screenRecordUpscale") || this.capture.video.upscale;
        const captureVideoBitrate = this.getSettingValue("screenRecordVideoBitrate") || this.capture.video.videoBitrate;
        const captureAudioBitrate = this.getSettingValue("screenRecordAudioBitrate") || this.capture.video.audioBitrate;
        const aspectRatio = this.gameManager.getVideoDimensions("aspect") || 1.333333;
        const videoRotation = parseInt(this.getSettingValue("videoRotation") || 0);
        const videoTurned = (videoRotation === 1 || videoRotation === 3);
        let width = 800;
        let height = 600;
        let frameAspect = this.canvas.width / this.canvas.height;
        let canvasAspect = width / height;
        let offsetX = 0;
        let offsetY = 0;

        const captureCanvas = document.createElement("canvas");
        const captureCtx = captureCanvas.getContext("2d", { alpha: false });
        captureCtx.fillStyle = "#000";
        captureCtx.imageSmoothingEnabled = false;
        const updateSize = () => {
            width = this.canvas.width;
            height = this.canvas.height;
            frameAspect = width / height
            if (width >= height && !videoTurned) {
                width = height * aspectRatio;
            } else if (width < height && !videoTurned) {
                height = width / aspectRatio;
            } else if (width >= height && videoTurned) {
                width = height * (1/aspectRatio);
            } else if (width < height && videoTurned) {
                width = height / (1/aspectRatio);
            }
            canvasAspect = width / height;
            captureCanvas.width = width * captureUpscale;
            captureCanvas.height = height * captureUpscale;
            captureCtx.scale(captureUpscale, captureUpscale);
            if (frameAspect > canvasAspect) {
                offsetX = (this.canvas.width - width) / -2;
            } else if (frameAspect < canvasAspect) {
                offsetY = (this.canvas.height - height) / -2;
            }
        }
        updateSize();
        this.addEventListener(this.canvas, "resize", () => {
            updateSize();
        });

        let animation = true;

        const drawNextFrame = () => {
            captureCtx.drawImage(this.canvas, offsetX, offsetY, this.canvas.width, this.canvas.height);
            if (animation) {
                requestAnimationFrame(drawNextFrame);
            }
        };
        requestAnimationFrame(drawNextFrame);

        const chunks = [];
        const tracks = this.collectScreenRecordingMediaTracks(captureCanvas, captureFps);
        const recorder = new MediaRecorder(tracks, {
            videoBitsPerSecond: captureVideoBitrate,
            audioBitsPerSecond: captureAudioBitrate,
            mimeType: "video/" + captureFormat
        });
        recorder.addEventListener("dataavailable", e => {
            chunks.push(e.data);
        });
        recorder.addEventListener("stop", () => {
            const blob = new Blob(chunks);
            const url = URL.createObjectURL(blob);
            const date = new Date();
            const a = document.createElement("a");
            a.href = url;
            a.download = this.getBaseFileName() + "-" + date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear() + "." + captureFormat;
            a.click();

            animation = false;
            captureCanvas.remove();
        });
        recorder.start();

        return recorder;
    }

    enableSaveUpdateEvent() {
        function withGameSaveHash(saveFile, callback) {
            if (saveFile) {
                cyrb53(saveFile).then(digest => callback(digest, saveFile));
            } else {
                console.warn("Save file not found when attempting to hash");
                callback(null, null);
            }
        }

        var recentHash = null;
        if (this.gameManager) { withGameSaveHash(this.gameManager.getSaveFile(false), (hash, _) => { recentHash = hash }) }

        this.on("saveSaveFiles", saveFile => {
            withGameSaveHash(saveFile, (newHash, fileContents) => {
                if (newHash && fileContents && newHash !== recentHash) {
                    recentHash = newHash;
                    this.takeScreenshot(this.capture.photo.source, this.capture.photo.format, this.capture.photo.upscale).then(({ screenshot, format }) => {
                        this.callEvent("saveUpdate", {
                            hash: newHash,
                            save: fileContents,
                            screenshot: screenshot,
                            format: format
                        });
                    })
                }
            })
        })
    }
}

export default EmulatorJS;
