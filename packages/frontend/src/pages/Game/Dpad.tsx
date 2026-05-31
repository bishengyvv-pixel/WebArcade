import { useMemo, useRef, useCallback } from 'react';

type Dir = 'center' | 'up' | 'down' | 'left' | 'right';

interface Props {
  pressedDirs: Set<string>;
  onSimulate: (code: string, type: 'keydown' | 'keyup') => void;
}

export default function Dpad({ pressedDirs, onSimulate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const activeRef = useRef<Dir>('center');

  const kbDir = useMemo((): Dir => {
    const has = (d: string) => pressedDirs.has(d);
    if (has('↑') && !has('←') && !has('→')) return 'up';
    if (has('↓') && !has('←') && !has('→')) return 'down';
    if (has('←') && !has('↑') && !has('↓')) return 'left';
    if (has('→') && !has('↑') && !has('↓')) return 'right';
    return 'center';
  }, [pressedDirs]);

  const displayDir = kbDir !== 'center' ? kbDir : activeRef.current;

  const releaseDir = useCallback((dir: Dir) => {
    const map: Record<Dir, string[]> = {
      center: [],
      up: ['ArrowUp'], down: ['ArrowDown'],
      left: ['ArrowLeft'], right: ['ArrowRight'],
    };
    for (const code of map[dir]) onSimulate(code, 'keyup');
  }, [onSimulate]);

  const activateDir = useCallback((dir: Dir) => {
    const map: Record<Dir, string[]> = {
      center: [],
      up: ['ArrowUp'], down: ['ArrowDown'],
      left: ['ArrowLeft'], right: ['ArrowRight'],
    };
    for (const code of map[dir]) onSimulate(code, 'keydown');
  }, [onSimulate]);

  const setDir = useCallback((next: Dir) => {
    const prev = activeRef.current;
    if (prev === next) return;
    releaseDir(prev);
    activateDir(next);
    activeRef.current = next;
  }, [releaseDir, activateDir]);

  const handlePointer = useCallback((e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = e.clientX - rect.left - cx;
    const dy = e.clientY - rect.top - cy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    const dead = cx * 0.25;

    if (adx < dead && ady < dead) { setDir('center'); return; }
    if (adx > ady) { setDir(dx > 0 ? 'right' : 'left'); }
    else { setDir(dy > 0 ? 'down' : 'up'); }
  }, [setDir]);

  const handleUp = useCallback(() => setDir('center'), [setDir]);

  const active = (d: Dir) => displayDir === d;

  return (
    <svg ref={svgRef} viewBox="0 0 80 80" width="80" height="80"
      style={{ touchAction: 'none', pointerEvents: 'auto' }}
      onPointerDown={handlePointer}
      onPointerMove={handlePointer}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <defs>
        <linearGradient id="dpad-base-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8c840" />
          <stop offset="50%" stopColor="#d4a820" />
          <stop offset="100%" stopColor="#b8901a" />
        </linearGradient>
        <linearGradient id="dpad-arm-up" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#333" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <linearGradient id="dpad-arm-down" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#333" />
        </linearGradient>
      </defs>

      {/* 底座 */}
      <rect x="4" y="4" width="72" height="72" rx="14" ry="14"
        fill="url(#dpad-base-grad)" stroke="#a07810" strokeWidth="1.5" />
      <rect x="8" y="8" width="64" height="64" rx="10" ry="10"
        fill="#c89818" stroke="#b08814" strokeWidth="0.5" opacity="0.6" />

      {/* 中心凹陷 */}
      <rect x="28" y="28" width="24" height="24" rx="4" ry="4"
        fill={active('center') ? '#1a1a1a' : '#222'} />

      {/* 上臂 */}
      <path d="M28,8 h24 v24 h-24 z" fill="#3a3a3a" stroke="#111" strokeWidth="0.5"
        opacity={active('up') ? 0.7 : 1} />
      {active('up') && <path d="M28,8 h24 v4 h-24 z" fill="rgba(255, 200, 50, 0.3)" />}

      {/* 下臂 */}
      <path d="M28,48 h24 v24 h-24 z" fill="#3a3a3a" stroke="#111" strokeWidth="0.5"
        opacity={active('down') ? 0.7 : 1} />
      {active('down') && <path d="M28,72 h24 v4 h-24 z" fill="rgba(255, 200, 50, 0.3)" />}

      {/* 左臂 */}
      <path d="M8,28 h24 v24 h-24 z" fill="#3a3a3a" stroke="#111" strokeWidth="0.5"
        opacity={active('left') ? 0.7 : 1} />
      {active('left') && <path d="M8,28 h4 v24 h-4 z" fill="rgba(255, 200, 50, 0.3)" />}

      {/* 右臂 */}
      <path d="M48,28 h24 v24 h-24 z" fill="#3a3a3a" stroke="#111" strokeWidth="0.5"
        opacity={active('right') ? 0.7 : 1} />
      {active('right') && <path d="M72,28 h4 v24 h-4 z" fill="rgba(255, 200, 50, 0.3)" />}

      {/* 中心圆 */}
      <circle cx="40" cy="40" r="9" fill="#2a2a2a" stroke="#1a1a1a" strokeWidth="0.5" />
    </svg>
  );
}
