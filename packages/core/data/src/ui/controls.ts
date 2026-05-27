// [ui/controls.js] 控制设置面板\n// 职责：构建手柄/键盘按键映射设置界面\n// 不负责：输入事件的捕获与映射（由 input/ 层处理）

export function createControlSettingMenu(emu) {
        let buttonListeners = [];
        emu.checkGamepadInputs = () => buttonListeners.forEach(elem => elem());
        emu.gamepadLabels = [];
        emu.gamepadSelection = [];
        emu.controls = JSON.parse(JSON.stringify(emu.defaultControllers));
        const body = emu.createPopup("Control Settings", {
            "Reset": () => {
                emu.stopAllAutofire();
                emu.controls = JSON.parse(JSON.stringify(emu.defaultControllers));
                emu.setupKeys();
                emu.checkGamepadInputs();
                emu.saveSettings();
            },
            "Clear": () => {
                emu.stopAllAutofire();
                emu.controls = { 0: {}, 1: {}, 2: {}, 3: {} };
                emu.setupKeys();
                emu.checkGamepadInputs();
                emu.saveSettings();
            },
            "Close": () => {
                emu.controlMenu.style.display = "none";
            }
        }, true);
        emu.setupKeys();
        emu.controlMenu = body.parentElement;
        body.classList.add("ejs-control_body");

        let buttons;
        if ("gb" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("nes" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
            if (emu.getCore() === "nestopia") {
                buttons.push({ id: 10, label: emu.localization("SWAP DISKS") });
            } else {
                buttons.push({ id: 10, label: emu.localization("SWAP DISKS") });
                buttons.push({ id: 11, label: emu.localization("EJECT/INSERT DISK") });
            }
        } else if ("snes" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 9, label: emu.localization("X") },
                { id: 1, label: emu.localization("Y") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
            ];
        } else if ("n64" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("A") },
                { id: 1, label: emu.localization("B") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("D-PAD UP") },
                { id: 5, label: emu.localization("D-PAD DOWN") },
                { id: 6, label: emu.localization("D-PAD LEFT") },
                { id: 7, label: emu.localization("D-PAD RIGHT") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 12, label: emu.localization("Z") },
                { id: 19, label: emu.localization("STICK UP") },
                { id: 18, label: emu.localization("STICK DOWN") },
                { id: 17, label: emu.localization("STICK LEFT") },
                { id: 16, label: emu.localization("STICK RIGHT") },
                { id: 23, label: emu.localization("C-PAD UP") },
                { id: 22, label: emu.localization("C-PAD DOWN") },
                { id: 21, label: emu.localization("C-PAD LEFT") },
                { id: 20, label: emu.localization("C-PAD RIGHT") },
            ];
        } else if ("gba" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("nds" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 9, label: emu.localization("X") },
                { id: 1, label: emu.localization("Y") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 14, label: emu.localization("Microphone") },
            ];
        } else if ("vb" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("LEFT D-PAD UP") },
                { id: 5, label: emu.localization("LEFT D-PAD DOWN") },
                { id: 6, label: emu.localization("LEFT D-PAD LEFT") },
                { id: 7, label: emu.localization("LEFT D-PAD RIGHT") },
                { id: 19, label: emu.localization("RIGHT D-PAD UP") },
                { id: 18, label: emu.localization("RIGHT D-PAD DOWN") },
                { id: 17, label: emu.localization("RIGHT D-PAD LEFT") },
                { id: 16, label: emu.localization("RIGHT D-PAD RIGHT") },
            ];
        } else if (["segaMD", "segaCD", "sega32x"].includes(emu.getControlScheme())) {
            buttons = [
                { id: 1, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 8, label: emu.localization("C") },
                { id: 10, label: emu.localization("X") },
                { id: 9, label: emu.localization("Y") },
                { id: 11, label: emu.localization("Z") },
                { id: 3, label: emu.localization("START") },
                { id: 2, label: emu.localization("MODE") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("segaMS" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("BUTTON 1 / START") },
                { id: 8, label: emu.localization("BUTTON 2") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("segaGG" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("BUTTON 1") },
                { id: 8, label: emu.localization("BUTTON 2") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("segaSaturn" === emu.getControlScheme()) {
            buttons = [
                { id: 1, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 8, label: emu.localization("C") },
                { id: 9, label: emu.localization("X") },
                { id: 10, label: emu.localization("Y") },
                { id: 11, label: emu.localization("Z") },
                { id: 12, label: emu.localization("L") },
                { id: 13, label: emu.localization("R") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("3do" === emu.getControlScheme()) {
            buttons = [
                { id: 1, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 8, label: emu.localization("C") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 2, label: emu.localization("X") },
                { id: 3, label: emu.localization("P") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("atari2600" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("FIRE") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("RESET") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("LEFT DIFFICULTY A") },
                { id: 12, label: emu.localization("LEFT DIFFICULTY B") },
                { id: 11, label: emu.localization("RIGHT DIFFICULTY A") },
                { id: 13, label: emu.localization("RIGHT DIFFICULTY B") },
                { id: 14, label: emu.localization("COLOR") },
                { id: 15, label: emu.localization("B/W") },
            ];
        } else if ("atari7800" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("BUTTON 1") },
                { id: 8, label: emu.localization("BUTTON 2") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("PAUSE") },
                { id: 9, label: emu.localization("RESET") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("LEFT DIFFICULTY") },
                { id: 11, label: emu.localization("RIGHT DIFFICULTY") },
            ];
        } else if ("lynx" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 10, label: emu.localization("OPTION 1") },
                { id: 11, label: emu.localization("OPTION 2") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("jaguar" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 1, label: emu.localization("C") },
                { id: 2, label: emu.localization("PAUSE") },
                { id: 3, label: emu.localization("OPTION") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("pce" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("I") },
                { id: 0, label: emu.localization("II") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("RUN") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("ngp" === emu.getControlScheme()) {
            buttons = [
                { id: 0, label: emu.localization("A") },
                { id: 8, label: emu.localization("B") },
                { id: 3, label: emu.localization("OPTION") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("ws" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("A") },
                { id: 0, label: emu.localization("B") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("X UP") },
                { id: 5, label: emu.localization("X DOWN") },
                { id: 6, label: emu.localization("X LEFT") },
                { id: 7, label: emu.localization("X RIGHT") },
                { id: 13, label: emu.localization("Y UP") },
                { id: 12, label: emu.localization("Y DOWN") },
                { id: 10, label: emu.localization("Y LEFT") },
                { id: 11, label: emu.localization("Y RIGHT") },
            ];
        } else if ("coleco" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("LEFT BUTTON") },
                { id: 0, label: emu.localization("RIGHT BUTTON") },
                { id: 9, label: emu.localization("1") },
                { id: 1, label: emu.localization("2") },
                { id: 11, label: emu.localization("3") },
                { id: 10, label: emu.localization("4") },
                { id: 13, label: emu.localization("5") },
                { id: 12, label: emu.localization("6") },
                { id: 15, label: emu.localization("7") },
                { id: 14, label: emu.localization("8") },
                { id: 2, label: emu.localization("*") },
                { id: 3, label: emu.localization("#") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("pcfx" === emu.getControlScheme()) {
            buttons = [
                { id: 8, label: emu.localization("I") },
                { id: 0, label: emu.localization("II") },
                { id: 9, label: emu.localization("III") },
                { id: 1, label: emu.localization("IV") },
                { id: 10, label: emu.localization("V") },
                { id: 11, label: emu.localization("VI") },
                { id: 3, label: emu.localization("RUN") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 12, label: emu.localization("MODE1") },
                { id: 13, label: emu.localization("MODE2") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
            ];
        } else if ("psp" === emu.getControlScheme()) {
            buttons = [
                { id: 9, label: emu.localization("\u25B3") }, // △
                { id: 1, label: emu.localization("\u25A1") }, // □
                { id: 0, label: emu.localization("\uFF58") }, // ｘ
                { id: 8, label: emu.localization("\u25CB") }, // ○
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 19, label: emu.localization("STICK UP") },
                { id: 18, label: emu.localization("STICK DOWN") },
                { id: 17, label: emu.localization("STICK LEFT") },
                { id: 16, label: emu.localization("STICK RIGHT") },
            ];
        } else if ("psx" === emu.getControlScheme()) {
            buttons = [
                { id: 9, label: emu.localization("\u25B3") }, // △
                { id: 1, label: emu.localization("\u25A1") }, // □
                { id: 0, label: emu.localization("\uFF58") }, // ｘ
                { id: 8, label: emu.localization("\u25CB") }, // ○
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 10, label: emu.localization("L1") },
                { id: 11, label: emu.localization("R1") },
                { id: 12, label: emu.localization("L2") },
                { id: 13, label: emu.localization("R2") },
                { id: 19, label: emu.localization("L STICK UP") },
                { id: 18, label: emu.localization("L STICK DOWN") },
                { id: 17, label: emu.localization("L STICK LEFT") },
                { id: 16, label: emu.localization("L STICK RIGHT") },
                { id: 23, label: emu.localization("R STICK UP") },
                { id: 22, label: emu.localization("R STICK DOWN") },
                { id: 21, label: emu.localization("R STICK LEFT") },
                { id: 20, label: emu.localization("R STICK RIGHT") },
            ];
        } else {
            buttons = [
                { id: 0, label: emu.localization("B") },
                { id: 1, label: emu.localization("Y") },
                { id: 2, label: emu.localization("SELECT") },
                { id: 3, label: emu.localization("START") },
                { id: 4, label: emu.localization("UP") },
                { id: 5, label: emu.localization("DOWN") },
                { id: 6, label: emu.localization("LEFT") },
                { id: 7, label: emu.localization("RIGHT") },
                { id: 8, label: emu.localization("A") },
                { id: 9, label: emu.localization("X") },
                { id: 10, label: emu.localization("L") },
                { id: 11, label: emu.localization("R") },
                { id: 12, label: emu.localization("L2") },
                { id: 13, label: emu.localization("R2") },
                { id: 14, label: emu.localization("L3") },
                { id: 15, label: emu.localization("R3") },
                { id: 19, label: emu.localization("L STICK UP") },
                { id: 18, label: emu.localization("L STICK DOWN") },
                { id: 17, label: emu.localization("L STICK LEFT") },
                { id: 16, label: emu.localization("L STICK RIGHT") },
                { id: 23, label: emu.localization("R STICK UP") },
                { id: 22, label: emu.localization("R STICK DOWN") },
                { id: 21, label: emu.localization("R STICK LEFT") },
                { id: 20, label: emu.localization("R STICK RIGHT") },
            ];
        }
        if (["arcade", "mame"].includes(emu.getControlScheme())) {
            for (const buttonIdx in buttons) {
                if (buttons[buttonIdx].id === 2) {
                    buttons[buttonIdx].label = emu.localization("INSERT COIN");
                }
            }
        }
        buttons.push(
            { id: 24, label: emu.localization("QUICK SAVE STATE") },
            { id: 25, label: emu.localization("QUICK LOAD STATE") },
            { id: 26, label: emu.localization("CHANGE STATE SLOT") },
            { id: 27, label: emu.localization("FAST FORWARD") },
            { id: 29, label: emu.localization("SLOW MOTION") },
            { id: 28, label: emu.localization("REWIND") }
        );
        let nums = [];
        for (let i = 0; i < buttons.length; i++) {
            nums.push(buttons[i].id);
        }
        for (let i = 0; i < 30; i++) {
            if (!nums.includes(i)) {
                delete emu.defaultControllers[0][i];
                delete emu.defaultControllers[1][i];
                delete emu.defaultControllers[2][i];
                delete emu.defaultControllers[3][i];
                delete emu.controls[0][i];
                delete emu.controls[1][i];
                delete emu.controls[2][i];
                delete emu.controls[3][i];
            }
        }

        //if (_emu.statesSupported === false) {
        //    delete buttons[24];
        //    delete buttons[25];
        //    delete buttons[26];
        //}
        let selectedPlayer;
        let players = [];
        let playerDivs = [];

        const playerSelect = emu.createElement("ul");
        playerSelect.classList.add("ejs-control_player_bar");
        for (let i = 1; i < 5; i++) {
            const playerContainer = emu.createElement("li");
            playerContainer.classList.add("tabs-title");
            playerContainer.setAttribute("role", "presentation");
            const player = emu.createElement("a");
            player.innerText = emu.localization("Player") + " " + i;
            player.setAttribute("role", "tab");
            player.setAttribute("aria-controls", "controls-" + (i - 1));
            player.setAttribute("aria-selected", "false");
            player.id = "controls-" + (i - 1) + "-label";
            emu.addEventListener(player, "click", (e) => {
                e.preventDefault();
                players[selectedPlayer].classList.remove("ejs-control_selected");
                playerDivs[selectedPlayer].setAttribute("hidden", "");
                selectedPlayer = i - 1;
                players[i - 1].classList.add("ejs-control_selected");
                playerDivs[i - 1].removeAttribute("hidden");
            })
            playerContainer.appendChild(player);
            playerSelect.appendChild(playerContainer);
            players.push(playerContainer);
        }
        body.appendChild(playerSelect);

        const controls = emu.createElement("div");
        for (let i = 0; i < 4; i++) {
            if (!emu.controls[i]) emu.controls[i] = {};
            const player = emu.createElement("div");
            const playerTitle = emu.createElement("div");

            const gamepadTitle = emu.createElement("div");
            gamepadTitle.innerText = emu.localization("Connected Gamepad") + ": ";

            const gamepadName = emu.createElement("select");
            gamepadName.classList.add("ejs-gamepad_dropdown");
            gamepadName.setAttribute("title", "gamepad-" + i);
            gamepadName.setAttribute("index", i);
            emu.gamepadLabels.push(gamepadName);
            emu.gamepadSelection.push("");
            emu.addEventListener(gamepadName, "change", e => {
                const controller = e.target.value;
                const player = parseInt(e.target.getAttribute("index"));
                if (controller === "notconnected") {
                    emu.gamepadSelection[player] = "";
                } else {
                    for (let i = 0; i < emu.gamepadSelection.length; i++) {
                        if (player === i) continue;
                        if (emu.gamepadSelection[i] === controller) {
                            emu.gamepadSelection[i] = "";
                        }
                    }
                    emu.gamepadSelection[player] = controller;
                    emu.updateGamepadLabels();
                }
            });
            const def = emu.createElement("option");
            def.setAttribute("value", "notconnected");
            def.innerText = "Not Connected";
            gamepadName.appendChild(def);
            gamepadTitle.appendChild(gamepadName);
            gamepadTitle.classList.add("ejs-gamepad_section");

            const leftPadding = emu.createElement("div");
            leftPadding.style = "width:25%;float:left;";
            leftPadding.innerHTML = "&nbsp;";

            const aboutParent = emu.createElement("div");
            aboutParent.style = "font-size:12px;width:40%;float:left;";
            const gamepad = emu.createElement("div");
            gamepad.style = "text-align:center;width:50%;float:left;";
            gamepad.innerText = emu.localization("Gamepad");
            aboutParent.appendChild(gamepad);
            const keyboard = emu.createElement("div");
            keyboard.style = "text-align:center;width:50%;float:left;";
            keyboard.innerText = emu.localization("Keyboard");
            aboutParent.appendChild(keyboard);

            const setHeader = emu.createElement("div");
            setHeader.style = "font-size:12px;width:15%;float:left;text-align:center;";
            setHeader.innerHTML = "&nbsp;";

            const autofireHeader = emu.createElement("div");
            autofireHeader.style = "font-size:12px;width:20%;float:left;text-align:center;";
            autofireHeader.innerText = emu.localization("Autofire");

            const headingPadding = emu.createElement("div");
            headingPadding.style = "clear:both;";

            playerTitle.appendChild(gamepadTitle);
            playerTitle.appendChild(leftPadding);
            playerTitle.appendChild(aboutParent);
            playerTitle.appendChild(setHeader);
            playerTitle.appendChild(autofireHeader);

            if ((emu.touch || emu.hasTouchScreen) && i === 0) {
                const vgp = emu.createElement("div");
                vgp.style = "width:25%;float:right;clear:none;padding:0;font-size: 11px;padding-left: 2.25rem;";
                vgp.classList.add("ejs-control_row");
                vgp.classList.add("ejs-cheat_row");
                const input = emu.createElement("input");
                input.type = "checkbox";
                input.checked = true;
                input.value = "o";
                input.id = "ejs_vp";
                vgp.appendChild(input);
                const label = emu.createElement("label");
                label.for = "ejs_vp";
                label.innerText = "Virtual Gamepad";
                vgp.appendChild(label);
                label.addEventListener("click", (e) => {
                    input.checked = !input.checked;
                    emu.changeSettingOption("virtual-gamepad", input.checked ? "enabled" : "disabled");
                })
                emu.on("start", (e) => {
                    if (emu.getSettingValue("virtual-gamepad") === "disabled") {
                        input.checked = false;
                    }
                })
                playerTitle.appendChild(vgp);
            }

            playerTitle.appendChild(headingPadding);

            player.appendChild(playerTitle);

            for (const buttonIdx in buttons) {
                const k = buttons[buttonIdx].id;
                const controlLabel = buttons[buttonIdx].label;

                const buttonText = emu.createElement("div");
                buttonText.setAttribute("data-id", k);
                buttonText.setAttribute("data-index", i);
                buttonText.setAttribute("data-label", controlLabel);
                buttonText.style = "margin-bottom:10px;";
                buttonText.classList.add("ejs-control_bar");

                const title = emu.createElement("div");
                title.style = "width:25%;float:left;font-size:12px;";
                const label = emu.createElement("label");
                label.innerText = controlLabel + ":";
                title.appendChild(label);

                const textBoxes = emu.createElement("div");
                textBoxes.style = "width:40%;float:left;";

                const textBox1Parent = emu.createElement("div");
                textBox1Parent.style = "width:50%;float:left;padding: 0 5px;";
                const textBox1 = emu.createElement("input");
                textBox1.style = "text-align:center;height:25px;width: 100%;";
                textBox1.type = "text";
                textBox1.setAttribute("readonly", "");
                textBox1.setAttribute("placeholder", "");
                textBox1Parent.appendChild(textBox1);

                const textBox2Parent = emu.createElement("div");
                textBox2Parent.style = "width:50%;float:left;padding: 0 5px;";
                const textBox2 = emu.createElement("input");
                textBox2.style = "text-align:center;height:25px;width: 100%;";
                textBox2.type = "text";
                textBox2.setAttribute("readonly", "");
                textBox2.setAttribute("placeholder", "");
                textBox2Parent.appendChild(textBox2);

                buttonListeners.push(() => {
                    textBox2.value = "";
                    textBox1.value = "";
                    if (emu.controls[i][k] && emu.controls[i][k].value !== undefined) {
                        let value = emu.keyMap[emu.controls[i][k].value];
                        value = emu.localization(value);
                        textBox2.value = value;
                    }
                    if (emu.controls[i][k] && emu.controls[i][k].value2 !== undefined && emu.controls[i][k].value2 !== "") {
                        let value2 = emu.controls[i][k].value2.toString();
                        if (value2.includes(":")) {
                            value2 = value2.split(":");
                            value2 = emu.localization(value2[0]) + ":" + emu.localization(value2[1])
                        } else if (!isNaN(value2)) {
                            value2 = emu.localization("BUTTON") + " " + emu.localization(value2);
                        } else {
                            value2 = emu.localization(value2);
                        }
                        textBox1.value = value2;
                    }
                })

                if (emu.controls[i][k] && emu.controls[i][k].value) {
                    let value = emu.keyMap[emu.controls[i][k].value];
                    value = emu.localization(value);
                    textBox2.value = value;
                }
                if (emu.controls[i][k] && emu.controls[i][k].value2) {
                    let value2 = emu.controls[i][k].value2.toString();
                    if (value2.includes(":")) {
                        value2 = value2.split(":");
                        value2 = emu.localization(value2[0]) + ":" + emu.localization(value2[1])
                    } else if (!isNaN(value2)) {
                        value2 = emu.localization("BUTTON") + " " + emu.localization(value2);
                    } else {
                        value2 = emu.localization(value2);
                    }
                    textBox1.value = value2;
                }

                textBoxes.appendChild(textBox1Parent);
                textBoxes.appendChild(textBox2Parent);

                const padding = emu.createElement("div");
                padding.style = "clear:both;";
                textBoxes.appendChild(padding);

                const setButton = emu.createElement("div");
                setButton.style = "width:15%;float:left;";
                const button = emu.createElement("a");
                button.classList.add("ejs-control_set_button");
                button.innerText = emu.localization("Set");
                setButton.appendChild(button);

                // Autofire checkbox - not available for analog stick axes
                const autofireColumn = emu.createElement("div");
                autofireColumn.style = "width:20%;float:left;text-align:center;";

                if (!emu.analogAxes.includes(k)) {
                    const autofireCheckbox = emu.createElement("input");
                    autofireCheckbox.type = "checkbox";
                    autofireCheckbox.style = "cursor:pointer;";
                    autofireCheckbox.checked = emu.controls[i][k] && emu.controls[i][k].autofire === true;
                    autofireCheckbox.setAttribute("data-player", i);
                    autofireCheckbox.setAttribute("data-button", k);

                    // Update checkbox state when controls change
                    buttonListeners.push(() => {
                        autofireCheckbox.checked = emu.controls[i][k] && emu.controls[i][k].autofire === true;
                    });

                    emu.addEventListener(autofireCheckbox, "change", (e) => {
                        e.stopPropagation();
                        const playerIdx = parseInt(e.target.getAttribute("data-player"));
                        const buttonIdx = parseInt(e.target.getAttribute("data-button"));
                        if (!emu.controls[playerIdx][buttonIdx]) {
                            emu.controls[playerIdx][buttonIdx] = {};
                        }
                        emu.controls[playerIdx][buttonIdx].autofire = e.target.checked;
                        // Stop any active autofire if unchecked
                        if (!e.target.checked) {
                            emu.stopAutofire(playerIdx, buttonIdx);
                        }
                        emu.saveSettings();
                    });

                    autofireColumn.appendChild(autofireCheckbox);
                }

                const padding2 = emu.createElement("div");
                padding2.style = "clear:both;";

                buttonText.appendChild(title);
                buttonText.appendChild(textBoxes);
                buttonText.appendChild(setButton);
                buttonText.appendChild(autofireColumn);
                buttonText.appendChild(padding2);

                player.appendChild(buttonText);

                emu.addEventListener(buttonText, "mousedown", (e) => {
                    // Don't open popup when clicking on the autofire checkbox
                    if (e.target.tagName === "INPUT" && e.target.type === "checkbox") {
                        return;
                    }
                    e.preventDefault();
                    emu.controlPopup.parentElement.parentElement.removeAttribute("hidden");
                    emu.controlPopup.innerText = "[ " + controlLabel + " ]\n" + emu.localization("Press Keyboard");
                    emu.controlPopup.setAttribute("button-num", k);
                    emu.controlPopup.setAttribute("player-num", i);
                })
            }
            controls.appendChild(player);
            player.setAttribute("hidden", "");
            playerDivs.push(player);
        }
        body.appendChild(controls);

        selectedPlayer = 0;
        players[0].classList.add("ejs-control_selected");
        playerDivs[0].removeAttribute("hidden");

        const popup = emu.createElement("div");
        popup.classList.add("ejs-popup_container");
        const popupMsg = emu.createElement("div");
        emu.addEventListener(popup, "mousedown click touchstart", (e) => {
            if (emu.isChild(popupMsg, e.target)) return;
            emu.controlPopup.parentElement.parentElement.setAttribute("hidden", "");
        })
        const btn = emu.createElement("a");
        btn.classList.add("ejs-control_set_button");
        btn.innerText = emu.localization("Clear");
        emu.addEventListener(btn, "mousedown click touchstart", (e) => {
            const num = emu.controlPopup.getAttribute("button-num");
            const player = emu.controlPopup.getAttribute("player-num");
            if (!emu.controls[player][num]) {
                emu.controls[player][num] = {};
            }
            emu.controls[player][num].value = 0;
            emu.controls[player][num].value2 = "";
            emu.controlPopup.parentElement.parentElement.setAttribute("hidden", "");
            emu.checkGamepadInputs();
            emu.saveSettings();
        })
        popupMsg.classList.add("ejs-popup_box");
        popupMsg.innerText = "";
        popup.setAttribute("hidden", "");
        const popMsg = emu.createElement("div");
        emu.controlPopup = popMsg;
        popup.appendChild(popupMsg);
        popupMsg.appendChild(popMsg);
        popupMsg.appendChild(emu.createElement("br"));
        popupMsg.appendChild(btn);
        emu.controlMenu.appendChild(popup);
}

export function initControlVars(emu) {
        emu.defaultControllers = {
            0: {
                0: {
                    "value": "x",
                    "value2": "BUTTON_2"
                },
                1: {
                    "value": "s",
                    "value2": "BUTTON_4"
                },
                2: {
                    "value": "v",
                    "value2": "SELECT"
                },
                3: {
                    "value": "enter",
                    "value2": "START"
                },
                4: {
                    "value": "up arrow",
                    "value2": "DPAD_UP"
                },
                5: {
                    "value": "down arrow",
                    "value2": "DPAD_DOWN"
                },
                6: {
                    "value": "left arrow",
                    "value2": "DPAD_LEFT"
                },
                7: {
                    "value": "right arrow",
                    "value2": "DPAD_RIGHT"
                },
                8: {
                    "value": "z",
                    "value2": "BUTTON_1"
                },
                9: {
                    "value": "a",
                    "value2": "BUTTON_3"
                },
                10: {
                    "value": "q",
                    "value2": "LEFT_TOP_SHOULDER"
                },
                11: {
                    "value": "e",
                    "value2": "RIGHT_TOP_SHOULDER"
                },
                12: {
                    "value": "tab",
                    "value2": "LEFT_BOTTOM_SHOULDER"
                },
                13: {
                    "value": "r",
                    "value2": "RIGHT_BOTTOM_SHOULDER"
                },
                14: {
                    "value": "",
                    "value2": "LEFT_STICK",
                },
                15: {
                    "value": "",
                    "value2": "RIGHT_STICK",
                },
                16: {
                    "value": "h",
                    "value2": "LEFT_STICK_X:+1"
                },
                17: {
                    "value": "f",
                    "value2": "LEFT_STICK_X:-1"
                },
                18: {
                    "value": "g",
                    "value2": "LEFT_STICK_Y:+1"
                },
                19: {
                    "value": "t",
                    "value2": "LEFT_STICK_Y:-1"
                },
                20: {
                    "value": "l",
                    "value2": "RIGHT_STICK_X:+1"
                },
                21: {
                    "value": "j",
                    "value2": "RIGHT_STICK_X:-1"
                },
                22: {
                    "value": "k",
                    "value2": "RIGHT_STICK_Y:+1"
                },
                23: {
                    "value": "i",
                    "value2": "RIGHT_STICK_Y:-1"
                },
                24: {
                    "value": "1"
                },
                25: {
                    "value": "2"
                },
                26: {
                    "value": "3"
                },
                27: {},
                28: {},
                29: {},
            },
            1: {},
            2: {},
            3: {}
        }
        // Analog stick axes - these use 0x7fff values and don't support autofire
        emu.analogAxes = [16, 17, 18, 19, 20, 21, 22, 23];
        emu.keyMap = {
            0: "",
            8: "backspace",
            9: "tab",
            13: "enter",
            16: "shift",
            17: "ctrl",
            18: "alt",
            19: "pause/break",
            20: "caps lock",
            27: "escape",
            32: "space",
            33: "page up",
            34: "page down",
            35: "end",
            36: "home",
            37: "left arrow",
            38: "up arrow",
            39: "right arrow",
            40: "down arrow",
            45: "insert",
            46: "delete",
            48: "0",
            49: "1",
            50: "2",
            51: "3",
            52: "4",
            53: "5",
            54: "6",
            55: "7",
            56: "8",
            57: "9",
            65: "a",
            66: "b",
            67: "c",
            68: "d",
            69: "e",
            70: "f",
            71: "g",
            72: "h",
            73: "i",
            74: "j",
            75: "k",
            76: "l",
            77: "m",
            78: "n",
            79: "o",
            80: "p",
            81: "q",
            82: "r",
            83: "s",
            84: "t",
            85: "u",
            86: "v",
            87: "w",
            88: "x",
            89: "y",
            90: "z",
            91: "left window key",
            92: "right window key",
            93: "select key",
            96: "numpad 0",
            97: "numpad 1",
            98: "numpad 2",
            99: "numpad 3",
            100: "numpad 4",
            101: "numpad 5",
            102: "numpad 6",
            103: "numpad 7",
            104: "numpad 8",
            105: "numpad 9",
            106: "multiply",
            107: "add",
            109: "subtract",
            110: "decimal point",
            111: "divide",
            112: "f1",
            113: "f2",
            114: "f3",
            115: "f4",
            116: "f5",
            117: "f6",
            118: "f7",
            119: "f8",
            120: "f9",
            121: "f10",
            122: "f11",
            123: "f12",
            144: "num lock",
            145: "scroll lock",
            186: "semi-colon",
            187: "equal sign",
            188: "comma",
            189: "dash",
            190: "period",
            191: "forward slash",
            192: "grave accent",
            219: "open bracket",
            220: "back slash",
            221: "close braket",
            222: "single quote"
        }
}
