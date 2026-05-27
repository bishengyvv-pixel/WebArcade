// [ui/ads.js] 广告层
// 职责：setupAds、adBlocked 等广告相关 UI 构建与展示
// 不负责：广告数据获取与业务逻辑

import { createElement, addEventListener } from "./dom.js";

export function setupAds(emu, ads, width, height) {
    const div = createElement("div");
    const time = (typeof emu.config.adMode === "number" && emu.config.adMode > -1 && emu.config.adMode < 3) ? emu.config.adMode : 2;
    div.classList.add("ejs-ad_iframe");
    const frame = createElement("iframe");
    frame.src = ads;
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("frameborder", "no");
    frame.style.width = width;
    frame.style.height = height;
    const closeParent = createElement("div");
    closeParent.classList.add("ejs-ad_close");
    const closeButton = createElement("a");
    closeParent.appendChild(closeButton);
    closeParent.setAttribute("hidden", "");
    div.appendChild(closeParent);
    div.appendChild(frame);
    if (emu.config.adMode !== 1) {
        emu.elements.parent.appendChild(div);
    }
    addEventListener(closeButton, "click", () => {
        div.remove();
    });

    emu.on("start-clicked", () => {
        if (emu.config.adMode === 0) div.remove();
        if (emu.config.adMode === 1) {
            emu.elements.parent.appendChild(div);
        }
    });

    emu.on("start", () => {
        closeParent.removeAttribute("hidden");
        const time = (typeof emu.config.adTimer === "number" && emu.config.adTimer > 0) ? emu.config.adTimer : 10000;
        if (emu.config.adTimer === -1) div.remove();
        if (emu.config.adTimer === 0) return;
        setTimeout(() => {
            div.remove();
        }, time);
    });
}

export function adBlocked(emu, url, del) {
    if (del) {
        document.querySelector('div[class="ejs-ad_iframe"]').remove();
    } else {
        try {
            document.querySelector('div[class="ejs-ad_iframe"]').remove();
        } catch(e) {}
        emu.config.adUrl = url;
        setupAds(emu, emu.config.adUrl, emu.config.adSize[0], emu.config.adSize[1]);
    }
}
