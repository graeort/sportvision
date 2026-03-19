import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const TOTAL_TRIALS = 8;

export function AerialJudge({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState<'ready' | 'rising' | 'feedback'>('ready');
  const [ballY, setBallY] = useState(88);
  const [peakY, setPeakY] = useState(10);
  const [hits, setHits] = useState(0);
  const [trial, setTrial] = useState(0);
  const [trialResult, setTrialResult] = useState<'hit' | 'miss' | null>(null);
  const animRef = useRef(0);
  const peakTimeRef = useRef(0);
  const hasPeakedRef = useRef(false);
  const ballYRef = useRef(88);
  const peakYRef = useRef(10);
  const phaseRef = useRef<'ready' | 'rising' | 'feedback'>('ready');
  const trialRef = useRef(0);
  const hitsRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);

  const startTrial = () => {
    const peak = 5 + Math.random() * 28;
    setPeakY(peak);
    peakYRef.current = peak;
    setBallY(88);
    ballYRef.current = 88;
    hasPeakedRef.current = false;
    peakTimeRef.current = 0;
    setPhase('rising');
    phaseRef.current = 'rising';
    setTrialResult(null);

    let velocity = -(38 + Math.random() * 18);
    const gravity = 28;
    let last = performance.now();
    let y = 88;
    let landed = false;

    const animate = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      velocity += gravity * dt;
      y += velocity * dt * 60;

      if (velocity >= 0 && !hasPeakedRef.current) {
        hasPeakedRef.current = true;
        peakTimeRef.current = Date.now();
      }

      const clamped = Math.max(4, Math.min(90, y));
      setBallY(clamped);
      ballYRef.current = clamped;

      if (y > 92 && !landed) {
        landed = true;
        // Missed - ball landed without user clicking
        if (phaseRef.current === 'rising') {
          const nextTrial = trialRef.current + 1;
          trialRef.current = nextTrial;
          setTrial(nextTrial);
          setTrialResult('miss');
          setPhase('feedback');
          phaseRef.current = 'feedback';
          setTimeout(() => {
            if (nextTrial >= TOTAL_TRIALS) {
              const accuracy = Math.round((hitsRef.current / TOTAL_TRIALS) * 100);
              const avg = reactionsRef.current.length > 0
                ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length) : 500;
              onComplete(accuracy, avg);
            } else {
              startTrial();
            }
          }, 800);
        }
        return;
      }

      if (!landed) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (active) startTrial();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  const handleClick = () => {
    if (phaseRef.current !== 'rising') return;
    cancelAnimationFrame(animRef.current);

    const currentY = ballYRef.current;
    const error = Math.abs(currentY - peakYRef.current);
    const isHit = error < 14;
    const reaction = peakTimeRef.current ? Math.abs(Date.now() - peakTimeRef.current) : 500;

    if (isHit) {
      hitsRef.current = hitsRef.current + 1;
      setHits(hitsRef.current);
      reactionsRef.current = [...reactionsRef.current, reaction];
    }

    setTrialResult(isHit ? 'hit' : 'miss');
    setPhase('feedback');
    phaseRef.current = 'feedback';
    const nextTrial = trialRef.current + 1;
    trialRef.current = nextTrial;
    setTrial(nextTrial);

    setTimeout(() => {
      if (nextTrial >= TOTAL_TRIALS) {
        const accuracy = Math.round((hitsRef.current / TOTAL_TRIALS) * 100);
        const avg = reactionsRef.current.length > 0
          ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length) : 500;
        onComplete(accuracy, avg);
      } else {
        startTrial();
      }
    }, 900);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span>Trial {Math.min(trial + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="text-yellow-400">{hits} hits</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <h3 className="text-white font-bold mb-2">Aerial Ball Height Judge</h3>
          <p className="text-gray-400 text-sm mb-4">
            A ball is kicked high into the air. Click <strong className="text-white">"NOW!"</strong> when the ball reaches its peak height.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-yellow-600 to-amber-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <>
          <div
            className="relative w-full max-w-md h-64 rounded-xl overflow-hidden cursor-pointer"
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 60%, #052e16 100%)' }}
            onClick={handleClick}
          >
            {/* Peak indicator (subtle dashed line) */}
            <div
              className="absolute left-0 right-0 h-px border-t border-dashed border-yellow-500/25"
              style={{ top: `${peakY}%` }}
            />
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-green-950/70" />

            {/* Ball */}
            <div
              className="absolute w-9 h-9 rounded-full shadow-lg pointer-events-none"
              style={{
                left: '48%',
                top: `${ballY}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor:
                  trialResult === 'hit' ? '#22c55e' : trialResult === 'miss' ? '#ef4444' : '#f59e0b',
                boxShadow: `0 0 18px ${trialResult === 'hit' ? '#22c55e' : trialResult === 'miss' ? '#ef4444' : '#f59e0b'}66`,
              }}
            />

            <div className="absolute top-2 left-0 right-0 text-center text-gray-700 text-xs pointer-events-none">
              {phase === 'rising' ? 'Watch the ball…' : trialResult === 'hit' ? '✓ Perfect timing!' : '✗ Off peak'}
            </div>
          </div>

          <button
            onClick={handleClick}
            disabled={phase !== 'rising'}
            className={`w-full max-w-md py-4 rounded-xl font-black text-2xl transition-all ${
              phase === 'rising'
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-500/40 active:scale-95'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            NOW!
          </button>

          {trialResult && (
            <div
              className={`text-center text-sm font-bold ${trialResult === 'hit' ? 'text-green-400' : 'text-red-400'}`}
            >
              {trialResult === 'hit' ? '✓ Excellent timing!' : '✗ Not quite at peak'}
            </div>
          )}

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-600 to-amber-500 transition-all"
              style={{ width: `${(trial / TOTAL_TRIALS) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
