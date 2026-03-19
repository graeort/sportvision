import { useState, useEffect, useRef } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

const ZONES = [
  { x: 50, y: 6 },
  { x: 87, y: 25 },
  { x: 94, y: 50 },
  { x: 87, y: 75 },
  { x: 50, y: 94 },
  { x: 13, y: 75 },
  { x: 6, y: 50 },
  { x: 13, y: 25 },
];

export function WideFlash({ onComplete }: Props) {
  const [active, setActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [flashedZones, setFlashedZones] = useState<number[]>([]);
  const [showing, setShowing] = useState(false);
  const [waitingAnswer, setWaitingAnswer] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [flashStart, setFlashStart] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const scheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 65;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 500;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, correct, total, reactions, onComplete]);

  const scheduleFlash = () => {
    scheduledRef.current = setTimeout(() => {
      const count = 2 + Math.floor(Math.random() * 5);
      const zones = [...Array(8).keys()].sort(() => Math.random() - 0.5).slice(0, count);
      setFlashedZones(zones);
      setShowing(true);
      setFlashStart(Date.now());
      setWaitingAnswer(false);
      setTimeout(() => {
        setShowing(false);
        setWaitingAnswer(true);
      }, 280);
    }, 1400 + Math.random() * 900);
  };

  useEffect(() => {
    if (active) scheduleFlash();
    return () => { if (scheduledRef.current) clearTimeout(scheduledRef.current); };
  }, [active]);

  const handleAnswer = (count: number) => {
    if (!waitingAnswer) return;
    const reaction = Date.now() - flashStart;
    setReactions((r) => [...r, reaction]);
    const isCorrect = count === flashedZones.length;
    if (isCorrect) setCorrect((c) => c + 1);
    setTotal((t) => t + 1);
    setWaitingAnswer(false);
    setFeedback({ ok: isCorrect, text: isCorrect ? `✓ Correct! (${flashedZones.length})` : `✗ Was ${flashedZones.length}, you said ${count}` });
    setTimeout(() => {
      setFeedback(null);
      scheduleFlash();
    }, 900);
  };

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-green-400">{accuracy}% accuracy</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">👀</div>
          <h3 className="text-white font-bold mb-2">Wide Field Number Flash</h3>
          <p className="text-gray-400 text-sm mb-4">
            Numbers briefly flash in zones around the edge. Keep your gaze on the centre dot and count how many zones lit up.
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
          <div className="relative w-72 h-72 select-none">
            {/* Zone dots */}
            {ZONES.map((z, i) => (
              <div
                key={i}
                className={`absolute w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-75 ${
                  showing && flashedZones.includes(i)
                    ? 'bg-green-400 text-gray-900 scale-110 shadow-lg shadow-green-400/50'
                    : 'bg-gray-800 text-gray-600'
                }`}
                style={{ left: `${z.x}%`, top: `${z.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                {showing && flashedZones.includes(i) ? flashedZones.indexOf(i) + 1 : '·'}
              </div>
            ))}
            {/* Centre fixation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/80 shadow-lg shadow-white/40" />
            </div>
          </div>

          {waitingAnswer && (
            <div>
              <p className="text-gray-400 text-sm text-center mb-2">How many zones flashed?</p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleAnswer(n)}
                    className="py-2 px-3 rounded-lg text-sm font-bold bg-gray-800 hover:bg-green-600/30 border border-gray-700 hover:border-green-500 text-white transition-all"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {feedback && (
            <div className={`text-center py-2 px-4 rounded-lg font-bold text-sm ${feedback.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {feedback.text}
            </div>
          )}

          {!waitingAnswer && !feedback && !showing && (
            <p className="text-gray-600 text-xs">Watch the zones…</p>
          )}

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
