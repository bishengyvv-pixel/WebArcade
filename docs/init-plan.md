# WebArcade 项目初始化方案

## 最终决策汇总

| 层面 | 选型 |
|---|---|
| 前端 | React + Vite |
| 集成 | npm workspace monorepo |
| 后端 | Node.js + Express，REST API |
| 数据库 | PostgreSQL |
| ROM 存储 | 本地磁盘，按平台分目录，直接公开 URL |
| 用户系统 | 无，纯匿名 |
| 存档 | 不需要（街机无存档机制） |
| 部署 | Docker Compose 单机 |
| 管理后台 | 需要 |
| 联机 | 不需要 |
| 数据来源 | 手动录入 |

---

## 目录结构

```
WebArcade/
├── package.json                  # monorepo root（workspaces）
├── docker-compose.yml            # postgres + server + frontend
├── .gitignore
├── roms/                         # ROM 文件（挂载卷）
│   ├── nes/
│   ├── snes/
│   ├── md/
│   ├── gba/
│   └── arcade/
├── uploads/                      # 封面上传目录（挂载卷）
│
├── packages/
│   ├── core/                     # WebArcade-Core 源码（从 ../WebArcade-Core 移入）
│   │
│   ├── server/                   # Express 后端
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts          # 入口
│   │   │   ├── db.ts             # 数据库连接 + 初始化
│   │   │   ├── routes/
│   │   │   │   ├── games.ts      # /api/games
│   │   │   │   ├── platforms.ts  # /api/platforms
│   │   │   │   └── admin.ts      # /api/admin/*
│   │   │   ├── models/
│   │   │   │   └── game.ts       # 数据库操作
│   │   │   ├── services/
│   │   │   │   ├── roms.ts       # ROM 文件扫描/管理
│   │   │   │   └── upload.ts     # 封面上传（multer）
│   │   │   └── migrations/
│   │   │       └── 001_initial.sql
│   │   └── Dockerfile
│   │
│   └── frontend/                 # React 前端
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx           # 路由
│       │   ├── api/
│       │   │   └── games.ts      # API 调用封装
│       │   ├── pages/
│       │   │   ├── Lobby/        # 游戏大厅（首页）
│       │   │   ├── Game/         # 游戏游玩页（嵌入 WebArcade-Core）
│       │   │   └── Admin/        # 管理后台
│       │   ├── components/       # 共享组件
│       │   │   ├── GameCard.tsx
│       │   │   ├── GameGrid.tsx
│       │   │   ├── PlatformFilter.tsx
│       │   │   ├── SearchBar.tsx
│       │   │   └── ...
│       │   └── styles/
│       │       └── global.css
│       └── Dockerfile
```

---

## WebArcade-Core 集成

WebArcade-Core 整体移入 `packages/core/`，保留其独立 `package.json` 和构建流程，不修改源码结构。前端通过 npm workspace 引用。

---

## 数据库 Schema

```sql
-- 平台枚举
CREATE TYPE platform AS ENUM (
  'nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds',
  'md', 'sms', 'gg', 'psx', 'arcade', 'pce', 'ws', 'wsc'
);

-- 游戏表
CREATE TABLE games (
  id          SERIAL PRIMARY KEY,
  title_zh    VARCHAR(200),                          -- 中文名
  title_en    VARCHAR(200) NOT NULL,                 -- 英文名（必填）
  platform    platform NOT NULL,
  release_year SMALLINT,
  publisher   VARCHAR(200),
  tags        TEXT[] DEFAULT '{}',                    -- PostgreSQL 数组
  cover_url   VARCHAR(500),                           -- 封面图相对路径
  rom_path    VARCHAR(500) NOT NULL,                  -- ROM 文件路径
  rom_hash    VARCHAR(64),                            -- SHA256
  core_type   VARCHAR(50) NOT NULL,                   -- 模拟核心
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_tags ON games USING GIN(tags);
CREATE INDEX idx_games_title ON games USING GIN(to_tsvector('simple', coalesce(title_zh,'') || ' ' || title_en));
```

---

## API 设计

