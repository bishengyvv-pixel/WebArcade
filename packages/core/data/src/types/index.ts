// [types/index.ts] TypeScript 类型定义
// 职责：集中定义 EmulatorConfig、EmulatorState、CoreDefinition 等核心类型
// 不负责：运行时行为（仅类型约束）

// === 基础支持类型 ===

export interface CacheConfig {
  enabled: boolean;
  cacheMaxSizeMB: number;
  cacheMaxAgeMins: number;
}

export interface CheatEntry {
  desc: string;
  checked: boolean;
  code: string;
  is_permanent: boolean;
}

export interface CaptureConfig {
  photo?: {
    source?: string;
    format?: string;
    upscale?: number;
  };
  video?: {
    format?: string;
    upscale?: number;
    fps?: number;
    videoBitrate?: number;
    audioBitrate?: number;
  };
}

// === 模拟核心定义 ===

export interface CoreDefinition {
  /** 平台标识符（如 "nes", "gba", "psx"） */
  name: string;
  /** RetroArch 核心 ID 列表，第一个为默认 */
  cores: string[];
  requiresThreads?: boolean;
  requiresWebGL2?: boolean;
}

/** RetroArch 核心选项 */
export interface CoreOption {
  name: string;
  description: string;
  options: Array<[string, string]>;
}

/** RetroArch 运行时选项 */
export interface RetroarchOption {
  name: string;
  key: string;
  /** 选项含义依赖 RetroArch 源码 */
  values: Array<Record<string, unknown>>;
}

// === 用户配置 ===

export interface EmulatorConfig {
  // 核心/ROM
  system?: string;
  gameUrl?: string | File | Uint8Array | ArrayBuffer | Blob;
  biosUrl?: string | File | Uint8Array | ArrayBuffer | Blob;
  gameParentUrl?: string | File | Uint8Array | ArrayBuffer | Blob;
  gamePatchUrl?: string | File | Uint8Array | ArrayBuffer | Blob;
  gameId?: number;
  gameName?: string;
  dataPath?: string;
  filePaths?: Record<string, string>;

  // 显示
  color?: string;
  backgroundColor?: string;
  backgroundImg?: string;
  backgroundBlur?: boolean;
  alignStartButton?: 'top' | 'center' | 'bottom';

  // 行为
  threads?: boolean;
  volume?: number;
  startOnLoad?: boolean;
  softLoad?: number;
  fullscreenOnLoad?: boolean;
  noAutoFocus?: boolean;
  startBtnName?: string;
  loadState?: string | Uint8Array | ArrayBuffer | Blob;

  // 存储
  disableDatabases?: boolean;
  disableLocalStorage?: boolean;
  disableAutoUnload?: boolean;
  cacheConfig?: CacheConfig;
  /** @deprecated 请使用 cacheConfig */
  cacheLimit?: number;

  // UI
  buttonOpts?: Record<string, unknown>;
  hideSettings?: boolean;
  controlScheme?: string;
  langJson?: Record<string, string>;
  language?: string;
  settingsLanguage?: string;

  // 联机
  netplayUrl?: string;

  // 广告
  adUrl?: string;
  adSize?: [string, string];

  // 高级
  defaultOptions?: Record<string, string>;
  defaultControllers?: Record<string, Record<string, { value?: string; value2?: string }>>;
  additionalShaders?: Record<string, unknown>;
  videoRotation?: 0 | 1 | 2 | 3;
  disableCue?: boolean;
  disableBatchBootup?: boolean;
  forceLegacyCores?: boolean;
  browserMode?: 1 | 2;
  consoleOpts?: unknown;
  externalFiles?: Record<string, string>;
  cheats?: Array<[string, string]>;
  debug?: boolean;
  fixedSaveInterval?: number;
  VirtualGamepadSettings?: Record<string, unknown>[];
  capture?: CaptureConfig;
}

// === 运行时状态（EmulatorJS 实例属性） ===

export interface EmulatorState {
  started: boolean;
  paused: boolean;
  failedToStart: boolean;
  isFastForward: boolean;
  isSlowMotion: boolean;
  rewindEnabled: boolean;
  volume: number;
  muted: boolean;
  touch: boolean;
  hasTouchScreen: boolean;
  isMobile: boolean;
  enableMouseLock: boolean;
  videoRotation: number;
  videoRotationChanged: boolean;
  currentShader: string | null;
  gameManager: unknown;
  Module: unknown;
  webgl2Enabled: boolean | null;
  supportsWebgl2: boolean;
  fileName: string;
  coreName: string;
  repository: string;
  saveFileExt: string | false;
  license: string;
  allSettings: Record<string, string>;
  settings: Record<string, string>;
  settingsLoaded: boolean;
  cheats: CheatEntry[];
  defaultControllers: Record<string, Record<string, unknown>>;
  autofireIntervals: Record<string, number>;
  defaultAutoFireInterval: number;
  storageCache: unknown;
  downloader: unknown;
}

// === UI 状态（由 core/state.ts StateStore 管理） ===

export interface EmulatorUIState {
  started: boolean;
  paused: boolean;
  failedToStart: boolean;
  isFastForward: boolean;
  isSlowMotion: boolean;
  rewindEnabled: boolean;
  volume: number;
  muted: boolean;
  touch: boolean;
  enableMouseLock: boolean;
  lightgunActive: boolean;
  settingsLoaded: boolean;
}
