import pg from 'pg';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));

const pgConfig: { database: string; port: number; host?: string; user?: string; password?: string } = {
  database: process.env.DB_NAME ?? 'webarcade',
  port: parseInt(process.env.DB_PORT ?? '5432'),
  host: process.env.DB_HOST ?? '/var/run/postgresql',
};
if (process.env.DB_USER) pgConfig.user = process.env.DB_USER;
if (process.env.DB_PASS) pgConfig.password = process.env.DB_PASS;

const pool = new Pool(pgConfig);

export async function migrate(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        name VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      )
    `);

    let migrationsDir = join(__dirname, 'migrations');
    if (!existsSync(migrationsDir)) {
      migrationsDir = resolve(__dirname, '../src/migrations');
    }
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT name FROM _migrations WHERE name = $1',
        [file]
      );
      if (rows.length > 0) continue;

      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      console.log(`[migrate] applied: ${file}`);
    }
  } finally {
    client.release();
  }
}

export default pool;
