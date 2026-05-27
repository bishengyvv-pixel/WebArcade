# emulator.ts 进一步拆分方案

> 编制日期：2026-05-27
> 目标：将 2074 行的 `data/src/emulator.ts` 拆分为多层模块，编辑器类降至 400 行以内

---

## 1. 当前状态诊断

```
emulator.ts 总行数: 2074
├── 类声明 + Property Declarations  90 行 (4%)
├── downloadFile 方法             148 行 (7%)
├── 其他类方法（纯委托占多数）     96 行 (5%)
└── constructor 内部             1740 行 (84%)  ← 核心问题
```

### 问题不是缺少拆分，而是拆分不均匀

Phase 1（docs/improvement-plan.md）已经将 UI 渲染、输入处理、引擎逻辑提取到了独立目录。但从整个 constructor（1740 行）来看，中型的编排管线仍然以 `this.xxx = (...) => { ... }` 形式内联。

### constructor 内部责任清单

```
constructor 内部 (~1740 行)
├─ 属性初始化 + EJS_SETUP + StateStore          ~45 行
├─ 设备检测 (isMobile/hasTouchScreen)             ~30 行  内联箭头函数
├─ Canvas 创建 + 捕获参数默认值                    ~25 行
├─ 广告初始化                                     ~5 行
├─ WebGL2 检测                                     ~10 行  内联箭头函数
├─ 存储初始化 (EJS_Cache/EJS_Download/EJS_STORAGE) ~25 行
├─ 作弊静态码处理                                  ~15 行
├─ 创建启动按钮 + handleResize                      ~15 行
├─ 整个模拟器启动流程 (通过点击启动按钮触发)     ~1450 行  六个大型内联回调和两个大方法
│   ├─ downloadGameCore (L674-820)                ~147 行  类方法，含内联 gotCore 和 this.processCore
│   ├─ download (L883-1032)                       ~150 行  类方法，含内联 writeFilesToFS
│   ├─ initModule (L1180-1229)                    ~50 行   类方法
│   ├─ startGame (L1232-1294)                     ~63 行   类方法
│   ├─ checkStarted (L1295-1321)                  ~27 行   类方法
│   └─ bindListeners (L1322-1423)                 ~102 行  类方法，16 个事件绑定
└─ 结束 (constructor 的 })                        ~1 行
```

### 哪些方法仍然是 delegating thin-wrapper?

下面这些方法**已经**委托到子模块了，只是留在 emulator.ts 里作为调用转发：

- `setupAds` / `adBlocked` → `ui/ads.ts`
- `on` / `off` / `callEvent` → `core/events.ts`
- `createLink` / `buildButtonOptions` → `ui/menu.ts`
- `createPopup` / `closePopup` / `displayMessage` / `showInputPrompt` → `ui/popup.ts`
- `createContextMenu` → `ui/contextMenu.ts`
- `createBottomMenuBar` → `ui/bottomBar.ts`
- `openCacheMenu` / `populateCacheList` → `ui/cacheMenu.ts`
- `createControlSettingMenu` / `initControlVars` → `ui/controls.ts`
- `setupSettingsMenu` → `ui/settings.ts`
- `setupDisksMenu` → `ui/disks.ts`
- `createCheatsMenu` → `ui/cheats.ts`
- `screenshot` / `takeScreenshot` → `ui/screenshot.ts`
- `keyLookup` / `keyChange` → `input/keyboard.ts`
- `gamepadEvent` → `input/gamepad.ts`
- `getAutofireInterval` / `isAutofireEnabled` / `startAutofire` / `stopAutofire` / `stopAllAutofire` → `input/autofire.ts`
- `setVirtualGamepad` → `ui/gamepad.ts`
- `preGetSetting` / `menuOptionChanged` / `getSettingValue` → `core/config.ts`

这些 thin-wrapper 可以保留或通过更优雅的方式消除，但不是本次拆分的重点。

---

## 2. 拆分方案

### 2.1 新增模块

| 新文件 | 目录 | 职责 | 来源 | 预估行数 |
|---|---|---|---|---|
| `core/download.ts` | core/ | ROM/核心/状态/BIOS/Patch 的下载管线 | constructor 中的 download 方法 (L883-1032) | ~220 |
| `core/coreLoader.ts` | core/ | 核心下载、解压、校验、CDN 回退 | downloadGameCore + processCore + initGameCore (L674-828) | ~200 |
| `core/romLoader.ts` | core/ | ROM 文件选择、CUE 生成、启动调度 | selectRomFile + startGameFromDownload + downloadFiles + startGame (L1080-1294) | ~180 |
| `core/moduleInit.ts` | core/ | Emscripten WASM 模块初始化 | initModule (L1180-1229) | ~80 |
| `core/bindListeners.ts` | core/ | 所有顶层事件绑定 | bindListeners (L1322-1423) | ~150 |
| `core/settingsPersistence.ts` | core/ | 设置/saveSettings/loadSettings/getCoreSettings/getLocalStorageKey | 当前 emulator.ts 中的设置相关方法 | ~150 |

