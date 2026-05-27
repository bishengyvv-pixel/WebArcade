import { useState, useEffect, useCallback, useRef } from 'react';

interface Binding {
  label: string;
  code: string;
}

const STORAGE_KEY = 'webarcade_keybindings';

const DEFAULTS: Binding[] = [
  { label: '↑', code: 'ArrowUp' },
  { label: '←', code: 'ArrowLeft' },
  { label: '↓', code: 'ArrowDown' },
  { label: '→', code: 'ArrowRight' },
  { label: 'A', code: 'KeyX' },
  { label: 'B', code: 'KeyZ' },
  { label: 'C', code: 'KeyC' },
  { label: 'Start', code: 'Enter' },
  { label: 'Select', code: 'ShiftRight' },
];

function loadBindings(): Binding[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return DEFAULTS;
}

const DIR_KEYS = new Set(['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const ACTION_KEYS = new Set(['KeyX', 'KeyZ', 'KeyC']);
const CENTER_KEYS = new Set(['Enter', 'ShiftRight']);

function classify(code: string): 'dir' | 'action' | 'center' {
  if (DIR_KEYS.has(code)) return 'dir';
  if (ACTION_KEYS.has(code)) return 'action';
  if (CENTER_KEYS.has(code)) return 'center';
  return 'action';
}

interface Props {
  editing: boolean;
  onEditDone: () => void;
}

export default function ArcadeButtons({ editing, onEditDone }: Props) {
  const [bindings, setBindings] = useState<Binding[]>(loadBindings);
  const [listening, setListening] = useState<string | null>(null);
  const savePendingRef = useRef<Binding[] | null>(null);

  useEffect(() => {
    if (!editing) return;

    const handleKey = (e: KeyboardEvent) => {
      if (!listening) return;
      e.preventDefault();
      e.stopPropagation();
      const code = e.code;
      setBindings((prev) => {
        const next = prev.map((b) => (b.label === listening ? { ...b, code } : b));
        savePendingRef.current = next;
        return next;
      });
      setListening(null);
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [editing, listening]);

  useEffect(() => {
    if (savePendingRef.current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savePendingRef.current));
      savePendingRef.current = null;
    }
  }, [bindings]);

  const simulateKey = useCallback((code: string, type: 'keydown' | 'keyup') => {
    const el = document.getElementById('game') || document.body;
    el.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  }, []);

  const dirButtons = bindings.filter((b) => classify(b.code) === 'dir');
  const actionButtons = bindings.filter((b) => classify(b.code) === 'action');
  const centerButtons = bindings.filter((b) => classify(b.code) === 'center');

  const handleReset = () => {
    setBindings(DEFAULTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  };

  return (
    <div className="arcade-buttons">
      {editing && (
        <div className="arcade-buttons__remap-bar">
          <span>点击按钮后按下新按键进行绑定</span>
          <button className="arcade-buttons__remap-btn" onClick={handleReset}>恢复默认</button>
          <button className="arcade-buttons__remap-btn" onClick={onEditDone}>完成</button>
        </div>
      )}

      <div className="arcade-buttons__left">
        {dirButtons.map((btn) => (
          <button
            key={btn.label}
            className={`arcade-btn ${listening === btn.label ? 'arcade-btn--listening' : ''}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (editing) { setListening(btn.label); return; }
              simulateKey(btn.code, 'keydown');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              if (editing) return;
              simulateKey(btn.code, 'keyup');
            }}
            onPointerLeave={() => {
              if (!editing) simulateKey(btn.code, 'keyup');
            }}
          >
            {btn.label}
            {editing && <span className="arcade-btn__key">{btn.code}</span>}
          </button>
        ))}
      </div>

      {centerButtons.length > 0 && (
        <div className="arcade-buttons__center">
          {centerButtons.map((btn) => (
            <button
              key={btn.label}
              className={`arcade-btn arcade-btn--wide ${listening === btn.label ? 'arcade-btn--listening' : ''}`}
              onPointerDown={(e) => {
                e.preventDefault();
                if (editing) { setListening(btn.label); return; }
                simulateKey(btn.code, 'keydown');
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                if (editing) return;
                simulateKey(btn.code, 'keyup');
              }}
              onPointerLeave={() => {
                if (!editing) simulateKey(btn.code, 'keyup');
              }}
            >
              {btn.label}
              {editing && <span className="arcade-btn__key">{btn.code}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="arcade-buttons__right">
        {actionButtons.map((btn) => (
          <button
            key={btn.label}
            className={`arcade-btn arcade-btn--action ${listening === btn.label ? 'arcade-btn--listening' : ''}`}
            onPointerDown={(e) => {
              e.preventDefault();
              if (editing) { setListening(btn.label); return; }
              simulateKey(btn.code, 'keydown');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              if (editing) return;
              simulateKey(btn.code, 'keyup');
            }}
            onPointerLeave={() => {
              if (!editing) simulateKey(btn.code, 'keyup');
            }}
          >
            {btn.label}
            {editing && <span className="arcade-btn__key">{btn.code}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
