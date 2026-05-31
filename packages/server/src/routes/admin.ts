import { Router } from 'express';
import { createGame, updateGame, deleteGame } from '../models/game.js';
import { uploadRom, uploadCover } from '../services/upload.js';
import { scanRoms } from '../services/roms.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

const router = Router();

router.post('/games', async (req, res) => {
  try {
    const game = await createGame(req.body);
    res.status(201).json(game);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.put('/games/:id', async (req, res) => {
  try {
    const game = await updateGame(parseInt(req.params.id), req.body);
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(game);
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

router.delete('/games/:id', async (req, res) => {
  const ok = await deleteGame(parseInt(req.params.id));
  if (!ok) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.status(204).send();
});

router.post('/upload/rom', uploadRom.single('rom'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const platform = (req.query.platform as string) || 'unknown';
  res.json({ path: `roms/${platform}/${req.file.filename}`, filename: req.file.filename });
});

router.post('/upload/cover', uploadCover.single('cover'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  res.json({ path: `uploads/${req.file.filename}`, filename: req.file.filename });
});

router.delete('/upload/cover/:filename', async (req, res) => {
  const filename = req.params.filename;
  if (filename.includes('/') || filename.includes('\\')) {
    res.status(400).json({ error: 'Invalid filename' });
    return;
  }
  const uploadsDir = process.env.UPLOADS_DIR ?? 'uploads';
  const filepath = join(uploadsDir, filename);
  try {
    await unlink(filepath);
    res.status(204).send();
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

router.post('/scan', async (_req, res) => {
  const result = await scanRoms();
  res.json(result);
});

export default router;
