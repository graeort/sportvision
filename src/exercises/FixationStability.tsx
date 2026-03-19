import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

const DURATION = 30;

export function FixationStability({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stateRef = useRef({
    animId: 0,
    locked: false,
    totalLockFrames: 0,
    totalFrames: 0,
    radius: 55,
    setTimeLeft: null as ((v: number) => void) | null,
    setScore: null as ((v: number) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
  });

  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  stateRef.current.setTimeLeft = setTimeLeft;
  stateRef.current.setScore = setScore;
  stateRef.current.setGameOver = setGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const s = stateRef.current;
    s.locked = false;
    s.totalLockFrames = 0;
    s.totalFrames = 0;
    s.radius = 55;

    const startCanvas = (width: number, height: number) => {
      if (cancelled) return;
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d')!;
          const W = canvas.width;
          const H = canvas.height;
          const cx = W / 2;
          const cy = H / 2;
          const startTime = Date.now();

          const draw = () => {
            if (cancelled) return;

            const elapsed = (Date.now() - startTime) / 1000;

            if (elapsed >= DURATION) {
              const pct = Math.round((s.totalLockFrames / Math.max(s.totalFrames, 1)) * 100);
              s.setScore?.(pct);
              s.setGameOver?.(true);
              return;
            }

            s.setTimeLeft?.(Math.ceil(DURATION - elapsed));
            s.totalFrames++;
            if (s.locked) s.totalLockFrames++;

            if (!s.locked) {
              s.radius = Math.max(8, s.radius - 0.06);
            } else {
              s.radius = Math.min(55, s.radius + 0.4);
            }

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#0a0a0a';
            ctx.fillRect(0, 0, W, H);

            ctx.beginPath();
            ctx.arc(cx, cy, 65, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255,255,255,0.07)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, s.radius, 0, 2 * Math.PI);
            ctx.fillStyle = s.locked ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.1)';
            ctx.fill();
            ctx.strokeStyle = s.locked ? '#22c55e' : '#3b82f6';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
            ctx.fillStyle = s.locked ? '#22c55e' : '#fff';
            ctx.fill();

            const lockPct = Math.round((s.totalLockFrames / Math.max(s.totalFrames, 1)) * 100);
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`Lock: ${lockPct}%`, cx, H - 12);

            s.animId = requestAnimationFrame(draw);
          };

          s.animId = requestAnimationFrame(draw);
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
      onCompleteRef.current(score, 200);
    }
  }, [gameOver, score]);

  const handleLock = () => {
    const s = stateRef.current;
    s.locked = true;
    setTimeout(() => {
      s.locked = false;
      s.radius = Math.max(8, s.radius - 4);
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s remaining</span>
        <span className="text-green-400">Score: {score}%</span>
      </div>

      <canvas
        ref={canvasRef}
        className="rounded-xl border border-gray-700 w-full block"
        style={{ height: '220px', background: '#0a0a0a' }}
      />

      <p className="text-gray-400 text-sm text-center">
        Focus on the centre dot. Tap <strong className="text-white">Lock Gaze</strong> to maintain fixation.
      </p>

      <button
        onClick={handleLock}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-xl text-lg transition-all"
      >
        🎯 Lock Gaze
      </button>
      <p className="text-gray-600 text-xs">Keep tapping as the target shrinks</p>
    </div>
  );
}
