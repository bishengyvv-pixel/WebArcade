import multer from 'multer';
import { extname } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const romsDir = process.env.ROMS_DIR ?? 'roms';
const uploadsDir = process.env.UPLOADS_DIR ?? 'uploads';

function ensureDir(dir: string): string {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

const romStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const platform = (req.query.platform as string) || req.body?.platform || 'unknown';
    const dir = ensureDir(`${romsDir}/${platform}`);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname);
  },
});

const coverStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureDir(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.png';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

export const uploadRom = multer({ storage: romStorage });
export const uploadCover = multer({ storage: coverStorage });
