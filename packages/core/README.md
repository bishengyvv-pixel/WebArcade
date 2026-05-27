<div align="center">

<img width="300" src="docs/Logo-light.png#gh-dark-mode-only" alt="WebArcade-Core Dark Mode Logo">
<img width="300" src="docs/Logo.png#gh-light-mode-only" alt="WebArcade-Core Light Mode Logo">

<br>

Self-hosted **JavaScript** emulation for various systems.

> This project is based on [EmulatorJS](https://github.com/EmulatorJS/EmulatorJS) and has been refactored with TypeScript + modular architecture. See [Improvement Plan](docs/改进计划.md) (Chinese) for details.

[![License: GPLv3][Badge License]][Link License]
[![Website][Badge Website]][Link Website]
[![Usage Docs][Badge Usage]][Link Usage]
[![Configurator][Badge Configurator]][Link Configurator]
[![Live Demo][Badge Demo]][Link Demo]
[![Contributors][Badge Contributors]][Link Contributors]

Join our Discord server:

[![Discord Badge](https://invidget.switchblade.xyz/6akryGkETU)](https://discord.gg/6akryGkETU)

</div>

---

## Getting Started

### Supported Systems
EmulatorJS supports a wide variety of legacy consoles and arcade machines. For the complete list of supported cores, please visit our [Cores Documentation](https://emulatorjs.org/docs4devs/cores).

### Versioning Guide
We use a specific versioning system to help you choose the right build for your needs:

1.  **Stable** - The most current release. Both code and cores are tested before release. Updated when new versions are released on GitHub. This is the default version on the Demo.
2.  **Latest** - Contains the latest code but uses stable cores. Updated whenever the `main` branch is updated. **This version will often be more broken than nightly**
3.  **Nightly** - Contains the latest code and the latest cores. Cores are updated daily. **This version is not recommended for production use as it is the main development branch.**

### CDN Integration
EmulatorJS provides a public CDN at `https://cdn.emulatorjs.org/`. You can access any version by setting the data path and loader.js accordingly.

```javascript
// Example Configuration
const EJS_pathToData = 'https://cdn.emulatorjs.org/<version>/data/';
// Replace <version> with: stable, latest, nightly, etc.
```

### Tech Stack

- **Language**: [TypeScript](https://www.typescriptlang.org/) (migrated from JavaScript)
- **Module System**: ES Modules (ESM)
- **Bundler**: [Rollup](https://rollupjs.org/) with `@rollup/plugin-typescript` and `@rollup/plugin-terser`
- **CSS**: BEM methodology with `ejs-` namespace prefix, auto-concatenated and minified
- **Lint**: ESLint with `no-unused-vars`, `prefer-const`, `prefer-arrow-callback`
- **Type Check**: `tsc --noEmit`
- **Output**: Single `emulator.min.js` + `emulator.min.css` (embedded via `<script>` tag)

### Project Structure

```
data/src/
├── core/               # Orchestration & lifecycle
│   ├── emulator.ts     # Main controller (download → extract → init WASM → game loop)
│   ├── config.ts       # Settings management
│   ├── events.ts       # Event bus (on/off/emit)
│   ├── state.ts        # UI state store (get/set/on/off)
│   └── setup.ts        # Initialization and shader setup
├── engine/             # Emulation engine — pure logic, no DOM
│   ├── GameManager.ts  # WASM bridge (cwrap → C functions)
│   ├── cache.ts        # Cache management (EJS_Cache, EJS_Download)
│   ├── compression.ts  # Archive extraction (7z/zip/rar)
│   ├── storage.ts      # IndexedDB/LocalStorage abstraction
│   ├── netplay.ts      # Multiplayer (WebRTC + Socket.IO)
│   ├── shaders.ts      # Shader definitions
│   └── license.ts      # GPL license text
├── ui/                 # UI construction — DOM operations
│   ├── dom.ts          # DOM helpers (createElement, addEventListener)
│   ├── menu.ts         # Menu bar and settings panel
│   ├── popup.ts        # Popups, messages, input prompts
│   ├── gamepad.ts      # Virtual gamepad rendering
│   ├── ads.ts          # Ad layer
│   ├── screenshot.ts   # Screenshot / recording
│   ├── bottomBar.ts    # Bottom control bar
│   ├── settings.ts     # Settings menu
│   ├── controls.ts     # Input mapping UI
│   ├── cheats.ts       # Cheat code interface
│   ├── disks.ts        # Disk management
│   ├── cacheMenu.ts    # Cache browser
│   ├── contextMenu.ts  # Right-click menu
│   └── netplayMenu.ts  # Multiplayer UI
├── input/              # Input handling — keyboard + gamepad
│   ├── keyboard.ts     # Key events and mapping
│   ├── gamepad.ts      # Physical gamepad (Gamepad API)
│   └── autofire.ts     # Autofire logic
├── css/                # BEM-scoped stylesheets (concatenated at build)
│   ├── base.css        # Variables, reset, typography, game container
│   ├── menu.css        # Menu bar and settings panel
│   ├── gamepad.css     # Virtual gamepad
│   ├── popup.css       # Popups and messages
│   └── ads.css         # Ad layer
├── types/
│   └── index.ts        # TypeScript type definitions
├── vendor/             # Third-party libraries (nipplejs, socket.io)
├── consts.ts           # Constants (core mappings, feature flags)
├── utils.ts            # Utility functions (hashing, GUID)
├── emulator.ts         # Main EmulatorJS class
└── gamepad.ts          # Gamepad handler
```

### Development

1.  Install dependencies:
    ```sh
    npm i
    ```
2.  Start the dev server:
    ```sh
    npm run start
    ```
3.  Open `http://localhost:8080/` to view the demo.
4.  Type-check (optional):
    ```sh
    npm run typecheck
    ```
5.  Build for production (JS minification + CSS concatenation & minification):
    ```sh
    npm run minify
    ```

> **Note:** The build step concatenates 5 CSS modules into a single `emulator.min.css` and minifies the Rollup-bundled `emulator.min.js`. Always run `npm run minify` before deploying. See [Minification Docs](minify/README.md).

### Architecture Constraints

| Layer | Allowed | Forbidden |
|---|---|---|
| `engine/` | Pure logic, WASM interaction, data I/O | DOM manipulation, `window.document` |
| `ui/` | DOM creation, event binding, style updates | WASM calls, emulation engine logic |
| `input/` | Keyboard/gamepad capture, key mapping | UI style changes, direct WASM access |
| `core/` | Lifecycle orchestration, layer coordination | Large DOM fragments |

---

## Community & Support

### 3rd Party Integrations
EmulatorJS is built as a library/plugin, not a standalone website (therefore, no Docker container). For projects that utilize EmulatorJS, check out our [3rd Party Integration List](https://emulatorjs.org/docs/3rd-party).

### Issues & Reporting
If you encounter an issue, please open an [Issue](https://github.com/EmulatorJS/EmulatorJS/issues) on GitHub. Include as many details as possible, including your browser console logs.

> **When reporting bugs, please specify the version you are using (Stable/Latest/Nightly).**

### Support the Project
This project is free and ad-free. The demo page may show occasional ads to help with hosting costs, but you can support development directly via [Patreon][Link Patreon].

---

## Star History

<a href="https://star-history.com/#EmulatorJS/EmulatorJS&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=EmulatorJS/EmulatorJS&type=Date" />
 </picture>
</a>

<!-- Link Definitions -->
[Badge License]: https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge&logo=opensourceinitiative
[Badge Website]: https://img.shields.io/badge/Website-736e9b?style=for-the-badge
[Badge Usage]: https://img.shields.io/badge/Usage-2478b5?style=for-the-badge
[Badge Configurator]: https://img.shields.io/badge/Config-992cb3?style=for-the-badge
[Badge Demo]: https://img.shields.io/badge/Demo-528116?style=for-the-badge
[Badge Contributors]: https://img.shields.io/badge/Contributors-54b7dd?style=for-the-badge
[Discord Badge]: https://invidget.switchblade.xyz/6akryGkETU

[Link License]: LICENSE
[Link Website]: https://emulatorjs.org/
[Link Usage]: https://emulatorjs.org/docs/
[Link Configurator]: https://emulatorjs.org/editor
[Link Demo]: https://demo.emulatorjs.org/
[Link Contributors]: docs/contributors.md
[Link Issue]: https://github.com/emulatorjs/emulatorjs/issues
[Link Patreon]: https://patreon.com/EmulatorJS
