// [core/setup.ts] 初始化设置
// 职责：启动时的初始化配置、已弃用配置项检查与迁移提示
// 不负责：运行时配置读写（由 core/config.js 处理）

import { EJS_SHADERS } from "../engine/shaders.js";

class EJS_SETUP {
    EJS: any;
    debug: boolean;

    constructor(EJS: any) {
        this.EJS = EJS;
        this.debug = this.EJS.debug;
    }
    log(...args: any[]) {
        if (!this.debug) return;
        console.log.apply(console, ["[EJS_SETUP]", ...args]);
    }
    checkDeprecatedSettings() {
        if (!this.debug) return;
        this.log("Checking Deprecated Settings");
        const config = this.EJS.config;
        if (config.cacheLimit) {
            console.warn("EJS_cacheLimit is deprecated and support may be removed in a future release. Please use EJS_cacheConfig instead.");
        }
    }
    cacheDefaults() {
        this.log("Setting Cache Defaults");
        const config = this.EJS.config;
        const cacheConfigDefaults = {
            enabled: true,
            cacheMaxSizeMB: 4096,
            cacheMaxAgeMins: 7200
        };

        // cacheLimit is deprecated but if it's set, use it to configure the cache - value is an integer representing bytes
        // if both cacheLimit and cacheConfig are set - cacheConfig should win
        // regardless of configuration, cacheLimit should display a deprecation notice if set
        if (config.cacheLimit) {
            // set the default for cacheConfig to match cacheLimit
            cacheConfigDefaults.cacheMaxSizeMB = Math.floor(config.cacheLimit / 1048576);
        }

        // Overwrite invalid or missing values in config.cacheConfig with defaults
        if (config.cacheConfig === undefined || typeof config.cacheConfig !== "object") {
            config.cacheConfig = cacheConfigDefaults;
        } else {
            if (!config.cacheConfig || typeof config.cacheConfig !== "object") {
                config.cacheConfig = {};
            }
            if (typeof config.cacheConfig.enabled !== "boolean") {
                config.cacheConfig.enabled = cacheConfigDefaults.enabled;
            }
            if (typeof config.cacheConfig.cacheMaxSizeMB !== "number" || config.cacheConfig.cacheMaxSizeMB <= 0) {
                config.cacheConfig.cacheMaxSizeMB = cacheConfigDefaults.cacheMaxSizeMB;
            }
            if (typeof config.cacheConfig.cacheMaxAgeMins !== "number" || config.cacheConfig.cacheMaxAgeMins <= 0) {
                config.cacheConfig.cacheMaxAgeMins = cacheConfigDefaults.cacheMaxAgeMins;
            }
        }
    }
    browserMode() {
        this.log("Setting Browser Mode");
        const config = this.EJS.config;
        switch (config.browserMode) {
            case 1: // Force mobile
            case "1":
            case "mobile":
                if (this.debug) { console.log("Force mobile mode is enabled"); }
                config.browserMode = 1;
                break;
            case 2: // Force desktop
            case "2":
            case "desktop":
                if (this.debug) { console.log("Force desktop mode is enabled"); }
                config.browserMode = 2;
                break;
            default: // Auto detect
                config.browserMode = undefined;
        }
    }
    shaders() {
        this.log("Setting shaders");
        const config = this.EJS.config;
        this.EJS.shaders = Object.assign({}, EJS_SHADERS, config.additionalShaders || {});
    }
}

export { EJS_SETUP };
