# EmulatorJS 开发规范

> 编制日期：2026-05-26
> 技术栈：Vanilla JavaScript (ES Module) / Emscripten (WASM) / RetroArch

## 1. 核心原则

### 1.1 单一职责

每个文件、每个函数、每个类只做一件事。判断标准：

- 能用一句话描述其职责，且这句话中没有「和」字
- 修改一个功能时，不需要修改不相关的文件

反例（当前代码）：
```javascript
// setVirtualGamepad() → 669行
// "构建游戏手柄 DOM 并计算按钮位置并绑定触摸事件并处理连发定时器" — 四个'和'
```

正例：
```javascript
// ui/gamepad/buildLayout.js  → 构建 DOM 结构
// ui/gamepad/position.js     → 计算按钮位置
// ui/gamepad/touch.js        → 绑定触摸/指针事件
// input/autofire.js          → 连发定时器
```

### 1.2 依赖方向

```
core/emulator.js (编排/生命周期)
  ├── engine/   (模拟引擎 — 纯逻辑，不碰 DOM)
  ├── ui/       (UI 构建 — DOM 操作集中营)
  ├── input/    (输入处理 — 键盘/手柄/连发)
  └── vendor/   (第三方库 — nipplejs, socket.io)

不允许: engine/* → ui/*  (引擎层不能依赖 UI 层)
不允许: engine/* → document/window (引擎层不能碰 DOM)
不允许: ui/menu.js → ui/gamepad.js (UI 模块间不应直接耦合)
```

### 1.3 代码即文档

- 命名自解释，不需要注释说「做什么」
- 仅在 **WHY 不显而易见**时写注释（边界条件、性能考量、Bug 规避）
- 不为类型写注释 — JSDoc 和 TypeScript 类型已经足够（阶段二后）

反例（当前代码）：
```javascript
// GameManager.js:262 — 没有注释，magic number
if ([24, 25, 26, 27, 28, 29].includes(index)) {
    if (index === 24 && value === 1) {  // 读了代码才知道 24 是存盘键
```

正例：
```javascript
const INPUT_INDEX = {
    QUICK_SAVE:   24,
    QUICK_LOAD:   25,
    SLOT_CHANGE:  26,
    FAST_FORWARD: 27,
    REWIND:       28,
    SLOW_MOTION:  29,
};

if (index === INPUT_INDEX.QUICK_SAVE && value === 1) {
    this.quickSave(currentSlot);
```

---

## 2. 目录结构

```
data/
├── src/
│   ├── engine/                # 模拟引擎 — 纯逻辑，零 DOM 依赖
│   │   ├── GameManager.js     # WASM 桥接层 (cwrap → C 函数)
│   │   ├── cache.js           # 缓存管理 (EJS_Cache, EJS_Download)
│   │   ├── compression.js     # 压缩文件处理 (7z/zip/rar)
│   │   ├── storage.js         # 存储抽象 (IndexedDB/LocalStorage)
│   │   ├── netplay.js         # 联机对战 (WebRTC + Socket.IO)
│   │   ├── shaders.js         # 着色器定义
│   │   └── license.js         # GPL 许可证文本
│   ├── ui/                    # UI 构建 — DOM 操作集中营
│   │   ├── dom.js             # DOM 工具函数 (createElement / addEventListener)
│   │   ├── menu.js            # 菜单栏、设置面板
│   │   ├── popup.js           # 弹窗、输入提示、信息展示
│   │   ├── gamepad.js         # 虚拟手柄渲染
│   │   ├── ads.js             # 广告层
│   │   └── screenshot.js      # 截图/录屏
│   ├── input/                 # 输入处理
│   │   ├── keyboard.js        # 键盘事件、按键映射
│   │   ├── gamepad.js         # 物理手柄事件 (Gamepad API)
│   │   └── autofire.js        # 连发逻辑
│   ├── core/                  # 编排 & 生命周期
│   │   ├── emulator.js        # 主控制器：下载→解压→初始化→启动
│   │   ├── setup.js           # 初始化设置、已弃用配置检查
│   │   ├── config.js          # 配置管理 (getSettingValue / menuOptionChanged)
│   │   ├── events.js          # 事件总线 (on / off / emit)
│   │   └── state.js           # UI 状态管理 (StateStore)
│   ├── types/                 # TypeScript 类型定义（阶段二）
│   │   └── index.ts
│   ├── consts.js              # 常量定义（core 映射、requiresThreads 等）
│   ├── utils.js               # 通用工具函数（hash、guid 等）
│   └── vendor/                # 第三方库（不修改）
│       ├── nipplejs.js
│       └── socket.io.min.js
├── compression/               # WASM 解压模块
├── cores/                     # RetroArch WASM 核心（.wasm + .data）
├── localization/              # 多语言文件
├── emulator.css               # 构建入口 — 合并各模块 CSS
├── loader.js                  # 动态加载入口
├── version.json               # 版本号
└── minify/                    # 构建脚本
```

