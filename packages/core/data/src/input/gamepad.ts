// [input/gamepad.js] 物理手柄事件
// 职责：Gamepad API 监听、手柄输入映射、gamepadEvent 处理
// 不负责：虚拟手柄 DOM 渲染（由 ui/gamepad.js 处理）

import { MAX_ANALOG_VALUE } from "../consts.js";

export function gamepadEvent(emu, e) {
    if (!emu.started) return;
    const gamepadIndex = emu.gamepadSelection.indexOf(emu.gamepad.gamepads[e.gamepadIndex].id + "_" + emu.gamepad.gamepads[e.gamepadIndex].index);
    if (gamepadIndex < 0) {
        return; // Gamepad not set anywhere
    }

    const toIntValue = (value) => {
        if (value > 0.5 || value < -0.5) {
            return (value > 0) ? 1 : -1;
        } else {
            return 0;
        }
    };

    const value = toIntValue(e.value || 0);
    const oldValue = toIntValue(e.oldValue || 0);
    const skippedZero = (value !== 0) && (value + oldValue === 0);

    if (emu.controlPopup.parentElement.parentElement.getAttribute("hidden") === null) {
        if ("buttonup" === e.type || (e.type === "axischanged" && value === 0)) return;
        const num = emu.controlPopup.getAttribute("button-num");
        const player = parseInt(emu.controlPopup.getAttribute("player-num"));
        if (gamepadIndex !== player) return;
        if (!emu.controls[player][num]) {
            emu.controls[player][num] = {};
        }
        emu.controls[player][num].value2 = e.label;
        emu.controlPopup.parentElement.parentElement.setAttribute("hidden", "");
        emu.checkGamepadInputs();
        emu.saveSettings();
        return;
    }
    if (emu.settingsMenu.style.display !== "none" || emu.isPopupOpen()) return;
    for (let i = 0; i < 4; i++) {
        if (gamepadIndex !== i) continue;
        for (let j = 0; j < 30; j++) {
            if (!emu.controls[i][j] || emu.controls[i][j].value2 === undefined) {
                continue;
            }
            const controlValue = emu.controls[i][j].value2;
            const isAnalog = emu.analogAxes.includes(j);

            if (["buttonup", "buttondown"].includes(e.type) && (controlValue === e.label || controlValue === e.index)) {
                const inputValue = isAnalog ? MAX_ANALOG_VALUE : 1;
                const isButtonUp = e.type === "buttonup";
                const value = isButtonUp ? 0 : inputValue;

                if (emu.isAutofireEnabled(i, j) && !isAnalog) {
                    isButtonUp ? emu.stopAutofire(i, j) : emu.startAutofire(i, j, inputValue);
                } else {
                    emu.gameManager.simulateInput(i, j, value);
                }
            } else if (e.type === "axischanged") {
                if (typeof controlValue === "string" && controlValue.split(":")[0] === e.axis) {
                    if (isAnalog) {
                        if (j === 16 || j === 17) {
                            if (e.value > 0) {
                                emu.gameManager.simulateInput(i, 16, MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 17, 0);
                            } else {
                                emu.gameManager.simulateInput(i, 17, -MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 16, 0);
                            }
                        } else if (j === 18 || j === 19) {
                            if (e.value > 0) {
                                emu.gameManager.simulateInput(i, 18, MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 19, 0);
                            } else {
                                emu.gameManager.simulateInput(i, 19, -MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 18, 0);
                            }
                        } else if (j === 20 || j === 21) {
                            if (e.value > 0) {
                                emu.gameManager.simulateInput(i, 20, MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 21, 0);
                            } else {
                                emu.gameManager.simulateInput(i, 21, -MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 20, 0);
                            }
                        } else if (j === 22 || j === 23) {
                            if (e.value > 0) {
                                emu.gameManager.simulateInput(i, 22, MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 23, 0);
                            } else {
                                emu.gameManager.simulateInput(i, 23, -MAX_ANALOG_VALUE * e.value);
                                emu.gameManager.simulateInput(i, 22, 0);
                            }
                        }
                    } else if (value === 0 || controlValue === e.label || controlValue === `${e.axis}:${value}`) {
                        emu.gameManager.simulateInput(i, j, ((value === 0) ? 0 : 1));
                    } else if (skippedZero) {
                        emu.gameManager.simulateInput(i, j, 0);
                    }
                }
            }
        }
    }
}
