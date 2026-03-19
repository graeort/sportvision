import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function DualPursuit({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [pos1, setPos1] = useState({ x: 25, y: 50 });
  const [pos2, setPos2] = useState({ x: 75, y: 50 });
  const [bothInZone, setBothInZone] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const zoneEnterTime = useRef(0);
  const bothInZoneRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const total = hits + misses;
          const accuracy = total > 0 ? Math.round((hits / total) * 100) : 70;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 600;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, hits, misses, reactions, onComplete]);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    const animate = (time: number) => {
      const t = time / 1000;
      const x1 = 25 + 18 * Math.cos(t * 0.9);
      const y1 = 50 + 28 * Math.sin(t * 0.9);
      const x2 = 75 + 18 * Math.cos(t * 0.7 + 1);
      const y2 = 50 + 28 * Math.sin(t * 1.1 + 2);
      setPos1({ x: x1, y: y1 });
      setPos2({ x: x2, y: y2 });

      const inZone1 = Math.abs(x1 - 25) < 9 && Math.abs(y1 - 50) < 9;
      const inZone2 = Math.abs(x2 - 75) < 9 && Math.abs(y2 - 50) < 9;
      const nowBoth = inZone1 && inZone2;

      if (nowBoth && !bothInZoneRef.current) {
        zoneEnterTime.current = Date.now();
      }
      bothInZoneRef.current = nowBoth;
      setBothInZone(nowBoth);

      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const handleClick = () => {
    if (!active) return;
    if (bothInZoneRef.current) {
      const reaction = Date.now() - zoneEnterTime.current;
      setReactions((r) => [...r, reaction]);
      setHits((h) => h + 1);
    } else {
      setMisses((m) => m + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-blue-400 text-xs">Click when both targets enter their rings</span>
        <span>{hits} hits</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">👁️</div>
          <h3 className="text-white font-bold mb-2">Dual Target Pursuit</h3>
          <p className="text-gray-400 text-sm mb-4">
            Track two moving targets simultaneously. Click anywhere when <strong className="text-white">both</strong> targets align with their marked zones.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <>
          <div
            className="relative w-full max-w-md h-64 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer select-none"
            onClick={handleClick}
          >
            {/* Zone rings */}
            <div
              className={`absolute w-14 h-14 rounded-full border-2 transition-colors ${bothInZone ? 'border-green-400 bg-green-400/10' : 'border-gray-600'}`}
              style={{ left: '25%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />
            <div
              className={`absolute w-14 h-14 rounded-full border-2 transition-colors ${bothInZone ? 'border-green-400 bg-green-400/10' : 'border-gray-600'}`}
              style={{ left: '75%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />
            {/* Target 1 */}
            <div
              className="absolute w-7 h-7 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"
              style={{ left: `${pos1.x}%`, top: `${pos1.y}%`, transform: 'translate(-50%, -50%)' }}
            />
            {/* Target 2 */}
            <div
              className="absolute w-7 h-7 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"
              style={{ left: `${pos2.x}%`, top: `${pos2.y}%`, transform: 'translate(-50%, -50%)' }}
            />
            <div className="absolute bottom-2 left-0 right-0 text-center text-xs pointer-events-none"
              style={{ color: bothInZone ? '#22c55e' : '#4b5563' }}>
              {bothInZone ? '✓ Both aligned — CLICK NOW!' : 'Click when both targets enter their rings'}
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
