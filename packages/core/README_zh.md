<div align="center">

<img width="300" src="docs/Logo-light.png#gh-dark-mode-only" alt="WebArcade-Core 深色模式 Logo">
<img width="300" src="docs/Logo.png#gh-light-mode-only" alt="WebArcade-Core 浅色模式 Logo">

<br>

自托管的 **JavaScript** 多平台模拟器。

> 本项目基于 [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) 进行改造。源代码已重构为 TypeScript + 模块化架构，详见 [改进计划](docs/改进计划.md)。

[![License: GPLv3][Badge License]][Link License]
[![Website][Badge Website]][Link Website]
[![使用文档][Badge Usage]][Link Usage]
[![配置器][Badge Configurator]][Link Configurator]
[![在线演示][Badge Demo]][Link Demo]
[![贡献者][Badge Contributors]][Link Contributors]

加入我们的 Discord 服务器：

[![Discord Badge](https://invidget.switchblade.xyz/6akryGkETU)](https://discord.gg/6akryGkETU)

</div>

---

## 快速开始

### 支持的系统
EmulatorJS 支持多种经典游戏机和街机平台。完整核心列表请参阅 [Cores 文档](https://emulatorjs.org/docs4devs/cores)。

### 版本说明
我们使用特定的版本号系统帮助你选择合适的构建：

1.  **Stable** — 最新的稳定版本。代码和核心均在发布前经过测试。随 GitHub 新版本发布而更新。演示站点默认使用此版本。
2.  **Latest** — 包含最新代码，但使用稳定核心。每当 `main` 分支有更新即发布。**此版本通常比 nightly 更容易出问题。**
3.  **Nightly** — 包含最新代码和最新核心。核心每日更新。**不建议生产环境使用，这是主要开发分支。**

### CDN 集成
EmulatorJS 通过 `https://cdn.emulatorjs.org/` 提供公共 CDN。通过设置 data path 和 loader.js 可使用任意版本。

```javascript
// 配置示例
const EJS_pathToData = 'https://cdn.emulatorjs.org/<version>/data/';
// 将 <version> 替换为: stable, latest, nightly 等。
```

### 技术栈

- **语言**: [TypeScript](https://www.typescriptlang.org/)（由 JavaScript 迁移而来）
- **模块系统**: ES Modules (ESM)
- **构建工具**: [Rollup](https://rollupjs.org/)，配合 `@rollup/plugin-typescript` 和 `@rollup/plugin-terser`
- **CSS**: BEM 命名规范，统一 `ejs-` 前缀；构建时自动合并并压缩
- **代码检查**: ESLint，启用 `no-unused-vars`、`prefer-const`、`prefer-arrow-callback`
- **类型检查**: `tsc --noEmit`
- **构建产物**: 单个 `emulator.min.js` + `emulator.min.css`（通过 `<script>` 标签嵌入）

### 项目结构

```
data/src/
├── core/               # 编排 & 生命周期
│   ├── emulator.ts     # 主控制器（下载 → 解压 → 初始化 WASM → 游戏循环）
│   ├── config.ts       # 配置管理
│   ├── events.ts       # 事件总线 (on/off/emit)
│   ├── state.ts        # UI 状态管理 (get/set/on/off)
│   └── setup.ts        # 初始化和着色器配置
├── engine/             # 模拟引擎 — 纯逻辑，不碰 DOM
│   ├── GameManager.ts  # WASM 桥接层 (cwrap → C 函数)
│   ├── cache.ts        # 缓存管理 (EJS_Cache, EJS_Download)
│   ├── compression.ts  # 压缩包处理 (7z/zip/rar)
│   ├── storage.ts      # 存储抽象 (IndexedDB/LocalStorage)
│   ├── netplay.ts      # 联机对战 (WebRTC + Socket.IO)
│   ├── shaders.ts      # 着色器定义
│   └── license.ts      # GPL 许可证文本
├── ui/                 # UI 构建 — DOM 操作
│   ├── dom.ts          # DOM 工具函数 (createElement, addEventListener)
│   ├── menu.ts         # 菜单栏和设置面板
│   ├── popup.ts        # 弹窗、消息、输入提示
│   ├── gamepad.ts      # 虚拟手柄渲染
│   ├── ads.ts          # 广告层
│   ├── screenshot.ts   # 截图 / 录屏
│   ├── bottomBar.ts    # 底部控制栏
│   ├── settings.ts     # 设置菜单
│   ├── controls.ts     # 按键映射界面
│   ├── cheats.ts       # 金手指界面
│   ├── disks.ts        # 磁盘管理
│   ├── cacheMenu.ts    # 缓存浏览器
│   ├── contextMenu.ts  # 右键菜单
│   └── netplayMenu.ts  # 联机界面
├── input/              # 输入处理 — 键盘 + 手柄
│   ├── keyboard.ts     # 键盘事件和按键映射
│   ├── gamepad.ts      # 物理手柄事件 (Gamepad API)
│   └── autofire.ts     # 连发逻辑
├── css/                # BEM 作用域样式（构建时合并）
│   ├── base.css        # CSS 变量、重置、排版、游戏容器
│   ├── menu.css        # 菜单和设置面板
│   ├── gamepad.css     # 虚拟手柄
│   ├── popup.css       # 弹窗和消息
│   └── ads.css         # 广告层
├── types/
│   └── index.ts        # TypeScript 类型定义
├── vendor/             # 第三方库 (nipplejs, socket.io)
├── consts.ts           # 常量定义（核心映射、功能开关）
├── utils.ts            # 通用工具函数（哈希、GUID）
├── emulator.ts         # EmulatorJS 主类
└── gamepad.ts          # 手柄处理器
```

### 开发指南

1.  安装依赖：
    ```sh
    npm i
    ```
2.  启动开发服务器：
    ```sh
    npm run start
    ```
3.  打开 `http://localhost:8080/` 查看演示。
4.  类型检查（可选）：
    ```sh
    npm run typecheck
    ```
5.  生产构建（JS 压缩 + CSS 合并压缩）：
    ```sh
    npm run minify
    ```

> **注意：** 构建步骤将 5 个 CSS 模块合并为单个 `emulator.min.css`，并压缩 Rollup 打包后的 `emulator.min.js`。部署前请务必运行 `npm run minify`。详见 [Minification 文档](minify/README.md)。

### 架构约束

| 层 | 允许 | 禁止 |
|---|---|---|
| `engine/` | 纯逻辑、WASM 交互、数据读写 | DOM 操作、`window.document` |
| `ui/` | DOM 创建、事件绑定、样式更新 | WASM 调用、模拟引擎逻辑 |
| `input/` | 键盘/手柄事件捕获、按键映射 | UI 样式修改、直接 WASM 访问 |
| `core/` | 生命周期编排、跨层协调 | 大型 DOM 片段 |

---

## 社区与支持

### 第三方集成
EmulatorJS 以库/插件形式构建，而非独立网站（因此不提供 Docker 镜像）。使用 EmulatorJS 的项目请参阅 [第三方集成列表](https://emulatorjs.org/docs/3rd-party)。

### 问题反馈
如遇到问题，请在 GitHub 上提交 [Issue](https://github.com/EmulatorJS/EmulatorJS/issues)。请附上尽可能详细的信息，包括浏览器控制台日志。

> **报告 Bug 时请注明你使用的版本（Stable / Latest / Nightly）。**

### 支持项目
本项目免费且无广告。演示页面可能偶尔展示广告以分担托管费用，你也可以通过 [Patreon][Link Patreon] 直接支持开发。

---

## Star 历史

<a href="https://star-history.com/#EmulatorJS/EmulatorJS&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
   <img alt="Star 历史图表" src="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
 </picture>
</a>

<!-- 链接定义 -->
[Badge License]: https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge&logo=opensourceinitiative
[Badge Website]: https://img.shields.io/badge/Website-736e9b?style=for-the-badge
[Badge Usage]: https://img.shields.io/badge/使用文档-2478b5?style=for-the-badge
[Badge Configurator]: https://img.shields.io/badge/配置器-992cb3?style=for-the-badge
[Badge Demo]: https://img.shields.io/badge/在线演示-528116?style=for-the-badge
[Badge Contributors]: https://img.shields.io/badge/贡献者-54b7dd?style=for-the-badge
[Discord Badge]: https://invidget.switchblade.xyz/6akryGkETU

[Link License]: LICENSE
[Link Website]: https://emulatorjs.org/
[Link Usage]: https://emulatorjs.org/docs/
[Link Configurator]: https://emulatorjs.org/editor
[Link Demo]: https://demo.emulatorjs.org/
[Link Contributors]: docs/contributors.md
[Link Issue]: https://github.com/emulatorjs/emulatorjs/issues
[Link Patreon]: https://patreon.com/EmulatorJS
