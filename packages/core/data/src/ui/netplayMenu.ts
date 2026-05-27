// [ui/netplayMenu.ts] 联机菜单 UI
// 职责：构建联机菜单 DOM 结构、房间列表、玩家表格、聊天界面、对话框
// 不负责：WebRTC 连接、Socket.IO 信令、输入同步（由 engine/netplay.ts 处理）

/**
 * NetplayMenuUI — encapsulates all netplay DOM construction and manipulation.
 * Accepts references to the EmulatorJS instance and the Netplay engine instance
 * so UI callbacks can delegate to engine logic while keeping DOM code in ui/.
 */
export class NetplayMenuUI {
    /** Reference to the EmulatorJS instance (for createElement, localization, events) */
    private emu: any;
    /** Reference to the Netplay engine instance (for logic callbacks) */
    private netplay: any;

    // DOM element references — populated by createNetplayMenu()
    _menuElement: any = null;
    createButton: any = null;
    _roomsDiv: any = null;
    _joinedDiv: any = null;
    _tbody: any = null;
    _tbody2: any = null;
    _password: any = null;
    _title2: any = null;
    _chatWrap: any = null;
    _chatLog: any = null;
    _chatTo: any = null;
    _chatInput: any = null;
    _chatSend: any = null;
    _chatBound: boolean = false;
    _warningShown: boolean = false;

    // Aliases set in openMenu — used by engine logic methods
    table: any = null;
    playerTable: any = null;
    passwordElem: any = null;
    roomNameElem: any = null;
    tabs: any[] = [];
    chatWrap: any = null;
    chatLog: any = null;
    chatTo: any = null;
    chatInput: any = null;
    chatSendBtn: any = null;

    constructor(emu: any, netplay: any) {
        this.emu = emu;
        this.netplay = netplay;
    }

    isMenuOpen(): boolean {
        return !!(this._menuElement && this._menuElement.style.display !== "none");
    }

    /** Toggle visibility of UI elements based on host/guest role */
    updateNetplayUI(isJoining: boolean) {
        if (!this.emu.elements.bottomBar) return;
        const bar = this.emu.elements.bottomBar;
        const shouldHide = isJoining && !this.netplay.owner;
        const elems = [
            ...(bar.playPause || []), ...(bar.restart || []), ...(bar.saveState || []),
            ...(bar.loadState || []), ...(bar.cheat || []), ...(bar.saveSavFiles || []),
            ...(bar.loadSavFiles || []), ...(bar.exit || []), ...(bar.contextMenu || []),
            ...(bar.cacheManager || [])
        ];
        if (bar.settings && bar.settings.length > 0 && bar.settings[0].parentElement) elems.push(bar.settings[0].parentElement);
        if (this.emu.diskParent) elems.push(this.emu.diskParent);
        elems.forEach((el: HTMLElement) => { if (el) el.classList.toggle("netplay-hidden", shouldHide); });
    }

