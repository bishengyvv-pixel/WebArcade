// [core/events.ts] 事件总线
// 职责：on、off、callEvent 事件订阅与发布，作为各层之间的解耦通信通道
// 不负责：具体业务逻辑

export function on(emu, event, func) {
    if (!emu.functions) emu.functions = {};
    if (!Array.isArray(emu.functions[event])) emu.functions[event] = [];
    emu.functions[event].push(func);
}

export function off(emu, event, func) {
    if (!emu.functions || !Array.isArray(emu.functions[event])) return;
    const index = emu.functions[event].indexOf(func);
    if (index > -1) {
        emu.functions[event].splice(index, 1);
    }
}

export function callEvent(emu, event, data) {
    if (!emu.functions) emu.functions = {};
    if (!Array.isArray(emu.functions[event])) return 0;
    emu.functions[event].forEach(e => e(data));
    return emu.functions[event].length;
}
