// [ui/settings.js] 设置面板\n// 职责：构建主设置面板 DOM（核心选择、画面比例、着色器等选项）\n// 不负责：设置值的验证与持久化（由 core/config.js 处理）

export function setupSettingsMenu(emu) {
        emu.settingsMenu = emu.createElement("div");
        emu.settingsMenu.classList.add("ejs-settings_parent");
        const nested = emu.createElement("div");
        nested.classList.add("ejs-settings_transition");
        emu.settings = {};
        const menus = [];
        let parentMenuCt = 0;

        const createSettingParent = (child, title, parentElement) => {
            const rv = emu.createElement("div");
            rv.classList.add("ejs-setting_menu");

            if (child) {
                const menuOption = emu.createElement("div");
                menuOption.classList.add("ejs-settings_main_bar");
                const span = emu.createElement("span");
                span.innerText = title;

                menuOption.appendChild(span);
                parentElement.appendChild(menuOption);

                const menu = emu.createElement("div");
                const menuChild = emu.createElement("div");
                menus.push(menu);
                parentMenuCt++;
                menu.setAttribute("hidden", "");
                menuChild.classList.add("ejs-parent_option_div");
                const button = emu.createElement("button");
                const goToHome = () => {
                    const homeSize = emu.getElementSize(parentElement);
                    nested.style.width = (homeSize.width + 20) + "px";
                    nested.style.height = homeSize.height + "px";
                    menu.setAttribute("hidden", "");
                    parentElement.removeAttribute("hidden");
                }
                emu.addEventListener(menuOption, "click", (e) => {
                    const targetSize = emu.getElementSize(menu);
                    nested.style.width = (targetSize.width + 20) + "px";
                    nested.style.height = targetSize.height + "px";
                    menu.removeAttribute("hidden");
                    rv.scrollTo(0, 0);
                    parentElement.setAttribute("hidden", "");
                })
                const observer = new MutationObserver((list) => {
                    for (const k of list) {
                        for (const removed of k.removedNodes) {
                            if (removed === menu) {
                                menuOption.remove();
                                observer.disconnect();
                                const index = menus.indexOf(menu);
                                if (index !== -1) menus.splice(index, 1);
                                emu.settingsMenu.style.display = "";
                                const homeSize = emu.getElementSize(parentElement);
                                nested.style.width = (homeSize.width + 20) + "px";
                                nested.style.height = homeSize.height + "px";
                                // This SHOULD always be called before the game started - this SHOULD never be an issue
                                emu.settingsMenu.style.display = "none";
                            }
                        }
                    }
                });
                emu.addEventListener(button, "click", goToHome);

                button.type = "button";
                button.classList.add("ejs-back_button");
                menuChild.appendChild(button);
                const pageTitle = emu.createElement("span");
                pageTitle.innerText = title;
                pageTitle.classList.add("ejs-menu_text_a");
                button.appendChild(pageTitle);
                
                // const optionsMenu = emu.createElement("div");
                // optionsMenu.classList.add("ejs-setting_menu");
                // menu.appendChild(optionsMenu);

                menuChild.appendChild(rv);
                menu.appendChild(menuChild);
                nested.appendChild(menu);
                observer.observe(nested, {
                    childList: true,
                    subtree: true,
                });
            }

            return rv;
        }

        const checkForEmptyMenu = (element) => {
            if (element.firstChild === null) {
                element.parentElement.remove(); // No point in keeping an empty menu
                parentMenuCt--;
            }
        }

        const home = createSettingParent();

        emu.handleSettingsResize = () => {
            let needChange = false;
            if (emu.settingsMenu.style.display !== "") {
                emu.settingsMenu.style.opacity = "0";
                emu.settingsMenu.style.display = "";
                needChange = true;
            }
            let height = emu.elements.parent.getBoundingClientRect().height;
            let w2 = emu.settingParent.parentElement.getBoundingClientRect().width;
            let settingsX = emu.settingParent.getBoundingClientRect().x;
            if (w2 > window.innerWidth) settingsX += (w2 - window.innerWidth);
            const onTheRight = settingsX > (w2 - 15) / 2;
            if (height > 375) height = 375;
            home.style["max-height"] = (height - 95) + "px";
            nested.style["max-height"] = (height - 95) + "px";
            for (let i = 0; i < menus.length; i++) {
                menus[i].style["max-height"] = (height - 95) + "px";
            }
            emu.settingsMenu.classList.toggle("ejs-settings_center_left", !onTheRight);
            emu.settingsMenu.classList.toggle("ejs-settings_center_right", onTheRight);
            if (needChange) {
                emu.settingsMenu.style.display = "none";
                emu.settingsMenu.style.opacity = "";
            }
        }
        nested.appendChild(home);

        let funcs = [];
        let settings = {};
        emu.changeSettingOption = (title, newValue, startup) => {
            emu.allSettings[title] = newValue;
            if (startup !== true) {
                emu.settings[title] = newValue;
            }
            settings[title] = newValue;
            funcs.forEach(e => e(title));
        }
        let allOpts = {};

        const addToMenu = (title, id, options, defaultOption, parentElement, useParentParent) => {
            if (Array.isArray(emu.config.hideSettings) && emu.config.hideSettings.includes(id)) {
                return;
            }
            parentElement = parentElement || home;
            const transitionElement = useParentParent ? parentElement.parentElement.parentElement : parentElement;
            const menuOption = emu.createElement("div");
            menuOption.classList.add("ejs-settings_main_bar");
            const span = emu.createElement("span");
            span.innerText = title;

            const current = emu.createElement("div");
            current.innerText = "";
            current.classList.add("ejs-settings_main_bar_selected");
            span.appendChild(current);

            menuOption.appendChild(span);
            parentElement.appendChild(menuOption);

            const menu = emu.createElement("div");
            menus.push(menu);
            const menuChild = emu.createElement("div");
            menu.setAttribute("hidden", "");
            menuChild.classList.add("ejs-parent_option_div");

            const optionsMenu = emu.createElement("div");
            optionsMenu.classList.add("ejs-setting_menu");

            const button = emu.createElement("button");
            const goToHome = () => {
                transitionElement.removeAttribute("hidden");
                menu.setAttribute("hidden", "");
                const homeSize = emu.getElementSize(transitionElement);
                nested.style.width = (homeSize.width + 20) + "px";
                nested.style.height = homeSize.height + "px";
                transitionElement.removeAttribute("hidden");
            }
            emu.addEventListener(menuOption, "click", (e) => {
                const targetSize = emu.getElementSize(menu);
                nested.style.width = (targetSize.width + 20) + "px";
                nested.style.height = targetSize.height + "px";
                menu.removeAttribute("hidden");
                optionsMenu.scrollTo(0, 0);
                transitionElement.setAttribute("hidden", "");
                transitionElement.setAttribute("hidden", "");
            })
            emu.addEventListener(button, "click", goToHome);

            button.type = "button";
            button.classList.add("ejs-back_button");
            menuChild.appendChild(button);
            const pageTitle = emu.createElement("span");
            pageTitle.innerText = title;
            pageTitle.classList.add("ejs-menu_text_a");
            button.appendChild(pageTitle);

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
                    buttons[j].classList.toggle("ejs-option_row_selected", buttons[j].getAttribute("ejs_value") === settings[id]);
                }
                emu.menuOptionChanged(id, settings[id]);
                current.innerText = opts[settings[id]];
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
                    emu.changeSettingOption(id, opt);
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

            menuChild.appendChild(optionsMenu);

            menu.appendChild(menuChild);
            nested.appendChild(menu);
        }
        const cores = emu.getCores();
        const core = cores[emu.getCore(true)];
        if (core && core.length > 1) {
            addToMenu(emu.localization("Core" + " (" + emu.localization("Requires restart") + ")"), "retroarch_core", core, emu.getCore(), home);
        }
        if (typeof window.SharedArrayBuffer === "function" && !emu.requiresThreads(emu.getCore())) {
            addToMenu(emu.localization("Threads"), "ejs_threads", {
                "enabled": emu.localization("Enabled"),
                "disabled": emu.localization("Disabled")
            }, emu.config.threads ? "enabled" : "disabled", home);
        }

        const graphicsOptions = createSettingParent(true, "Graphics Settings", home);

        if (emu.shaders) {
            const builtinShaders = {
                "2xScaleHQ.glslp": emu.localization("2xScaleHQ"),
                "4xScaleHQ.glslp": emu.localization("4xScaleHQ"),
                "crt-aperture.glslp": emu.localization("CRT aperture"),
                "crt-beam": emu.localization("CRT beam"),
                "crt-caligari": emu.localization("CRT caligari"),
                "crt-easymode.glslp": emu.localization("CRT easymode"),
                "crt-geom.glslp": emu.localization("CRT geom"),
                "crt-lottes": emu.localization("CRT lottes"),
                "crt-mattias.glslp": emu.localization("CRT mattias"),
                "crt-yeetron": emu.localization("CRT yeetron"),
                "crt-zfast": emu.localization("CRT zfast"),
                "sabr": emu.localization("SABR"),
                "bicubic": emu.localization("Bicubic"),
                "mix-frames": emu.localization("Mix frames"),
            };
            let shaderMenu = {
                "disabled": emu.localization("Disabled"),
            };
            for (const shaderName in emu.shaders) {
                if (builtinShaders[shaderName]) {
                    shaderMenu[shaderName] = builtinShaders[shaderName];
                } else {
                    shaderMenu[shaderName] = shaderName;
                }
            }
            addToMenu(emu.localization("Shaders"), "shader", shaderMenu, "disabled", graphicsOptions, true);
        }

        if (emu.supportsWebgl2 && !emu.requiresWebGL2(emu.getCore())) {
            addToMenu(emu.localization("WebGL2") + " (" + emu.localization("Requires restart") + ")", "webgl2Enabled", {
                "enabled": emu.localization("Enabled"),
                "disabled": emu.localization("Disabled")
            }, emu.webgl2Enabled ? "enabled" : "disabled", graphicsOptions, true);
        }

        addToMenu(emu.localization("FPS"), "fps", {
            "show": emu.localization("show"),
            "hide": emu.localization("hide")
        }, "hide", graphicsOptions, true);

        addToMenu(emu.localization("VSync"), "vsync", {
            "enabled": emu.localization("Enabled"),
            "disabled": emu.localization("Disabled")
        }, "enabled", graphicsOptions, true);

        addToMenu(emu.localization("Video Rotation"), "videoRotation", {
            "0": "0 deg",
            "1": "90 deg",
            "2": "180 deg",
            "3": "270 deg"
        }, emu.videoRotation.toString(), graphicsOptions, true);

        const screenCaptureOptions = createSettingParent(true, "Screen Capture", home);

        addToMenu(emu.localization("Screenshot Source"), "screenshotSource", {
            "canvas": "canvas",
            "retroarch": "retroarch"
        }, emu.capture.photo.source, screenCaptureOptions, true);

        let screenshotFormats = {
            "png": "png",
            "jpeg": "jpeg",
            "webp": "webp"
        }
        if (emu.isSafari) {  
            delete screenshotFormats["webp"]; 
        }
        if (!(emu.capture.photo.format in screenshotFormats)) {
            emu.capture.photo.format = "png";
        }
        addToMenu(emu.localization("Screenshot Format"), "screenshotFormat", screenshotFormats, emu.capture.photo.format, screenCaptureOptions, true);

        const screenshotUpscale = emu.capture.photo.upscale.toString();
        let screenshotUpscales = {
            "0": "native",
            "1": "1x",
            "2": "2x",
            "3": "3x"
        }
        if (!(screenshotUpscale in screenshotUpscales)) {
            screenshotUpscales[screenshotUpscale] = screenshotUpscale + "x";
        }
        addToMenu(emu.localization("Screenshot Upscale"), "screenshotUpscale", screenshotUpscales, screenshotUpscale, screenCaptureOptions, true);

        const screenRecordFPS = emu.capture.video.fps.toString();
        let screenRecordFPSs = {
            "30": "30",
            "60": "60"
        }
        if (!(screenRecordFPS in screenRecordFPSs)) {
            screenRecordFPSs[screenRecordFPS] = screenRecordFPS;
        }
        addToMenu(emu.localization("Screen Recording FPS"), "screenRecordFPS", screenRecordFPSs, screenRecordFPS, screenCaptureOptions, true);

        let screenRecordFormats = {
            "mp4": "mp4",
            "webm": "webm"
        }
        for (const format in screenRecordFormats) {
            if (!MediaRecorder.isTypeSupported("video/" + format)) {
                delete screenRecordFormats[format];
            }
        }
        if (!(emu.capture.video.format in screenRecordFormats)) {
            emu.capture.video.format = Object.keys(screenRecordFormats)[0];
        }
        addToMenu(emu.localization("Screen Recording Format"), "screenRecordFormat", screenRecordFormats, emu.capture.video.format, screenCaptureOptions, true);

        const screenRecordUpscale = emu.capture.video.upscale.toString();
        let screenRecordUpscales = {
            "1": "1x",
            "2": "2x",
            "3": "3x",
            "4": "4x"
        }
        if (!(screenRecordUpscale in screenRecordUpscales)) {
            screenRecordUpscales[screenRecordUpscale] = screenRecordUpscale + "x";
        }
        addToMenu(emu.localization("Screen Recording Upscale"), "screenRecordUpscale", screenRecordUpscales, screenRecordUpscale, screenCaptureOptions, true);

        const screenRecordVideoBitrate = emu.capture.video.videoBitrate.toString();
        let screenRecordVideoBitrates = {
            "1048576": "1 Mbit/sec",
            "2097152": "2 Mbit/sec",
            "2621440": "2.5 Mbit/sec",
            "3145728": "3 Mbit/sec",
            "4194304": "4 Mbit/sec"
        }
        if (!(screenRecordVideoBitrate in screenRecordVideoBitrates)) {
            screenRecordVideoBitrates[screenRecordVideoBitrate] = screenRecordVideoBitrate + " Bits/sec";
        }
        addToMenu(emu.localization("Screen Recording Video Bitrate"), "screenRecordVideoBitrate", screenRecordVideoBitrates, screenRecordVideoBitrate, screenCaptureOptions, true);

        const screenRecordAudioBitrate = emu.capture.video.audioBitrate.toString();
        let screenRecordAudioBitrates = {
            "65536": "64 Kbit/sec",
            "131072": "128 Kbit/sec",
            "196608": "192 Kbit/sec",
            "262144": "256 Kbit/sec",
            "327680": "320 Kbit/sec"
        }
        if (!(screenRecordAudioBitrate in screenRecordAudioBitrates)) {
            screenRecordAudioBitrates[screenRecordAudioBitrate] = screenRecordAudioBitrate + " Bits/sec";
        }
        addToMenu(emu.localization("Screen Recording Audio Bitrate"), "screenRecordAudioBitrate", screenRecordAudioBitrates, screenRecordAudioBitrate, screenCaptureOptions, true);

        checkForEmptyMenu(screenCaptureOptions);

        const speedOptions = createSettingParent(true, "Speed Options", home);

        addToMenu(emu.localization("Fast Forward"), "fastForward", {
            "enabled": emu.localization("Enabled"),
            "disabled": emu.localization("Disabled")
        }, "disabled", speedOptions, true);

        addToMenu(emu.localization("Fast Forward Ratio"), "ff-ratio", [
            "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10.0", "unlimited"
        ], "3.0", speedOptions, true);

        addToMenu(emu.localization("Slow Motion"), "slowMotion", {
            "enabled": emu.localization("Enabled"),
            "disabled": emu.localization("Disabled")
        }, "disabled", speedOptions, true);

        addToMenu(emu.localization("Slow Motion Ratio"), "sm-ratio", [
            "1.5", "2.0", "2.5", "3.0", "3.5", "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0", "8.5", "9.0", "9.5", "10.0"
        ], "3.0", speedOptions, true);

        addToMenu(emu.localization("Rewind Enabled" + " (" + emu.localization("Requires restart") + ")"), "rewindEnabled", {
            "enabled": emu.localization("Enabled"),
            "disabled": emu.localization("Disabled")
        }, "disabled", speedOptions, true);

        if (emu.rewindEnabled) {
            addToMenu(emu.localization("Rewind Granularity"), "rewind-granularity", [
                "1", "3", "6", "12", "25", "50", "100"
            ], "6", speedOptions, true);
        }

        const inputOptions = createSettingParent(true, "Input Options", home);

        addToMenu(emu.localization("Menubar Mouse Trigger"), "menubarBehavior", {
            "downward": emu.localization("Downward Movement"),
            "anywhere": emu.localization("Movement Anywhere"),
        }, "downward", inputOptions, true);

        addToMenu(emu.localization("Direct Keyboard Input"), "keyboardInput", {
            "disabled": emu.localization("Disabled"),
            "enabled": emu.localization("Enabled"),
        }, ((emu.defaultCoreOpts && emu.defaultCoreOpts.useKeyboard === true) ? "enabled" : "disabled"), inputOptions, true);

        addToMenu(emu.localization("Forward Alt key"), "altKeyboardInput", {
            "disabled": emu.localization("Disabled"),
            "enabled": emu.localization("Enabled"),
        }, "disabled", inputOptions, true);

        addToMenu(emu.localization("Lock Mouse"), "lockMouse", {
            "disabled": emu.localization("Disabled"),
            "enabled": emu.localization("Enabled"),
        }, (emu.enableMouseLock === true ? "enabled" : "disabled"), inputOptions, true);

        addToMenu(emu.localization("Autofire Interval"), "autofireInterval", {
            "20": "20ms",
            "50": "50ms",
            "100": "100ms",
            "200": "200ms",
            "500": "500ms",
        }, "100", inputOptions, true);

        checkForEmptyMenu(inputOptions);

        let controllerPortInfo;
        try {
            controllerPortInfo = emu.gameManager.getControllerPortInfo();
        } catch(e) {
            if (emu.debug) console.warn("getControllerPortInfo not available:", e);
        }
        if (controllerPortInfo) {
            // Parse the port info: each line is "port:deviceId:description"
            const ports = {};
            controllerPortInfo.split("\n").forEach(line => {
                if (!line.trim()) return;
                const parts = line.split(":");
                if (parts.length < 3) return;
                const port = parseInt(parts[0]);
                const deviceId = parts[1];
                const desc = parts.slice(2).join(":");
                if (!ports[port]) ports[port] = {};
                ports[port][deviceId] = emu.localization(desc);
            });
            const portKeys = Object.keys(ports);
            if (portKeys.length > 0) {
                const controllerDeviceOpts = createSettingParent(true, "Controller Port Devices", home);
                for (const port of portKeys) {
                    const portNum = parseInt(port) + 1;
                    if (Object.keys(ports[port]).length <= 1) continue;
                    addToMenu(emu.localization("Port") + " " + portNum,
                        "controller-port-device-p" + portNum,
                        ports[port], "1", controllerDeviceOpts, true);
                }
                checkForEmptyMenu(controllerDeviceOpts);
            }
        }

        if (emu.saveInBrowserSupported()) {
            const saveStateOpts = createSettingParent(true, "Save States", home);
            addToMenu(emu.localization("Save State Slot"), "save-state-slot", ["1", "2", "3", "4", "5", "6", "7", "8", "9"], "1", saveStateOpts, true);
            addToMenu(emu.localization("Save State Location"), "save-state-location", {
                "download": emu.localization("Download"),
                "browser": emu.localization("Keep in Browser")
            }, "download", saveStateOpts, true);
            if (!emu.config.fixedSaveInterval) {
                addToMenu(emu.localization("System Save interval"), "save-save-interval", {
                    "0": "Disabled",
                    "30": "30 seconds",
                    "60": "1 minute",
                    "300": "5 minutes",
                    "600": "10 minutes",
                    "900": "15 minutes",
                    "1800": "30 minutes"
                }, "300", saveStateOpts, true);
            }
            checkForEmptyMenu(saveStateOpts);
        }

        if (emu.touch || emu.hasTouchScreen) {
            const virtualGamepad = createSettingParent(true, "Virtual Gamepad", home);
            addToMenu(emu.localization("Virtual Gamepad"), "virtual-gamepad", {
                "enabled": emu.localization("Enabled"),
                "disabled": emu.localization("Disabled")
            }, emu.isMobile ? "enabled" : "disabled", virtualGamepad, true);
            addToMenu(emu.localization("Menu Bar Button"), "menu-bar-button", {
                "visible": emu.localization("visible"),
                "hidden": emu.localization("hidden")
            }, "visible", virtualGamepad, true);
            addToMenu(emu.localization("Left Handed Mode"), "virtual-gamepad-left-handed-mode", {
                "enabled": emu.localization("Enabled"),
                "disabled": emu.localization("Disabled")
            }, "disabled", virtualGamepad, true);
            checkForEmptyMenu(virtualGamepad);
        }

        let coreOpts;
        try {
            coreOpts = emu.gameManager.getCoreOptions();
        } catch(e) {}
        if (coreOpts) {
            const coreOptions = createSettingParent(true, "Backend Core Options", home);
            coreOpts.split("\n").forEach((line, index) => {
                let option = line.split("; ");
                let name = option[0];
                let options = option[1].split("|"),
                    optionName = name.split("|")[0].replace(/_/g, " ").replace(/.+\-(.+)/, "$1");
                options.slice(1, -1);
                if (options.length === 1) return;
                let availableOptions = {};
                for (let i = 0; i < options.length; i++) {
                    availableOptions[options[i]] = emu.localization(options[i], emu.config.settingsLanguage);
                }
                addToMenu(emu.localization(optionName, emu.config.settingsLanguage),
                    name.split("|")[0], availableOptions,
                    (name.split("|").length > 1) ? name.split("|")[1] : options[0].replace("(Default) ", ""),
                    coreOptions,
                    true);
            })
            checkForEmptyMenu(coreOptions);
        }

        /*
        emu.retroarchOpts = [
            {
                title: "Audio Latency", // String
                name: "audio_latency", // String - value to be set in retroarch.cfg
                // options should ALWAYS be strings here...
                options: ["8", "16", "32", "64", "128"], // values
                options: {"8": "eight", "16": "sixteen", "32": "thirty-two", "64": "sixty-four", "128": "one hundred-twenty-eight"}, // This also works
                default: "128", // Default
                isString: false // Surround value with quotes in retroarch.cfg file?
            }
        ];*/

        if (emu.retroarchOpts && Array.isArray(emu.retroarchOpts)) {
            const retroarchOptsMenu = createSettingParent(true, "RetroArch Options" + " (" + emu.localization("Requires restart") + ")", home);
            emu.retroarchOpts.forEach(option => {
                addToMenu(emu.localization(option.title, emu.config.settingsLanguage),
                    option.name,
                    option.options,
                    option.default,
                    retroarchOptsMenu,
                    true);
            })
            checkForEmptyMenu(retroarchOptsMenu);
        }

        checkForEmptyMenu(graphicsOptions);
        checkForEmptyMenu(speedOptions);

        emu.settingsMenu.appendChild(nested);

        emu.settingParent.appendChild(emu.settingsMenu);
        emu.settingParent.style.position = "relative";

        emu.settingsMenu.style.display = "";
        const homeSize = emu.getElementSize(home);
        nested.style.width = (homeSize.width + 20) + "px";
        nested.style.height = homeSize.height + "px";

        emu.settingsMenu.style.display = "none";

        if (emu.debug) {
            console.log("Available core options", allOpts);
        }

        if (emu.config.defaultOptions) {
            for (const k in emu.config.defaultOptions) {
                emu.changeSettingOption(k, emu.config.defaultOptions[k], true);
            }
        }

        if (parentMenuCt === 0) {
            emu.on("start", () => {
                emu.elements.bottomBar.settings[0][0].style.display = "none";
            });
        }
}