    /** Build the netplay menu popup with room list, chat, and player table */
    createNetplayMenu() {
        const body = this.emu.createPopup("Netplay", {
            "Create a Room": () => {
                this.netplay._unlockMobileAudio();
                if (!this.netplay.updateList) this.netplay.defineNetplayFunctions();
                if (this.emu.isNetplay) this.netplay.leaveRoom();
                else this.netplay.showOpenRoomDialog();
            },
            "Close": () => {
                this._menuElement.style.display = "none";
                if (this.netplay.updateList) this.netplay.updateList.stop();
            }
        }, true);

        this._menuElement = body.parentElement;
        this.createButton = this._menuElement.getElementsByTagName("a")[0];

        // Room list section
        const rooms = this.emu.createElement("div");
        const title = this.emu.createElement("strong");
        title.innerText = this.emu.localization("Rooms");

        const table = this.emu.createElement("table");
        table.classList.add("ejs-netplay_table");
        table.style.width = "100%";
        table.setAttribute("cellspacing", "0");

        const thead = this.emu.createElement("thead");
        const row = this.emu.createElement("tr");
        const addToHeader = (text: string) => {
            const item = this.emu.createElement("td");
            item.innerText = text;
            item.style.textAlign = "center";
            row.appendChild(item);
            return item;
        };
        thead.appendChild(row);
        addToHeader("Room Name").style.textAlign = "left";
        addToHeader("Players").style.width = "80px";
        addToHeader("").style.width = "80px";
        table.appendChild(thead);

        const tbody = this.emu.createElement("tbody");
        table.appendChild(tbody);
        rooms.appendChild(title);
        rooms.appendChild(table);

        // Joined room section
        const joined = this.emu.createElement("div");
        const title2 = this.emu.createElement("strong");
        title2.innerText = "{roomname}";

        const password = this.emu.createElement("div");
        password.innerText = "Password: ";

        const table2 = this.emu.createElement("table");
        table2.classList.add("ejs-netplay_table");
        table2.style.width = "100%";
        table2.setAttribute("cellspacing", "0");

        const thead2 = this.emu.createElement("thead");
        const row2 = this.emu.createElement("tr");
        const addToHeader2 = (text: string) => {
            const item = this.emu.createElement("td");
            item.innerText = text;
            row2.appendChild(item);
            return item;
        };
        thead2.appendChild(row2);
        addToHeader2("Player").style.width = "80px";
        addToHeader2("Name");
        addToHeader2("").style.width = "80px";
        table2.appendChild(thead2);

        const tbody2 = this.emu.createElement("tbody");
        table2.appendChild(tbody2);
        joined.appendChild(title2);
        joined.appendChild(password);
        joined.appendChild(table2);

        // Chat UI
        const chatWrap = this.emu.createElement("div");
        chatWrap.classList.add("ejs-netplay_chat_container");
        chatWrap.style.marginTop = "10px";

        const chatHeaderRow = this.emu.createElement("div");
        chatHeaderRow.classList.add("ejs-netplay_chat_header_row");
        chatWrap.appendChild(chatHeaderRow);

        const chatTitle = this.emu.createElement("strong");
        chatTitle.innerText = this.emu.localization("Chat");
        chatHeaderRow.appendChild(chatTitle);

        const chatHint = this.emu.createElement("span");
        chatHint.classList.add("ejs-netplay_chat_hint");
        chatHint.innerText = this.emu.localization("Everyone or private");
        chatHeaderRow.appendChild(chatHint);

        const chatLog = this.emu.createElement("div");
        chatLog.classList.add("ejs-netplay_chat_log");
        chatWrap.appendChild(chatLog);

        const chatRow = this.emu.createElement("div");
        chatRow.classList.add("ejs-netplay_chat_row");
        chatWrap.appendChild(chatRow);

        const chatTo = this.emu.createElement("select");
        chatTo.classList.add("ejs-netplay_chat_to");
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.innerText = this.emu.localization("Everyone");
        chatTo.appendChild(optAll);
        chatRow.appendChild(chatTo);

        const chatInput = this.emu.createElement("input");
        chatInput.type = "text";
        chatInput.maxLength = 300;
        chatInput.placeholder = this.emu.localization("Type a message...");
        chatInput.classList.add("ejs-netplay_chat_input");
        chatRow.appendChild(chatInput);

        const chatSend = this.emu.createElement("button");
        chatSend.classList.add("ejs-button_button");
        chatSend.style.height = "34px";
        chatSend.style.minWidth = "70px";
        chatSend.innerText = this.emu.localization("Send");
        chatRow.appendChild(chatSend);

        joined.appendChild(chatWrap);
        joined.style.display = "none";
        body.appendChild(rooms);
        body.appendChild(joined);

        // Store references
        this._roomsDiv = rooms;
        this._joinedDiv = joined;
        this._tbody = tbody;
        this._tbody2 = tbody2;
        this._password = password;
        this._title2 = title2;
        this._chatWrap = chatWrap;
        this._chatLog = chatLog;
        this._chatTo = chatTo;
        this._chatInput = chatInput;
        this._chatSend = chatSend;

        this.openMenu = () => {
            if (this.emu.netplayShowTurnWarning && !this._warningShown) {
                const warningDiv = this.emu.createElement("div");
                warningDiv.className = "ejs-netplay_warning";
                warningDiv.innerText = "Warning: No TURN server configured. Netplay connections may fail.";
                const menuBody = this._menuElement.querySelector(".ejs_popup_body");
                if (menuBody) {
                    menuBody.prepend(warningDiv);
                    this._warningShown = true;
                }
            }

            this._menuElement.style.display = "";
            this.table = this._tbody;
            this.playerTable = this._tbody2;
            this.passwordElem = this._password;
            this.roomNameElem = this._title2;
            this.tabs = [this._roomsDiv, this._joinedDiv];
            this.chatWrap = this._chatWrap;
            this.chatLog = this._chatLog;
            this.chatTo = this._chatTo;
            this.chatInput = this._chatInput;
            this.chatSendBtn = this._chatSend;

            if (!this.netplay.name) {
                this._showNamePrompt();
            }

            if (!this.netplay.updateList) this.netplay.defineNetplayFunctions();
            this.bindChatUI();
            this.chatRefreshRecipients();
            this.netplay.updateList.start();
        };
    }

