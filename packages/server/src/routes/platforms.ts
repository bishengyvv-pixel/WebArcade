import { Router } from 'express';
import { listPlatforms } from '../models/game.js';

const router = Router();

router.get('/', async (_req, res) => {
  const platforms = await listPlatforms();
  res.json(platforms);
});

export default router;