### 2.2 可在现有目录内吸收的代码

| 代码块 | 目标文件 | 说明 |
|---|---|---|
| `isMobile` 检测 (L387-399) | `core/setup.ts` 或 `utils.ts` | 纯函数，不依赖状态 |
| `hasTouchScreen` 检测 (L400-413) | `core/setup.ts` 或 `utils.ts` | 同上 |
| `webgl2Enabled` 检测 (L440-448) | `core/setup.ts` | 同上 |
| `setColor` (L534-559) | `ui/dom.ts` 新增 `setAccentColor` | DOM 操作 |
| `getColor` 内联函数 (L536-553) | 合并到 `setColor` 中或独立 `utils.ts` | 纯 hex 解析 |
| `createStartButton` (L593-633) | `ui/menu.ts` 新增 `createStartButton` | 纯 DOM 构建 |
| `startGameError` (L661-672) | `ui/dom.ts` 新增 `showStartError` | 大部分 DOM 操作 |
| `checkSupportedOpts` (L1425-1436) | `ui/menu.ts` 或 `ui/bottomBar.ts` | 纯 DOM 操作 |
| `updateGamepadLabels` (L1437-1452) | `ui/gamepad.ts` | 纯 DOM 操作 |
| `selectFile` (L1477-1486) | `ui/dom.ts` 新增 `promptFileInput` | 纯 DOM 操作 |
| `isPopupOpen` (L1487-1492) | `ui/popup.ts` | 纯 DOM 查询 |
| `isChild` (L1493-1504) | `ui/dom.ts` | 纯 DOM 工具 |
| `handleResize` (L1569-1587) | `ui/dom.ts` 新增 `handleResize` | 纯 DOM 操作 |
| `getElementSize` (L1588-1600) | `ui/dom.ts` | 纯 DOM 操作 |
| `checkStarted` (L1295-1321) | `ui/popup.ts` 新增 `showiOSResumePopup` | 纯 UI + 平台检测 |
| `screenRecord` (L1958-2041) | `ui/screenshot.ts` | 屏幕录制逻辑 |
| `collectScreenRecordingMediaTracks` (L1916-1956) | `ui/screenshot.ts` | 媒体流收集 |
| `updateCheatUI` (L1826-1873) | `ui/cheats.ts` | 纯 DOM 构建 |
| `cheatChanged` (L1875-1878) | `ui/cheats.ts` | 薄委托 |
| `enableShader` (L1880-1906) | `engine/shaders.ts` | 纯文件系统 + WASM |
| `enableSaveUpdateEvent` (L2043-2071) | `core/events.ts` 或独立 `core/saveEvents.ts` | 事件绑定 |

### 2.3 保留在 emulator.ts 中的内容

编辑器类最终只保留：
- 属性声明和类型标注
- StateStore getter/setter
- 构造函数：**调用各模块初始化**，而不是内联实现
- thin-wrapper 委托方法（保持向后兼容）
- `handleSpecialOptions`（设置分发中心，目前 ~92 行，可以考虑独立但非必须）

---

## 3. 实施步骤（按优先级）

### Phase 1：提取核心管线到 `core/` 目录

**目标：constructor 从 1740 行 → 250 行**

1. **`core/coreLoader.ts`** — `downloadGameCore` + `processCore` + `initGameCore`
   - 移动 `downloadGameCore()` (L674-820)，包括内联 `gotCore` 和 `this.processCore` 赋值
   - 移动 `initGameCore()` (L822-828)
   - 导出 `downloadGameCore(emulator)` 函数

2. **`core/download.ts`** — `download` 方法的游戏管线部分
   - 移动 `download()` (L883-1032)，包括内联 `writeFilesToFS`
   - 导出 `downloadGame(emulator, url, type)` 函数

3. **`core/romLoader.ts`** — ROM 文件选择与启动
   - 移动 `selectRomFile()` (L1080-1144)
   - 移动 `startGameFromDownload()` (L1150-1160)
   - 移动 `downloadFiles()` (L1165-1177)
   - 移动 `startGame()` (L1232-1294)
   - 导出 `downloadAndStartGame(emulator)` 函数

4. **`core/moduleInit.ts`** — Emscripten WASM 初始化
   - 移动 `initModule()` (L1180-1229)
   - 导出 `initWasmModule(emulator, wasmData, threadData)` 函数

5. **`core/bindListeners.ts`** — 事件绑定
   - 移动 `bindListeners()` (L1322-1423)
   - 导出 `bindAllListeners(emulator)` 函数

