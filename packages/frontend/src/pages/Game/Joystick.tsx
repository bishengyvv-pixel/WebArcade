import { useRef, useCallback, useMemo } from 'react';

// 8 方向 → 键盘 code 组合
type Dir = 'center' | 'up' | 'down' | 'left' | 'right' | 'upleft' | 'upright' | 'downleft' | 'downright';

interface DirDef {
  codes: string[];
  cx: number;
  cy: number;
}

const DIR_MAP: Record<Dir, DirDef> = {
  center:   { codes: [],                             cx: 60, cy: 60 },
  up:       { codes: ['ArrowUp'],                    cx: 60, cy: 32 },
  down:     { codes: ['ArrowDown'],                  cx: 60, cy: 88 },
  left:     { codes: ['ArrowLeft'],                  cx: 32, cy: 60 },
  right:    { codes: ['ArrowRight'],                 cx: 88, cy: 60 },
  upleft:   { codes: ['ArrowUp', 'ArrowLeft'],       cx: 32, cy: 32 },
  upright:  { codes: ['ArrowUp', 'ArrowRight'],      cx: 88, cy: 32 },
  downleft: { codes: ['ArrowDown', 'ArrowLeft'],     cx: 32, cy: 88 },
  downright:{ codes: ['ArrowDown', 'ArrowRight'],    cx: 88, cy: 88 },
};

function angleToDir(rad: number): Dir {
  const deg = (rad * 180) / Math.PI;
  if (deg > -22.5 && deg <= 22.5) return 'right';
  if (deg > 22.5 && deg <= 67.5) return 'upright';
  if (deg > 67.5 && deg <= 112.5) return 'up';
  if (deg > 112.5 && deg <= 157.5) return 'upleft';
  if (deg > 157.5 || deg <= -157.5) return 'left';
  if (deg > -157.5 && deg <= -112.5) return 'downleft';
  if (deg > -112.5 && deg <= -67.5) return 'down';
  return 'downright';
}

interface Props {
  pressedDirs: Set<string>;   // 当前按下的方向 label 集合
  onSimulate: (code: string, type: 'keydown' | 'keyup') => void;
}

export default function Joystick({ pressedDirs, onSimulate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeDirRef = useRef<Dir>('center');

  // 根据键盘按压状态计算方向
  const kbDir = useMemo((): Dir => {
    const has = (d: string) => pressedDirs.has(d);
    if (has('↑') && has('←')) return 'upleft';
    if (has('↑') && has('→')) return 'upright';
    if (has('↓') && has('←')) return 'downleft';
    if (has('↓') && has('→')) return 'downright';
    if (has('↑')) return 'up';
    if (has('↓')) return 'down';
    if (has('←')) return 'left';
    if (has('→')) return 'right';
    return 'center';
  }, [pressedDirs]);

  // 优先显示键盘方向，否则用触摸方向
  const displayDir = kbDir !== 'center' ? kbDir : activeDirRef.current;
  const { cx, cy } = DIR_MAP[displayDir];

  // 释放旧方向码
  const releaseDir = useCallback((dir: Dir) => {
    for (const code of DIR_MAP[dir].codes) {
      onSimulate(code, 'keyup');
    }
  }, [onSimulate]);

  // 激活新方向码
  const activateDir = useCallback((dir: Dir) => {
    for (const code of DIR_MAP[dir].codes) {
      onSimulate(code, 'keydown');
    }
  }, [onSimulate]);

  // 切换方向
  const setDir = useCallback((next: Dir) => {
    const prev = activeDirRef.current;
    if (prev === next) return;
    releaseDir(prev);
    activateDir(next);
    activeDirRef.current = next;
  }, [releaseDir, activateDir]);

  // 触摸交互
  const handlePointer = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx_el = rect.width / 2;
    const cy_el = rect.height / 2;
    const dx = e.clientX - rect.left - cx_el;
    const dy = e.clientY - rect.top - cy_el;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const deadZone = cx_el * 0.25;

    if (dist < deadZone) {
      setDir('center');
    } else {
      setDir(angleToDir(Math.atan2(dy, dx)));
    }
  }, [setDir]);

  const handlePointerUp = useCallback(() => {
    setDir('center');
  }, [setDir]);

  const isActive = displayDir !== 'center';
  const glowColor = '#e94560';
  const glowOpacity = isActive ? '0.6' : '0.15';

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 120 120"
      width="120"
      height="120"
      style={{ touchAction: 'none', pointerEvents: 'auto' }}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <defs>
        <linearGradient id="joystick-stick" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="80" y2="0">
          <stop offset="0%" stopColor="#666" />
          <stop offset="25%" stopColor="#aaa" />
          <stop offset="50%" stopColor="#f5f5f5" />
          <stop offset="75%" stopColor="#999" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
        <radialGradient id="joystick-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#242440" />
          <stop offset="100%" stopColor="#141428" />
        </radialGradient>
        <radialGradient id="joystick-ball" cx="40%" cy="35%" r="50%">
          <stop offset="0%" stopColor="#ff6b81" />
          <stop offset="60%" stopColor="#e94560" />
          <stop offset="100%" stopColor="#b0304a" />
        </radialGradient>
        <filter id="joystick-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 底座外圈 */}
      <circle cx="60" cy="60" r="55" fill="url(#joystick-base)" stroke="#2a2a4a" strokeWidth="2.5" />
      {/* 内圈 */}
      <circle cx="60" cy="60" r="40" fill="#1a1a30" stroke="#222244" strokeWidth="1" opacity="0.8" />
      {/* 十字线 */}
      <line x1="60" y1="22" x2="60" y2="98" stroke="#2a2a4a" strokeWidth="1" opacity="0.5" />
      <line x1="22" y1="60" x2="98" y2="60" stroke="#2a2a4a" strokeWidth="1" opacity="0.5" />
      {/* 对角线 */}
      <line x1="32" y1="32" x2="88" y2="88" stroke="#222240" strokeWidth="0.5" opacity="0.3" />
      <line x1="88" y1="32" x2="32" y2="88" stroke="#222240" strokeWidth="0.5" opacity="0.3" />

      {/* 摇杆轴 */}
      <line x1="60" y1="60" x2={cx} y2={cy}
        stroke="url(#joystick-stick)" strokeWidth="6" strokeLinecap="round"
        opacity={displayDir !== 'center' ? 0.9 : 0}
      />

      {/* 方向指示器（高亮当前方向）*/}
      {isActive && (
        <circle cx={cx} cy={cy} r="20" fill="none" stroke={glowColor} strokeWidth="1.5"
          opacity={glowOpacity} filter="url(#joystick-glow)" />
      )}

      {/* 球头 */}
      <circle cx={cx} cy={cy} r="18" fill="url(#joystick-ball)" stroke="#ff4d6a" strokeWidth="1" />
      {/* 球头高光 */}
      <ellipse cx={cx - 5} cy={cy - 5} rx="7" ry="5" fill="rgba(255,255,255,0.25)" />
      {/* 球头底部阴影（3D效果） */}
      <ellipse cx={cx + 6} cy={cy + 8} rx="10" ry="6" fill="rgba(0,0,0,0.3)" opacity="0.5" />
    </svg>
  );
}
