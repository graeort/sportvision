import { useState, useEffect, useCallback, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const TOTAL_TARGETS = 20;  // exercise ends when player finds target #20
const TIME_LIMIT = 60;      // or when 60 seconds runs out

export function SaccadicHunt({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [targetNum, setTargetNum] = useState(1);
  const [numbers, setNumbers] = useState<Array<{ num: number; x: number; y: number; id: number }>>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reactionStart, setReactionStart] = useState(0);

  // Refs to avoid stale closures in timer and prevent double-completion
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const total = hitsRef.current + missesRef.current;
    const accuracy = total > 0 ? Math.round((hitsRef.current / total) * 100) : 65;
    const avg = reactionsRef.current.length > 0
      ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length)
      : 500;
    onComplete(Math.min(accuracy, 100), avg);
  }, [onComplete]);

  const spawnNumbers = useCallback((currentTarget: number) => {
    const positions: Array<{ x: number; y: number }> = [];
    const count = 7;
    const nums: Array<{ num: number; x: number; y: number; id: number }> = [];
    for (let i = 0; i < count; i++) {
      let x: number, y: number, ok: boolean;
      let attempts = 0;
      do {
        x = 8 + Math.random() * 84;
        y = 8 + Math.random() * 84;
        ok = positions.every((p) => Math.hypot(p.x - x, p.y - y) > 14);
        attempts++;
      } while (!ok && attempts < 50);
      positions.push({ x, y });
      nums.push({ num: currentTarget + i, x, y, id: Date.now() + i });
    }
    setNumbers(nums);
    setTargetNum(currentTarget);
    setReactionStart(Date.now());
  }, []);

  useEffect(() => {
    if (!active) return;
    spawnNumbers(1);
  }, [active, spawnNumbers]);

  // Timer — depends only on active; uses refs for accurate final stats
  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          finish();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, finish]);

  const handleClick = (_num: number, isTarget: boolean) => {
    if (!active || completedRef.current) return;
    if (isTarget) {
      const reaction = Date.now() - reactionStart;
      hitsRef.current += 1;
      reactionsRef.current = [...reactionsRef.current, reaction];
      setHits(hitsRef.current);

      // Complete when player finds the final target
      if (targetNum >= TOTAL_TARGETS) {
        finish();
        return;
      }
      spawnNumbers(targetNum + 1);
    } else {
      missesRef.current += 1;
      setMisses(missesRef.current);
    }
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-blue-300 font-medium">
          Find: <strong className="text-white text-base">{targetNum}</strong>
          <span className="text-gray-500 text-xs ml-1">/ {TOTAL_TARGETS}</span>
        </span>
        <span>{accuracy}% accuracy</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔢</div>
          <h3 className="text-white font-bold mb-2">Saccadic Number Hunt</h3>
          <p className="text-gray-400 text-sm mb-4">
            Click numbers 1 → {TOTAL_TARGETS} in order as fast as you can. Keep your head still — eyes only. Ends at target {TOTAL_TARGETS} or {TIME_LIMIT}s, whichever comes first.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <div className="relative w-full max-w-md h-72 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden select-none">
          {numbers.map(({ num, x, y, id }) => (
            <button
              key={id}
              onClick={() => handleClick(num, num === targetNum)}
              className={`absolute w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                num === targetNum
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 scale-110 ring-2 ring-blue-300'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            >
              {num}
            </button>
          ))}
          <div className="absolute bottom-2 left-0 right-0 text-center text-gray-600 text-xs pointer-events-none">
            Hits: {hits} · Misses: {misses}
          </div>
        </div>
      )}

      {active && (
        <div className="w-full max-w-md space-y-1.5">
          {/* Time bar */}
          <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
              style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
            />
          </div>
          {/* Target progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all"
              style={{ width: `${((targetNum - 1) / TOTAL_TARGETS) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
