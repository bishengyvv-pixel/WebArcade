import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

type Status = '' | 'starting' | 'running' | 'exited';

export default function GameTestPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);
  const [status, setStatus] = useState<Status>('');

  const [romUrl, setRomUrl] = useState('/roms/nes/Raiden DX (Japan) (Major Wave).7z');
  const [core, setCore] = useState('nes');
  const [gameName, setGameName] = useState('Test Game');

  const startEmulator = useCallback(() => {
    if (!containerRef.current || startedRef.current) return;
    startedRef.current = true;

    const container = containerRef.current;
    const gameEl = document.createElement('div');
    gameEl.id = 'game';
    container.appendChild(gameEl);

    window.EJS_player = '#game';
    window.EJS_gameName = gameName;
    window.EJS_gameUrl = romUrl;
    window.EJS_core = core;
    window.EJS_pathtodata = '/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_DEBUG_XX = false;
    window.EJS_askBeforeExit = false;

    window.EJS_onGameStart = () => setStatus('running');
    window.EJS_onExit = () => setStatus('exited');

    const script = document.createElement('script');
    script.src = '/data/loader.js';
    document.body.appendChild(script);
  }, [gameName, romUrl, core]);

  // Trigger DOM setup after React removes the placeholder
  useEffect(() => {
    if (status !== 'starting') return;
    const timer = setTimeout(startEmulator, 0);
    return () => clearTimeout(timer);
  }, [status, startEmulator]);

  useEffect(() => {
    return () => {
      delete window.EJS_player;
      delete window.EJS_gameUrl;
      delete window.EJS_core;
      delete window.EJS_pathtodata;
      delete window.EJS_onGameStart;
      delete window.EJS_onExit;
    };
  }, []);

  const handleLaunch = () => setStatus('starting');

  return (
    <div className="game-page">
      <div className="game-page__toolbar">
        <button className="game-page__btn" onClick={() => navigate('/')}>返回大厅</button>
        <span className="game-page__title">Test: {gameName}</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{status}</span>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <div className="game-page__emulator" ref={containerRef}>
          {!status && (
            <div style={{
              position: 'absolute', inset: 0, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                aspectRatio: '4 / 3',
                height: '70%',
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.1)',
                fontSize: 14,
              }}>
                游戏画面区域
              </div>
            </div>
          )}
        </div>

        {!status && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 400 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                ROM URL
                <input value={romUrl} onChange={(e) => setRomUrl(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Core
                <input value={core} onChange={(e) => setCore(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Game Name
                <input value={gameName} onChange={(e) => setGameName(e.target.value)}
                  style={{ padding: '4px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }} />
              </label>
              <button onClick={handleLaunch}
                style={{ padding: '8px 16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Launch Emulator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
