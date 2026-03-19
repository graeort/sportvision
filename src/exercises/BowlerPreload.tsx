import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const DELIVERIES = ['Bouncer', 'Yorker', 'Off-spin', 'Full Toss'] as const;
type Delivery = typeof DELIVERIES[number];
const DELIVERY_ICONS: Record<Delivery, string> = {
  Bouncer: '⬆️',
  Yorker: '⬇️',
  'Off-spin': '🔄',
  'Full Toss': '➡️',
};
const TOTAL_TRIALS = 8;

export function BowlerPreload({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [phase, setPhase] = useState<'approach' | 'release' | 'answer' | 'feedback'>('approach');
  const [current, setCurrent] = useState<Delivery>('Yorker');
  const [correct, setCorrect] = useState(0);
  const [trial, setTrial] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [releaseTime, setReleaseTime] = useState(0);
  const [lastResult, setLastResult] = useState<boolean | null>(null);
  const reactionsRef = useRef<number[]>([]);

  const startTrial = () => {
    const delivery = DELIVERIES[Math.floor(Math.random() * DELIVERIES.length)];
    setCurrent(delivery);
    setPhase('approach');
    setLastResult(null);

    const approachDuration = 900 + Math.random() * 600;
    setTimeout(() => {
      setPhase('release');
      setReleaseTime(Date.now());
      setTimeout(() => setPhase('answer'), 380);
    }, approachDuration);
  };

  useEffect(() => {
    if (active) startTrial();
  }, [active]);

  const handleAnswer = (answer: Delivery) => {
    if (phase !== 'answer') return;
    const reaction = Date.now() - releaseTime;
    reactionsRef.current = [...reactionsRef.current, reaction];
    setReactions(reactionsRef.current);
    const isCorrect = answer === current;
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
        <span className="text-orange-400">{correct} correct</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🏏</div>
          <h3 className="text-white font-bold mb-2">Bowler Pre-load Read</h3>
          <p className="text-gray-400 text-sm mb-4">
            Watch the bowler's run-up and release cues. Identify the delivery type before the ball reaches you.
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
          <div className="w-full max-w-md h-36 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden relative">
            {/* Pitch strip */}
            <div
              className="absolute bottom-0 left-1/2 border border-amber-900/30 bg-amber-950/20"
              style={{ width: 70, height: '100%', transform: 'translateX(-50%)' }}
            />
            {/* Crease line */}
            <div className="absolute bottom-8 left-0 right-0 h-px bg-white/20" />

            {/* Bowler */}
            <div
              className="absolute bottom-8 text-2xl transition-all duration-500"
              style={{
                left: phase === 'approach' ? '20%' : '48%',
                transform: 'translateX(-50%)',
              }}
            >
              {phase === 'release' ? '🦵' : '🏃'}
            </div>

            {/* Ball (only at release) */}
            {phase === 'release' && (
              <div
                className="absolute w-4 h-4 rounded-full bg-red-500 border border-red-300 shadow-lg shadow-red-500/50"
                style={{ left: '52%', bottom: '45%', transform: 'translateX(-50%)' }}
              />
            )}

            <div className="absolute top-2 left-0 right-0 text-center text-gray-600 text-xs">
              {phase === 'approach' && 'Bowler approaching…'}
              {phase === 'release' && '🎯 Ball released!'}
              {(phase === 'answer' || phase === 'feedback') && 'What delivery was that?'}
            </div>
          </div>

          {phase === 'answer' && (
            <div className="grid grid-cols-2 gap-3 w-full max-w-md">
              {DELIVERIES.map((d) => (
                <button
                  key={d}
                  onClick={() => handleAnswer(d)}
                  className="py-3 rounded-xl font-medium text-sm bg-gray-800 hover:bg-orange-600/30 border border-gray-700 hover:border-orange-500 text-white transition-all"
                >
                  {DELIVERY_ICONS[d]} {d}
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
              {lastResult ? '✓ Correct!' : `✗ It was: ${DELIVERY_ICONS[current]} ${current}`}
            </div>
          )}
        </>
      )}
    </div>
  );
}
