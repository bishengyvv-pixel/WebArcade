// [core/config.ts] 配置管理
// 职责：getSettingValue、menuOptionChanged、preGetSetting 等配置的读取、验证与持久化
// 不负责：配置 UI 的 DOM 构建（由 ui/menu.js 处理）

export function preGetSetting(emu: any, setting: string): string | null {
    if (window.localStorage && !emu.config.disableLocalStorage) {
        const raw = localStorage.getItem(emu.getLocalStorageKey());
        try {
            const coreSpecific: any = JSON.parse(raw as string);
            if (coreSpecific && coreSpecific.settings) {
                return coreSpecific.settings[setting];
            }
        } catch(e) {
            console.warn("Could not load previous settings", e);
        }
    }
    if (emu.config.defaultOptions && emu.config.defaultOptions[setting]) {
        return emu.config.defaultOptions[setting];
    }
    return null;
}

export function menuOptionChanged(emu: any, option: string, value: string): void {
    emu.saveSettings();
    emu.allSettings[option] = value;
    if (emu.debug) console.log(option, value);
    if (!emu.gameManager) return;
    emu.handleSpecialOptions(option, value);
    emu.gameManager.setVariable(option, value);
    emu.saveSettings();
}

export function getSettingValue(emu: any, id: string): string | null {
    return emu.allSettings[id] || emu.settings[id] || null;
}
