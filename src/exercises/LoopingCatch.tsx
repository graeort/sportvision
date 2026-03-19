import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const GRID_COLS = 5;
const TOTAL_TRIALS = 8;

export function LoopingCatch({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState<'launch' | 'answer' | 'feedback'>('launch');
  const [ballX, setBallX] = useState(10);
  const [ballY, setBallY] = useState(85);
  const [landingCol, setLandingCol] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [trial, setTrial] = useState(0);
  const [answerTime, setAnswerTime] = useState(0);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const animRef = useRef(0);
  const reactionsRef = useRef<number[]>([]);

  const startTrial = () => {
    const col = Math.floor(Math.random() * GRID_COLS);
    setLandingCol(col);
    setPhase('launch');
    setLastResult(null);
    setBallX(8);
    setBallY(85);

    const targetX = ((col / GRID_COLS) + 0.5 / GRID_COLS) * 100;
    let t = 0;

    const animate = () => {
      t += 0.028;
      if (t >= 1) {
        setPhase('answer');
        setAnswerTime(Date.now());
        return;
      }
      // Parabolic arc
      const x = 8 + (targetX - 8) * t;
      const y = 85 - 72 * (4 * t * (1 - t));
      setBallX(x);
      setBallY(y);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (active) startTrial();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  const handleAnswer = (col: number) => {
    if (phase !== 'answer') return;
    const reaction = Date.now() - answerTime;
    reactionsRef.current = [...reactionsRef.current, reaction];
    const isCorrect = col === landingCol;
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
        startTrial();
      }
    }, 900);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span>Trial {Math.min(trial + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}</span>
        <span className="text-yellow-400">{correct} correct</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🏏</div>
          <h3 className="text-white font-bold mb-2">Looping Ball Catch Timing</h3>
          <p className="text-gray-400 text-sm mb-4">
            Watch a lobbed ball travel across the screen. When it disappears, click the column where you predict it will land.
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
          <div className="relative w-full max-w-md h-44 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Sky */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #0f172a 65%, #052e16 100%)' }} />
            {/* Ground */}
            <div className="absolute bottom-0 left-0 right-0 h-9 bg-green-950/60 border-t border-green-900/40" />
            {/* Grid zones on ground */}
            <div className="absolute bottom-0 left-0 right-0 h-9 flex">
              {Array.from({ length: GRID_COLS }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 border-r border-green-900/30 last:border-0 flex items-center justify-center ${
                    phase === 'feedback' && i === landingCol
                      ? lastResult ? 'bg-green-400/20' : 'bg-red-400/20'
                      : ''
                  }`}
                >
                  <span className="text-gray-700 text-xs font-bold">{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
            </div>
            {/* Ball */}
            {phase === 'launch' && (
              <div
                className="absolute w-6 h-6 rounded-full bg-yellow-400 shadow-lg shadow-yellow-400/50"
                style={{ left: `${ballX}%`, top: `${ballY}%`, transform: 'translate(-50%, -50%)' }}
              />
            )}
            {/* Landing marker */}
            {phase === 'feedback' && (
              <div
                className="absolute w-4 h-4 rounded-full"
                style={{
                  left: `${((landingCol / GRID_COLS) + 0.5 / GRID_COLS) * 100}%`,
                  bottom: '14px',
                  transform: 'translateX(-50%)',
                  backgroundColor: lastResult ? '#22c55e' : '#ef4444',
                  boxShadow: `0 0 10px ${lastResult ? '#22c55e' : '#ef4444'}`,
                }}
              />
            )}
            <div className="absolute top-2 left-0 right-0 text-center text-gray-700 text-xs">
              {phase === 'launch' ? 'Watch the ball…' : phase === 'answer' ? 'Where will it land?' : lastResult ? '✓ Correct!' : '✗ Missed'}
            </div>
          </div>

          {phase === 'answer' && (
            <div className="grid gap-2 w-full max-w-md" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
              {Array.from({ length: GRID_COLS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="py-4 rounded-lg font-bold text-sm bg-gray-800 hover:bg-yellow-600/30 border border-gray-700 hover:border-yellow-500 text-white transition-all"
                >
                  {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>
          )}

          {phase === 'feedback' && (
            <div
              className={`w-full max-w-md text-center py-2 rounded-lg font-bold text-sm ${
                lastResult ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {lastResult ? '✓ Correct prediction!' : `✗ It landed in column ${String.fromCharCode(65 + landingCol)}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
