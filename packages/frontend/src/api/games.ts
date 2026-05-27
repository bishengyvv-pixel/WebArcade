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
  core_type: string;
}

export function assetUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('/') || /^https?:\/\//.test(path)) return path;
  return `/${path}`;
}

export interface GameListParams {
  platform?: string;
  tag?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface GameListResponse {
  items: Game[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PlatformInfo {
  platform: string;
  count: number;
}

export interface TagInfo {
  tag: string;
  count: number;
}

export async function fetchGames(params: GameListParams = {}): Promise<GameListResponse> {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const res = await fetch(`/api/games?${searchParams}`);
  if (!res.ok) throw new Error(`Failed to fetch games: ${res.status}`);
  return res.json();
}

export async function fetchGame(id: number): Promise<Game> {
  const res = await fetch(`/api/games/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch game ${id}: ${res.status}`);
  return res.json();
}

export async function fetchPlatforms(): Promise<PlatformInfo[]> {
  const res = await fetch('/api/platforms');
  if (!res.ok) throw new Error(`Failed to fetch platforms: ${res.status}`);
  return res.json();
}

export async function fetchTags(): Promise<TagInfo[]> {
  const res = await fetch('/api/tags');
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
  return res.json();
}

export async function fetchDeleteGame(id: number): Promise<void> {
  const res = await fetch(`/api/admin/games/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete game ${id}: ${res.status}`);
}

export async function fetchCreateGame(data: Partial<Game>): Promise<Game> {
  const res = await fetch('/api/admin/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create game: ${res.status}`);
  return res.json();
}

export async function fetchUpdateGame(id: number, data: Partial<Game>): Promise<Game> {
  const res = await fetch(`/api/admin/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update game ${id}: ${res.status}`);
  return res.json();
}

export async function fetchUploadRom(file: File, platform: string): Promise<{ path: string }> {
  const form = new FormData();
  form.append('rom', file);
  const res = await fetch(`/api/admin/upload/rom?platform=${encodeURIComponent(platform)}`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to upload ROM: ${res.status}`);
  return res.json();
}

export async function fetchUploadCover(file: File): Promise<{ path: string }> {
  const form = new FormData();
  form.append('cover', file);
  const res = await fetch('/api/admin/upload/cover', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`Failed to upload cover: ${res.status}`);
  return res.json();
}

export async function fetchDeleteCover(filename: string): Promise<void> {
  const res = await fetch(`/api/admin/upload/cover/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete cover: ${res.status}`);
}

export interface ScanResult {
  found: number;
  added: number;
  skipped: number;
  files: string[];
}

export async function fetchScanRoms(): Promise<ScanResult> {
  const res = await fetch('/api/admin/scan', { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to scan ROMs: ${res.status}`);
  return res.json();
}

export const PLATFORM_LABELS: Record<string, string> = {
  nes: 'Nintendo Entertainment System',
  snes: 'Super Nintendo Entertainment System',
  n64: 'Nintendo 64',
  gb: 'Nintendo Game Boy',
  gba: 'Nintendo Game Boy Advance',
  nds: 'Nintendo DS',
  segaMD: 'Sega Mega Drive',
  segaMS: 'Sega Master System',
  segaGG: 'Sega Game Gear',
  segaCD: 'Sega CD',
  sega32x: 'Sega 32X',
  segaSaturn: 'Sega Saturn',
  psx: 'PlayStation',
  arcade: 'Arcade',
  pce: 'NEC TurboGrafx-16/SuperGrafx/PC Engine',
  pcfx: 'NEC PC-FX',
  ws: 'Bandai WonderSwan (Color)',
  ngp: 'SNK NeoGeo Pocket (Color)',
  vb: 'Virtual Boy',
  lynx: 'Atari Lynx',
  jaguar: 'Atari Jaguar',
  atari2600: 'Atari 2600',
  atari7800: 'Atari 7800',
  coleco: 'ColecoVision',
  vice_x64sc: 'Commodore 64',
  vice_x128: 'Commodore 128',
  vice_xvic: 'Commodore VIC20',
  vice_xplus4: 'Commodore Plus/4',
  vice_xpet: 'Commodore PET',
  puae: 'Amiga',
};
