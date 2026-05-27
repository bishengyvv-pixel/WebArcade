import pool from '../db.js';

export interface Game {
  id: number;
  title_zh: string | null;
  title_en: string;
  platform: string;
  release_year: number | null;
  publisher: string | null;
  tags: string[];
  cover_url: string | null;
  rom_path: string;
  rom_hash: string | null;
  core_type: string;
  created_at: string;
  updated_at: string;
}

export interface GameListParams {
  platform?: string;
  tag?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface GameListResult {
  items: Game[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listGames(params: GameListParams): Promise<GameListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: (string | number)[] = [];
  let paramIdx = 1;

  if (params.platform) {
    conditions.push(`platform = $${paramIdx++}`);
    values.push(params.platform);
  }
  if (params.tag) {
    conditions.push(`$${paramIdx++} = ANY(tags)`);
    values.push(params.tag);
  }
  if (params.search) {
    conditions.push(
      `(to_tsvector('simple', coalesce(title_zh, '') || ' ' || title_en) @@ plainto_tsquery('simple', $${paramIdx++}))`
    );
    values.push(params.search);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let orderBy = 'ORDER BY created_at DESC';
  if (params.sort === 'title') orderBy = 'ORDER BY title_en ASC';
  if (params.sort === 'year') orderBy = 'ORDER BY release_year DESC NULLS LAST';

  const countQuery = `SELECT COUNT(*) FROM games ${where}`;
  const dataQuery = `SELECT * FROM games ${where} ${orderBy} LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;

  const [countResult, dataResult] = await Promise.all([
    pool.query(countQuery, values),
    pool.query(dataQuery, [...values, pageSize, offset]),
  ]);

  return {
    items: dataResult.rows,
    total: parseInt(countResult.rows[0].count),
    page,
    pageSize,
  };
}

export async function getGame(id: number): Promise<Game | null> {
  const { rows } = await pool.query('SELECT * FROM games WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createGame(data: Omit<Game, 'id' | 'created_at' | 'updated_at'>): Promise<Game> {
  const { rows } = await pool.query(
    `INSERT INTO games (title_zh, title_en, platform, release_year, publisher, tags, cover_url, rom_path, rom_hash, core_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [data.title_zh, data.title_en, data.platform, data.release_year, data.publisher, data.tags, data.cover_url, data.rom_path, data.rom_hash, data.core_type]
  );
  return rows[0];
}

export async function updateGame(id: number, data: Partial<Game>): Promise<Game | null> {
  const fields: string[] = [];
  const values: (string | number | string[] | null)[] = [];
  let idx = 1;

  for (const key of ['title_zh', 'title_en', 'platform', 'release_year', 'publisher', 'tags', 'cover_url', 'rom_path', 'rom_hash', 'core_type'] as const) {
    if (data[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(data[key] as (string | number | string[] | null));
    }
  }
  if (fields.length === 0) return null;
  fields.push(`updated_at = NOW()`);

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE games SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function deleteGame(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM games WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function listPlatforms(): Promise<{ platform: string; count: number }[]> {
  const { rows } = await pool.query(
    'SELECT platform, COUNT(*)::int AS count FROM games GROUP BY platform ORDER BY platform'
  );
  return rows;
}

export async function listTags(): Promise<{ tag: string; count: number }[]> {
  const { rows } = await pool.query(
    `SELECT unnest(tags) AS tag, COUNT(*)::int AS count FROM games GROUP BY tag ORDER BY count DESC`
  );
  return rows;
}
