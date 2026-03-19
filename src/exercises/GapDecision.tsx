import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function GapDecision({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [def1X, setDef1X] = useState(20);
  const [def2X, setDef2X] = useState(80);
  const [gapPct, setGapPct] = useState(60);
  const [optimal, setOptimal] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [hits, setHits] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const optimalStartRef = useRef(0);
  const optimalRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          const accuracy = clicks > 0 ? Math.round((hits / clicks) * 100) : 65;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 500;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, clicks, hits, reactions, onComplete]);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.012;
      const d1 = 8 + 28 * Math.abs(Math.sin(t * 0.55));
      const d2 = 92 - 28 * Math.abs(Math.sin(t * 0.55 + 0.6));
      setDef1X(d1);
      setDef2X(d2);
      const g = d2 - d1;
      setGapPct(g);
      const isOptimal = g > 18 && g < 32;
      if (isOptimal && !optimalRef.current) {
        optimalStartRef.current = Date.now();
      }
      optimalRef.current = isOptimal;
      setOptimal(isOptimal);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const handleGo = () => {
    if (!active) return;
    setClicks((c) => c + 1);
    if (optimalRef.current) {
      const reaction = Date.now() - optimalStartRef.current;
      setReactions((r) => [...r, reaction]);
      setHits((h) => h + 1);
    }
  };

  const accuracy = clicks > 0 ? Math.round((hits / clicks) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-orange-400">Gap: {Math.round(gapPct)}%</span>
        <span>{accuracy}% accuracy</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🏃</div>
          <h3 className="text-white font-bold mb-2">Gap Decision Maker</h3>
          <p className="text-gray-400 text-sm mb-4">
            Two defenders converge and diverge. Click <strong className="text-white">"GO!"</strong> when the gap between them is in the optimal zone — not too narrow, not too wide.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <>
          <div
            className="relative w-full max-w-md h-44 rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #052e16 0%, #0f2210 100%)' }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-0 border border-green-900/30 m-3 rounded" />

            {/* Defender 1 */}
            <div
              className="absolute text-2xl transition-transform duration-75"
              style={{ left: `${def1X}%`, top: '25%', transform: 'translateX(-50%)' }}
            >
              🛡️
            </div>
            {/* Defender 2 */}
            <div
              className="absolute text-2xl transition-transform duration-75"
              style={{ left: `${def2X}%`, top: '25%', transform: 'translateX(-50%)' }}
            >
              🛡️
            </div>

            {/* Gap highlight */}
            <div
              className={`absolute top-10 h-8 transition-all rounded ${
                optimal ? 'bg-green-400/25 border border-green-400/60' : 'bg-gray-600/10 border border-gray-700/30'
              }`}
              style={{ left: `${def1X}%`, width: `${gapPct}%` }}
            />

            {/* Runner */}
            <div
              className="absolute bottom-4 left-1/2 text-xl"
              style={{ transform: 'translateX(-50%)' }}
            >
              🏃
            </div>

            {/* Status */}
            <div
              className="absolute bottom-12 left-0 right-0 text-center text-xs font-semibold"
              style={{ color: optimal ? '#22c55e' : gapPct < 18 ? '#ef4444' : '#6b7280' }}
            >
              {optimal ? '✓ OPTIMAL — GO NOW!' : gapPct < 18 ? 'Too narrow' : gapPct > 32 ? 'Too wide' : ''}
            </div>
          </div>

          <button
            onClick={handleGo}
            className={`w-full max-w-md py-4 rounded-xl font-black text-2xl transition-all ${
              optimal
                ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-500/40'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-500 border border-gray-700'
            }`}
          >
            GO!
          </button>

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
