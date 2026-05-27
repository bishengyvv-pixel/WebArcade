import { readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import pool from '../db.js';

const PLATFORM_CORE: Record<string, string> = {
  nes: 'fceumm',
  snes: 'snes9x',
  n64: 'mupen64plus_next',
  gb: 'gambatte',
  gbc: 'gambatte',
  gba: 'mgba',
  nds: 'melonds',
  md: 'genesis_plus_gx',
  sms: 'genesis_plus_gx',
  gg: 'genesis_plus_gx',
  psx: 'pcsx_rearmed',
  arcade: 'fbneo',
  pce: 'mednafen_pce_fast',
  ws: 'mednafen_wswan',
  wsc: 'mednafen_wswan',
};

const ROM_EXTENSIONS = new Set([
  '.nes', '.smc', '.sfc', '.md', '.bin', '.gen', '.smd',
  '.gba', '.gbc', '.gb', '.nds', '.n64', '.z64', '.v64',
  '.iso', '.cue', '.chd', '.zip', '.7z', '.pce', '.ws', '.wsc',
]);

function scanDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        results.push(...scanDir(full));
      } else if (ROM_EXTENSIONS.has(extname(entry).toLowerCase())) {
        results.push(full);
      }
    }
  } catch {
    // dir doesn't exist
  }
  return results;
}

export interface ScanResult {
  found: number;
  added: number;
  skipped: number;
  files: string[];
}

export async function scanRoms(): Promise<ScanResult> {
  const romsDir = process.env.ROMS_DIR ?? 'roms';
  const files = scanDir(romsDir);

  let added = 0;
  let skipped = 0;

  for (const filepath of files) {
    const { rows: existing } = await pool.query(
      'SELECT id FROM games WHERE rom_path = $1',
      [filepath]
    );
    if (existing.length > 0) {
      skipped++;
      continue;
    }

    const name = basename(filepath, extname(filepath));
    const segments = filepath.split('/');
    const platformIdx = segments.indexOf(romsDir);
    const platform = platformIdx >= 0 && platformIdx + 1 < segments.length
      ? segments[platformIdx + 1]
      : 'unknown';

    await pool.query(
      `INSERT INTO games (title_en, platform, tags, rom_path, core_type)
       VALUES ($1, $2, '{}', $3, $4)`,
      [name, platform, filepath, PLATFORM_CORE[platform] ?? '']
    );
    added++;
  }

  return { found: files.length, added, skipped, files };
}
