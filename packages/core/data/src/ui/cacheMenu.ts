// [ui/cacheMenu.js] 缓存菜单
// 职责：构建缓存管理弹窗 DOM、展示已缓存 ROM 列表
// 不负责：实际文件存储与缓存策略（由 engine/cache.js 处理）

export function openCacheMenu(emu) {
        (async () => {
            // Run cleanup before showing cache contents
            await emu.storageCache.cleanup();

            const list = emu.createElement("table");
            const thead = emu.createElement("thead");
            const tbody = emu.createElement("tbody");

            // Create header row
            const headerRow = emu.createElement("tr");
            const nameHeader = emu.createElement("th");
            const typeHeader = emu.createElement("th");
            const sizeHeader = emu.createElement("th");
            const lastUsedHeader = emu.createElement("th");
            const actionHeader = emu.createElement("th");

            nameHeader.innerText = "Filename";
            typeHeader.innerText = "Type";
            sizeHeader.innerText = "Size";
            lastUsedHeader.innerText = "Last Used";
            actionHeader.innerText = "Action";

            nameHeader.style.textAlign = "left";
            typeHeader.style.textAlign = "left";
            sizeHeader.style.textAlign = "left";
            lastUsedHeader.style.textAlign = "left";
            actionHeader.style.textAlign = "left";

            headerRow.appendChild(nameHeader);
            headerRow.appendChild(typeHeader);
            headerRow.appendChild(sizeHeader);
            headerRow.appendChild(lastUsedHeader);
            headerRow.appendChild(actionHeader);
            thead.appendChild(headerRow);

            const body = emu.createPopup("Cache Manager", {
                "Cleanup Now": async () => {
                    const cleanupBtn = document.querySelector('.ejs_popup_button');
                    if (cleanupBtn) cleanupBtn.textContent = 'Cleaning...';
                    await emu.storageCache.cleanup();
                    tbody.innerHTML = "";
                    // Refresh the cache list
                    await emu.populateCacheList(tbody, getSize, getTypeName);
                    if (cleanupBtn) cleanupBtn.textContent = 'Cleanup Now';
                },
                "Clear All": async () => {
                    await emu.storageCache.clear();
                    tbody.innerHTML = "";
                },
                "Close": () => {
                    emu.closePopup();
                }
            });
            
            list.style.width = "100%";
            list.style["padding-left"] = "10px";
            list.style["text-align"] = "left";
            
            list.appendChild(thead);
            list.appendChild(tbody);
            body.appendChild(list);

            const getSize = function (size) {
                let i = -1;
                do {
                    size = (size as number) / 1024, i++;
                } while (size > 1024);
                return Math.max(size, 0.1).toFixed(1) + [" kB", " MB", " GB", " TB", "PB", "EB", "ZB", "YB"][i];
            }

            const getTypeName = function (key) {
                if (key.startsWith('compression_')) return 'Decompressed Content';
                if (key.startsWith('core_decompressed_')) return 'Core';
                // Additional fallback logic for other types
                if (key.includes('core')) return 'Core';
                if (key.includes('bios')) return 'BIOS';
                if (key.includes('rom')) return 'ROM';
                if (key.includes('asset')) return 'Asset';
                return 'Unknown';
            }

            await emu.populateCacheList(tbody, getSize, getTypeName);
        })();
}

export async function populateCacheList(emu, tbody, getSize, getTypeName) {
        // Get all cache items from the compression cache
        const allCacheItems = await emu.storageCache.storage.getAll();

        for (const item of allCacheItems) {
            if (!item.key || !item.fileSize) continue;

            const line = emu.createElement("tr");
            const name = emu.createElement("td");
            const type = emu.createElement("td");
            const size = emu.createElement("td");
            const lastUsed = emu.createElement("td");
            const remove = emu.createElement("td");
            remove.style.cursor = "pointer";

            // Calculate total size of all files in this cache item
            let totalSize = item.fileSize;

            // Use filename if available, otherwise fall back to key
            const displayName = item.filename || item.key;
            name.innerText = displayName.substring(0, 50) + (displayName.length > 50 ? '...' : '');

            // Use the stored type if available, otherwise fall back to getTypeName
            const itemType = item.type || getTypeName(item.key);
            type.innerText = itemType;
            size.innerText = getSize(totalSize);

            // Format last accessed time
            const lastAccessedTime = item.lastAccessed || item.added || Date.now();
            const formatDate = (timestamp) => {
                const date = new Date(timestamp);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                if (diffMins < 1) return 'Just now';
                if (diffMins < 60) return `${diffMins}m ago`;
                if (diffHours < 24) return `${diffHours}h ago`;
                if (diffDays < 7) return `${diffDays}d ago`;

                // For older items, show the actual date
                return date.toLocaleDateString();
            };
            lastUsed.innerText = formatDate(lastAccessedTime);

            const a = emu.createElement("a");
            a.innerText = emu.localization("Remove");
            emu.addEventListener(remove, "click", async () => {
                await emu.storageCache.delete(item.key);
                line.remove();
            })
            remove.appendChild(a);

            line.appendChild(name);
            line.appendChild(type);
            line.appendChild(size);
            line.appendChild(lastUsed);
            line.appendChild(remove);
            tbody.appendChild(line);
        }
}