### 大厅接口（公开）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/games` | 游戏列表，支持 `?platform=&tag=&search=&sort=&page=&pageSize=` |
| GET | `/api/games/:id` | 游戏详情 |
| GET | `/api/platforms` | 返回所有平台及其游戏数量 |
| GET | `/api/tags` | 返回所有标签及其游戏数量 |

### 管理后台接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/admin/games` | 新增游戏 |
| PUT | `/api/admin/games/:id` | 编辑游戏信息 |
| DELETE | `/api/admin/games/:id` | 删除游戏 |
| POST | `/api/admin/upload/rom` | 上传 ROM 文件（multipart） |
| POST | `/api/admin/upload/cover` | 上传封面图（multipart） |
| POST | `/api/admin/scan` | 扫描 roms 目录，自动检测新增 ROM |

### 静态文件

| 路径 | 说明 |
|---|---|
| `/roms/*` | ROM 文件（express.static） |
| `/uploads/*` | 封面图（express.static） |
| `/` | 前端 SPA（生产环境） |

---

## 前端路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | Lobby | 游戏大厅，封面墙 |
| `/game/:id` | Game | 游戏游玩页，嵌入 WebArcade-Core |
| `/admin` | Admin | 管理后台 |
| `/admin/games/new` | Admin | 新增/编辑游戏 |

---

## React 前端架构

```
App.tsx
├── <BrowserRouter>
│   ├── /              → <LobbyPage>
│   │   ├── <PlatformFilter />
│   │   ├── <SearchBar />
│   │   ├── <TagFilter />
│   │   ├── <SortSelect />
│   │   └── <GameGrid>
│   │       └── <GameCard />  (×N)
│   │           └── 点击 → <GameDetailModal /> 或跳转 /game/:id
│   ├── /game/:id      → <GamePage>
│   │   ├── <GameToolbar />  （返回、全屏）
│   │   └── <EmulatorFrame /> （加载 WebArcade-Core）
│   └── /admin/*       → <AdminPage>
```

### 状态管理

不需要 Redux/Zustand — 当前需求用 React 内置的 `useState` + `useEffect` + URL 参数已足够：

- 大厅筛选/搜索状态 → URL search params（`?platform=nes&tag=动作`），支持浏览器前进后退
- 管理后台 → 局部 state
- 不需要全局用户状态

---

## 技术栈补充（已确认）

| 层面 | 选型 |
|---|---|
| CSS 方案 | 纯 CSS |
| 数据库驱动 | pg 原生 SQL（node-postgres） |
| 包管理器 | npm |
| 反向代理 | 不需要，Express 直接暴露 |
| HTTP 客户端 | fetch 原生 |
| 文件上传 | multer |

---

## 实施步骤

### 第一阶段：骨架搭建（1-2 天）

1. 初始化 monorepo 根 `package.json`，配置 workspaces
2. 创建 `packages/server/`，Express + TypeScript，跑通一个 `/api/health` 端点
3. 创建 `packages/frontend/`，Vite + React + TypeScript，显示一个空白页
4. 将 `../WebArcade-Core` 移入 `packages/core/`
5. 配置 Docker Compose（postgres + server + frontend）

### 第二阶段：后端核心（1-2 天）

6. 数据库 migration + 连接池
7. `/api/games` CRUD 接口
8. ROM 文件上传 + 封面图上传（multer）
9. ROM 目录扫描自动注册

### 第三阶段：前端大厅（2-3 天）

10. 游戏列表页（GameGrid + GameCard）
11. 平台筛选 + 标签筛选 + 搜索
12. 分页 + 排序
13. 游戏详情弹窗

### 第四阶段：游戏游玩页（1-2 天）

14. `/game/:id` 页面，加载游戏信息
15. 嵌入 WebArcade-Core，传入 ROM 配置
16. 街机按键 UI 叠加层 + 键位调整
17. 全屏切换 + 加载进度 + 错误处理

### 第五阶段：管理后台（1-2 天）

18. 游戏列表管理（编辑/删除）
19. ROM 上传 + 封面图上传表单
20. 批量导入

### 第六阶段：联调与部署

21. 前后端联调
22. Docker Compose 生产配置
