import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

type ServeDir = 'Wide' | 'Body' | 'T';
const SERVE_DIRS: ServeDir[] = ['Wide', 'Body', 'T'];
const TOTAL_ROUNDS = 8;
type Phase = 'toss' | 'occluded' | 'answer' | 'feedback';

export function ServePrediction({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stateRef = useRef({
    animId: 0,
    round: 0,
    correct: 0,
    reactions: [] as number[],
    phase: 'toss' as Phase,
    answer: 'Wide' as ServeDir,
    frame: 0,
    roundStart: 0,
    setPhase: null as ((v: Phase) => void) | null,
    setUiRound: null as ((v: number) => void) | null,
    setUiCorrect: null as ((v: number) => void) | null,
    setLastResult: null as ((v: boolean | null) => void) | null,
    setCorrectAnswer: null as ((v: ServeDir) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
    startNextRound: null as (() => void) | null,
  });

  const [uiRound, setUiRound] = useState(1);
  const [uiCorrect, setUiCorrect] = useState(0);
  const [phase, setPhase] = useState<Phase>('toss');
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [correctAnswer, setCorrectAnswer] = useState<ServeDir>('Wide');
  const [gameOver, setGameOver] = useState(false);

  stateRef.current.setPhase = setPhase;
  stateRef.current.setUiRound = setUiRound;
  stateRef.current.setUiCorrect = setUiCorrect;
  stateRef.current.setLastResult = setLastResult;
  stateRef.current.setCorrectAnswer = setCorrectAnswer;
  stateRef.current.setGameOver = setGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const s = stateRef.current;
    s.round = 0;
    s.correct = 0;
    s.reactions = [];
    s.phase = 'toss';
    s.frame = 0;

    const startNextRound = () => {
      if (cancelled) return;
      const dir = SERVE_DIRS[Math.floor(Math.random() * 3)];
      s.answer = dir;
      s.frame = 0;
      s.phase = 'toss';
      s.roundStart = performance.now();
      s.setCorrectAnswer?.(dir);
      s.setPhase?.('toss');
    };
    s.startNextRound = startNextRound;

    const startCanvas = (width: number, height: number) => {
          if (cancelled) return;

          canvas.width = Math.round(width);
          canvas.height = Math.round(height);
          const ctx = canvas.getContext('2d')!;
          const W = canvas.width;
          const H = canvas.height;

          const draw = () => {
            if (cancelled) return;

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = '#1a4a2a';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#1e5a30';
            ctx.fillRect(W * 0.08, H * 0.45, W * 0.84, H * 0.5);

            ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(W * 0.04, H * 0.45); ctx.lineTo(W * 0.96, H * 0.45);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255,255,255,0.35)';
            ctx.lineWidth = 1;
            ctx.strokeRect(W * 0.08, H * 0.45, W * 0.42, H * 0.28);
            ctx.strokeRect(W * 0.5, H * 0.45, W * 0.42, H * 0.28);
            ctx.beginPath();
            ctx.moveTo(W * 0.5, H * 0.45); ctx.lineTo(W * 0.5, H * 0.73);
            ctx.stroke();

            const p = s.phase;
            const f = s.frame;
            const sx = W * 0.82;
            const sy = H * 0.25;
            const headY = sy - 28;

            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = '#ffffff';
            ctx.lineWidth = 2;

            ctx.beginPath(); ctx.arc(sx, headY, 8, 0, 2 * Math.PI); ctx.fill();
            ctx.beginPath(); ctx.moveTo(sx, headY + 8); ctx.lineTo(sx, sy + 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx, sy + 20); ctx.lineTo(sx - 10, sy + 42); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(sx, sy + 20); ctx.lineTo(sx + 10, sy + 42); ctx.stroke();

            const tossProgress = p === 'toss' ? Math.min(f / 35, 1) : 1;
            const tossAngle = -Math.PI / 2 - tossProgress * 0.6;
            ctx.beginPath();
            ctx.moveTo(sx, headY + 14);
            ctx.lineTo(sx + Math.cos(tossAngle) * 22, headY + 14 + Math.sin(tossAngle) * 22);
            ctx.stroke();

            const racketAngle = p === 'toss' ? -0.8 - tossProgress * 0.5 : -2.2;
            ctx.beginPath();
            ctx.moveTo(sx, headY + 14);
            ctx.lineTo(sx + Math.cos(racketAngle) * 28, headY + 14 + Math.sin(racketAngle) * 28);
            ctx.stroke();

            if (p === 'toss') {
              const ballX = sx + Math.cos(tossAngle) * 22;
              const ballY = headY + 14 + Math.sin(tossAngle) * 22 - f * 1.5;
              ctx.beginPath();
              ctx.arc(ballX, Math.max(ballY, headY - 55), 7, 0, 2 * Math.PI);
              ctx.fillStyle = '#c8ff00';
              ctx.fill();
            }

            if (p === 'occluded') {
              ctx.fillStyle = 'rgba(255,200,0,0.95)';
              ctx.font = `bold ${Math.round(H * 0.12)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.fillText('?', sx, headY - 30);
            }

            if (p === 'toss') {
              s.frame = f + 1;
              if (f > 38) {
                s.phase = 'occluded';
                s.frame = 0;
                s.setPhase?.('occluded');
              }
            } else if (p === 'occluded') {
              s.frame = f + 1;
              if (f > 18) {
                s.phase = 'answer';
                s.setPhase?.('answer');
              }
            }

            s.animId = requestAnimationFrame(draw);
          };

          s.animId = requestAnimationFrame(draw);
          setTimeout(startNextRound, 300);
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
        : 500;
      onCompleteRef.current(Math.round((s.correct / TOTAL_ROUNDS) * 100), Math.round(avgRT));
    }
  }, [gameOver]);

  const handleAnswer = (dir: ServeDir) => {
    const s = stateRef.current;
    if (s.phase !== 'answer') return;
    const rt = performance.now() - s.roundStart;
    const isCorrect = dir === s.answer;
    s.phase = 'feedback';
    setPhase('feedback');
    setLastResult(isCorrect);
    s.reactions.push(rt);
    if (isCorrect) { s.correct += 1; setUiCorrect(s.correct); }

    const next = s.round + 1;
    s.round = next;
    setUiRound(Math.min(next + 1, TOTAL_ROUNDS));

    if (next >= TOTAL_ROUNDS) {
      setTimeout(() => setGameOver(true), 1000);
    } else {
      setTimeout(() => {
        setLastResult(null);
        s.startNextRound?.();
      }, 1200);
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
        style={{ height: '240px' }}
      />

      <div className="h-5 flex items-center justify-center">
        {phase === 'toss' && <span className="text-yellow-400 text-sm">Watch the server…</span>}
        {phase === 'occluded' && <span className="text-cyan-400 text-sm font-bold animate-pulse">Occluded! Choose direction!</span>}
        {lastResult !== null && (
          <span className={`text-sm font-bold ${lastResult ? 'text-green-400' : 'text-red-400'}`}>
            {lastResult ? '✓ Correct!' : `✗ It was: ${correctAnswer}`}
          </span>
        )}
      </div>

      <div className="flex gap-3 w-full max-w-sm">
        {SERVE_DIRS.map((dir) => (
          <button
            key={dir}
            onClick={() => handleAnswer(dir)}
            disabled={phase !== 'answer'}
            className="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gray-800 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 hover:border-blue-500 text-white"
          >
            {dir}
          </button>
        ))}
      </div>
    </div>
  );
}
