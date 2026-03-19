import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const DIRECTIONS = ['Left', 'Centre', 'Right'] as const;
type Direction = typeof DIRECTIONS[number];
const TOTAL_TRIALS = 10;

export function PadelWallRead({ onComplete }: Props) {
  const [phase, setPhase] = useState<'approach' | 'impact' | 'answer' | 'feedback'>('approach');
  const [targetDir, setTargetDir] = useState<Direction>('Centre');
  // Ball start X — the approach angle is the visual cue
  // Reflection physics: ball from right side → exits left, and vice versa
  const [ballStartX, setBallStartX] = useState(50);
  const [correct, setCorrect] = useState(0);
  const [trial, setTrial] = useState(0);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const [releaseTime, setReleaseTime] = useState(0);

  const reactionsRef = useRef<number[]>([]);
  const correctRef = useRef(0);
  const trialRef = useRef(0);

  const startTrial = () => {
    const dir = DIRECTIONS[Math.floor(Math.random() * 3)];
    setTargetDir(dir);
    setLastResult(null);

    // Ball approach X: reflection rule — incoming side = opposite of exit
    // A ball coming from the RIGHT side of the wall exits LEFT
    const x =
      dir === 'Left'   ? 60 + Math.random() * 14   // ball from right → exits left
    : dir === 'Right'  ? 26 + Math.random() * 14   // ball from left  → exits right
    :                    43 + Math.random() * 14;  // ball from centre → exits centre
    setBallStartX(x);
    setPhase('approach');

    setTimeout(() => {
      setPhase('impact');
      setReleaseTime(Date.now());
      setTimeout(() => setPhase('answer'), 340);
    }, 900 + Math.random() * 600);
  };

  useEffect(() => { startTrial(); }, []);

  const handleAnswer = (answer: Direction) => {
    if (phase !== 'answer') return;
    const reaction = Date.now() - releaseTime;
    reactionsRef.current = [...reactionsRef.current, reaction];
    const isCorrect = answer === targetDir;
    if (isCorrect) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
    }
    setLastResult(isCorrect);
    setPhase('feedback');
    const nextTrial = trialRef.current + 1;
    trialRef.current = nextTrial;
    setTrial(nextTrial);

    setTimeout(() => {
      if (nextTrial >= TOTAL_TRIALS) {
        const accuracy = Math.round((correctRef.current / TOTAL_TRIALS) * 100);
        const avg = reactionsRef.current.length > 0
          ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length)
          : 450;
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
        <span className="text-cyan-400">{correct} correct</span>
      </div>

      {/* Court — side-on view showing ball heading toward back glass */}
      <div className="w-full max-w-md h-52 rounded-xl overflow-hidden relative select-none"
        style={{ background: 'linear-gradient(to bottom, #0a1628 0%, #0c1f15 55%, #06291a 100%)' }}
      >
        {/* Faint court lines */}
        <div className="absolute left-1/2 top-0 bottom-14 w-px bg-white/8" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/6" />

        {/* Glass back wall panel */}
        <div
          className="absolute bottom-0 left-0 right-0 h-14 border-t-2"
          style={{ background: 'rgba(6,182,212,0.07)', borderColor: 'rgba(6,182,212,0.45)' }}
        />

        {/* Wall zone dividers + feedback highlight */}
        <div className="absolute bottom-0 left-0 right-0 h-14 flex">
          {DIRECTIONS.map((d) => (
            <div
              key={d}
              className={`flex-1 flex items-center justify-center border-r last:border-0 transition-colors ${
                phase === 'feedback' && d === targetDir
                  ? lastResult ? 'bg-green-500/25' : 'bg-red-500/25'
                  : ''
              }`}
              style={{ borderColor: 'rgba(6,182,212,0.18)' }}
            >
              {phase === 'feedback' && d === targetDir && (
                <span className="text-sm font-bold" style={{ color: lastResult ? '#22c55e' : '#ef4444' }}>
                  {lastResult ? '✓' : '✗'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Wall label */}
        <div className="absolute bottom-1 left-0 right-0 text-center text-xs font-semibold tracking-widest pointer-events-none"
          style={{ color: 'rgba(6,182,212,0.35)' }}>
          GLASS BACK WALL
        </div>

        {/* Ball — visible during approach and impact phases */}
        {(phase === 'approach' || phase === 'impact') && (
          <div
            className={`absolute w-4 h-4 rounded-full shadow-lg transition-all ${
              phase === 'impact' ? 'bg-white scale-150 shadow-white/60' : 'bg-cyan-300 shadow-cyan-400/50'
            }`}
            style={{
              left: `${ballStartX}%`,
              top: phase === 'approach' ? '16%' : '66%',
              transform: 'translate(-50%, -50%)',
              transitionDuration: phase === 'approach' ? '800ms' : '200ms',
              transitionTimingFunction: 'ease-in',
            }}
          />
        )}

        {/* Impact flash on wall */}
        {phase === 'impact' && (
          <div className="absolute bottom-14 left-0 right-0 h-0.5 bg-cyan-300/70 animate-ping" />
        )}

        {/* Status text */}
        <div className="absolute top-2.5 left-0 right-0 text-center text-xs pointer-events-none"
          style={{ color: 'rgba(156,163,175,0.7)' }}>
          {phase === 'approach' && 'Lob heading to back glass…'}
          {phase === 'impact'   && '💥 Wall contact!'}
          {(phase === 'answer' || phase === 'feedback') && 'Which direction did it exit?'}
        </div>
      </div>

      {/* Direction buttons */}
      {phase === 'answer' && (
        <div className="grid grid-cols-3 gap-3 w-full max-w-md">
          {DIRECTIONS.map((d) => (
            <button
              key={d}
              onClick={() => handleAnswer(d)}
              className="py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-cyan-600/30 border border-gray-700 hover:border-cyan-500 text-white transition-all"
            >
              {d === 'Left' ? '← Left' : d === 'Right' ? 'Right →' : '⬆ Centre'}
            </button>
          ))}
        </div>
      )}

      {/* Feedback */}
      {phase === 'feedback' && lastResult !== null && (
        <div className={`w-full max-w-md text-center py-2 rounded-lg font-bold text-sm ${
          lastResult ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}>
          {lastResult ? '✓ Correct read!' : `✗ Ball exited ${targetDir}`}
        </div>
      )}

      {/* Trial progress bar */}
      <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all"
          style={{ width: `${(trial / TOTAL_TRIALS) * 100}%` }}
        />
      </div>
    </div>
  );
}
