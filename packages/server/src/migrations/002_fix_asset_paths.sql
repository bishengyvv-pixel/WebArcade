-- Fix absolute Docker paths stored by old upload routes.
-- Old: /data/uploads/xxx.webp   New: uploads/xxx.webp
-- Old: /data/roms/psx/game.7z   New: roms/psx/game.7z
UPDATE games SET cover_url = REGEXP_REPLACE(cover_url, '^/data/uploads/', 'uploads/')
WHERE cover_url LIKE '/data/uploads/%';

UPDATE games SET rom_path = REGEXP_REPLACE(rom_path, '^/data/roms/', 'roms/')
WHERE rom_path LIKE '/data/roms/%';
