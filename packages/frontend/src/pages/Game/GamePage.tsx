import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchGame, assetUrl, type Game } from '../../api/games';
import GamepadOverlay from './GamepadOverlay';

type LoadState = 'loading' | 'loading-game' | 'starting' | 'ready' | 'error';

export default function GamePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [state, setState] = useState<LoadState>('loading');
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState('');
  const [editingKeys, setEditingKeys] = useState(false);

  useEffect(() => {
    if (!id) return;
    setState('loading-game');
    fetchGame(parseInt(id))
      .then((g) => {
        setGame(g);
        setState('starting');
      })
      .catch((err) => {
        setError('加载游戏信息失败: ' + String(err));
        setState('error');
      });
  }, [id]);

  const startEmulator = useCallback(() => {
    if (!game || !containerRef.current || startedRef.current) return;
    startedRef.current = true;

    const container = containerRef.current;
    const gameEl = document.createElement('div');
    gameEl.id = 'game';
    container.appendChild(gameEl);

    window.EJS_player = '#game';
    window.EJS_gameName = game.title_zh || game.title_en;
    window.EJS_gameUrl = assetUrl(game.rom_path)!;
    window.EJS_core = game.core_type || game.platform;
    window.EJS_pathtodata = '/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false;
    window.EJS_askBeforeExit = false;

    window.EJS_onGameStart = () => {
      setState('ready');
    };

    window.EJS_onExit = () => {
      setError('模拟器已退出');
      setState('error');
    };

    const script = document.createElement('script');
    script.src = '/data/loader.js';
    document.body.appendChild(script);
  }, [game]);

  useEffect(() => {
    if (state === 'starting') {
      const timer = setTimeout(startEmulator, 100);
      return () => clearTimeout(timer);
    }
  }, [state, startEmulator]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  if (state === 'error') {
    return (
      <div className="game-page game-page--error">
        <div className="game-page__error-box">
          <p>{error}</p>
          <button onClick={() => navigate('/')}>返回大厅</button>
          <button onClick={() => window.location.reload()}>重试</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-page__toolbar">
        <button className="game-page__btn" onClick={() => navigate('/')}>
          返回大厅
        </button>
        <span className="game-page__title">
          {game?.title_zh || game?.title_en || '加载中...'}
        </span>
        <div className="game-page__actions">
          <button
            className={`game-page__btn ${editingKeys ? 'active' : ''}`}
            onClick={() => setEditingKeys(!editingKeys)}
          >
            键位
          </button>
          <button className="game-page__btn" onClick={toggleFullscreen}>
            全屏
          </button>
        </div>
      </div>

      <div className="game-page__emulator" ref={containerRef}>
        {(state === 'loading' || state === 'loading-game') && (
          <div className="game-page__status">
            <div className="game-page__spinner" />
            <p>{state === 'loading' ? '加载中...' : '获取游戏信息...'}</p>
          </div>
        )}
        {state === 'starting' && (
          <div className="game-page__status">
            <div className="game-page__spinner" />
            <p>正在启动模拟器...</p>
          </div>
        )}
      </div>

      {game && (
        <GamepadOverlay
          platform={game.platform}
          editing={editingKeys}
          onEditDone={() => setEditingKeys(false)}
        />
      )}
    </div>
  );
}

declare global {
  interface Window {
    EJS_player?: string;
    EJS_gameName?: string;
    EJS_gameUrl?: string;
    EJS_core?: string;
    EJS_pathtodata?: string;
    EJS_startOnLoaded?: boolean;
    EJS_DEBUG_XX?: boolean;
    EJS_askBeforeExit?: boolean;
    EJS_onGameStart?: () => void;
    EJS_onExit?: () => void;
    EJS_emulator?: {
      on: (event: string, cb: () => void) => void;
      gameManager?: { pause: () => void; resume: () => void };
    };
  }
}
