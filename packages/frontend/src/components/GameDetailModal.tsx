import { useNavigate } from 'react-router-dom';
import { PLATFORM_LABELS, assetUrl, type Game } from '../api/games';

interface Props {
  game: Game;
  onClose: () => void;
}

export default function GameDetailModal({ game, onClose }: Props) {
  const navigate = useNavigate();
  const title = game.title_zh || game.title_en;

  const handlePlay = () => {
    navigate(`/game/${game.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal__close" onClick={onClose}>✕</button>
        <div className="modal__body">
          <div className="modal__cover">
            {game.cover_url ? (
              <img src={assetUrl(game.cover_url)!} alt={title} />
            ) : (
              <div className="modal__placeholder">{title}</div>
            )}
          </div>
          <div className="modal__info">
            <h2>{title}</h2>
            {game.title_zh && game.title_en && (
              <p className="modal__subtitle">{game.title_en}</p>
            )}
            <div className="modal__meta">
              <span>{PLATFORM_LABELS[game.platform] ?? game.platform}</span>
              {game.release_year && <span>{game.release_year}</span>}
              {game.publisher && <span>{game.publisher}</span>}
            </div>
            {game.tags.length > 0 && (
              <div className="modal__tags">
                {game.tags.map((tag) => (
                  <span key={tag} className="modal__tag">{tag}</span>
                ))}
              </div>
            )}
            <button className="modal__play-btn" onClick={handlePlay}>
              开始游戏
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
