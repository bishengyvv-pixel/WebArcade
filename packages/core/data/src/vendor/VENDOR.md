# Vendor Libraries

第三方库清单，记录版本、用途和更新方式。

| 库 | 版本 | 许可证 | 用途 | 来源 |
|---|---|---|---|---|
| `nipplejs.js` | 0.10.2 | MIT | 虚拟手柄摇杆（nipplejs） | npm: `nipplejs` |
| `socket.io.min.js` | 4.8.1 | MIT | 联机对战的 WebSocket 通信（Socket.IO 客户端） | npm: `socket.io` |

## 更新方式

```bash
npm update nipplejs socket.io
cp node_modules/nipplejs/dist/nipplejs.js data/src/vendor/nipplejs.js
cp node_modules/socket.io/client-dist/socket.io.min.js data/src/vendor/socket.io.min.js
```

或运行 `npm run update`（由 `update.js` 自动同步）。
