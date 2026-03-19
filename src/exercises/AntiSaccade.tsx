import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function AntiSaccade({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(75);
  const [flashSide, setFlashSide] = useState<'left' | 'right' | null>(null);
  const [flashY, setFlashY] = useState(50);
  const [hits, setHits] = useState(0);
  const [total, setTotal] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [flashStart, setFlashStart] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const waitingRef = useRef(false);
  const flashSideRef = useRef<'left' | 'right' | null>(null);
  const scheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          const accuracy = total > 0 ? Math.round((hits / total) * 100) : 65;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 400;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, hits, total, reactions, onComplete]);

  const scheduleFlash = () => {
    scheduledRef.current = setTimeout(() => {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const y = 18 + Math.random() * 64;
      setFlashSide(side);
      flashSideRef.current = side;
      setFlashY(y);
      waitingRef.current = true; // setWaiting handled by waitingRef
      waitingRef.current = true;
      setFlashStart(Date.now());

      setTimeout(() => {
        setFlashSide(null);
        flashSideRef.current = null;
        // Give 600ms after flash disappears to respond
        setTimeout(() => {
          if (waitingRef.current) {
            recordMiss();
            waitingRef.current = false;
            scheduleFlash();
          }
        }, 600);
      }, 400);
    }, 1000 + Math.random() * 1200);
  };

  const recordMiss = () => {
    setTotal((t) => t + 1);
    setFeedback('wrong');
    setTimeout(() => setFeedback(null), 500);
  };

  useEffect(() => {
    if (active) scheduleFlash();
    return () => { if (scheduledRef.current) clearTimeout(scheduledRef.current); };
  }, [active]);

  const handleClick = (clicked: 'left' | 'right') => {
    if (!waitingRef.current || !flashSideRef.current) return;
    const reaction = Date.now() - flashStart;
    setReactions((r) => [...r, reaction]);
    // Correct = OPPOSITE side of the flash
    const isCorrect = clicked !== flashSideRef.current;
    waitingRef.current = false;
    setFlashSide(null);
    flashSideRef.current = null;
    if (scheduledRef.current) clearTimeout(scheduledRef.current);

    if (isCorrect) setHits((h) => h + 1);
    setTotal((t) => t + 1);
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setFeedback(null);
      scheduleFlash();
    }, 600);
  };

  const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-red-400 text-xs font-medium">Click OPPOSITE side of flash</span>
        <span>{accuracy}%</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-white font-bold mb-2">Anti-Saccade Drill</h3>
          <p className="text-gray-400 text-sm mb-4">
            A yellow flash appears on one side. Click the <strong className="text-white">opposite</strong> side — resist the natural reflex to look at the flash.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-md h-52 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            {/* Centre divider */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700" />
            {/* Centre fixation */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-3 h-3 rounded-full bg-white/70 shadow-lg shadow-white/30" />
            </div>

            {/* Flash */}
            {flashSide && (
              <div
                className="absolute w-11 h-11 rounded-full bg-yellow-400"
                style={{
                  left: flashSide === 'left' ? '25%' : '75%',
                  top: `${flashY}%`,
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 24px rgba(250,204,21,0.7)',
                }}
              />
            )}

            {/* Feedback overlay */}
            {feedback && (
              <div
                className={`absolute inset-0 pointer-events-none transition-opacity ${
                  feedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}
              />
            )}

            {/* Click zones */}
            <button
              onClick={() => handleClick('left')}
              className="absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer"
            />
            <button
              onClick={() => handleClick('right')}
              className="absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer"
            />

            <div className="absolute bottom-2 left-0 right-0 text-center text-xs pointer-events-none"
              style={{ color: feedback === 'correct' ? '#22c55e' : feedback === 'wrong' ? '#ef4444' : '#374151' }}>
              {feedback === 'correct' ? '✓ Correct!' : feedback === 'wrong' ? '✗ Wrong side!' : 'Click opposite side of flash'}
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all"
              style={{ width: `${(timeLeft / 75) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
