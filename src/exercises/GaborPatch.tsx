import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

const TOTAL_ROUNDS = 10;

function drawGabor(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, freq: number, contrast: number, orientation: number) {
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const sigma = size / 5;
  const half = size / 2;
  for (let px = 0; px < size; px++) {
    for (let py = 0; py < size; py++) {
      const x = px - half;
      const y = py - half;
      const xr = x * Math.cos(orientation) + y * Math.sin(orientation);
      const yr = -x * Math.sin(orientation) + y * Math.cos(orientation);
      void yr;
      const gaussian = Math.exp(-(xr * xr + (x * x + y * y - xr * xr)) / (2 * sigma * sigma));
      const grating = Math.cos(2 * Math.PI * freq * xr);
      const val = gaussian * grating * contrast;
      const gray = Math.round(128 + val * 127);
      const idx = (py * size + px) * 4;
      data[idx] = gray; data[idx + 1] = gray; data[idx + 2] = gray; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, Math.round(cx - half), Math.round(cy - half));
}

function drawNoise(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  const sigma = size / 5;
  const half = size / 2;
  for (let px = 0; px < size; px++) {
    for (let py = 0; py < size; py++) {
      const x = px - half;
      const y = py - half;
      const gaussian = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      const noise = (Math.random() * 2 - 1) * gaussian * 0.6;
      const gray = Math.round(128 + noise * 127);
      const idx = (py * size + px) * 4;
      data[idx] = gray; data[idx + 1] = gray; data[idx + 2] = gray; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, Math.round(cx - half), Math.round(cy - half));
}

function renderRound(ctx: CanvasRenderingContext2D, W: number, H: number, roundNum: number, gaborPos: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, W, H);

  const contrast = Math.max(0.12, 1.0 - roundNum * 0.085);
  const patchSize = Math.min(Math.round(W * 0.18), 90);
  const positions = [
    { x: W * 0.2, y: H / 2 },
    { x: W * 0.5, y: H / 2 },
    { x: W * 0.8, y: H / 2 },
  ];

  positions.forEach((pos, i) => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, patchSize / 2 + 5, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (i === gaborPos) {
      const freq = 0.055 + roundNum * 0.004;
      const orient = Math.random() * Math.PI;
      drawGabor(ctx, pos.x, pos.y, patchSize, freq, contrast, orient);
    } else {
      drawNoise(ctx, pos.x, pos.y, patchSize);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(i + 1), pos.x, pos.y + patchSize / 2 + 20);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`Contrast: ${Math.round(contrast * 100)}%`, W - 10, 8);
}

export function GaborPatch({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stateRef = useRef({
    round: 0,
    correct: 0,
    reactions: [] as number[],
    gaborPos: 0,
    roundStart: 0,
    answered: false,
    setUiRound: null as ((v: number) => void) | null,
    setUiCorrect: null as ((v: number) => void) | null,
    setShowResult: null as ((v: boolean | null) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
  });

  const [uiRound, setUiRound] = useState(1);
  const [uiCorrect, setUiCorrect] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);

  stateRef.current.setUiRound = setUiRound;
  stateRef.current.setUiCorrect = setUiCorrect;
  stateRef.current.setShowResult = setShowResult;
  stateRef.current.setGameOver = setGameOver;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cancelled = false;
    const s = stateRef.current;
    s.round = 0;
    s.correct = 0;
    s.reactions = [];
    s.answered = false;

    const showNextRound = (roundNum: number) => {
      if (cancelled) return;
      const ctx = canvas.getContext('2d')!;
      const gaborPos = Math.floor(Math.random() * 3);
      s.gaborPos = gaborPos;
      s.roundStart = performance.now();
      s.answered = false;
      renderRound(ctx, canvas.width, canvas.height, roundNum, gaborPos);
    };

    const initCanvas = (width: number, height: number) => {
      if (cancelled) return;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      showNextRound(0);
    };

    let resizeObserver: ResizeObserver | null = null;

    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      initCanvas(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            resizeObserver?.disconnect();
            initCanvas(width, height);
            break;
          }
        }
      });
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (gameOver) {
      const s = stateRef.current;
      const avgRT = s.reactions.length > 0
        ? s.reactions.reduce((a, b) => a + b, 0) / s.reactions.length
        : 400;
      onCompleteRef.current(Math.round((s.correct / TOTAL_ROUNDS) * 100), Math.round(avgRT));
    }
  }, [gameOver]);

  const handleAnswer = (choice: number) => {
    const s = stateRef.current;
    if (s.answered) return;
    s.answered = true;

    const rt = performance.now() - s.roundStart;
    const isCorrect = choice === s.gaborPos;
    s.reactions.push(rt);
    if (isCorrect) { s.correct += 1; setUiCorrect(s.correct); }
    setShowResult(isCorrect);

    const next = s.round + 1;
    s.round = next;
    setUiRound(Math.min(next + 1, TOTAL_ROUNDS));

    if (next >= TOTAL_ROUNDS) {
      setTimeout(() => setGameOver(true), 800);
    } else {
      setTimeout(() => {
        setShowResult(null);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const gaborPos = Math.floor(Math.random() * 3);
        s.gaborPos = gaborPos;
        s.roundStart = performance.now();
        s.answered = false;
        renderRound(ctx, canvas.width, canvas.height, next, gaborPos);
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
        style={{ height: '200px', background: '#111' }}
      />

      <div className="h-5 flex items-center">
        {showResult !== null && (
          <span className={`text-sm font-bold ${showResult ? 'text-green-400' : 'text-red-400'}`}>
            {showResult ? '✓ Correct!' : `✗ It was patch ${stateRef.current.gaborPos + 1}`}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-sm text-center">
        Which patch has the <strong className="text-white">striped Gabor pattern</strong>?
      </p>

      <div className="flex gap-5">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            className="w-16 h-12 rounded-xl font-bold text-lg bg-gray-800 hover:bg-blue-600 active:scale-95 border border-gray-700 hover:border-blue-500 text-white transition-all"
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
