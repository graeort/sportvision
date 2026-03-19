import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const DIRECTIONS = ['Left', 'Centre', 'Right'] as const;
type Direction = typeof DIRECTIONS[number];
const TOTAL_TRIALS = 8;

export function PenaltyRead({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState<'approach' | 'kick' | 'answer' | 'feedback'>('approach');
  const [targetDir, setTargetDir] = useState<Direction>('Centre');
  const [kickerX, setKickerX] = useState(50);
  const [correct, setCorrect] = useState(0);
  const [trial, setTrial] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [releaseTime, setReleaseTime] = useState(0);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const reactionsRef = useRef<number[]>([]);

  const startTrial = () => {
    const dir = DIRECTIONS[Math.floor(Math.random() * 3)];
    setTargetDir(dir);
    setKickerX(dir === 'Left' ? 38 : dir === 'Right' ? 62 : 50);
    setPhase('approach');
    setLastResult(null);

    setTimeout(() => {
      setPhase('kick');
      setReleaseTime(Date.now());
      setTimeout(() => setPhase('answer'), 360);
    }, 900 + Math.random() * 600);
  };

  useEffect(() => {
    if (active) startTrial();
  }, [active]);

  const handleAnswer = (answer: Direction) => {
    if (phase !== 'answer') return;
    const reaction = Date.now() - releaseTime;
    reactionsRef.current = [...reactionsRef.current, reaction];
    setReactions(reactionsRef.current);
    const isCorrect = answer === targetDir;
    const nextCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) setCorrect(nextCorrect);
    setLastResult(isCorrect);
    setPhase('feedback');
    const nextTrial = trial + 1;
    setTrial(nextTrial);

    setTimeout(() => {
      if (nextTrial >= TOTAL_TRIALS) {
        const accuracy = Math.round((nextCorrect / TOTAL_TRIALS) * 100);
        const avg = reactionsRef.current.length > 0 ? Math.round(reactionsRef.current.reduce((a, b) => a + b, 0) / reactionsRef.current.length) : 450;
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
        <span className="text-orange-400">{correct} saves</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <h3 className="text-white font-bold mb-2">Penalty Kick Read</h3>
          <p className="text-gray-400 text-sm mb-4">
            You're the goalkeeper. Read the kicker's body language and dive to the correct side before the ball is struck.
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
          <div className="w-full max-w-md h-40 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
            {/* Goal frame */}
            <div className="absolute top-3 left-6 right-6 h-20 border-2 border-white/25 border-b-0 rounded-t" />
            {/* Goal section dividers */}
            <div className="absolute top-3 left-6 right-6 h-20 flex">
              {['Left', 'Centre', 'Right'].map((d) => (
                <div
                  key={d}
                  className={`flex-1 border-r border-white/10 last:border-0 flex items-center justify-center ${
                    phase === 'feedback' && d === targetDir ? (lastResult ? 'bg-green-500/15' : 'bg-red-500/15') : ''
                  }`}
                >
                  {phase === 'feedback' && d === targetDir && (
                    <span className="text-xs font-bold" style={{ color: lastResult ? '#22c55e' : '#ef4444' }}>
                      {lastResult ? '✓' : '✗'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-green-950/50" />
            {/* Penalty spot */}
            <div className="absolute bottom-10 left-1/2 w-2 h-2 rounded-full bg-white/30" style={{ transform: 'translateX(-50%)' }} />

            {/* Kicker */}
            <div
              className="absolute bottom-10 text-xl transition-all duration-400"
              style={{ left: `${kickerX}%`, transform: 'translateX(-50%)' }}
            >
              {phase === 'kick' ? '🦵' : '🧍'}
            </div>

            {/* Ball */}
            {phase === 'kick' && (
              <div
                className="absolute w-4 h-4 rounded-full bg-white shadow-lg"
                style={{ left: `${kickerX}%`, bottom: '44%', transform: 'translateX(-50%)' }}
              />
            )}

            <div className="absolute bottom-1 left-0 right-0 text-center text-gray-700 text-xs">
              {phase === 'approach' && 'Kicker approaching…'}
              {phase === 'kick' && '⚡ Kicked!'}
              {(phase === 'answer' || phase === 'feedback') && 'Which direction?'}
            </div>
          </div>

          {phase === 'answer' && (
            <div className="grid grid-cols-3 gap-3 w-full max-w-md">
              {DIRECTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => handleAnswer(d)}
                  className="py-3 rounded-xl font-bold text-sm bg-gray-800 hover:bg-orange-600/30 border border-gray-700 hover:border-orange-500 text-white transition-all"
                >
                  {d === 'Left' ? '← Left' : d === 'Right' ? 'Right →' : '⬆ Centre'}
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
              {lastResult ? '✓ Correct save!' : `✗ It went ${targetDir}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
