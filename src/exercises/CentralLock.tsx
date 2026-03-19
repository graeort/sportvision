import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

const POSITIONS = [
  { label: 'Top-Left', x: 0.1, y: 0.15 },
  { label: 'Top', x: 0.5, y: 0.08 },
  { label: 'Top-Right', x: 0.9, y: 0.15 },
  { label: 'Left', x: 0.05, y: 0.5 },
  { label: 'Right', x: 0.95, y: 0.5 },
  { label: 'Bot-Left', x: 0.1, y: 0.85 },
  { label: 'Bottom', x: 0.5, y: 0.92 },
  { label: 'Bot-Right', x: 0.9, y: 0.85 },
];

const TOTAL = 12;

export function CentralLock({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stateRef = useRef({
    animId: 0,
    round: 0,
    correct: 0,
    reactions: [] as number[],
    flash: null as { posIdx: number; startTime: number; visible: boolean } | null,
    setCurrentFlash: null as ((v: number | null) => void) | null,
    setShowResult: null as ((v: boolean | null) => void) | null,
    setUiRound: null as ((v: number) => void) | null,
    setUiCorrect: null as ((v: number) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
    triggerFlash: null as (() => void) | null,
  });

  const [uiRound, setUiRound] = useState(1);
  const [uiCorrect, setUiCorrect] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [currentFlash, setCurrentFlash] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  stateRef.current.setCurrentFlash = setCurrentFlash;
  stateRef.current.setShowResult = setShowResult;
  stateRef.current.setUiRound = setUiRound;
  stateRef.current.setUiCorrect = setUiCorrect;
  stateRef.current.setGameOver = setGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const s = stateRef.current;
    s.round = 0;
    s.correct = 0;
    s.reactions = [];
    s.flash = null;

    const triggerFlash = () => {
      if (cancelled) return;
      const posIdx = Math.floor(Math.random() * POSITIONS.length);
      s.flash = { posIdx, startTime: performance.now(), visible: true };
      s.setCurrentFlash?.(posIdx);
      setTimeout(() => {
        if (s.flash) s.flash.visible = false;
        s.setCurrentFlash?.(null);
      }, 350);
    };
    s.triggerFlash = triggerFlash;

    const startCanvas = (width: number, height: number) => {
      if (cancelled) return;
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d')!;
          const W = canvas.width;
          const H = canvas.height;
          const cx = W / 2;
          const cy = H / 2;

          const draw = () => {
            if (cancelled) return;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, W, H);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
            ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
            ctx.stroke();

            if (s.flash?.visible) {
              const pos = POSITIONS[s.flash.posIdx];
              ctx.beginPath();
              ctx.arc(pos.x * W, pos.y * H, 12, 0, 2 * Math.PI);
              ctx.fillStyle = '#38bdf8';
              ctx.fill();
              ctx.beginPath();
              ctx.arc(pos.x * W, pos.y * H, 20, 0, 2 * Math.PI);
              ctx.fillStyle = 'rgba(56,189,248,0.2)';
              ctx.fill();
            }

            s.animId = requestAnimationFrame(draw);
          };

          s.animId = requestAnimationFrame(draw);
          setTimeout(triggerFlash, 800);
    };

    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      startCanvas(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            observer.disconnect();
            startCanvas(width, height);
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
      cancelAnimationFrame(stateRef.current.animId);
      const s = stateRef.current;
      const avgRT = s.reactions.length > 0
        ? s.reactions.reduce((a, b) => a + b, 0) / s.reactions.length
        : 600;
      onCompleteRef.current(Math.round((s.correct / TOTAL) * 100), Math.round(avgRT));
    }
  }, [gameOver]);

  const handleResponse = (posIdx: number) => {
    const s = stateRef.current;
    if (s.flash === null) return;
    const rt = performance.now() - s.flash.startTime;
    const isCorrect = posIdx === s.flash.posIdx;

    s.reactions.push(rt);
    if (isCorrect) { s.correct += 1; setUiCorrect(s.correct); }
    setShowResult(isCorrect);
    s.flash = null;

    const next = s.round + 1;
    s.round = next;
    setUiRound(Math.min(next + 1, TOTAL));

    if (next >= TOTAL) {
      setTimeout(() => setGameOver(true), 500);
    } else {
      setTimeout(() => {
        setShowResult(null);
        s.triggerFlash?.();
      }, 700);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>Round {uiRound} / {TOTAL}</span>
        <span className="text-green-400">{uiCorrect} detected</span>
      </div>

      <canvas
        ref={canvasRef}
        className="rounded-xl border border-gray-700 w-full block"
        style={{ height: '200px', background: '#0a0a0a' }}
      />

      <div className="h-5 flex items-center">
        {showResult !== null && (
          <span className={`text-sm font-bold ${showResult ? 'text-green-400' : 'text-red-400'}`}>
            {showResult ? '✓ Detected!' : '✗ Missed'}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-sm text-center">
        Keep eyes on the central cross. Where did you see the flash?
      </p>

      <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
        {POSITIONS.map((pos, i) => (
          <button
            key={i}
            onClick={() => handleResponse(i)}
            className={`py-2 rounded-lg text-xs font-medium border transition-all ${
              currentFlash === i
                ? 'bg-cyan-500/30 border-cyan-500 text-cyan-300'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
            }`}
          >
            {pos.label}
          </button>
        ))}
      </div>
    </div>
  );
}
