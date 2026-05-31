import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Joystick from './Joystick';

// ==== 类型 ====

interface Binding {
  label: string;
  code: string;
}

type Layout = 'arcade' | 'psx';

// ==== 默认键位 ====

const ARCADE_DEFAULTS: Binding[] = [
  { label: '↑', code: 'ArrowUp' },
  { label: '←', code: 'ArrowLeft' },
  { label: '↓', code: 'ArrowDown' },
  { label: '→', code: 'ArrowRight' },
  { label: 'A', code: 'KeyX' },
  { label: 'B', code: 'KeyZ' },
  { label: 'C', code: 'KeyC' },
  { label: 'D', code: 'KeyV' },
  { label: 'E', code: 'KeyB' },
  { label: 'F', code: 'KeyN' },
  { label: 'Start', code: 'Enter' },
  { label: 'Select', code: 'ShiftRight' },
];

const PSX_DEFAULTS: Binding[] = [
  { label: '↑', code: 'ArrowUp' },
  { label: '←', code: 'ArrowLeft' },
  { label: '↓', code: 'ArrowDown' },
  { label: '→', code: 'ArrowRight' },
  { label: 'L1', code: 'KeyQ' },
  { label: 'R1', code: 'KeyE' },
  { label: '△', code: 'KeyI' },
  { label: '○', code: 'KeyL' },
  { label: '×', code: 'KeyK' },
  { label: '□', code: 'KeyJ' },
  { label: 'Start', code: 'Enter' },
  { label: 'Select', code: 'ShiftRight' },
];

// ==== 工具 ====

function defaultsFor(layout: Layout): Binding[] {
  return layout === 'psx' ? PSX_DEFAULTS : ARCADE_DEFAULTS;
}

function storageKey(layout: Layout): string {
  return `webarcade_keybindings_${layout}`;
}

function loadBindings(layout: Layout): Binding[] {
  try {
    const saved = localStorage.getItem(storageKey(layout));
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return defaultsFor(layout);
}

function buildCodeToLabel(bindings: Binding[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const b of bindings) {
    map.set(b.code, b.label);
  }
  return map;
}

// ==== 分类（按 label 而非 code，确保重绑后位置不变） ====

const DIR_LABELS = new Set(['↑', '←', '↓', '→']);
const CENTER_LABELS = new Set(['Start', 'Select']);
const SHOULDER_LABELS = new Set(['L1', 'R1']);

// ==== Props ====

interface Props {
  platform: string;
  editing: boolean;
  onEditDone: () => void;
}

// ==== 共享子组件: 可绑定按键 ====

interface KeyButtonProps {
  binding: Binding;
  pressed: boolean;
  listening: boolean;
  editing: boolean;
  extraClass?: string;
  onSimulate: (code: string, type: 'keydown' | 'keyup') => void;
  onListen: (label: string) => void;
}

function KeyButton({ binding, pressed, listening, editing, extraClass, onSimulate, onListen }: KeyButtonProps) {
  const base = 'gamepad-btn';
  const cls = [base];
  if (extraClass) cls.push(extraClass);
  if (pressed) cls.push(`${base}--pressed`);
  if (listening) cls.push(`${base}--listening`);

  return (
    <button
      className={cls.join(' ')}
      onPointerDown={(e) => {
        e.preventDefault();
        if (editing) { onListen(binding.label); return; }
        onSimulate(binding.code, 'keydown');
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        if (editing) return;
        onSimulate(binding.code, 'keyup');
      }}
      onPointerLeave={() => {
        if (!editing) onSimulate(binding.code, 'keyup');
      }}
    >
      {binding.label}
      {editing && <span className={`${base}__key`}>{binding.code}</span>}
    </button>
  );
}

// ==== 街机布局 ====

function ArcadeLayout({
  bindings, pressedSet, listening, editing, onSimulate, onListen,
}: {
  bindings: Binding[];
  pressedSet: Set<string>;
  listening: string | null;
  editing: boolean;
  onSimulate: (code: string, type: 'keydown' | 'keyup') => void;
  onListen: (label: string) => void;
}) {
  const dirs = bindings.filter((b) => DIR_LABELS.has(b.label));
  const centers = bindings.filter((b) => CENTER_LABELS.has(b.label));
  const actions = bindings.filter(
    (b) => !DIR_LABELS.has(b.label) && !CENTER_LABELS.has(b.label) && !SHOULDER_LABELS.has(b.label)
  );

  return (
    <>
      <div className="gamepad__left">
        {editing ? (
          dirs.map((b) => (
            <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} onSimulate={onSimulate} onListen={onListen} />
          ))
        ) : (
          <Joystick pressedDirs={pressedSet} onSimulate={onSimulate} />
        )}
      </div>

      {centers.length > 0 && (
        <div className="gamepad__center">
          {centers.map((b) => (
            <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} extraClass="gamepad-btn--wide" onSimulate={onSimulate} onListen={onListen} />
          ))}
        </div>
      )}

      <div className="gamepad__right">
        {actions.map((b) => (
          <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} extraClass="gamepad-btn--action" onSimulate={onSimulate} onListen={onListen} />
        ))}
      </div>
    </>
  );
}

// ==== PS 布局 ====

