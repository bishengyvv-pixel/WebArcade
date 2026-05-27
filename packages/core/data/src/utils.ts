// [utils.ts] 通用工具函数
// 职责：cyrb53 哈希、guid 生成、简单的浏览器/环境检测辅助
// 不负责：模拟引擎特定逻辑、UI 构建

/**
 * Computes a simple hash of the given data array.
 */
export function simpleHash(dataArray: Uint8Array): number {
    let hash = 0;
    for (let i = 0; i < dataArray.length; i++) {
        hash = ((hash << 5) - hash + dataArray[i]) & 0xffffffff;
    }
    return hash;
}

/**
 * Cyrb53 hash function adapted for buffers.
 * Modified to accept a buffer instead of a string and return hex instead of an int.
 */
export async function cyrb53(charBuffer: Uint8Array, seed: number = 0): Promise<string> {
    // https://stackoverflow.com/questions/7616461
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < charBuffer.length; i++) {
        ch = charBuffer[i];
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    // Cyrb53 is a 53-bit hash; we need 14 hex characters to represent it
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

/**
 * Generate a random GUID string.
 */
export function guid(): string {
    const s4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}