完成 Phase 1 后，启动按钮的回调变为：
```typescript
button.onclick = async () => {
    await downloadGameCore(this);
    // initModule 由 downloadGameCore → initGameCore 内部调用
    // downloadFiles 由 initModule 的回调调用
    // startGame 由 downloadFiles → startGameFromDownload 内部调用
    bindAllListeners(this);
};
```

### Phase 2：提取工具函数到 target modules

**目标：减少 thin-wrapper，emulator.ts 方法数从 ~55 个 → ~30 个**

1. **`core/settingsPersistence.ts`**
   - 移动 `saveSettings()` (L1602-1616)
   - 移动 `getLocalStorageKey()` (L1617-1629)
   - 移动 `getCoreSettings()` (L1633-1666)
   - 移动 `loadSettings()` (L1668-1710)
   - emulator.ts 保留 thin-wrapper 调用新函数

2. **设备检测 → `core/setup.ts`** 或 `utils.ts`
   - 提取 `isMobile()` 为纯函数
   - 提取 `hasTouchScreen()` 为纯函数
   - 提取 `checkWebGL2()` 为纯函数

3. **UI 片段迁移**
   - `createStartButton` → `ui/menu.ts`
   - `startGameError` → `ui/dom.ts`
   - `checkStarted` → `ui/popup.ts`
   - `screenRecord` + `collectScreenRecordingMediaTracks` → `ui/screenshot.ts`
   - `updateCheatUI` + `cheatChanged` → `ui/cheats.ts`
   - `updateGamepadLabels` → `ui/gamepad.ts`
   - `handleResize` + `getElementSize` → `ui/dom.ts`
   - `selectFile` + `isPopupOpen` + `isChild` → `ui/dom.ts`

4. **引擎片段迁移**
   - `enableShader` → `engine/shaders.ts`
   - `enableSaveUpdateEvent` → `core/saveEvents.ts`（或并入 `core/events.ts`）

### Phase 3：Constructor 最终净化

**目标：constructor 保持初始化顺序和调用关系，所有实现细节委托给模块**

完成 Phase 1+2 后 constructor 的结构：

```
constructor(element, config) {
    // === 基本属性初始化 (~20 行) ===
    this.ejs_version = CONSTS.version;
    this.debug = config.debug;
    this.config = config;
    
    // === 设置初始化 (~15 行) ===
    this.setup = new EJS_SETUP(this);
    this.setup.checkDeprecatedSettings();
    ...
    
    // === 状态管理 (~5 行) ===
    this._stateStore = new StateStore({ ... });
    
    // === 设备 & 环境检测 (纯函数调用) (~10 行) ===
    this.isMobile = detectMobile(this.config.browserMode);
    this.hasTouchScreen = detectTouchScreen();
    this.webgl2Enabled = detectWebGL2(this.config);
    
    // === DOM 构建 (~15 行) ===
    this.setElements(element);
    this.setColor(this.config.color || "");
    this.setupAds(this.config.adUrl, ...);
    this.canvas = createCanvas();
    
    // === 存储初始化 (~10 行) ===
    this.storageCache = new EJS_Cache(...);
    this.downloader = new EJS_Download(this.storageCache, this);
    
    // === 输入 & UI 初始化 (~20 行) ===
    if (this.netplayEnabled) this.netplay = new Netplay(this);
    this.handleResize();
    this.bindAllListeners();
    
    // === 最后：创建启动按钮 + 绑定启动流程 (~10 行) ===
    this.createStartButton();
}
```

---

## 4. 预期结果

| 指标 | 当前 | 目标 |
|---|---|---|
| emulator.ts 总行数 | 2074 | 380-420 |
| constructor 行数 | 1740 | 130-160 |
| emulator.ts 方法数 | ~55 | ~30 |
| core/ 目录文件数 | 5 | 10-11 |
| engine/ 模块利用 | partial | full (`shaders.ts` 吸收 `enableShader`) |
| ui/ 模块利用 | partial | full (`screenshot.ts` 吸收录屏) |

## 5. 风险与约束

1. **向后兼容**：所有 `this.xxx` 方法引用需要通过 thin-wrapper 保留，避免破坏 ui/input/engine 子模块中的 `this.` 调用。
2. **`this` 绑定**：当前代码通过箭头函数 `this.processCore = (...) => {}` 在 constructor 中绑定 this。提取为独立函数后需要在调用处显式传入 `emulator` 实例。
3. **拆分顺序**：Phase 1（核心管线）涉及下载→解压→初始化的异步链，拆分时需保留调用链的正确性。建议按自底向上顺序：先 `coreLoader.ts`，再 `download.ts`，再 `romLoader.ts`，再 `moduleInit.ts`。
4. **测试覆盖**：当前仅有 `GameManager.test.ts` 骨架。核心管线拆分后建议添加 smoke test（至少验证模块加载不报错）。
5. **构建验证**：每次拆分后运行 `node build.js` 验证产物生成正常。
