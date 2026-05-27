// [ui/bottomBar.js] 底部菜单栏\n// 职责：构建底部控制栏 DOM（播放/暂停/音量/快进/全屏等按钮）\n// 不负责：按钮触发的模拟引擎操作（通过 emu 回调处理）

export function createBottomMenuBar(emu) {
        emu.elements.menu = emu.createElement("div");

        //prevent weird glitch on some devices
        emu.elements.menu.style.opacity = 0;
        emu.on("start", (e) => {
            emu.elements.menu.style.opacity = "";
        })
        emu.elements.menu.classList.add("ejs-menu_bar");
        emu.elements.menu.classList.add("ejs-menu_bar_hidden");

        let timeout = null;
        let ignoreEvents = false;
        const hide = () => {
            if (emu.paused || emu.settingsMenuOpen || emu.disksMenuOpen) return;
            emu.elements.menu.classList.add("ejs-menu_bar_hidden");
        }

        const show = () => {
            clearTimeout(timeout);
            timeout = setTimeout(hide, 3000);
            emu.elements.menu.classList.remove("ejs-menu_bar_hidden");
        }

        emu.menu = {
            close: () => {
                clearTimeout(timeout);
                emu.elements.menu.classList.add("ejs-menu_bar_hidden");
            },
            open: (force) => {
                if (!emu.started && force !== true) return;
                clearTimeout(timeout);
                if (force !== true) timeout = setTimeout(hide, 3000);
                emu.elements.menu.classList.remove("ejs-menu_bar_hidden");
            },
            toggle: () => {
                if (!emu.started) return;
                clearTimeout(timeout);
                if (emu.elements.menu.classList.contains("ejs-menu_bar_hidden")) {
                    timeout = setTimeout(hide, 3000);
                }
                emu.elements.menu.classList.toggle("ejs-menu_bar_hidden");
            }
        }

        emu.createBottomMenuBarListeners = () => {
            const clickListener = (e) => {
                if (e.pointerType === "touch") return;
                if (!emu.started || ignoreEvents || document.pointerLockElement === emu.canvas) return;
                if (emu.isPopupOpen()) return;
                show();
            }
            const mouseListener = (e) => {
                if (!emu.started || ignoreEvents || document.pointerLockElement === emu.canvas) return;
                if (emu.isPopupOpen()) return;
                const deltaX = e.movementX;
                const deltaY = e.movementY;
                const threshold = emu.elements.menu.offsetHeight + 30;
                const mouseY = e.clientY;

                if (mouseY >= window.innerHeight - threshold) {
                    show();
                    return;
                }
                let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
                if (angle < 0) angle += 360;
                if (angle < 85 || angle > 95) return;
                show();
            }
            if (emu.menu.mousemoveListener) emu.removeEventListener(emu.menu.mousemoveListener);
            
            if ((emu.preGetSetting("menubarBehavior") || "downward") === "downward") {
                emu.menu.mousemoveListener = emu.addEventListener(emu.elements.parent, "mousemove", mouseListener);
            } else {
                emu.menu.mousemoveListener = emu.addEventListener(emu.elements.parent, "mousemove", clickListener);
            }

            emu.addEventListener(emu.elements.parent, "click", clickListener);
        }
        emu.createBottomMenuBarListeners();

        emu.elements.parent.appendChild(emu.elements.menu);

        let tmout;
        emu.addEventListener(emu.elements.parent, "mousedown touchstart", (e) => {
            if (emu.isChild(emu.elements.menu, e.target) || emu.isChild(emu.elements.menuToggle, e.target)) return;
            if (!emu.started || emu.elements.menu.classList.contains("ejs-menu_bar_hidden") || emu.isPopupOpen()) return;
            const width = emu.elements.parent.getBoundingClientRect().width;
            if (width > 575) return;
            clearTimeout(tmout);
            tmout = setTimeout(() => {
                ignoreEvents = false;
            }, 2000)
            ignoreEvents = true;
            emu.menu.close();
        })

        let paddingSet = false;
        //Now add buttons
        const addButton = (buttonConfig: any, callback: any, element?: any, both?: any) => {
            const button = emu.createElement("button");
            button.type = "button";
            const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("role", "presentation");
            svg.setAttribute("focusable", "false");
            svg.innerHTML = buttonConfig.icon;
            const text = emu.createElement("span");
            text.innerText = emu.localization(buttonConfig.displayName);
            if (paddingSet) text.classList.add("ejs-menu_text_right");
            text.classList.add("ejs-menu_text");

            button.classList.add("ejs-menu_button");
            button.appendChild(svg);
            button.appendChild(text);
            if (element) {
                element.appendChild(button);
            } else {
                emu.elements.menu.appendChild(button);
            }
            if (callback instanceof Function) {
                emu.addEventListener(button, "click", callback);
            }

            if (buttonConfig.callback instanceof Function) {
                emu.addEventListener(button, "click", buttonConfig.callback);
            }
            return both ? [button, svg, text] : button;
        }
        
        const restartButton = addButton(emu.config.buttonOpts.restart, () => {
            if (emu.isNetplay && emu.netplay.owner) {
                emu.gameManager.restart();
                emu.netplay.reset();
                emu.netplay.sendMessage({ restart: true });
                emu.play();
            } else if (!emu.isNetplay) {
                emu.gameManager.restart();
            }
        });
        const pauseButton = addButton(emu.config.buttonOpts.pause, () => {
            if (emu.isNetplay && emu.netplay.owner) {
                emu.pause();
                emu.gameManager.saveSaveFiles();
                emu.netplay.sendMessage({ pause: true });
            } else if (!emu.isNetplay) {
                emu.pause();
            }
        });
        const playButton = addButton(emu.config.buttonOpts.play, () => {
            if (emu.isNetplay && emu.netplay.owner) {
                emu.play();
                emu.netplay.sendMessage({ play: true });
            } else if (!emu.isNetplay) {
                emu.play();
            }
        });
        playButton.style.display = "none";
        emu.togglePlaying = (dontUpdate) => {
            emu.paused = !emu.paused;
            if (!dontUpdate) {
                if (emu.paused) {
                    pauseButton.style.display = "none";
                    playButton.style.display = "";
                } else {
                    pauseButton.style.display = "";
                    playButton.style.display = "none";
                }
            }
            emu.gameManager.toggleMainLoop(emu.paused ? 0 : 1);

            //I now realize its not easy to pause it while the cursor is locked, just in case I guess
            if (emu.enableMouseLock) {
                if (emu.canvas.exitPointerLock) {
                    emu.canvas.exitPointerLock();
                } else if (emu.canvas.mozExitPointerLock) {
                    emu.canvas.mozExitPointerLock();
                }
            }
        }
        emu.play = (dontUpdate) => {
            if (emu.paused) emu.togglePlaying(dontUpdate);
        }
        emu.pause = (dontUpdate) => {
            if (!emu.paused) emu.togglePlaying(dontUpdate);
        }

        let stateUrl;
        const saveState = addButton(emu.config.buttonOpts.saveState, async () => {
            let state;
            try {
                state = emu.gameManager.getState();
            } catch(e) {
                emu.displayMessage(emu.localization("FAILED TO SAVE STATE"));
                return;
            }
            const { screenshot, format } = await emu.takeScreenshot(emu.capture.photo.source, emu.capture.photo.format, emu.capture.photo.upscale);
            const called = emu.callEvent("saveState", {
                screenshot: screenshot,
                format: format,
                state: state
            });
            if (called > 0) return;
            if (stateUrl) URL.revokeObjectURL(stateUrl);
            if (emu.getSettingValue("save-state-location") === "browser" && emu.saveInBrowserSupported()) {
                emu.storage.states.put(emu.getBaseFileName() + ".state", state);
                emu.displayMessage(emu.localization("SAVED STATE TO BROWSER"));
            } else {
                const blob = new Blob([state]);
                stateUrl = URL.createObjectURL(blob);
                const a = emu.createElement("a");
                a.href = stateUrl;
                a.download = emu.getBaseFileName() + ".state";
                a.click();
            }
        });
        const loadState = addButton(emu.config.buttonOpts.loadState, async () => {
            const called = emu.callEvent("loadState");
            if (called > 0) return;
            if (emu.getSettingValue("save-state-location") === "browser" && emu.saveInBrowserSupported()) {
                emu.storage.states.get(emu.getBaseFileName() + ".state").then(e => {
                    emu.gameManager.loadState(e);
                    emu.displayMessage(emu.localization("LOADED STATE FROM BROWSER"));
                })
            } else {
                const file = await emu.selectFile();
                const state = new Uint8Array(await file.arrayBuffer());
                emu.gameManager.loadState(state);
            }
        });
        const controlMenu = addButton(emu.config.buttonOpts.gamepad, () => {
            emu.controlMenu.style.display = "";
        });
        const cheatMenu = addButton(emu.config.buttonOpts.cheat, () => {
            emu.cheatMenu.style.display = "";
        });

        const cache = addButton(emu.config.buttonOpts.cacheManager, () => {
            emu.openCacheMenu();
        });

        if (emu.config.cacheConfig.enabled === false) cache.style.display = "none";

        let savUrl;

        const saveSavFiles = addButton(emu.config.buttonOpts.saveSavFiles, async () => {
            const file = await emu.gameManager.getSaveFile();
            const { screenshot, format } = await emu.takeScreenshot(emu.capture.photo.source, emu.capture.photo.format, emu.capture.photo.upscale);
            const called = emu.callEvent("saveSave", {
                screenshot: screenshot,
                format: format,
                save: file
            });
            if (called > 0) return;
            const blob = new Blob([file]);
            savUrl = URL.createObjectURL(blob);
            const a = emu.createElement("a");
            a.href = savUrl;
            a.download = emu.gameManager.getSaveFilePath().split("/").pop();
            a.click();
        });
        const loadSavFiles = addButton(emu.config.buttonOpts.loadSavFiles, async () => {
            const called = emu.callEvent("loadSave");
            if (called > 0) return;
            const file = await emu.selectFile();
            const sav = new Uint8Array(await file.arrayBuffer());
            const path = emu.gameManager.getSaveFilePath();
            const paths = path.split("/");
            let cp = "";
            for (let i = 0; i < paths.length - 1; i++) {
                if (paths[i] === "") continue;
                cp += "/" + paths[i];
                if (!emu.gameManager.FS.analyzePath(cp).exists) emu.gameManager.FS.mkdir(cp);
            }
            if (emu.gameManager.FS.analyzePath(path).exists) emu.gameManager.FS.unlink(path);
            emu.gameManager.FS.writeFile(path, sav);
            emu.gameManager.loadSaveFiles();
        });
        const netplay = addButton(emu.config.buttonOpts.netplay, async () => {
            if (!emu.netplay) return;
            if (!emu.netplay.isMenuCreated()) {
                emu.netplay.createNetplayMenu();
            }
            emu.netplay.openMenu();
        });
        
        // add custom buttons
        // get all elements from emu.config.buttonOpts with custom: true
        if (emu.config.buttonOpts) {
            for (const [key, value] of Object.entries(emu.config.buttonOpts)) {
                if ((value as any).custom === true) {
                    const customBtn = addButton(value, (value as any).callback || (() => {}));
                }
            }
        }

        const spacer = emu.createElement("span");
        spacer.classList.add("ejs-menu_bar_spacer");
        emu.elements.menu.appendChild(spacer);
        paddingSet = true;

        const volumeSettings = emu.createElement("div");
        volumeSettings.classList.add("ejs-volume_parent");
        const muteButton = addButton(emu.config.buttonOpts.mute, () => {
            muteButton.style.display = "none";
            unmuteButton.style.display = "";
            emu.muted = true;
            emu.setVolume(0);
        }, volumeSettings);
        const unmuteButton = addButton(emu.config.buttonOpts.unmute, () => {
            if (emu.volume === 0) emu.volume = 0.5;
            muteButton.style.display = "";
            unmuteButton.style.display = "none";
            emu.muted = false;
            emu.setVolume(emu.volume);
        }, volumeSettings);
        unmuteButton.style.display = "none";

        const volumeSlider = emu.createElement("input");
        volumeSlider.setAttribute("data-range", "volume");
        volumeSlider.setAttribute("type", "range");
        volumeSlider.setAttribute("min", 0);
        volumeSlider.setAttribute("max", 1);
        volumeSlider.setAttribute("step", 0.01);
        volumeSlider.setAttribute("autocomplete", "off");
        volumeSlider.setAttribute("role", "slider");
        volumeSlider.setAttribute("aria-label", "Volume");
        volumeSlider.setAttribute("aria-valuemin", 0);
        volumeSlider.setAttribute("aria-valuemax", 100);

        emu.setVolume = (volume) => {
            emu.saveSettings();
            emu.muted = (volume === 0);
            volumeSlider.value = volume;
            volumeSlider.setAttribute("aria-valuenow", volume * 100);
            volumeSlider.setAttribute("aria-valuetext", (volume * 100).toFixed(1) + "%");
            volumeSlider.setAttribute("style", "--value: " + volume * 100 + "%;margin-left: 5px;position: relative;z-index: 2;");

            const skipLocalAudio = emu.isNetplay && emu.netplay && emu.netplay.setVolume(volume);

            if (!skipLocalAudio && emu.Module.AL && emu.Module.AL.currentCtx && emu.Module.AL.currentCtx.sources) {
                emu.Module.AL.currentCtx.sources.forEach(e => {
                    e.gain.gain.value = volume;
                })
            }
            if (!emu.config.buttonOpts || emu.config.buttonOpts.mute !== false) {
                unmuteButton.style.display = (volume === 0) ? "" : "none";
                muteButton.style.display = (volume === 0) ? "none" : "";
            }
        }

        emu.addEventListener(volumeSlider, "change mousemove touchmove mousedown touchstart mouseup", (e) => {
            setTimeout(() => {
                const newVal = parseFloat(volumeSlider.value);
                if (newVal === 0 && emu.muted) return;
                emu.volume = newVal;
                emu.setVolume(emu.volume);
            }, 5);
        })

        if (!emu.config.buttonOpts || emu.config.buttonOpts.volume !== false) {
            volumeSettings.appendChild(volumeSlider);
        }

        emu.elements.menu.appendChild(volumeSettings);

        const contextMenuButton = addButton(emu.config.buttonOpts.contextMenu, () => {
            if (emu.elements.contextmenu.style.display === "none") {
                emu.elements.contextmenu.style.display = "block";
                emu.elements.contextmenu.style.left = (Number(getComputedStyle(emu.elements.parent).width.split("px")[0]) / 2 - Number(getComputedStyle(emu.elements.contextmenu).width.split("px")[0]) / 2) + "px";
                emu.elements.contextmenu.style.top = (Number(getComputedStyle(emu.elements.parent).height.split("px")[0]) / 2 - Number(getComputedStyle(emu.elements.contextmenu).height.split("px")[0]) / 2) + "px";
                setTimeout(emu.menu.close.bind(this), 20);
            } else {
                emu.elements.contextmenu.style.display = "none";
            }
        });

        emu.diskParent = emu.createElement("div");
        emu.diskParent.id = "ejs_disksMenu";
        emu.disksMenuOpen = false;
        const diskButton = addButton(emu.config.buttonOpts.diskButton, () => {
            emu.disksMenuOpen = !emu.disksMenuOpen;
            diskButton[1].classList.toggle("ejs-svg_rotate", emu.disksMenuOpen);
            emu.disksMenu.style.display = emu.disksMenuOpen ? "" : "none";
            diskButton[2].classList.toggle("ejs-disks_text", emu.disksMenuOpen);
        }, emu.diskParent, true);
        emu.elements.menu.appendChild(emu.diskParent);
        emu.closeDisksMenu = () => {
            if (!emu.disksMenu) return;
            emu.disksMenuOpen = false;
            diskButton[1].classList.toggle("ejs-svg_rotate", emu.disksMenuOpen);
            diskButton[2].classList.toggle("ejs-disks_text", emu.disksMenuOpen);
            emu.disksMenu.style.display = "none";
        }
        emu.addEventListener(emu.elements.parent, "mousedown touchstart", (e) => {
            if (emu.isChild(emu.disksMenu, e.target)) return;
            if (e.pointerType === "touch") return;
            if (e.target === diskButton[0] || e.target === diskButton[2]) return;
            emu.closeDisksMenu();
        })

        emu.settingParent = emu.createElement("div");
        emu.settingsMenuOpen = false;
        const settingButton = addButton(emu.config.buttonOpts.settings, () => {
            emu.settingsMenuOpen = !emu.settingsMenuOpen;
            settingButton[1].classList.toggle("ejs-svg_rotate", emu.settingsMenuOpen);
            emu.settingsMenu.style.display = emu.settingsMenuOpen ? "" : "none";
            settingButton[2].classList.toggle("ejs-settings_text", emu.settingsMenuOpen);
        }, emu.settingParent, true);
        emu.elements.menu.appendChild(emu.settingParent);
        emu.closeSettingsMenu = () => {
            if (!emu.settingsMenu) return;
            emu.settingsMenuOpen = false;
            settingButton[1].classList.toggle("ejs-svg_rotate", emu.settingsMenuOpen);
            settingButton[2].classList.toggle("ejs-settings_text", emu.settingsMenuOpen);
            emu.settingsMenu.style.display = "none";
        }
        emu.addEventListener(emu.elements.parent, "mousedown touchstart", (e) => {
            if (emu.isChild(emu.settingsMenu, e.target)) return;
            if (e.pointerType === "touch") return;
            if (e.target === settingButton[0] || e.target === settingButton[2]) return;
            emu.closeSettingsMenu();
        })

        emu.addEventListener(emu.canvas, "click", (e) => {
            if (e.pointerType === "touch") return;
            if (emu.enableMouseLock && !emu.paused) {
                if (emu.canvas.requestPointerLock) {
                    emu.canvas.requestPointerLock();
                } else if (emu.canvas.mozRequestPointerLock) {
                    emu.canvas.mozRequestPointerLock();
                }
                emu.menu.close();
            }
        })

        const enter = addButton(emu.config.buttonOpts.enterFullscreen, () => {
            emu.toggleFullscreen(true);
        });
        const exit = addButton(emu.config.buttonOpts.exitFullscreen, () => {
            emu.toggleFullscreen(false);
        });
        exit.style.display = "none";

        emu.toggleFullscreen = (fullscreen) => {
            if (fullscreen) {
                if (emu.elements.parent.requestFullscreen) {
                    emu.elements.parent.requestFullscreen();
                } else if (emu.elements.parent.mozRequestFullScreen) {
                    emu.elements.parent.mozRequestFullScreen();
                } else if (emu.elements.parent.webkitRequestFullscreen) {
                    emu.elements.parent.webkitRequestFullscreen();
                } else if (emu.elements.parent.msRequestFullscreen) {
                    emu.elements.parent.msRequestFullscreen();
                }
                exit.style.display = "";
                enter.style.display = "none";
                if (emu.isMobile) {
                    try {
                        screen.orientation.lock(emu.getCore(true) === "nds" ? "portrait" : "landscape").catch(e => {});
                    } catch(e) {}
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    (document as any).webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    (document as any).mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    (document as any).msExitFullscreen();
                }
                exit.style.display = "none";
                enter.style.display = "";
                if (emu.isMobile) {
                    try {
                        screen.orientation.unlock();
                    } catch(e) {}
                }
            }
        }

        let exitMenuIsOpen = false;
        const exitEmulation = addButton(emu.config.buttonOpts.exitEmulation, async () => {
            if (exitMenuIsOpen) return;
            if (emu.config.askBeforeExit !== false) {
                exitMenuIsOpen = true;
                const popups = emu.createSubPopup();
                emu.game.appendChild(popups[0]);
                popups[1].classList.add("ejs-cheat_parent");
                popups[1].style.width = "100%";
                const popup = popups[1];
                const header = emu.createElement("div");
                header.classList.add("ejs-cheat_header");
                const title = emu.createElement("h2");
                title.innerText = emu.localization("Are you sure you want to exit?");
                title.classList.add("ejs-cheat_heading");
                const close = emu.createElement("button");
                close.classList.add("ejs-cheat_close");
                header.appendChild(title);
                header.appendChild(close);
                popup.appendChild(header);
                emu.addEventListener(close, "click", (e) => {
                    exitMenuIsOpen = false
                    popups[0].remove();
                })
                popup.appendChild(emu.createElement("br"));

                const footer = emu.createElement("footer");
                const submit = emu.createElement("button");
                const closeButton = emu.createElement("button");
                submit.innerText = emu.localization("Exit");
                closeButton.innerText = emu.localization("Cancel");
                submit.classList.add("ejs-button_button");
                closeButton.classList.add("ejs-button_button");
                submit.classList.add("ejs-popup_submit");
                closeButton.classList.add("ejs-popup_submit");
                submit.style["background-color"] = "rgba(var(--ejs-primary-color),1)";
                footer.appendChild(submit);
                const span = emu.createElement("span");
                span.innerText = " ";
                footer.appendChild(span);
                footer.appendChild(closeButton);
                popup.appendChild(footer);

                emu.addEventListener(closeButton, "click", (e) => {
                    popups[0].remove();
                    exitMenuIsOpen = false
                })

                emu.addEventListener(submit, "click", (e) => {
                    popups[0].remove();
                    const body = emu.createPopup("EmulatorJS has exited", {});
                    setTimeout(() => {
                        emu.callEvent("exit");
                    }, 20);
                })
                setTimeout(emu.menu.close.bind(this), 20);
            } else {
                const body = emu.createPopup("EmulatorJS has exited", {});
                setTimeout(() => {
                    emu.callEvent("exit");
                }, 20);
            }
        });

        emu.addEventListener(document, "webkitfullscreenchange mozfullscreenchange fullscreenchange", (e) => {
            if (e.target !== emu.elements.parent) return;
            if (document.fullscreenElement === null) {
                exit.style.display = "none";
                enter.style.display = "";
            } else {
                //not sure if this is possible, lets put it here anyways
                exit.style.display = "";
                enter.style.display = "none";
            }
        })

        const hasFullscreen = !!(emu.elements.parent.requestFullscreen || emu.elements.parent.mozRequestFullScreen || emu.elements.parent.webkitRequestFullscreen || emu.elements.parent.msRequestFullscreen);

        if (!hasFullscreen) {
            exit.style.display = "none";
            enter.style.display = "none";
        }

        emu.elements.bottomBar = {
            playPause: [pauseButton, playButton],
            restart: [restartButton],
            settings: [settingButton],
            contextMenu: [contextMenuButton],
            fullscreen: [enter, exit],
            saveState: [saveState],
            loadState: [loadState],
            gamepad: [controlMenu],
            cheat: [cheatMenu],
            cacheManager: [cache],
            saveSavFiles: [saveSavFiles],
            loadSavFiles: [loadSavFiles],
            netplay: [netplay],
            exit: [exitEmulation]
        }

        if (emu.config.buttonOpts) {
            if (emu.debug) console.log(emu.config.buttonOpts);
            if (emu.config.buttonOpts.playPause.visible === false) {
                pauseButton.style.display = "none";
                playButton.style.display = "none";
            }
            if (emu.config.buttonOpts.contextMenu.visible === false && emu.config.buttonOpts.rightClick !== false && emu.isMobile === false) contextMenuButton.style.display = "none"
            if (emu.config.buttonOpts.restart.visible === false) restartButton.style.display = "none"
            if (emu.config.buttonOpts.settings.visible === false) settingButton[0].style.display = "none"
            if (emu.config.buttonOpts.fullscreen.visible === false) {
                enter.style.display = "none";
                exit.style.display = "none";
            }
            if (emu.config.buttonOpts.mute.visible === false) {
                muteButton.style.display = "none";
                unmuteButton.style.display = "none";
            }
            if (emu.config.buttonOpts.saveState.visible === false) saveState.style.display = "none";
            if (emu.config.buttonOpts.loadState.visible === false) loadState.style.display = "none";
            if (emu.config.buttonOpts.saveSavFiles.visible === false) saveSavFiles.style.display = "none";
            if (emu.config.buttonOpts.loadSavFiles.visible === false) loadSavFiles.style.display = "none";
            if (emu.config.buttonOpts.gamepad.visible === false) controlMenu.style.display = "none";
            if (emu.config.buttonOpts.cheat.visible === false) cheatMenu.style.display = "none";
            if (emu.config.buttonOpts.cacheManager.visible === false) cache.style.display = "none";
            if (emu.config.buttonOpts.netplay.visible === false) netplay.style.display = "none";
            if (emu.config.buttonOpts.diskButton.visible === false) diskButton[0].style.display = "none";
            if (emu.config.buttonOpts.volumeSlider.visible === false) volumeSlider.style.display = "none";
            if (emu.config.buttonOpts.exitEmulation.visible === false) exitEmulation.style.display = "none";
        }

        emu.menu.failedToStart = () => {
            if (!emu.config.buttonOpts) emu.config.buttonOpts = {};
            emu.config.buttonOpts.mute = false;

            settingButton[0].style.display = "";

            // Hide all except settings button.
            pauseButton.style.display = "none";
            playButton.style.display = "none";
            contextMenuButton.style.display = "none";
            restartButton.style.display = "none";
            enter.style.display = "none";
            exit.style.display = "none";
            muteButton.style.display = "none";
            unmuteButton.style.display = "none";
            saveState.style.display = "none";
            loadState.style.display = "none";
            saveSavFiles.style.display = "none";
            loadSavFiles.style.display = "none";
            controlMenu.style.display = "none";
            cheatMenu.style.display = "none";
            cache.style.display = "none";
            netplay.style.display = "none";
            diskButton[0].style.display = "none";
            volumeSlider.style.display = "none";
            exitEmulation.style.display = "none";

            emu.elements.menu.style.opacity = "";
            emu.elements.menu.style.background = "transparent";
            emu.virtualGamepad.style.display = "none";
            settingButton[0].classList.add("shadow");
            emu.menu.open(true);
        }

        // === StateStore subscriptions — reactive DOM updates ===
        if (emu._stateStore) {
            emu._stateStore.on('paused', (paused) => {
                if (paused) {
                    pauseButton.style.display = 'none';
                    playButton.style.display = '';
                } else {
                    pauseButton.style.display = '';
                    playButton.style.display = 'none';
                }
            });
            emu._stateStore.on('volume', (vol) => {
                volumeSlider.value = vol;
            });
            emu._stateStore.on('muted', (muted) => {
                muteButton.style.display = muted ? 'none' : '';
                unmuteButton.style.display = muted ? '' : 'none';
            });
        }
    }
