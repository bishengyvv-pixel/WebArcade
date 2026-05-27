import { Router } from 'express';
import { listGames, getGame } from '../models/game.js';

const router = Router();

router.get('/', async (req, res) => {
  const { platform, tag, search, sort, page, pageSize } = req.query;
  const result = await listGames({
    platform: platform as string | undefined,
    tag: tag as string | undefined,
    search: search as string | undefined,
    sort: sort as string | undefined,
    page: page ? parseInt(page as string) : undefined,
    pageSize: pageSize ? parseInt(pageSize as string) : undefined,
  });
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const game = await getGame(parseInt(req.params.id));
  if (!game) {
    res.status(404).json({ error: 'Game not found' });
    return;
  }
  res.json(game);
});

export default router;
