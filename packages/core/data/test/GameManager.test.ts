// [test/GameManager.test.ts] EJS_GameManager 单元测试骨架
// 职责：验证 GameManager 的 RetroArch/WASM 桥接层核心逻辑
// 不负责：完整集成测试（需要加载 WASM 模块和 ROM 文件）

/**
 * GameManager 测试骨架说明：
 *
 * EJS_GameManager 依赖 Emscripten Module 对象（包含 FS、cwrap、callMain 等接口），
 * 这些在浏览器中由 WASM 运行时提供。完整的单元测试需要 mock Module 对象。
 *
 * 运行方式（需先安装测试框架）：
 *   npm install --save-dev vitest
 *   npx vitest run data/test/
 *
 * 当前文件提供测试场景的骨架结构，待集成测试框架后填充 mock 和断言。
 */

import { EJS_GameManager } from '../src/engine/GameManager.js';

describe('EJS_GameManager', () => {
    let mockModule: any;
    let mockEJS: any;
    let gm: EJS_GameManager;

    beforeEach(() => {
        // Mock Emscripten Module
        mockModule = {
            cwrap: (name: string, returnType: string, argTypes: string[]) => {
                return (...args: any[]) => {
                    // Stub: return mock values based on the function name
                    if (name === 'get_disk_count') return 1;
                    if (name === 'get_current_disk') return 0;
                    if (name === 'supports_states') return 1;
                    if (name === 'get_current_frame_count') return 0;
                    if (name === 'get_video_dimensions') return 0;
                    return undefined;
                };
            },
            FS: {
                writeFile: () => {},
                readFile: () => new Uint8Array(),
                unlink: () => {},
                mkdir: () => {},
                readdir: () => [],
                stat: () => ({ mode: 0 }),
                isDir: () => false,
                analyzePath: () => ({ exists: false }),
                mount: () => {},
                unmount: () => {},
                syncfs: (populate: boolean, cb: () => void) => cb(),
                filesystems: { IDBFS: {} },
            },
            callMain: () => {},
            resumeMainLoop: () => {},
            abort: () => {},
            EmulatorJSGetState: () => new Uint8Array(),
            callbacks: {},
        };

        // Mock EmulatorJS instance
        mockEJS = {
            on: () => {},
            debug: false,
            config: {},
            isNetplay: false,
            failedToStart: false,
        };

        gm = new EJS_GameManager(mockModule, mockEJS);
    });

    describe('构造函数', () => {
        it('应该初始化 EJS 和 Module 引用', () => {
            expect(gm.EJS).toBe(mockEJS);
            expect(gm.Module).toBe(mockModule);
            expect(gm.FS).toBe(mockModule.FS);
        });

        it('应该通过 cwrap 绑定所有 WASM 函数', () => {
            expect(gm.functions.restart).toBeInstanceOf(Function);
            expect(gm.functions.simulateInput).toBeInstanceOf(Function);
            expect(gm.functions.screenshot).toBeInstanceOf(Function);
            expect(gm.functions.toggleMainLoop).toBeInstanceOf(Function);
            expect(gm.functions.getCoreOptions).toBeInstanceOf(Function);
        });
    });

    describe('文件系统操作', () => {
        it('writeFile 应该创建中间目录并写入数据', () => {
            expect(() => gm.writeFile('/home/test/file.cfg', 'data')).not.toThrow();
        });

        it('mkdir 应该吞掉已存在目录的错误', () => {
            expect(() => gm.mkdir('/existing')).not.toThrow();
        });

        it('getRetroArchCfg 应该返回包含 core option 的字符串', () => {
            mockEJS.defaultCoreOpts = {
                file: 'test.cfg',
                settings: { 'option1': 'value1' },
            };
            const cfg = gm.getRetroArchCfg();
            expect(typeof cfg).toBe('string');
            expect(cfg).toContain('test.cfg');
        });
    });

    describe('模拟控制', () => {
        it('restart 应该清除计时器并执行系统重启', () => {
            // verify restart is bound
            expect(gm.functions.restart).toBeDefined();
        });

        it('simulateInput 应该转发到 cwrap 绑定的函数', () => {
            expect(() => gm.simulateInput(0, 0, 1)).not.toThrow();
        });

        it('toggleMainLoop 应该传递 playing 状态', () => {
            expect(() => gm.toggleMainLoop(0)).not.toThrow();
            expect(() => gm.toggleMainLoop(1)).not.toThrow();
        });
    });

    describe('存档状态', () => {
        it('supportsStates 应该返回布尔值', () => {
            const result = gm.supportsStates();
            expect(typeof result).toBe('boolean');
        });

        it('getState 应该返回 Uint8Array', () => {
            const state = gm.getState();
            expect(state).toBeInstanceOf(Uint8Array);
        });

        it('quickSave 和 quickLoad 不应该抛出异常', () => {
            expect(() => gm.quickSave(0)).not.toThrow();
            expect(() => gm.quickLoad(0)).not.toThrow();
        });
    });

    describe('磁盘管理', () => {
        it('getDiskCount 应该返回磁盘数量', () => {
            const count = gm.getDiskCount();
            expect(typeof count).toBe('number');
        });

        it('getCurrentDisk 应该返回当前磁盘索引', () => {
            const disk = gm.getCurrentDisk();
            expect(typeof disk).toBe('number');
        });
    });
});
