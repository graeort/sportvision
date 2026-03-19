import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

type Direction = 'up' | 'down' | 'left' | 'right';
const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];
const TOTAL_ROUNDS = 10;
const R = 28;

const GAP_ANGLES: Record<Direction, [number, number]> = {
  right: [-0.22, 0.22],
  left:  [Math.PI - 0.22, Math.PI + 0.22],
  up:    [-Math.PI / 2 - 0.22, -Math.PI / 2 + 0.22],
  down:  [Math.PI / 2 - 0.22,  Math.PI / 2 + 0.22],
};

export function MovingOptotype({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [uiRound, setUiRound] = useState(1);
  const [uiCorrect, setUiCorrect] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Shared mutable state between effect and event handlers
  const stateRef = useRef({
    animId: 0,
    x: -60,
    speed: 2.5,
    gapDir: 'right' as Direction,
    roundStart: 0,
    active: false,
    round: 0,
    correct: 0,
    reactions: [] as number[],
    setShowResult: null as ((v: boolean | null) => void) | null,
    setUiRound: null as ((v: number) => void) | null,
    setUiCorrect: null as ((v: number) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
  });

  // Keep setters in ref so effect closure can call them
  stateRef.current.setShowResult = setShowResult;
  stateRef.current.setUiRound = setUiRound;
  stateRef.current.setUiCorrect = setUiCorrect;
  stateRef.current.setGameOver = setGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Local cancelled flag — reset on each effect invocation
    let cancelled = false;
    const s = stateRef.current;

    // Reset game state on each mount
    s.x = -60;
    s.speed = 2.5;
    s.active = false;
    s.round = 0;
    s.correct = 0;
    s.reactions = [];

    const startRound = (roundNum: number) => {
      if (cancelled) return;
      s.gapDir = DIRECTIONS[Math.floor(Math.random() * 4)];
      s.x = -60;
      s.speed = 2.5 + roundNum * 0.3;
      s.roundStart = performance.now();
      s.active = true;
      s.round = roundNum;
      s.setShowResult?.(null);
    };

    const init = (w: number, h: number) => {
      if (cancelled) return;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      const draw = () => {
        if (cancelled) return;
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        if (s.active) {
          const cy = h / 2;
          ctx.beginPath();
          ctx.arc(s.x, cy, R, 0, 2 * Math.PI);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 5;
          ctx.stroke();

          const [a1, a2] = GAP_ANGLES[s.gapDir];
          ctx.beginPath();
          ctx.arc(s.x, cy, R, a1, a2);
          ctx.strokeStyle = '#0a0a0a';
          ctx.lineWidth = 9;
          ctx.stroke();

          s.x += s.speed;

          if (s.x > w + 60) {
            s.active = false;
            const next = s.round + 1;
            s.setUiRound?.(Math.min(next + 1, TOTAL_ROUNDS));
            if (next >= TOTAL_ROUNDS) {
              s.setGameOver?.(true);
              return;
            }
            setTimeout(() => startRound(next), 900);
          }
        }

        s.animId = requestAnimationFrame(draw);
      };

      s.animId = requestAnimationFrame(draw);
      setTimeout(() => startRound(0), 400);
    };

    // If canvas already has layout dimensions (e.g. StrictMode remount), init directly
    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      init(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            observer.disconnect();
            init(Math.round(width), Math.round(height));
            break;
          }
        }
      });
      observer.observe(canvas);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(s.animId);
    };
  }, []);

  useEffect(() => {
    if (gameOver) {
      const s = stateRef.current;
      cancelAnimationFrame(s.animId);
      const avgRT = s.reactions.length > 0
        ? s.reactions.reduce((a, b) => a + b, 0) / s.reactions.length
        : 500;
      onCompleteRef.current(Math.round((s.correct / TOTAL_ROUNDS) * 100), Math.round(avgRT));
    }
  }, [gameOver]);

  const handleAnswer = (dir: Direction) => {
    const s = stateRef.current;
    if (!s.active) return;
    const rt = performance.now() - s.roundStart;
    const isCorrect = dir === s.gapDir;
    s.active = false;
    s.reactions.push(rt);
    if (isCorrect) { s.correct += 1; setUiCorrect(s.correct); }
    setShowResult(isCorrect);

    const next = s.round + 1;
    setUiRound(Math.min(next + 1, TOTAL_ROUNDS));
    if (next >= TOTAL_ROUNDS) {
      setTimeout(() => setGameOver(true), 800);
    } else {
      setTimeout(() => {
        s.gapDir = DIRECTIONS[Math.floor(Math.random() * 4)];
        s.x = -60;
        s.speed = 2.5 + next * 0.3;
        s.roundStart = performance.now();
        s.active = true;
        s.round = next;
        setShowResult(null);
      }, 900);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>Round {uiRound} / {TOTAL_ROUNDS}</span>
        <span className="text-green-400">{uiCorrect} correct</span>
      </div>

      <canvas
        ref={canvasRef}
        className="rounded-xl border border-gray-700 w-full block"
        style={{ height: '180px', background: '#0a0a0a' }}
      />

      <div className="h-5 flex items-center">
        {showResult !== null && (
          <span className={`text-sm font-bold ${showResult ? 'text-green-400' : 'text-red-400'}`}>
            {showResult ? '✓ Correct!' : '✗ Wrong'}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-sm">Which direction is the gap pointing?</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {DIRECTIONS.map((dir) => (
          <button
            key={dir}
            onClick={() => handleAnswer(dir)}
            className="py-3 bg-gray-800 hover:bg-blue-600/40 active:scale-95 border border-gray-700 rounded-xl text-white font-medium text-sm transition-all"
          >
            {dir === 'up' ? '↑ Up' : dir === 'down' ? '↓ Down' : dir === 'left' ? '← Left' : '→ Right'}
          </button>
        ))}
      </div>
    </div>
  );
}
