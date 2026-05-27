import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchGames, fetchPlatforms, fetchTags, type Game, type PlatformInfo, type TagInfo } from '../../api/games';
import SearchBar from '../../components/SearchBar';
import PlatformFilter from '../../components/PlatformFilter';
import TagFilter from '../../components/TagFilter';
import SortSelect from '../../components/SortSelect';
import GameGrid from '../../components/GameGrid';
import Pagination from '../../components/Pagination';
import GameDetailModal from '../../components/GameDetailModal';

const PAGE_SIZE = 20;

export default function LobbyPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const platform = searchParams.get('platform') ?? '';
  const tag = searchParams.get('tag') ?? '';
  const search = searchParams.get('search') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1');

  const [games, setGames] = useState<Game[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [tags, setTags] = useState<TagInfo[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const updateParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== 'page') next.delete('page');
      return next;
    });
  }, [setSearchParams]);

  useEffect(() => {
    fetchPlatforms().then(setPlatforms).catch(() => {});
    fetchTags().then(setTags).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchGames({ platform, tag, search, sort, page, pageSize: PAGE_SIZE })
      .then((data) => {
        setGames(data.items);
        setTotal(data.total);
      })
      .catch(() => setError('加载失败，请稍后重试'))
      .finally(() => setLoading(false));
  }, [platform, tag, search, sort, page]);

  return (
    <div className="lobby">
      <header className="lobby__header">
        <h1 className="lobby__title">WebArcade</h1>
        <SearchBar value={search} onSearch={(v) => updateParam('search', v)} />
      </header>

      <div className="lobby__filters">
        <PlatformFilter platforms={platforms} selected={platform} onChange={(v) => updateParam('platform', v)} />
        <TagFilter tags={tags} selected={tag} onChange={(v) => updateParam('tag', v)} />
        <div className="lobby__filters-bottom">
          <span className="lobby__count">共 {total} 款游戏</span>
          <SortSelect value={sort} onChange={(v) => updateParam('sort', v)} />
        </div>
      </div>

      <main className="lobby__main">
        <GameGrid games={games} loading={loading} error={error} onGameClick={setSelectedGame} />
      </main>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={(p) => updateParam('page', String(p))}
      />

      {selectedGame && (
        <GameDetailModal game={selectedGame} onClose={() => setSelectedGame(null)} />
      )}
    </div>
  );
}
