import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function SmoothPursuit({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [ballX, setBallX] = useState(50);
  const [ballY, setBallY] = useState(50);
  const [cursorX, setCursorX] = useState(50);
  const [cursorY, setCursorY] = useState(50);
  const [trackFrames, setTrackFrames] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const ballXRef = useRef(50);
  const ballYRef = useRef(50);
  const cursorXRef = useRef(50);
  const cursorYRef = useRef(50);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          const accuracy = totalFrames > 0 ? Math.round((trackFrames / totalFrames) * 100) : 65;
          onComplete(Math.max(10, accuracy), 350);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, totalFrames, trackFrames, onComplete]);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.016;
      const x = 50 + 36 * Math.sin(t * 0.9);
      const y = 50 + 28 * Math.sin(t * 1.4);
      ballXRef.current = x;
      ballYRef.current = y;
      setBallX(x);
      setBallY(y);

      const dx = x - cursorXRef.current;
      const dy = y - cursorYRef.current;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setTotalFrames((f) => f + 1);
      if (dist < 12) setTrackFrames((f) => f + 1);

      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !active) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cursorXRef.current = x;
    cursorYRef.current = y;
    setCursorX(x);
    setCursorY(y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || !active) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    cursorXRef.current = x;
    cursorYRef.current = y;
    setCursorX(x);
    setCursorY(y);
  };

  const accuracy = totalFrames > 0 ? Math.round((trackFrames / totalFrames) * 100) : 0;
  const dx = ballX - cursorX;
  const dy = ballY - cursorY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const onTarget = dist < 12;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span style={{ color: accuracy > 60 ? '#22c55e' : accuracy > 30 ? '#f97316' : '#ef4444' }}>
          {accuracy}% on target
        </span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-white font-bold mb-2">Smooth Pursuit Track</h3>
          <p className="text-gray-400 text-sm mb-4">
            Move your cursor (or finger on mobile) to track the red dot as it moves in a smooth path. Keep it centred on the dot at all times.
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
          <div
            ref={containerRef}
            className="relative w-full max-w-md h-64 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-none select-none"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* Tracking accuracy bar */}
            <div className="absolute top-2 left-3 right-3 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${accuracy}%`,
                  background: accuracy > 60 ? '#22c55e' : accuracy > 30 ? '#f97316' : '#ef4444',
                }}
              />
            </div>

            {/* Cursor ring */}
            <div
              className={`absolute w-8 h-8 rounded-full border-2 pointer-events-none transition-colors ${
                onTarget ? 'border-green-400' : 'border-white/40'
              }`}
              style={{ left: `${cursorX}%`, top: `${cursorY}%`, transform: 'translate(-50%, -50%)' }}
            />

            {/* Ball */}
            <div
              className="absolute w-9 h-9 rounded-full pointer-events-none shadow-lg"
              style={{
                left: `${ballX}%`,
                top: `${ballY}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: onTarget ? '#22c55e' : '#ef4444',
                boxShadow: `0 0 18px ${onTarget ? '#22c55e' : '#ef4444'}66`,
              }}
            />

            <div className="absolute bottom-2 left-0 right-0 text-center text-gray-700 text-xs pointer-events-none">
              {onTarget ? '✓ On target!' : 'Keep your cursor on the dot'}
            </div>
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
