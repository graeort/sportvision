import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_RADIUS = CENTER - 4;
const TOTAL_TRIALS = 8;

export function ExpandingRing({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [radius, setRadius] = useState(0);
  const [targetRadius, setTargetRadius] = useState(0.7);
  const [phase, setPhase] = useState<'idle' | 'running' | 'feedback'>('idle');
  const [trialResult, setTrialResult] = useState<'hit' | 'miss' | null>(null);
  const [hits, setHits] = useState(0);
  const [trial, setTrial] = useState(0);
  const startTimeRef = useRef(0);
  const radiusRef = useRef(0);
  const animRef = useRef(0);
  const trialRef = useRef(0);
  const hitsRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);

  const startTrial = () => {
    const tgt = 0.55 + Math.random() * 0.3;
    setTargetRadius(tgt);
    setRadius(0);
    radiusRef.current = 0;
    setPhase('running');
    setTrialResult(null);
    startTimeRef.current = performance.now();

    const speed = MAX_RADIUS * (0.18 + Math.random() * 0.12);
    let last = performance.now();

    const animate = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const r = radiusRef.current + speed * dt;
      radiusRef.current = r;
      setRadius(r);

      if (r / MAX_RADIUS < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Missed — use refs to avoid stale closure
        setPhase('feedback');
        setTrialResult('miss');
        const nextTrial = trialRef.current + 1;
        trialRef.current = nextTrial;
        setTrial(nextTrial);
        setTimeout(() => {
          if (nextTrial >= TOTAL_TRIALS) {
            const accuracy = Math.round((hitsRef.current / TOTAL_TRIALS) * 100);
            const avg = reactionsRef.current.length > 0
              ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length)
              : 600;
            onComplete(accuracy, avg);
          } else {
            startTrial();
          }
        }, 800);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(startTrial, 400);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const handleClick = () => {
    if (phase !== 'running') return;
    cancelAnimationFrame(animRef.current);

    const currentFrac = radiusRef.current / MAX_RADIUS;
    const error = Math.abs(currentFrac - targetRadius);
    const isHit = error < 0.12;
    const reaction = Date.now() - startTimeRef.current;

    if (isHit) {
      hitsRef.current = hitsRef.current + 1;
      setHits(hitsRef.current);
      reactionsRef.current = [...reactionsRef.current, reaction];
    }
    setTrialResult(isHit ? 'hit' : 'miss');
    setPhase('feedback');
    const nextTrial = trialRef.current + 1;
    trialRef.current = nextTrial;
    setTrial(nextTrial);

    setTimeout(() => {
      if (nextTrial >= TOTAL_TRIALS) {
        const accuracy = Math.round((hitsRef.current / TOTAL_TRIALS) * 100);
        const avg = reactionsRef.current.length > 0
          ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length)
          : 600;
        onComplete(accuracy, avg);
      } else {
        startTrial();
      }
    }, 800);
  };

  const targetR = targetRadius * MAX_RADIUS;
  const currentR = Math.min(radius, MAX_RADIUS);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>Trial {Math.min(trial + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="text-green-400">{hits} hits</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🔵</div>
          <h3 className="text-white font-bold mb-2">Expanding Ring Alert</h3>
          <p className="text-gray-400 text-sm mb-4">
            A ring expands outward from the centre. Tap when the expanding ring reaches the dashed target circle.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <>
          <div
            className="cursor-pointer select-none"
            style={{ width: SIZE, height: SIZE }}
            onClick={handleClick}
          >
            <svg width={SIZE} height={SIZE}>
              {/* Target ring (dashed) */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={targetR}
                fill="none"
                stroke="#22c55e"
                strokeWidth="2"
                strokeDasharray="7 4"
                opacity={0.6}
              />
              {/* Expanding ring */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r={currentR}
                fill="none"
                stroke={
                  trialResult === 'hit' ? '#22c55e' : trialResult === 'miss' ? '#ef4444' : '#3b82f6'
                }
                strokeWidth="3"
                opacity={0.9}
              />
              {/* Centre dot */}
              <circle cx={CENTER} cy={CENTER} r="4" fill="white" />
            </svg>
          </div>

          {trialResult && (
            <div
              className={`text-center py-2 px-6 rounded-lg font-bold text-sm ${
                trialResult === 'hit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {trialResult === 'hit' ? '✓ Hit!' : '✗ Too early or too late'}
            </div>
          )}

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all"
              style={{ width: `${(trial / TOTAL_TRIALS) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
