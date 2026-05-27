import { PLATFORM_LABELS, assetUrl, type Game } from '../api/games';

interface Props {
  game: Game;
  onClick: () => void;
}

export default function GameCard({ game, onClick }: Props) {
  const title = game.title_zh || game.title_en;

  return (
    <div className="game-card" onClick={onClick}>
      <div className="game-card__cover">
        {game.cover_url ? (
          <img src={assetUrl(game.cover_url)!} alt={title} loading="lazy" />
        ) : (
          <div className="game-card__placeholder">
            <span>{title.slice(0, 2)}</span>
          </div>
        )}
      </div>
      <div className="game-card__info">
        <span className="game-card__platform">{PLATFORM_LABELS[game.platform] ?? game.platform}</span>
        <h3 className="game-card__title">{title}</h3>
        {game.release_year && (
          <span className="game-card__year">{game.release_year}</span>
        )}
      </div>
    </div>
  );
}
