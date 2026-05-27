// [ui/disks.js] 换盘菜单\n// 职责：构建多光盘游戏换盘界面 DOM\n// 不负责：实际光盘切换逻辑（由 engine/GameManager.js 处理）

export function setupDisksMenu(emu) {
        emu.disksMenu = emu.createElement("div");
        emu.disksMenu.classList.add("ejs-settings_parent");
        const nested = emu.createElement("div");
        nested.classList.add("ejs-settings_transition");
        emu.disks = {};

        const home = emu.createElement("div");
        home.style.overflow = "auto";
        const menus = [];
        emu.handleDisksResize = () => {
            let needChange = false;
            if (emu.disksMenu.style.display !== "") {
                emu.disksMenu.style.opacity = "0";
                emu.disksMenu.style.display = "";
                needChange = true;
            }
            let height = emu.elements.parent.getBoundingClientRect().height;
            let w2 = emu.diskParent.parentElement.getBoundingClientRect().width;
            let disksX = emu.diskParent.getBoundingClientRect().x;
            if (w2 > window.innerWidth) disksX += (w2 - window.innerWidth);
            const onTheRight = disksX > (w2 - 15) / 2;
            if (height > 375) height = 375;
            home.style["max-height"] = (height - 95) + "px";
            nested.style["max-height"] = (height - 95) + "px";
            for (let i = 0; i < menus.length; i++) {
                menus[i].style["max-height"] = (height - 95) + "px";
            }
            emu.disksMenu.classList.toggle("ejs-settings_center_left", !onTheRight);
            emu.disksMenu.classList.toggle("ejs-settings_center_right", onTheRight);
            if (needChange) {
                emu.disksMenu.style.display = "none";
                emu.disksMenu.style.opacity = "";
            }
        }

        home.classList.add("ejs-setting_menu");
        nested.appendChild(home);
        let funcs = [];
        emu.changeDiskOption = (title, newValue) => {
            emu.disks[title] = newValue;
            funcs.forEach(e => e(title));
        }
        let allOpts = {};

        // TODO - Why is this duplicated?
        const addToMenu = (title, id, options, defaultOption) => {
            const span = emu.createElement("span");
            span.innerText = title;

            const current = emu.createElement("div");
            current.innerText = "";
            current.classList.add("ejs-settings_main_bar_selected");
            span.appendChild(current);

            const menu = emu.createElement("div");
            menus.push(menu);
            menu.setAttribute("hidden", "");
            menu.classList.add("ejs-parent_option_div");
            const button = emu.createElement("button");
            const goToHome = () => {
                const homeSize = emu.getElementSize(home);
                nested.style.width = (homeSize.width + 20) + "px";
                nested.style.height = homeSize.height + "px";
                menu.setAttribute("hidden", "");
                home.removeAttribute("hidden");
            }
            emu.addEventListener(button, "click", goToHome);

            button.type = "button";
            button.classList.add("ejs-back_button");
            menu.appendChild(button);
            const pageTitle = emu.createElement("span");
            pageTitle.innerText = title;
            pageTitle.classList.add("ejs-menu_text_a");
            button.appendChild(pageTitle);

            const optionsMenu = emu.createElement("div");
            optionsMenu.classList.add("ejs-setting_menu");

            let buttons = [];
            let opts = options;
            if (Array.isArray(options)) {
                opts = {};
                for (let i = 0; i < options.length; i++) {
                    opts[options[i]] = options[i];
                }
            }
            allOpts[id] = opts;

            funcs.push((title) => {
                if (id !== title) return;
                for (let j = 0; j < buttons.length; j++) {
                    buttons[j].classList.toggle("ejs-option_row_selected", buttons[j].getAttribute("ejs_value") === emu.disks[id]);
                }
                emu.menuOptionChanged(id, emu.disks[id]);
                current.innerText = opts[emu.disks[id]];
            });

            for (const opt in opts) {
                const optionButton = emu.createElement("button");
                buttons.push(optionButton);
                optionButton.setAttribute("ejs_value", opt);
                optionButton.type = "button";
                optionButton.value = opts[opt];
                optionButton.classList.add("ejs-option_row");
                optionButton.classList.add("ejs-button_style");

                emu.addEventListener(optionButton, "click", (e) => {
                    emu.disks[id] = opt;
                    for (let j = 0; j < buttons.length; j++) {
                        buttons[j].classList.remove("ejs-option_row_selected");
                    }
                    optionButton.classList.add("ejs-option_row_selected");
                    emu.menuOptionChanged(id, opt);
                    current.innerText = opts[opt];
                    goToHome();
                })
                if (defaultOption === opt) {
                    optionButton.classList.add("ejs-option_row_selected");
                    emu.menuOptionChanged(id, opt);
                    current.innerText = opts[opt];
                }

                const msg = emu.createElement("span");
                msg.innerText = opts[opt];
                optionButton.appendChild(msg);

                optionsMenu.appendChild(optionButton);
            }

            home.appendChild(optionsMenu);

            nested.appendChild(menu);
        }

        if (emu.gameManager.getDiskCount() > 1) {
            const diskLabels = {};
            let isM3U = false;
            let disks = {};
            if (emu.fileName.split(".").pop() === "m3u") {
                disks = emu.gameManager.Module.FS.readFile(emu.fileName, { encoding: "utf8" }).split("\n");
                isM3U = true;
            }
            for (let i = 0; i < emu.gameManager.getDiskCount(); i++) {
                // default if not an m3u loaded rom is "Disk x"
                // if m3u, then use the file name without the extension
                // if m3u, and contains a |, then use the string after the | as the disk label
                if (!isM3U) {
                    diskLabels[i.toString()] = "Disk " + (i + 1);
                } else {
                    // get disk name from m3u
                    const diskLabelValues = disks[i].split("|");
                    // remove the file extension from the disk file name
                    let diskLabel = diskLabelValues[0].replace("." + diskLabelValues[0].split(".").pop(), "");
                    if (diskLabelValues.length >= 2) {
                        // has a label - use that instead
                        diskLabel = diskLabelValues[1];
                    }
                    diskLabels[i.toString()] = diskLabel;
                }
            }
            addToMenu(emu.localization("Disk"), "disk", diskLabels, emu.gameManager.getCurrentDisk().toString());
        }

        emu.disksMenu.appendChild(nested);

        emu.diskParent.appendChild(emu.disksMenu);
        emu.diskParent.style.position = "relative";

        const homeSize = emu.getElementSize(home);
        nested.style.width = (homeSize.width + 20) + "px";
        nested.style.height = homeSize.height + "px";

        emu.disksMenu.style.display = "none";

        if (emu.debug) {
            console.log("Available core options", allOpts);
        }

        if (emu.config.defaultOptions) {
            for (const k in emu.config.defaultOptions) {
                emu.changeDiskOption(k, emu.config.defaultOptions[k]);
            }
        }
}
