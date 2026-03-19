import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

export function ContrastChase({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(75);
  const [ballX, setBallX] = useState(50);
  const [ballY, setBallY] = useState(50);
  const [opacity, setOpacity] = useState(0.25);
  const [colorChanged, setColorChanged] = useState(false);
  const [waitingClick, setWaitingClick] = useState(false);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const changeTimeRef = useRef(0);
  const waitRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          const total = hits + misses;
          const accuracy = total > 0 ? Math.round((hits / total) * 100) : 65;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 500;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [active, hits, misses, reactions, onComplete]);

  useEffect(() => {
    if (!active) return;
    let frame: number;
    let t = 0;
    const animate = () => {
      t += 0.008;
      setBallX(10 + 80 * ((Math.sin(t) + 1) / 2));
      setBallY(15 + 70 * ((Math.cos(t * 0.7) + 1) / 2));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    let timeoutId: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const delay = 1800 + Math.random() * 2500;
      timeoutId = setTimeout(() => {
        setOpacity(0.8 + Math.random() * 0.2);
        setColorChanged(true);
        setWaitingClick(true);
        waitRef.current = true;
        changeTimeRef.current = Date.now();

        const resetId = setTimeout(() => {
          if (waitRef.current) {
            setMisses((m) => m + 1);
          }
          setOpacity(0.2 + Math.random() * 0.1);
          setColorChanged(false);
          setWaitingClick(false);
          waitRef.current = false;
          schedule();
        }, 1100);

        return () => clearTimeout(resetId);
      }, delay);
    };

    schedule();
    return () => clearTimeout(timeoutId);
  }, [active]);

  const handleClick = () => {
    if (!active) return;
    if (waitRef.current) {
      const reaction = Date.now() - changeTimeRef.current;
      setReactions((r) => [...r, reaction]);
      setHits((h) => h + 1);
      setWaitingClick(false);
      setColorChanged(false);
      setOpacity(0.2 + Math.random() * 0.1);
      waitRef.current = false;
    } else {
      setMisses((m) => m + 1);
    }
  };

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-purple-400">{accuracy}% accuracy</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">🌫️</div>
          <h3 className="text-white font-bold mb-2">Contrast Chase</h3>
          <p className="text-gray-400 text-sm mb-4">
            Track the moving target. Click anywhere the moment you notice it suddenly brighten.
          </p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <div
          className="relative w-full max-w-md h-64 rounded-xl overflow-hidden cursor-pointer select-none"
          style={{ background: '#030303' }}
          onClick={handleClick}
        >
          <div
            className="absolute w-10 h-10 rounded-full transition-all duration-75"
            style={{
              left: `${ballX}%`,
              top: `${ballY}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: `rgba(210,210,210,${opacity})`,
              boxShadow: colorChanged ? '0 0 22px rgba(255,255,255,0.45)' : 'none',
            }}
          />
          <div className="absolute bottom-2 left-0 right-0 text-center text-gray-800 text-xs pointer-events-none">
            {waitingClick ? '⚡ Flash detected — click!' : 'Click when the target brightens'}
          </div>
        </div>
      )}

      {active && (
        <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
            style={{ width: `${(timeLeft / 75) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
