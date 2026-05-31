import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GamepadOverlay from './GamepadOverlay';

type SimState = 'idle' | 'loading' | 'starting' | 'ready';

export default function GameTestPage() {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState('arcade');
  const [editingKeys, setEditingKeys] = useState(false);
  const [showError, setShowError] = useState(false);
  const [simulateState, setSimulateState] = useState<SimState>('idle');

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

  if (showError) {
    return (
      <div className="game-page game-page--error">
        <div className="game-page__error-box">
          <p>模拟器已退出（测试占位）</p>
          <button onClick={() => setShowError(false)}>返回页面</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      {/* 工具栏 */}
      <div className="game-page__toolbar">
        <button className="game-page__btn" onClick={() => navigate('/')}>
          返回大厅
        </button>
        <span className="game-page__title">
          {simulateState === 'ready' ? '测试游戏名称' : '测试游戏'}
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

      {/* 模拟器区域 */}
      <div className="game-page__emulator">
        {simulateState === 'loading' && (
          <div className="game-page__status">
            <div className="game-page__spinner" />
            <p>加载中...</p>
          </div>
        )}
        {simulateState === 'starting' && (
          <div className="game-page__status">
            <div className="game-page__spinner" />
            <p>正在启动模拟器...</p>
          </div>
        )}
        {simulateState === 'idle' && (
          <div
            className="game-page__status"
            style={{
              width: '100%',
              height: '100%',
              background: 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
            }}
          >
            <div
              style={{
                marginTop: '10px',
                aspectRatio: '4 / 3',
                width: 'min(100%, calc(100vh * 0.7 * 4 / 3))',
                maxHeight: '100%',
                background: '#000',
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.15)',
                fontSize: 14,
              }}
            >
              游戏画面区域
            </div>
          </div>
        )}
      </div>

      <GamepadOverlay
        platform={platform}
        editing={editingKeys}
        onEditDone={() => setEditingKeys(false)}
      />

      {/* 状态模拟控制器 */}
      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: 12,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
          fontSize: 12,
          color: 'var(--color-text-muted)',
        }}
      >
        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>状态模拟</span>
        {(['idle', 'loading', 'starting', 'ready'] as const).map((s) => (
          <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name="simState"
              checked={simulateState === s}
              onChange={() => setSimulateState(s)}
            />
            {s}
          </label>
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 4 }}>
          <input
            type="checkbox"
            checked={showError}
            onChange={(e) => setShowError(e.target.checked)}
          />
          错误态
        </label>
        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
        <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>手柄布局</span>
        {(['arcade', 'psx'] as const).map((p) => (
          <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="radio"
              name="platform"
              checked={platform === p}
              onChange={() => setPlatform(p)}
            />
            {p === 'arcade' ? '街机' : 'PlayStation'}
          </label>
        ))}
      </div>
    </div>
  );
}
