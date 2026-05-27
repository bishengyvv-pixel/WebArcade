// [input/keyboard.js] 键盘事件与按键映射
// 职责：监听键盘事件、keyLookup 映射、keyChange 状态变更
// 不负责：连发逻辑（由 input/autofire.js 处理）、UI 更新（由 ui/ 层处理）

import { MAX_ANALOG_VALUE } from "../consts.js";

export function keyLookup(emu, controllerkey) {
    if (controllerkey === undefined) return 0;
    if (typeof controllerkey === "number") return controllerkey;
    controllerkey = controllerkey.toString().toLowerCase();
    const values = Object.values(emu.keyMap);
    if (values.includes(controllerkey)) {
        const index = values.indexOf(controllerkey);
        return Object.keys(emu.keyMap)[index];
    }
    return -1;
}

export function keyChange(emu, e) {
    if (e.repeat) return;
    if (!emu.started) return;
    if (emu.controlPopup.parentElement.parentElement.getAttribute("hidden") === null) {
        const num = emu.controlPopup.getAttribute("button-num");
        const player = emu.controlPopup.getAttribute("player-num");
        if (!emu.controls[player][num]) {
            emu.controls[player][num] = {};
        }
        emu.controls[player][num].value = e.keyCode;
        emu.controlPopup.parentElement.parentElement.setAttribute("hidden", "");
        emu.checkGamepadInputs();
        emu.saveSettings();
        return;
    }
    if (emu.settingsMenu.style.display !== "none" || emu.isPopupOpen() || emu.getSettingValue("keyboardInput") === "enabled") return;
    e.preventDefault();
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 30; j++) {
            if (emu.controls[i][j] && emu.controls[i][j].value === e.keyCode) {
                const isAnalog = emu.analogAxes.includes(j);
                const inputValue = isAnalog ? MAX_ANALOG_VALUE : 1;
                const isKeyUp = e.type === "keyup";
                const value = isKeyUp ? 0 : inputValue;

                if (emu.isAutofireEnabled(i, j) && !isAnalog) {
                    isKeyUp ? emu.stopAutofire(i, j) : emu.startAutofire(i, j, inputValue);
                } else {
                    emu.gameManager.simulateInput(i, j, value);
                }
            }
        }
    }
}
