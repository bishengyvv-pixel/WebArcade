import type { Game } from '../api/games';
import GameCard from './GameCard';

interface Props {
  games: Game[];
  onGameClick: (game: Game) => void;
  loading?: boolean;
  error?: string | null;
}

export default function GameGrid({ games, onGameClick, loading, error }: Props) {
  if (loading) {
    return <div className="game-grid__loading">加载中...</div>;
  }

  if (error) {
    return <div className="game-grid__error">{error}</div>;
  }

  if (games.length === 0) {
    return <div className="game-grid__empty">暂无游戏</div>;
  }

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game.id} game={game} onClick={() => onGameClick(game)} />
      ))}
    </div>
  );
}
