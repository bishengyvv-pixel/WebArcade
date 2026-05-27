// [ui/popup.js] 弹窗、输入提示、信息展示
// 职责：createPopup、createSubPopup、displayMessage、showInputPrompt 等弹窗相关 UI
// 不负责：弹窗的业务逻辑（由 core/ 层通过回调处理）

import { createElement, addEventListener } from "./dom.js";

export function createPopup(emu, popupTitle, buttons, hidden) {
    if (!hidden) emu.closePopup();
    const popup = createElement("div");
    popup.classList.add("ejs-popup_container");
    emu.elements.parent.appendChild(popup);
    const title = createElement("h4");
    title.innerText = emu.localization(popupTitle);
    const main = createElement("div");
    main.classList.add("ejs-popup_body");

    popup.appendChild(title);
    popup.appendChild(main);

    const padding = createElement("div");
    padding.style["padding-top"] = "10px";
    popup.appendChild(padding);

    for (let k in buttons) {
        const button = createElement("a");
        if (buttons[k] instanceof Function) {
            button.addEventListener("click", (e) => {
                buttons[k]();
                e.preventDefault();
            });
        }
        button.classList.add("ejs-button");
        button.innerText = emu.localization(k);
        popup.appendChild(button);
    }
    if (!hidden) {
        emu.currentPopup = popup;
    } else {
        popup.style.display = "none";
    }

    return main;
}

export function createSubPopup(emu, hidden) {
    const popup = createElement("div");
    popup.classList.add("ejs-popup_container");
    popup.classList.add("ejs-popup_container_box");
    const popupMsg = createElement("div");
    popupMsg.innerText = "";
    if (hidden) popup.setAttribute("hidden", "");
    popup.appendChild(popupMsg);
    return [popup, popupMsg];
}

export function displayMessage(emu, message, time) {
    if (!emu.msgElem) {
        emu.msgElem = createElement("div");
        emu.msgElem.classList.add("ejs-message");
        emu.msgElem.style.zIndex = "6";
        emu.elements.parent.appendChild(emu.msgElem);
    }
    clearTimeout(emu.msgTimeout);
    emu.msgTimeout = setTimeout(() => {
        emu.msgElem.innerText = "";
    }, (typeof time === "number" && time > 0) ? time : 3000);
    emu.msgElem.innerText = message;
}

export function showInputPrompt(emu, opts) {
    opts = opts || {};
    const hint = opts.hint || "Enter text";
    const maxLength = opts.maxLength | 0;
    const password = !!opts.password;
    return new Promise<any>((resolve) => {
        const popups = emu.createSubPopup();
        emu.currentPopup = popups;
        emu.game.appendChild(popups[0]);
        const popup = popups[1];
        popup.classList.add("small_popup");
        popup.style.width = "100%";
        const header = createElement("div");
        const title = createElement("h2");
        title.innerText = emu.localization(hint);
        header.appendChild(title);
        popup.appendChild(header);

        const input = createElement("input");
        input.type = "text";
        input.style.width = "100%";
        popup.appendChild(input);

        const submit = createElement("button");
        submit.classList.add("ejs-button_button");
        submit.classList.add("ejs-popup_submit");
        submit.innerText = emu.localization("Submit");
        popup.appendChild(submit);
        addEventListener(submit, "click", (e) => {
            if (!input.value.trim())
                return;
            popups[0].remove();
            emu.currentPopup = null;
            resolve(input.value.trim());
        });
    });
}
