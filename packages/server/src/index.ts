import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from './db.js';
import gamesRouter from './routes/games.js';
import adminRouter from './routes/admin.js';
import platformsRouter from './routes/platforms.js';
import tagsRouter from './routes/tags.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001');
const ROMS_DIR = process.env.ROMS_DIR ?? 'roms';
const UPLOADS_DIR = process.env.UPLOADS_DIR ?? 'uploads';
const CORE_DATA_DIR = process.env.CORE_DATA_DIR ?? resolve(__dirname, '../../core/data');
const FRONTEND_DIST = process.env.FRONTEND_DIST ?? resolve(__dirname, '../../frontend/dist');

app.use(cors());
app.use(express.json());

// 静态资源
app.use('/roms', express.static(ROMS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/data', express.static(CORE_DATA_DIR));

// API 路由
app.use('/api/games', gamesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/tags', tagsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 生产模式：托管前端构建产物
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(resolve(FRONTEND_DIST, 'index.html'));
  });
  console.log(`[prod] Serving frontend from ${FRONTEND_DIST}`);
}

async function start() {
  try {
    await migrate();
  } catch (err) {
    console.error('Migration failed, continuing:', err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();

export default app;
