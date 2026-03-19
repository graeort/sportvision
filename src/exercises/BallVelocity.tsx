import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

type Speed = 'slow' | 'medium' | 'fast';

const SPEED_LABELS: Record<Speed, string> = { slow: '🐢 Slow', medium: '🏃 Medium', fast: '⚡ Fast' };
const SPEED_PX_PER_SEC: Record<Speed, number> = { slow: 14, medium: 26, fast: 46 };
const SPEEDS: Speed[] = ['slow', 'medium', 'fast'];
const TOTAL_TRIALS = 8;

export function BallVelocity({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [trial, setTrial] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [ballX, setBallX] = useState(-10);
  const [phase, setPhase] = useState<'idle' | 'moving' | 'answer' | 'feedback'>('idle');
  const [currentSpeed, setCurrentSpeed] = useState<Speed>('medium');
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [trialStart, setTrialStart] = useState(0);
  const animRef = useRef<number>(0);
  const reactionsRef = useRef<number[]>([]);

  const runTrial = () => {
    const speed = SPEEDS[Math.floor(Math.random() * 3)];
    setCurrentSpeed(speed);
    setBallX(0);
    setPhase('moving');
    setLastResult(null);

    const startTime = performance.now();
    const pxPerSec = SPEED_PX_PER_SEC[speed];
    setTrialStart(Date.now());

    const animate = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const x = elapsed * pxPerSec;
      setBallX(x);
      if (x < 78) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setPhase('answer');
      }
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(runTrial, 600);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const handleAnswer = (answer: Speed) => {
    if (phase !== 'answer') return;
    const reaction = Date.now() - trialStart;
    reactionsRef.current = [...reactionsRef.current, reaction];
    const isCorrect = answer === currentSpeed;
    const nextCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) setCorrect(nextCorrect);
    setLastResult(isCorrect);
    setPhase('feedback');
    const nextTrial = trial + 1;
    setTrial(nextTrial);

    setTimeout(() => {
      if (nextTrial >= TOTAL_TRIALS) {
        const accuracy = Math.round((nextCorrect / TOTAL_TRIALS) * 100);
        const avg = reactionsRef.current.length > 0 ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length) : 500;
        onComplete(accuracy, avg);
      } else {
        runTrial();
      }
    }, 900);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>Trial {Math.min(trial + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="text-blue-400">{correct} correct</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚾</div>
          <h3 className="text-white font-bold mb-2">Ball Velocity Read</h3>
          <p className="text-gray-400 text-sm mb-4">
            Watch the ball travel across the screen, then identify whether it was slow, medium, or fast.
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
          <div className="relative w-full max-w-md h-28 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {[25, 50, 75].map((x) => (
              <div key={x} className="absolute top-0 bottom-0 w-px bg-gray-800/70" style={{ left: `${x}%` }} />
            ))}
            {phase === 'moving' && (
              <div
                className="absolute w-7 h-7 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                style={{ left: `${ballX}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
              />
            )}
            {phase === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-sm">
                Get ready…
              </div>
            )}
          </div>

          {phase === 'answer' && (
            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleAnswer(s)}
                  className="py-3 rounded-xl font-medium text-sm bg-gray-800 hover:bg-blue-600/30 border border-gray-700 hover:border-blue-500 text-white transition-all"
                >
                  {SPEED_LABELS[s]}
                </button>
              ))}
            </div>
          )}

          {phase === 'feedback' && lastResult !== null && (
            <div
              className={`w-full max-w-md text-center py-2 rounded-lg font-bold text-sm ${
                lastResult ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {lastResult ? '✓ Correct!' : `✗ It was ${SPEED_LABELS[currentSpeed]}`}
            </div>
          )}

          {phase === 'moving' && (
            <p className="text-gray-500 text-xs">Watch carefully…</p>
          )}
        </>
      )}
    </div>
  );
}