### 目录职责约束

| 目录 | 可以 | 禁止 |
|------|------|------|
| `engine/` | 纯逻辑计算、WASM 交互、数据读写 | 操作 DOM、访问 `window.document` |
| `ui/` | 创建 DOM、绑定事件、更新样式 | 模拟引擎逻辑、WASM 交互 |
| `input/` | 键盘/手柄事件捕获、按键映射、连发 | 修改 UI 样式、直接操作 WASM |
| `core/` | 编排生命周期、协调各层、管理状态 | 直接构建大型 DOM 片段 |
| `vendor/` | 存放第三方库源码 | 直接修改（通过 patch 文件记录修改） |

---

## 3. 模块分层规范

以模拟器的设置菜单为例，横跨三层：

```
模块示例: 设置菜单 (settings)
─────────────────────────────
core/config.js    →  def getSettingValue(id)        → 读取当前配置值
                  →  def menuOptionChanged(key, val) → 验证 + 持久化 + 通知变更
ui/menu.js        →  def buildSettingsMenu()         → 根据配置项构建 DOM
                  →  注册事件回调: onChange → menuOptionChanged()
input/keyboard.js →  快捷键映射 (F1→菜单, Esc→关闭)
core/events.js    →  emit('settingChanged', { key, val })
engine/GameManager.js → 收到事件 → 调用 WASM 对应的 setVariable()
```

规则：

- `ui/` 层函数只做 DOM 构建和事件绑定，从 `core/state.js` 读取状态
- `core/` 层负责业务逻辑编排，不构建 DOM
- `engine/` 层不监听 UI 事件，通过 `core/events.js` 事件总线通信
- 跨层通信使用事件总线，避免模块间直接引用

---

## 4. 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件名 | camelCase | `gameManager.js`, `netplay.js` |
| 类名 | PascalCase | `EmulatorJS`, `EJS_GameManager`, `EJS_Download` |
| 函数/方法 | camelCase | `getSettingValue()`, `buildButtonOptions()` |
| 变量 | camelCase | `isFastForward`, `gameUrl` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PLAYERS`, `CACHE_BLOB_CHUNK_SIZE` |
| 事件名 | camelCase | `'saveUpdate'`, `'gameStart'` |
| CSS 类名 | BEM + `ejs-` 前缀 | `ejs-menu`, `ejs-menu__item--active` |
| DOM id | kebab-case + `ejs-` 前缀 | `ejs-settings-panel`, `ejs-volume-slider` |

### 已有约定（保持）

- `EJS_` 前缀用于暴露给用户页面的全局变量：`EJS_gameUrl`, `EJS_core`, `EJS_emulator`
- 内部类使用 `EJS_` 前缀（历史遗留，保持一致性）：`EJS_GameManager`, `EJS_STORAGE`
- 新文件不使用 `EJS_` 文件名前缀，通过目录区分作用域

---

## 5. 函数规范

### 5.1 长度限制

| 类型 | 最大行数 | 说明 |
|------|---------|------|
| 纯 UI 构建函数 | 150 | DOM 构建本身冗长，可适当放宽 |
| 业务逻辑函数 | 50 | 超过则拆分 |
| 事件处理函数 | 30 | 回调逻辑应轻量 |
| `constructor` | 50 | 超过则提取 `init*` 方法 |
| 常量/配置定义文件 | 不限 | 但需按类别分段注释 |

### 5.2 参数限制

- 函数参数不超过 **4 个**
- 超过 3 个参数时使用对象解构：

```javascript
// 反例
downloadFile(path, type, progress, notWithPath, opts, forceExtract, dontCache, dontExtract) { ... }

