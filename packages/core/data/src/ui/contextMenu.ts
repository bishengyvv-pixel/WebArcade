import { EJS_license } from "../engine/license.js";
// [ui/contextMenu.js] 右键菜单\n// 职责：构建右键上下文菜单 DOM（存档/截图/暂停等功能按钮）\n// 不负责：菜单项的具体功能实现（由核心方法处理）

export function createContextMenu(emu) {
        emu.elements.contextmenu = emu.createElement("div");
        emu.elements.contextmenu.classList.add("ejs-context_menu");
        emu.addEventListener(emu.game, "contextmenu", (e) => {
            e.preventDefault();
            if ((emu.config.buttonOpts && emu.config.buttonOpts.rightClick === false) || !emu.started || emu.lightgunActive) return;
            const parentRect = emu.elements.parent.getBoundingClientRect();
            emu.elements.contextmenu.style.display = "block";
            const rect = emu.elements.contextmenu.getBoundingClientRect();
            const up = e.offsetY + rect.height > parentRect.height - 25;
            const left = e.offsetX + rect.width > parentRect.width - 5;
            emu.elements.contextmenu.style.left = (e.offsetX - (left ? rect.width : 0)) + "px";
            emu.elements.contextmenu.style.top = (e.offsetY - (up ? rect.height : 0)) + "px";
        })
        const hideMenu = () => {
            emu.elements.contextmenu.style.display = "none";
        }
        emu.addEventListener(emu.elements.contextmenu, "contextmenu", (e) => e.preventDefault());
        emu.addEventListener(emu.elements.parent, "contextmenu", (e) => e.preventDefault());
        emu.addEventListener(emu.game, "mousedown touchend", hideMenu);
        // Prevent mouse buttons 4/5 (back/forward) from navigating away
        // when used as lightgun Start/Select. Works in Chromium-based
        // browsers; Firefox handles back/forward navigation before page
        // event handlers fire, so this has no effect there.
        // See: https://support.mozilla.org/en-US/questions/1319892
        for (const evtName of ["mousedown", "mouseup", "auxclick"]) {
            emu.addEventListener(emu.game, evtName, (e) => {
                if (emu.lightgunActive && (e.button === 3 || e.button === 4)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
        const parent = emu.createElement("ul");
        const addButton = (title, hidden, functi0n) => {
            //<li><a href="#" onclick="return false">'+title+'</a></li>
            const li = emu.createElement("li");
            if (hidden) li.hidden = true;
            const a = emu.createElement("a");
            if (functi0n instanceof Function) {
                emu.addEventListener(li, "click", (e) => {
                    e.preventDefault();
                    functi0n();
                });
            }
            a.href = "#";
            a.onclick = "return false";
            a.innerText = emu.localization(title);
            li.appendChild(a);
            parent.appendChild(li);
            hideMenu();
            return li;
        }
        let screenshotUrl;
        const screenshot = addButton("Take Screenshot", false, () => {
            if (screenshotUrl) URL.revokeObjectURL(screenshotUrl);
            const date = new Date();
            const fileName = emu.getBaseFileName() + "-" + date.getMonth() + "-" + date.getDate() + "-" + date.getFullYear();
            emu.screenshot((blob, format) => {
                screenshotUrl = URL.createObjectURL(blob);
                const a = emu.createElement("a");
                a.href = screenshotUrl;
                a.download = fileName + "." + format;
                a.click();
                hideMenu();
            });
        });

        let screenMediaRecorder = null;
        const startScreenRecording = addButton("Start Screen Recording", false, () => {
            if (screenMediaRecorder !== null) {
                screenMediaRecorder.stop();
            }
            screenMediaRecorder = emu.screenRecord();
            startScreenRecording.setAttribute("hidden", "hidden");
            stopScreenRecording.removeAttribute("hidden");
            hideMenu();
        });
        const stopScreenRecording = addButton("Stop Screen Recording", true, () => {
            if (screenMediaRecorder !== null) {
                screenMediaRecorder.stop();
                screenMediaRecorder = null;
            }
            startScreenRecording.removeAttribute("hidden");
            stopScreenRecording.setAttribute("hidden", "hidden");
            hideMenu();
        });

        const qSave = addButton("Quick Save", false, () => {
            const slot = emu.getSettingValue("save-state-slot") ? emu.getSettingValue("save-state-slot") : "1";
            if (emu.gameManager.quickSave(slot)) {
                emu.displayMessage(emu.localization("SAVED STATE TO SLOT") + " " + slot);
            } else {
                emu.displayMessage(emu.localization("FAILED TO SAVE STATE"));
            }
            hideMenu();
        });
        const qLoad = addButton("Quick Load", false, () => {
            const slot = emu.getSettingValue("save-state-slot") ? emu.getSettingValue("save-state-slot") : "1";
            emu.gameManager.quickLoad(slot);
            emu.displayMessage(emu.localization("LOADED STATE FROM SLOT") + " " + slot);
            hideMenu();
        });
        emu.elements.contextMenu = {
            screenshot: screenshot,
            startScreenRecording: startScreenRecording,
            stopScreenRecording: stopScreenRecording,
            save: qSave,
            load: qLoad
        }
        addButton("EmulatorJS v" + emu.ejs_version, false, () => {
            hideMenu();
            const body = emu.createPopup("EmulatorJS", {
                "Close": () => {
                    emu.closePopup();
                }
            });

            body.style.display = "flex";

            const menu = emu.createElement("div");
            body.appendChild(menu);
            menu.classList.add("ejs-list_selector");
            const parent = emu.createElement("ul");
            const addButton = (title, hidden, functi0n) => {
                const li = emu.createElement("li");
                if (hidden) li.hidden = true;
                const a = emu.createElement("a");
                if (functi0n instanceof Function) {
                    emu.addEventListener(li, "click", (e) => {
                        e.preventDefault();
                        functi0n(li);
                    });
                }
                a.href = "#";
                a.onclick = "return false";
                a.innerText = emu.localization(title);
                li.appendChild(a);
                parent.appendChild(li);
                hideMenu();
                return li;
            }
            //body.style["padding-left"] = "20%";
            const home = emu.createElement("div");
            const license = emu.createElement("div");
            license.style.display = "none";
            const retroarch = emu.createElement("div");
            retroarch.style.display = "none";
            const coreLicense = emu.createElement("div");
            coreLicense.style.display = "none";
            body.appendChild(home);
            body.appendChild(license);
            body.appendChild(retroarch);
            body.appendChild(coreLicense);

            home.innerText = "EmulatorJS v" + emu.ejs_version;
            home.appendChild(emu.createElement("br"));
            home.appendChild(emu.createElement("br"));

            home.classList.add("ejs-context_menu_tab");
            license.classList.add("ejs-context_menu_tab");
            retroarch.classList.add("ejs-context_menu_tab");
            coreLicense.classList.add("ejs-context_menu_tab");

            emu.createLink(home, "https://github.com/EmulatorJS/EmulatorJS", "View on GitHub", true);

            emu.createLink(home, "https://discord.gg/6akryGkETU", "Join the discord", true);

            const info = emu.createElement("div");

            emu.createLink(info, "https://emulatorjs.org", "EmulatorJS");
            // I do not like using innerHTML, though this should be "safe"
            info.innerHTML += " is powered by ";
            emu.createLink(info, "https://github.com/libretro/RetroArch/", "RetroArch");
            if (emu.repository && emu.coreName) {
                info.innerHTML += ". This core is powered by ";
                emu.createLink(info, emu.repository, emu.coreName);
                info.innerHTML += ".";
            } else {
                info.innerHTML += ".";
            }
            home.appendChild(info);


            home.appendChild(emu.createElement("br"));
            menu.appendChild(parent);
            let current = home;
            const setElem = (element, li) => {
                if (current === element) return;
                if (current) {
                    current.style.display = "none";
                }
                let activeLi = li.parentElement.querySelector(".ejs_active_list_element");
                if (activeLi) {
                    activeLi.classList.remove("ejs-active_list_element");
                }
                li.classList.add("ejs-active_list_element");
                current = element;
                element.style.display = "";
            }
            addButton("Home", false, (li) => {
                setElem(home, li);
            }).classList.add("ejs-active_list_element");
            addButton("EmulatorJS License", false, (li) => {
                setElem(license, li);
            });
            addButton("RetroArch License", false, (li) => {
                setElem(retroarch, li);
            });
            if (emu.coreName && emu.license) {
                addButton(emu.coreName + " License", false, (li) => {
                    setElem(coreLicense, li);
                })
                coreLicense.innerText = emu.license;
            }
            //Todo - Contributors.

            retroarch.innerText = emu.localization("This project is powered by") + " ";
            const a = emu.createElement("a");
            a.href = "https://github.com/libretro/RetroArch";
            a.target = "_blank";
            a.innerText = "RetroArch";
            retroarch.appendChild(a);
            const licenseLink = emu.createElement("a");
            licenseLink.target = "_blank";
            licenseLink.href = "https://github.com/libretro/RetroArch/blob/master/COPYING";
            licenseLink.innerText = emu.localization("View the RetroArch license here");
            a.appendChild(emu.createElement("br"));
            a.appendChild(licenseLink);

            license.innerText = EJS_license;
        });

        if (emu.config.buttonOpts) {
            if (emu.config.buttonOpts.screenshot.visible === false) screenshot.setAttribute("hidden", "");
            if (emu.config.buttonOpts.screenRecord.visible === false) startScreenRecording.setAttribute("hidden", "");
            if (emu.config.buttonOpts.quickSave.visible === false) qSave.setAttribute("hidden", "");
            if (emu.config.buttonOpts.quickLoad.visible === false) qLoad.setAttribute("hidden", "");
        }

        emu.elements.contextmenu.appendChild(parent);

        emu.elements.parent.appendChild(emu.elements.contextmenu);
}
