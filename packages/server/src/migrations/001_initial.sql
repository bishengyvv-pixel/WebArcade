-- 平台枚举
DO $$ BEGIN
  CREATE TYPE platform AS ENUM (
    'nes', 'snes', 'n64', 'gb', 'gbc', 'gba', 'nds',
    'md', 'sms', 'gg', 'psx', 'arcade', 'pce', 'ws', 'wsc'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 游戏表
CREATE TABLE IF NOT EXISTS games (
  id           SERIAL PRIMARY KEY,
  title_zh     VARCHAR(200),
  title_en     VARCHAR(200) NOT NULL,
  platform     platform NOT NULL,
  release_year SMALLINT,
  publisher    VARCHAR(200),
  tags         TEXT[] DEFAULT '{}',
  cover_url    VARCHAR(500),
  rom_path     VARCHAR(500) NOT NULL,
  rom_hash     VARCHAR(64),
  core_type    VARCHAR(50) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_platform ON games(platform);
CREATE INDEX idx_games_tags ON games USING GIN(tags);
CREATE INDEX idx_games_title ON games USING GIN(to_tsvector('simple', coalesce(title_zh, '') || ' ' || title_en));
