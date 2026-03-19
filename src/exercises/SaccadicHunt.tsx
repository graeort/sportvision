import { useState, useEffect, useCallback } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function SaccadicHunt({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetNum, setTargetNum] = useState(1);
  const [numbers, setNumbers] = useState<Array<{ num: number; x: number; y: number; id: number }>>([]);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [reactionStart, setReactionStart] = useState(0);

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

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const total = hits + misses;
          const accuracy = total > 0 ? Math.round((hits / total) * 100) : 65;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 500;
          onComplete(Math.min(accuracy, 100), avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, hits, misses, reactions, onComplete]);

  const handleClick = (_num: number, isTarget: boolean) => {
    if (!active) return;
    if (isTarget) {
      const reaction = Date.now() - reactionStart;
      setReactions((r) => [...r, reaction]);
      setHits((h) => h + 1);
      spawnNumbers(targetNum + 1);
    } else {
      setMisses((m) => m + 1);
    }
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-blue-300 font-medium">
          Find: <strong className="text-white text-base">{targetNum}</strong>
        </span>
        <span>{accuracy}% accuracy</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔢</div>
          <h3 className="text-white font-bold mb-2">Saccadic Number Hunt</h3>
          <p className="text-gray-400 text-sm mb-4">
            Click numbers in ascending order (1, 2, 3…) as fast as possible. Keep your head still — use only your eyes.
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
        <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
            style={{ width: `${(timeLeft / 60) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
