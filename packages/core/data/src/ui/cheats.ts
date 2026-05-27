// [ui/cheats.js] 金手指菜单\n// 职责：构建金手指管理界面 DOM\n// 不负责：金手指代码的实际生效逻辑（由引擎层处理）

export function createCheatsMenu(emu) {
        const body = emu.createPopup(
            "Cheats",
            {
                "Add Cheat": () => {
                    const popups = emu.createSubPopup();
                    emu.cheatMenu.appendChild(popups[0]);
                    popups[1].classList.add("ejs-cheat_parent");
                    popups[1].style.width = "100%";
                    const popup = popups[1];
                    const header = emu.createElement("div");
                    header.classList.add("ejs-cheat_header");
                    const title = emu.createElement("h2");
                    title.innerText = emu.localization("Add Cheat Code");
                    title.classList.add("ejs-cheat_heading");
                    const close = emu.createElement("button");
                    close.classList.add("ejs-cheat_close");
                    header.appendChild(title);
                    header.appendChild(close);
                    popup.appendChild(header);
                    emu.addEventListener(close, "click", (e) => {
                        popups[0].remove();
                    });

                    let cheatDB = {};
                    const systemKey = emu.getCore(true);
                    const cleanRomTags = (name) => {
                        return name
                            .replace(/\([^)]+\)/g, "")
                            .replace(/\[[^\]]+\]/g, "")
                            .trim();
                    };

                    const normalizeAndConvertNumerals = (name) => {
                        let normalized = name.toLowerCase();
                        normalized = normalized.replace(/ iv/g, " 4");
                        normalized = normalized.replace(/ iii/g, " 3");
                        normalized = normalized.replace(/ ii/g, " 2");
                        normalized = normalized.replace(/ v/g, " 5");
                        normalized = normalized.replace(/ i/g, " 1");

                        return normalized.replace(/[^a-z0-9]/g, "");
                    };

                    const createSelect = (labelText) => {
                        const div = emu.createElement("div");
                        const label = emu.createElement("strong");
                        label.innerText = emu.localization(labelText);
                        div.appendChild(label);
                        div.appendChild(emu.createElement("br"));
                        const select = emu.createElement("select");
                        select.style.width = "100%";
                        select.classList.add("ejs-cheat_code");
                        div.appendChild(select);
                        return {
                            container: div,
                            select: select,
                        };
                    };

                    const importDiv = emu.createElement("div");
                    importDiv.classList.add("ejs-cheat_main");
                    importDiv.style.borderBottom = "1px solid #555";
                    importDiv.style.paddingBottom = "10px";
                    importDiv.style.display = "none";

                    const importTitle = emu.createElement("h3");
                    importTitle.innerText =
                        emu.localization("Import from Database") +
                        (systemKey ? ` (${systemKey.toUpperCase()})` : "");
                    importTitle.style.marginTop = "0px";
                    importDiv.appendChild(importTitle);

                    const gameSelectUI = createSelect("Game");
                    const cheatSelectUI = createSelect("Cheat");

                    importDiv.appendChild(gameSelectUI.container);
                    importDiv.appendChild(cheatSelectUI.container);

                    popup.appendChild(importDiv);

                    const main = emu.createElement("div");
                    main.classList.add("ejs-cheat_main");
                    const header3 = emu.createElement("strong");
                    header3.innerText = emu.localization(
                        "Manual Entry - Code",
                    );
                    main.appendChild(header3);
                    main.appendChild(emu.createElement("br"));

                    const manualCodeTextarea = emu.createElement("textarea");
                    manualCodeTextarea.classList.add("ejs-cheat_code");
                    manualCodeTextarea.style.width = "100%";
                    manualCodeTextarea.style.height = "80px";
                    main.appendChild(manualCodeTextarea);
                    main.appendChild(emu.createElement("br"));

                    const header2 = emu.createElement("strong");
                    header2.innerText = emu.localization(
                        "Manual Entry - Description",
                    );
                    main.appendChild(header2);
                    main.appendChild(emu.createElement("br"));

                    const manualDescriptionInput = emu.createElement("input");
                    manualDescriptionInput.type = "text";
                    manualDescriptionInput.classList.add("ejs-cheat_code");
                    manualDescriptionInput.style.width = "100%";
                    main.appendChild(manualDescriptionInput);
                    main.appendChild(emu.createElement("br"));
                    popup.appendChild(main);

                    const loadCheatList = (gameName) => {
                        cheatSelectUI.select.innerHTML = "";

                        const defaultOpt = emu.createElement("option");
                        defaultOpt.value = "";
                        defaultOpt.innerText =
                            "--- " +
                            emu.localization("Select a Cheat") +
                            " ---";
                        cheatSelectUI.select.appendChild(defaultOpt);

                        manualCodeTextarea.value = "";
                        manualDescriptionInput.value = "";

                        if (!gameName || !cheatDB[gameName]) return;

                        const cheats = cheatDB[gameName];
                        cheats.forEach((cheat) => {
                            const opt = emu.createElement("option");
                            opt.value = cheat.desc;
                            opt.innerText = cheat.desc;
                            cheatSelectUI.select.appendChild(opt);
                        });

                        if (cheats.length > 0) {
                            cheatSelectUI.select.value = cheats[0].desc;
                            manualCodeTextarea.value = cheats[0].code;
                            manualDescriptionInput.value = cheats[0].desc;
                        }
                    };

                    const loadCheatDatabase = async (system) => {
                        gameSelectUI.select.innerHTML = "";
                        cheatSelectUI.select.innerHTML = "";

                        const defaultGameOpt = emu.createElement("option");
                        defaultGameOpt.value = "";
                        defaultGameOpt.innerText =
                            "--- " +
                            emu.localization("Select a Game") +
                            " ---";
                        gameSelectUI.select.appendChild(defaultGameOpt);

                        if (!emu.config.cheatPath) {
                            if (emu.debug)
                                console.error(
                                    "Cheat file load error: EJS_cheatPath is not configured.",
                                );
                            importDiv.style.display = "none";
                            return;
                        }

                        const globalUrl = emu.config.cheatPath + "cheats.json";
                        const systemUrl =
                            emu.config.cheatPath + system + ".json";

                        const fetchCheatJson = async (url) => {
                            const res = await emu.downloadFile(url, "cheats", null, true, { responseType: "text", method: "GET" });
                            if (res === -1) return null;
                            return res.data;
                        };

                        try {
                            let data = await fetchCheatJson(globalUrl);
                            if (data === null) {
                                if (emu.debug)
                                    console.log(
                                        `[Cheats] cheats.json not found. Trying ${system}.json fallback...`,
                                    );
                                data = await fetchCheatJson(systemUrl);
                                if (data === null) {
                                    throw new Error(
                                        `Cheat JSON not found at ${globalUrl} or ${systemUrl}`,
                                    );
                                }
                            }
                            // downloadFile tries JSON.parse internally and swallows failures,
                            // so data may be the already-parsed object or still a string.
                            if (typeof data === "string") data = JSON.parse(data);
                            if (
                                data &&
                                data.data &&
                                typeof data.data === "object" &&
                                !Array.isArray(data.data)
                            ) {
                                data = data.data;
                            }
                            if (data && data.systems && data.systems[system]) {
                                cheatDB = data.systems[system];
                            } else if (data && data[system]) {
                                cheatDB = data[system];
                            } else {
                                cheatDB = data;
                            }

                            importDiv.style.display = "";

                            const gameNames = Object.keys(cheatDB).sort();
                            gameNames.forEach((name) => {
                                const opt = emu.createElement("option");
                                opt.value = name;
                                opt.innerText = name;
                                gameSelectUI.select.appendChild(opt);
                            });

                            let currentFileBaseName =
                                emu.getBaseFileName(true);
                            currentFileBaseName = currentFileBaseName.replace(
                                /\.[^/.]+$/,
                                "",
                            );
                            const cleanedFileName =
                                cleanRomTags(currentFileBaseName);
                            const normalizedFile =
                                normalizeAndConvertNumerals(cleanedFileName);

                            let matchedGameName = null;
                            if (
                                emu.config.gameName &&
                                gameNames.includes(emu.config.gameName)
                            ) {
                                matchedGameName = emu.config.gameName;
                            }

                            if (!matchedGameName) {
                                for (const name of gameNames) {
                                    if (
                                        normalizeAndConvertNumerals(name) ===
                                        normalizedFile
                                    ) {
                                        matchedGameName = name;
                                        break;
                                    }
                                }
                            }

                            if (matchedGameName) {
                                gameSelectUI.select.value = matchedGameName;
                            }

                            loadCheatList(gameSelectUI.select.value);
                        } catch (e) {
                            if (emu.debug)
                                console.error(
                                    "Cheat file load error:",
                                    e.message,
                                );
                            importDiv.style.display = "none";
                            cheatDB = {};
                            loadCheatList(null);
                        }
                    };

                    gameSelectUI.select.addEventListener("change", () => {
                        loadCheatList(gameSelectUI.select.value);
                    });

                    cheatSelectUI.select.addEventListener("change", () => {
                        const game = gameSelectUI.select.value;
                        const cheatDesc = cheatSelectUI.select.value;

                        if (!game || !cheatDesc) {
                            manualCodeTextarea.value = "";
                            manualDescriptionInput.value = "";
                            return;
                        }

                        const cheat = cheatDB[game].find(
                            (c) => c.desc === cheatDesc,
                        );
                        if (cheat) {
                            manualCodeTextarea.value = cheat.code;
                            manualDescriptionInput.value = cheat.desc;
                        }
                    });

                    if (systemKey) {
                        loadCheatDatabase(systemKey).catch((e) => {
                            if (emu.debug)
                                console.error("Initial cheat load failed:", e);
                        });
                    } else {
                        importDiv.style.display = "none";
                    }

                    const footer = emu.createElement("footer");
                    const submit = emu.createElement("button");
                    const closeButton = emu.createElement("button");
                    submit.innerText = emu.localization("Submit");
                    closeButton.innerText = emu.localization("Close");
                    submit.classList.add("ejs-button_button");
                    closeButton.classList.add("ejs-button_button");
                    submit.classList.add("ejs-popup_submit");
                    closeButton.classList.add("ejs-popup_submit");
                    submit.style["background-color"] =
                        "rgba(var(--ejs-primary-color),1)";
                    footer.appendChild(submit);
                    const span = emu.createElement("span");
                    span.innerText = " ";
                    footer.appendChild(span);
                    footer.appendChild(closeButton);
                    popup.appendChild(footer);

                    emu.addEventListener(submit, "click", (e) => {
                        if (
                            !manualCodeTextarea.value.trim() ||
                            !manualDescriptionInput.value.trim()
                        )
                            return;
                        popups[0].remove();
                        emu.cheats.push({
                            code: manualCodeTextarea.value,
                            desc: manualDescriptionInput.value,
                            checked: false,
                        });
                        emu.updateCheatUI();
                        emu.saveSettings();
                    });
                    emu.addEventListener(closeButton, "click", (e) => {
                        popups[0].remove();
                    });
                },
                Close: () => {
                    emu.cheatMenu.style.display = "none";
                },
            },
            true,
        );
        emu.cheatMenu = body.parentElement;
        emu.cheatMenu.getElementsByTagName("h4")[0].style["padding-bottom"] =
            "0px";
        const msg = emu.createElement("div");
        msg.style["padding-top"] = "0px";
        msg.style["padding-bottom"] = "15px";
        msg.innerText = emu.localization(
            "Note that some cheats require a restart to disable",
        );
        body.appendChild(msg);
        const rows = emu.createElement("div");
        body.appendChild(rows);
        rows.classList.add("ejs-cheat_rows");
        emu.elements.cheatRows = rows;
}
