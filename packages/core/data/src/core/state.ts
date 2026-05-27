// [core/state.ts] UI 状态管理 (StateStore)
// 职责：集中管理所有 UI 相关状态（started、paused、volume 等），提供 get/set/on/off 接口
// 不负责：模拟引擎内部状态（WASM 中的 RetroArch 运行时由 engine/GameManager.js 管理）

import type { EmulatorUIState } from '../types/index.js';

type StateKey = keyof EmulatorUIState;
type Listener = (value: any) => void;

const DEFAULTS: EmulatorUIState = {
    started: false,
    paused: true,
    failedToStart: false,
    isFastForward: false,
    isSlowMotion: false,
    rewindEnabled: false,
    volume: 0.5,
    muted: false,
    touch: false,
    enableMouseLock: false,
    lightgunActive: false,
    settingsLoaded: false,
};

class StateStore {
    #state: EmulatorUIState;
    #listeners: Map<StateKey, Set<Listener>>;

    constructor(initial?: Partial<EmulatorUIState>) {
        this.#state = { ...DEFAULTS, ...initial };
        this.#listeners = new Map();
    }

    /** 读取单个状态键 */
    get<K extends StateKey>(key: K): EmulatorUIState[K] {
        return this.#state[key];
    }

    /** 写入单个状态键，值无变化时跳过通知 */
    set<K extends StateKey>(key: K, value: EmulatorUIState[K]): void {
        if (this.#state[key] === value) return;
        this.#state[key] = value;
        this.#notify(key, value);
    }

    /** 订阅某个键的变化，返回取消订阅函数 */
    on(key: StateKey, callback: Listener): () => void {
        if (!this.#listeners.has(key)) {
            this.#listeners.set(key, new Set());
        }
        this.#listeners.get(key)!.add(callback);
        return () => this.off(key, callback);
    }

    /** 取消订阅 */
    off(key: StateKey, callback: Listener): void {
        const set = this.#listeners.get(key);
        if (set) {
            set.delete(callback);
            if (set.size === 0) this.#listeners.delete(key);
        }
    }

    /** 内部：通知某个键的所有订阅者 */
    #notify(key: StateKey, value: any): void {
        const set = this.#listeners.get(key);
        if (set) {
            set.forEach((fn) => fn(value));
        }
    }
}

export { StateStore, DEFAULTS };
export type { EmulatorUIState, StateKey };