// 正例
downloadFile(path, { type, progress, notWithPath, opts, forceExtract, dontCache, dontExtract }) { ... }
```

### 5.3 纯函数优先

- `engine/` 和 `utils/` 中的函数应尽可能为纯函数 — 不修改入参、不读全局状态
- UI 层函数允许有副作用（DOM 操作本身就是副作用）

---

## 6. 状态管理规范

### 6.1 UI 状态

所有 UI 状态集中在 `core/state.js` 的 `StateStore` 中：

```javascript
// core/state.js
class StateStore {
    #state = {
        isPlaying: false,
        isPaused: true,
        isFastForward: false,
        isSlowMotion: false,
        rewindEnabled: false,
        volume: 0.5,
        currentShader: null,
    };
    #listeners = new Map();

    get(key) { return this.#state[key]; }
    set(key, value) {
        if (this.#state[key] === value) return;
        this.#state[key] = value;
        this.#notify(key, value);
    }
    on(key, callback) { ... }   // 订阅单个 key 变化
    off(key, callback) { ... }  // 取消订阅
    #notify(key, value) { ... }
}
```

规则：

- 禁止直接在 `emulator.js` 或 UI 模块中 `this.isFastForward = true`
- 永远通过 `state.set('isFastForward', true)` 修改
- UI 组件通过 `state.on('isFastForward', callback)` 订阅变化

### 6.2 模拟状态

模拟引擎的内部状态（WASM 中的 RetroArch 运行时）通过 `GameManager` 操作，不纳入 UI 状态管理。

---

## 7. 注释规范

### 7.1 文件头

每个文件头部标注所属目录和一句话职责范围：

```javascript
// [ui/menu.js] 菜单栏和设置面板的 DOM 构建
// 职责：创建菜单 UI、注册交互事件、响应状态变更更新 DOM
// 不负责：配置值的验证和持久化（由 core/config.js 处理）
```

### 7.2 JSDoc

对外暴露的公共方法必须写 JSDoc：

```javascript
/**
 * 下载文件并写入 WASM 虚拟文件系统
 * @param {string} path — 文件路径或 URL
 * @param {string} type — 下载类型 ('core' | 'game' | 'support')
 * @returns {Promise<EJS_CacheItem>}
 */
async function downloadFile(path, type) { ... }
```

内部辅助方法不强制 JSDoc，但参数名必须自解释。

### 7.3 注释时机

- **必须写** — magic number 的来源、浏览器兼容性 workaround、性能敏感逻辑、非显而易见的算法选择
- **不写** — 代码自解释的情况（`restartGame()` 不需要注释"重启游戏"）
- **禁止** — 注释掉的旧代码（用 git history）、虚假注释（与代码行为不一致）

---

## 8. 错误处理规范

### 8.1 模拟核心错误

WASM 启动失败、ROM 加载失败、核心不兼容等属于致命错误：

```javascript
// core/emulator.js
this.startGameError = function(message) {
    this.textElem.innerText = this.localization(message);  // 显示在 Canvas 上
    this.textElem.style.color = 'red';
    this.failedToStart = true;
    this.callEvent('error', { message });
};
```

### 8.2 下载/网络错误

```javascript
// engine/cache.js
try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    ...
} catch (e) {
    console.warn(`[EJS ${type}] Download failed: ${path}`, e.message);
    // 降级：尝试 CDN 备用地址 / 显示重试按钮
    ...
}
```

规则：

- 网络错误永不静默吞掉 — 至少 `console.warn`
- 下载失败提供重试机制，不直接崩溃
- 向用户展示可理解的中文/本地化错误信息

---

## 9. 嵌入兼容性约束

> 这是本项目独有的硬性约束，区别于一般前端应用。

- **最终输出物**：单个 JS 文件（`emulator.min.js`）+ 单个 CSS 文件（`emulator.min.css`）
- **集成方式**：`<script src=".../loader.js">` 标签即可，构建步骤必须保留此路径
- **全局变量**：配置通过 `window.EJS_*` 传入，不得改为仅支持 JS API
- **命名空间**：所有 CSS 类名使用 `.ejs-` 前缀，所有 `window` 挂载使用 `EJS_` 前缀，防止污染宿主页面
- **无框架依赖**：不得引入 React/Vue/任何框架运行时。vendor 目录仅允许纯工具库
- **IE 不兼容可接受**：最低目标为 ES2020 浏览器

---

## 10. Git 规范

### 10.1 Commit 格式

```
<type>(<scope>): <subject>

type: feat | fix | refactor | style | docs | chore | perf | test
scope: core | engine | ui | input | build | vendor | docs
subject: 简短描述（英文，限 72 字符内）
```

示例：
```
feat(engine): add cwrap bindings for rewind toggle
fix(ui): prevent menu flicker on rapid open/close
refactor(core): split constructor into init methods
chore(build): update rollup config for multi-entry
```

### 10.2 分支策略

- `main` — 发布就绪，禁止直接推送
- `feature/<description>` — 新功能
- `fix/<description>` — Bug 修复

---

## 11. 代码审查清单

- [ ] 修改的文件属于正确的目录（`engine/` vs `ui/` vs `core/`）
- [ ] `engine/` 层代码无 DOM 操作
- [ ] `ui/` 层代码无 WASM/模拟引擎调用
- [ ] 新增方法不超过 50 行（UI 构建不超过 150 行）
- [ ] 超过 3 个参数的函数使用对象解构
- [ ] magic number 已替换为命名常量
- [ ] 新公共方法有 JSDoc
- [ ] CSS 类名使用 `.ejs-` 前缀，不与宿主页面冲突
- [ ] `window.EJS_*` 无新增污染，或已文档化
- [ ] 最终产物仍为单个 JS + 单个 CSS
- [ ] `<script src="loader.js">` 集成方式未破坏
- [ ] 网络错误不静默吞掉

---

> **参考原则来源**：SubGate 项目 DEVELOPMENT_STANDARDS.md（单一职责、依赖方向、代码即文档）
> **编制日期**：2026-05-26
