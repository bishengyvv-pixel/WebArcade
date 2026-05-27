import { Router } from 'express';
import { listTags } from '../models/game.js';

const router = Router();

router.get('/', async (_req, res) => {
  const tags = await listTags();
  res.json(tags);
});

export default router;
