// [input/autofire.js] 连发逻辑
// 职责：startAutofire、stopAutofire、stopAllAutofire、getAutofireInterval、isAutofireEnabled
// 不负责：键盘事件捕获（由 input/keyboard.js 处理）

export function getAutofireInterval(emu, playerIndex, buttonIndex) {
    const control = emu.controls[playerIndex] && emu.controls[playerIndex][buttonIndex];
    if (control && typeof control.autoFireInterval === "number") {
        return control.autoFireInterval;
    }
    const settingValue = emu.getSettingValue("autofireInterval");
    return settingValue ? parseInt(settingValue) : emu.defaultAutoFireInterval;
}

export function isAutofireEnabled(emu, playerIndex, buttonIndex) {
    const control = emu.controls[playerIndex] && emu.controls[playerIndex][buttonIndex];
    return control && control.autofire === true;
}

export function startAutofire(emu, playerIndex, buttonIndex, inputValue) {
    const key = `${playerIndex}-${buttonIndex}`;
    if (emu.autofireIntervals[key]) {
        return;
    }
    let pressed = true;
    const interval = getAutofireInterval(emu, playerIndex, buttonIndex);
    emu.autofireIntervals[key] = setInterval(() => {
        if (emu.paused || !emu.gameManager) return;
        pressed = !pressed;
        emu.gameManager.simulateInput(playerIndex, buttonIndex, pressed ? inputValue : 0);
    }, interval);
}

export function stopAutofire(emu, playerIndex, buttonIndex) {
    const key = `${playerIndex}-${buttonIndex}`;
    if (emu.autofireIntervals[key]) {
        clearInterval(emu.autofireIntervals[key]);
        delete emu.autofireIntervals[key];
        emu.gameManager.simulateInput(playerIndex, buttonIndex, 0);
    }
}

export function stopAllAutofire(emu) {
    for (const key in emu.autofireIntervals) {
        clearInterval(emu.autofireIntervals[key]);
        const [playerIndex, buttonIndex] = key.split("-").map(Number);
        if (emu.gameManager) {
            emu.gameManager.simulateInput(playerIndex, buttonIndex, 0);
        }
    }
    emu.autofireIntervals = {};
}
