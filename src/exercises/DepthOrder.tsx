import { useEffect, useRef, useState } from 'react';

interface Props {
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

const TOTAL_ROUNDS = 5;
const ITEMS = 4;

interface DepthItem {
  emoji: string;
  trueDepth: number;
  size: number;
  shade: number;
  blur: number;
  x: number;
  y: number;
}

function generateItems(W: number, H: number): DepthItem[] {
  const depths = [1, 2, 3, 4].sort(() => Math.random() - 0.5);
  const emojis = ['🔴', '🟠', '🔵', '🟢'];
  return depths.map((depth, i) => ({
    emoji: emojis[i],
    trueDepth: depth,
    size: 58 - (depth - 1) * 11,
    shade: 235 - (depth - 1) * 48,
    blur: (depth - 1) * 1.2,
    x: (W / (ITEMS + 1)) * (i + 1),
    y: H * 0.45,
  }));
}

function paintCanvas(ctx: CanvasRenderingContext2D, W: number, H: number, items: DepthItem[], clickOrder: number[]) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, H * 0.7, W, H * 0.3);

  items.forEach((item, idx) => {
    const isClicked = clickOrder.includes(idx);
    const clickRank = clickOrder.indexOf(idx) + 1;

    ctx.save();
    if (item.blur > 0) ctx.filter = `blur(${item.blur}px)`;

    ctx.beginPath();
    ctx.ellipse(item.x, H * 0.7 + 6, item.size * 0.38, 5, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(item.x, item.y, item.size / 2, 0, 2 * Math.PI);
    const sh = item.shade;
    ctx.fillStyle = isClicked ? `rgba(${sh},${sh},${sh},0.25)` : `rgb(${sh},${sh},${sh})`;
    ctx.fill();

    ctx.filter = 'none';
    ctx.font = `${Math.round(item.size * 0.55)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, item.x, item.y);

    if (isClicked) {
      ctx.beginPath();
      ctx.arc(item.x + item.size / 2 - 5, item.y - item.size / 2 + 5, 10, 0, 2 * Math.PI);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(clickRank), item.x + item.size / 2 - 5, item.y - item.size / 2 + 5);
    }
    ctx.restore();
  });

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('← Closest', 10, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText('Farthest →', W - 10, H - 8);
}

export function DepthOrder({ onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stateRef = useRef({
    round: 0,
    correct: 0,
    reactions: [] as number[],
    items: [] as DepthItem[],
    clickOrder: [] as number[],
    roundStart: 0,
    answered: false,
    setUiRound: null as ((v: number) => void) | null,
    setUiCorrect: null as ((v: number) => void) | null,
    setShowResult: null as ((v: boolean | null) => void) | null,
    setClickCount: null as ((v: number) => void) | null,
    setGameOver: null as ((v: boolean) => void) | null,
  });

  const [uiRound, setUiRound] = useState(1);
  const [uiCorrect, setUiCorrect] = useState(0);
  const [showResult, setShowResult] = useState<boolean | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  stateRef.current.setUiRound = setUiRound;
  stateRef.current.setUiCorrect = setUiCorrect;
  stateRef.current.setShowResult = setShowResult;
  stateRef.current.setClickCount = setClickCount;
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

    const beginRound = () => {
      if (cancelled) return;
      const items = generateItems(canvas.width, canvas.height);
      s.items = items;
      s.clickOrder = [];
      s.roundStart = performance.now();
      s.answered = false;
      s.setClickCount?.(0);
      s.setShowResult?.(null);
      const ctx = canvas.getContext('2d')!;
      paintCanvas(ctx, canvas.width, canvas.height, items, []);
    };

    const initCanvas = (width: number, height: number) => {
      if (cancelled) return;
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      beginRound();
    };

    if (canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
      initCanvas(canvas.offsetWidth, canvas.offsetHeight);
    } else {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            observer.disconnect();
            initCanvas(width, height);
            break;
          }
        }
      });
      observer.observe(canvas);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gameOver) {
      const s = stateRef.current;
      const avgRT = s.reactions.length > 0
        ? s.reactions.reduce((a, b) => a + b, 0) / s.reactions.length
        : 500;
      onCompleteRef.current(Math.round((s.correct / TOTAL_ROUNDS) * 100), Math.round(avgRT));
    }
  }, [gameOver]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const s = stateRef.current;
    if (!canvas || s.answered) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    for (let i = 0; i < s.items.length; i++) {
      const item = s.items[i];
      const dist = Math.sqrt((mx - item.x) ** 2 + (my - item.y) ** 2);
      if (dist <= item.size / 2 + 8 && !s.clickOrder.includes(i)) {
        s.clickOrder = [...s.clickOrder, i];
        s.setClickCount?.(s.clickOrder.length);

        const ctx = canvas.getContext('2d')!;
        paintCanvas(ctx, canvas.width, canvas.height, s.items, s.clickOrder);

        if (s.clickOrder.length === ITEMS) {
          s.answered = true;
          const rt = performance.now() - s.roundStart;
          const isCorrect = s.clickOrder.every((idx, rank) => s.items[idx].trueDepth === rank + 1);
          s.reactions.push(rt);
          if (isCorrect) { s.correct += 1; setUiCorrect(s.correct); }
          setShowResult(isCorrect);

          const next = s.round + 1;
          s.round = next;
          setUiRound(Math.min(next + 1, TOTAL_ROUNDS));

          if (next >= TOTAL_ROUNDS) {
            setTimeout(() => setGameOver(true), 1000);
          } else {
            setTimeout(() => {
              if (!canvas) return;
              const items = generateItems(canvas.width, canvas.height);
              s.items = items;
              s.clickOrder = [];
              s.roundStart = performance.now();
              s.answered = false;
              s.setClickCount?.(0);
              s.setShowResult?.(null);
              const ctx2 = canvas.getContext('2d')!;
              paintCanvas(ctx2, canvas.width, canvas.height, items, []);
            }, 1500);
          }
        }
        break;
      }
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
        className="rounded-xl border border-gray-700 w-full block cursor-pointer"
        style={{ height: '220px' }}
        onClick={handleClick}
      />

      <div className="h-5 flex items-center">
        {showResult !== null && (
          <span className={`text-sm font-bold ${showResult ? 'text-green-400' : 'text-red-400'}`}>
            {showResult ? '✓ Correct order!' : '✗ Incorrect order'}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-sm text-center">
        Click objects <strong className="text-white">closest → farthest</strong>
        <br /><span className="text-gray-600 text-xs">Closer = larger &amp; brighter</span>
      </p>
      <p className="text-gray-600 text-xs">{clickCount} / {ITEMS} selected</p>
    </div>
  );
}