function PsxLayout({
  bindings, pressedSet, listening, editing, onSimulate, onListen,
}: {
  bindings: Binding[];
  pressedSet: Set<string>;
  listening: string | null;
  editing: boolean;
  onSimulate: (code: string, type: 'keydown' | 'keyup') => void;
  onListen: (label: string) => void;
}) {
  const dirs = bindings.filter((b) => DIR_LABELS.has(b.label));
  const centers = bindings.filter((b) => CENTER_LABELS.has(b.label));
  const shoulders = bindings.filter((b) => SHOULDER_LABELS.has(b.label));
  const actions = bindings.filter(
    (b) => !DIR_LABELS.has(b.label) && !CENTER_LABELS.has(b.label) && !SHOULDER_LABELS.has(b.label)
  );

  const actionOrder = ['△', '○', '×', '□'];
  const orderedActions = actionOrder
    .map((label) => actions.find((b) => b.label === label))
    .filter(Boolean) as Binding[];

  return (
    <>
      <div className="gamepad__shoulders">
        {shoulders.map((b) => (
          <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} extraClass="gamepad-btn--shoulder" onSimulate={onSimulate} onListen={onListen} />
        ))}
        {centers.map((b) => (
          <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} extraClass="gamepad-btn--wide" onSimulate={onSimulate} onListen={onListen} />
        ))}
      </div>

      <div className="gamepad__main">
        <div className="gamepad__left">
          {editing ? (
            dirs.map((b) => (
              <KeyButton key={b.label} binding={b} pressed={pressedSet.has(b.label)} listening={listening === b.label} editing={editing} onSimulate={onSimulate} onListen={onListen} />
            ))
          ) : (
            <Joystick pressedDirs={pressedSet} onSimulate={onSimulate} />
          )}
        </div>

        <div className="gamepad__right gamepad__right--diamond">
          {orderedActions.map((b) => (
            <KeyButton
              key={b.label}
              binding={b}
              pressed={pressedSet.has(b.label)}
              listening={listening === b.label}
              editing={editing}
              extraClass={`gamepad-btn--action gamepad-btn--ps-${b.label}`}
              onSimulate={onSimulate}
              onListen={onListen}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ==== 主组件 ====

export default function GamepadOverlay({ platform, editing, onEditDone }: Props) {
  const layout: Layout = platform === 'psx' ? 'psx' : 'arcade';

  const [bindings, setBindings] = useState<Binding[]>(() => loadBindings(layout));
  const [listening, setListening] = useState<string | null>(null);
  const [pressedSet, setPressedSet] = useState<Set<string>>(new Set());
  const savePendingRef = useRef<Binding[] | null>(null);
  const pressedRef = useRef<Set<string>>(new Set());

  // code → label 查找表
  const codeToLabel = useMemo(() => buildCodeToLabel(bindings), [bindings]);

  // 监听实体键盘: 高亮虚拟按键
  useEffect(() => {
    if (editing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const label = codeToLabel.get(e.code);
      if (!label) return;
      if (pressedRef.current.has(label)) return;
      pressedRef.current = new Set(pressedRef.current).add(label);
      setPressedSet(pressedRef.current);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const label = codeToLabel.get(e.code);
      if (!label) return;
      if (!pressedRef.current.has(label)) return;
      const next = new Set(pressedRef.current);
      next.delete(label);
      pressedRef.current = next;
      setPressedSet(next);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [editing, codeToLabel]);

  // 离开编辑模式时确保清除按压状态
  useEffect(() => {
    if (editing && pressedRef.current.size > 0) {
      pressedRef.current = new Set();
      setPressedSet(new Set());
    }
  }, [editing]);

  // 监听键盘按键进行绑定（编辑模式）
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

  // 保存到 localStorage
  useEffect(() => {
    if (savePendingRef.current) {
      localStorage.setItem(storageKey(layout), JSON.stringify(savePendingRef.current));
      savePendingRef.current = null;
    }
  }, [bindings, layout]);

  // layout 切换时重置绑定
  useEffect(() => {
    setBindings(loadBindings(layout));
  }, [layout]);

  const simulateKey = useCallback((code: string, type: 'keydown' | 'keyup') => {
    const el = document.getElementById('game') || document.body;
    el.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
  }, []);

  const handleReset = () => {
    const defs = defaultsFor(layout);
    setBindings(defs);
    localStorage.setItem(storageKey(layout), JSON.stringify(defs));
  };

  return (
    <div className={`gamepad gamepad--${layout}`}>
      {editing && (
        <div className="gamepad__remap-bar">
          <span>点击按键后按下新按键进行绑定</span>
          <button className="gamepad__remap-btn" onClick={handleReset}>恢复默认</button>
          <button className="gamepad__remap-btn" onClick={onEditDone}>完成</button>
        </div>
      )}

      {layout === 'psx' ? (
        <PsxLayout bindings={bindings} pressedSet={pressedSet} listening={listening} editing={editing} onSimulate={simulateKey} onListen={setListening} />
      ) : (
        <ArcadeLayout bindings={bindings} pressedSet={pressedSet} listening={listening} editing={editing} onSimulate={simulateKey} onListen={setListening} />
      )}
    </div>
  );
}