    /** Prompt for player name if not already set */
    private _showNamePrompt() {
        const popups = this.emu.createSubPopup();
        this._menuElement.appendChild(popups[0]);
        popups[1].classList.add("ejs-cheat_parent");
        const popup = popups[1];

        const header = this.emu.createElement("div");
        const nameTitle = this.emu.createElement("h2");
        nameTitle.innerText = this.emu.localization("Set Player Name");
        nameTitle.classList.add("ejs-netplay_name_heading");
        header.appendChild(nameTitle);
        popup.appendChild(header);

        const main = this.emu.createElement("div");
        main.classList.add("ejs-netplay_header");
        const head = this.emu.createElement("strong");
        head.innerText = this.emu.localization("Player Name");
        const input = this.emu.createElement("input");
        input.type = "text";
        input.setAttribute("maxlength", 20);

        main.appendChild(head);
        main.appendChild(this.emu.createElement("br"));
        main.appendChild(input);
        popup.appendChild(main);
        popup.appendChild(this.emu.createElement("br"));

        const buttonRow = this.emu.createElement("div");
        buttonRow.style.display = "flex";
        buttonRow.style.justifyContent = "center";
        buttonRow.style.gap = "10px";
        popup.appendChild(buttonRow);

        const submit = this.emu.createElement("button");
        submit.classList.add("ejs-button_button", "ejs-popup_submit");
        submit.style.backgroundColor = "rgba(var(--ejs-primary-color),1)";
        submit.innerText = this.emu.localization("Submit");
        buttonRow.appendChild(submit);

        const cancel = this.emu.createElement("button");
        cancel.classList.add("ejs-button_button", "ejs-popup_submit");
        cancel.innerText = this.emu.localization("Cancel");
        buttonRow.appendChild(cancel);

        const closeNamePopup = () => popups[0].remove();

        this.emu.addEventListener(submit, "click", () => {
            if (!input.value.trim()) return;
            this.netplay.name = input.value.trim();
            closeNamePopup();
        });

        this.emu.addEventListener(cancel, "click", () => {
            closeNamePopup();
            this._menuElement.style.display = "none";
            if (this.netplay.updateList) this.netplay.updateList.stop();
        });

        this.emu.addEventListener(input, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                submit.click();
            } else if (e.key === "Escape") {
                e.preventDefault();
                cancel.click();
            }
        });

        setTimeout(() => input.focus(), 0);
    }

    /** Update room list table from server response */
    updateTableList() {
        if (!this.table) return Promise.resolve(undefined);
        return this.netplay.getOpenRooms().then((rooms: Record<string, any>) => {
            this.table.innerHTML = "";
            for (const k in rooms) {
                ((id: string, r: any) => {
                    const row = this.emu.createElement("tr");
                    row.classList.add("ejs-netplay_table_row");
                    const c1 = this.emu.createElement("td");
                    c1.innerText = r.room_name; c1.style.textAlign = "left"; c1.style.padding = "10px 0";
                    const c2 = this.emu.createElement("td");
                    c2.innerText = r.current + "/" + r.max; c2.style.width = "80px"; c2.style.textAlign = "center";
                    const c3 = this.emu.createElement("td");
                    c3.style.width = "80px";
                    if (r.current < r.max) {
                        const btn = this.emu.createElement("button");
                        btn.classList.add("ejs-netplay_join_button", "ejs-button_button");
                        btn.style.backgroundColor = "rgba(var(--ejs-primary-color),1)";
                        btn.innerText = this.emu.localization("Join");
                        c3.appendChild(btn);
                        this.emu.addEventListener(btn, "click", () => {
                            this.netplay._ensureRemoteAudioContext();
                            if (r.hasPassword) this.showJoinPasswordDialog(id, r.room_name, r.max);
                            else this.netplay.joinRoom(id, r.room_name, r.max, null);
                        });
                    }
                    row.appendChild(c1); row.appendChild(c2); row.appendChild(c3);
                    this.table.appendChild(row);
                })(k, rooms[k]);
            }
        }).catch(() => {});
    }

    /** Update player table in joined room view */
    updatePlayersTable() {
        if (!this.playerTable) return;
        this.playerTable.innerHTML = "";
        let i = 0;
        const keys = Object.keys(this.netplay.players || {});
        keys.forEach((k: string) => {
            const row = this.emu.createElement("tr");
            const values = [i + 1, this.netplay.players[k].player_name || "Unknown", i === 0 ? keys.length + "/" + (this.netplay.maxPlayers || "?") : ""];
            values.forEach((t: string) => {
                const td = this.emu.createElement("td");
                td.innerText = t;
                row.appendChild(td);
            });
            this.playerTable.appendChild(row);
            i++;
        });
        this.chatRefreshRecipients();
    }

    /** Show dialog to create a new room */
    showOpenRoomDialog() {
        if (!this.emu.createSubPopup) return;
        this.emu.originalControls = JSON.parse(JSON.stringify(this.emu.controls));
        const popups = this.emu.createSubPopup();
        this._menuElement.appendChild(popups[0]);
        popups[1].classList.add("ejs-cheat_parent");
        const title = this.emu.createElement("h2");
        title.innerText = this.emu.localization("Create a room");
        title.classList.add("ejs-netplay_name_heading");
        popups[1].appendChild(title);
        const form = this.emu.createElement("div");
        form.classList.add("ejs-netplay_header");
        const ni = this.emu.createElement("input"); ni.type = "text"; ni.maxLength = 20;
        const ms = this.emu.createElement("select");
        ["2", "3", "4"].forEach((v) => { const o = document.createElement("option"); o.value = v; o.innerText = v; ms.appendChild(o); });
        const pw = this.emu.createElement("input"); pw.type = "text"; pw.maxLength = 20;
        [["Room Name", ni], ["Max Players", ms], ["Password (optional)", pw]].forEach((item: any[]) => {
            const s = this.emu.createElement("strong");
            s.innerText = this.emu.localization(item[0]);
            form.appendChild(s); form.appendChild(this.emu.createElement("br")); form.appendChild(item[1]);
        });
        popups[1].appendChild(form);
        const sub = this.emu.createElement("button");
        sub.classList.add("ejs-button_button", "ejs-popup_submit");
        sub.style.backgroundColor = "rgba(var(--ejs-primary-color),1)";
        sub.style.margin = "10px";
        sub.innerText = this.emu.localization("Submit");
        this.emu.addEventListener(sub, "click", () => {
            const n = ni.value.trim();
            if (n) { this.netplay.openRoom(n, parseInt(ms.value, 10), pw.value.trim()); popups[0].remove(); }
        });
        const cls = this.emu.createElement("button");
        cls.classList.add("ejs-button_button", "ejs-popup_submit");
        cls.style.margin = "10px";
        cls.innerText = this.emu.localization("Close");
        this.emu.addEventListener(cls, "click", () => { popups[0].remove(); });
        popups[1].appendChild(sub); popups[1].appendChild(cls);
    }

    /** Show password dialog for protected rooms */
    showJoinPasswordDialog(roomId: string, roomName: string, maxPlayers: number) {
        if (!this.emu.createSubPopup) return;
        const popups = this.emu.createSubPopup();
        this._menuElement.appendChild(popups[0]);
        popups[1].classList.add("ejs-cheat_parent");
        const title = this.emu.createElement("h2");
        title.innerText = this.emu.localization("Enter Password");
        title.classList.add("ejs-netplay_name_heading");
        popups[1].appendChild(title);
        const form = this.emu.createElement("div");
        form.classList.add("ejs-netplay_header");
        const roomLabel = this.emu.createElement("div");
        roomLabel.classList.add("ejs-netplay_dialog_label");
        roomLabel.innerText = this.emu.localization("Room") + ": " + roomName;
        form.appendChild(roomLabel);
        const pwLabel = this.emu.createElement("strong");
        pwLabel.innerText = this.emu.localization("Password");
        form.appendChild(pwLabel); form.appendChild(this.emu.createElement("br"));
        const pwInput = this.emu.createElement("input");
        pwInput.type = "password"; pwInput.maxLength = 20; pwInput.placeholder = this.emu.localization("Enter room password");
        form.appendChild(pwInput);
        popups[1].appendChild(form);
        const buttonRow = this.emu.createElement("div");
        buttonRow.classList.add("ejs-netplay_dialog_buttons");
        const joinBtn = this.emu.createElement("button");
        joinBtn.classList.add("ejs-button_button", "ejs-popup_submit");
        joinBtn.style.backgroundColor = "rgba(var(--ejs-primary-color),1)";
        joinBtn.innerText = this.emu.localization("Join");
        const cancelBtn = this.emu.createElement("button");
        cancelBtn.classList.add("ejs-button_button", "ejs-popup_submit");
        cancelBtn.innerText = this.emu.localization("Cancel");

        this.emu.addEventListener(joinBtn, "click", () => {
            this.netplay._ensureRemoteAudioContext();
            const pw = pwInput.value.trim();
            popups[0].remove();
            if (pw) this.netplay.joinRoom(roomId, roomName, maxPlayers, pw);
        });
        this.emu.addEventListener(cancelBtn, "click", () => { popups[0].remove(); });
        this.emu.addEventListener(pwInput, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                this.netplay._ensureRemoteAudioContext();
                const pw = pwInput.value.trim();
                popups[0].remove();
                if (pw) this.netplay.joinRoom(roomId, roomName, maxPlayers, pw);
            }
            if (e.key === "Escape") popups[0].remove();
        });
        buttonRow.appendChild(joinBtn); buttonRow.appendChild(cancelBtn); popups[1].appendChild(buttonRow);
        setTimeout(() => pwInput.focus(), 50);
    }

    /** Show error dialog when join fails */
    showJoinErrorDialog(roomId: string, roomName: string, maxPlayers: number, errorMessage: string, hadPassword: boolean) {
        if (!this.emu.createSubPopup) {
            this.emu.displayMessage(this.emu.localization("Join error") + ": " + errorMessage, 5000);
            return;
        }
        const popups = this.emu.createSubPopup();
        this._menuElement.appendChild(popups[0]);
        popups[1].classList.add("ejs-cheat_parent");
        const title = this.emu.createElement("h2");
        title.innerText = this.emu.localization("Unable to Join");
        title.classList.add("ejs-netplay_name_heading");
        popups[1].appendChild(title);
        const content = this.emu.createElement("div");
        content.classList.add("ejs-netplay_header");
        const roomLabel = this.emu.createElement("div");
        roomLabel.classList.add("ejs-netplay_dialog_label");
        roomLabel.innerText = this.emu.localization("Room") + ": " + roomName;
        content.appendChild(roomLabel);
        const errorBox = this.emu.createElement("div");
        errorBox.classList.add("ejs-netplay_error_box");
        errorBox.innerText = errorMessage;
        content.appendChild(errorBox);
        popups[1].appendChild(content);
        const buttonRow = this.emu.createElement("div");
        buttonRow.classList.add("ejs-netplay_dialog_buttons");

        if (hadPassword) {
            const retryBtn = this.emu.createElement("button");
            retryBtn.classList.add("ejs-button_button", "ejs-popup_submit");
            retryBtn.style.backgroundColor = "rgba(var(--ejs-primary-color),1)";
            retryBtn.innerText = this.emu.localization("Try Again");
            this.emu.addEventListener(retryBtn, "click", () => {
                popups[0].remove();
                this.showJoinPasswordDialog(roomId, roomName, maxPlayers);
            });
            buttonRow.appendChild(retryBtn);
        }

        const closeBtn = this.emu.createElement("button");
        closeBtn.classList.add("ejs-button_button", "ejs-popup_submit");
        closeBtn.innerText = this.emu.localization("Close");
        this.emu.addEventListener(closeBtn, "click", () => { popups[0].remove(); });
        buttonRow.appendChild(closeBtn);
        popups[1].appendChild(buttonRow);
    }

    /** Append a message to the chat log */
    chatAppend(payload: any) {
        if (!this.chatLog) return;
        const name = payload && payload.player_name ? payload.player_name : "Player";
        const msg = payload && payload.message ? payload.message : "";
        const to = payload && payload.to ? payload.to : "all";
        const line = document.createElement("div");
        if (to && to !== "all") {
            line.textContent = name + " (private): " + msg;
            line.style.opacity = "0.95";
        } else {
            line.textContent = name + ": " + msg;
        }
        this.chatLog.appendChild(line);
        this.chatLog.scrollTop = this.chatLog.scrollHeight;
    }

    /** Refresh chat recipient dropdown with current players */
    chatRefreshRecipients() {
        if (!this.chatTo) return;
        const sel = this.chatTo;
        const prev = sel.value || "all";
        sel.innerHTML = "";
        const optAll = document.createElement("option");
        optAll.value = "all";
        optAll.innerText = this.emu.localization("Everyone");
        sel.appendChild(optAll);
        const players = this.netplay.players || {};
        Object.keys(players).forEach((userid: string) => {
            const p = players[userid];
            const opt = document.createElement("option");
            opt.value = userid;
            opt.innerText = p.player_name || "Player";
            sel.appendChild(opt);
        });
        const stillExists = Array.from(sel.options).some((o: HTMLOptionElement) => o.value === prev);
        sel.value = stillExists ? prev : "all";
    }

    /** Bind event listeners to chat UI elements */
    bindChatUI() {
        if (this._chatBound) return;
        if (!this._chatSend || !this._chatInput) return;
        this._chatBound = true;
        this.emu.addEventListener(this._chatSend, "click", () => { this.netplay.chatSendMessage(); });
        this.emu.addEventListener(this._chatInput, "keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") { e.preventDefault(); this.netplay.chatSendMessage(); }
        });
    }

    /** Called when the menu should open — bound after construction */
    openMenu: (() => void) | null = null;
}
