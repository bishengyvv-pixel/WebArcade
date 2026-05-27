// [ui/dom.js] DOM 工具函数
// 职责：提供 createElement、addEventListener、removeEventListener 等基础 DOM 操作封装
// 不负责：具体 UI 组件的构建逻辑（由 ui/menu.js、ui/popup.js 等处理）

export function createElement(type) {
    return document.createElement(type);
}

export function addEventListener(element, listener, callback) {
    const listeners = listener.split(" ");
    let rv = [];
    for (let i = 0; i < listeners.length; i++) {
        element.addEventListener(listeners[i], callback);
        const data = { cb: callback, elem: element, listener: listeners[i] };
        rv.push(data);
    }
    return rv;
}

export function removeEventListener(data) {
    for (let i = 0; i < data.length; i++) {
        data[i].elem.removeEventListener(data[i].listener, data[i].cb);
    }
}
