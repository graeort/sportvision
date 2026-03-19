import { useState, useEffect } from 'react';

interface Props {
  onComplete: (accuracy: number, reactionMs: number) => void;
}

interface Player {
  id: number;
  x: number;
  y: number;
  role: 'self' | 'open' | 'covered' | 'defender';
}

export function TeammateAwareness({ onComplete }: Props) {
  const [active, setActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [trialStart, setTrialStart] = useState(0);

  const generateTrial = () => {
    const ps: Player[] = [];
    ps.push({ id: 0, x: 50, y: 50, role: 'self' });

    // One clearly open teammate (no defender close by)
    const openX = 15 + Math.random() * 70;
    const openY = 10 + Math.random() * 75;
    ps.push({ id: 1, x: openX, y: openY, role: 'open' });

    // 2 covered teammates with nearby defenders
    for (let i = 2; i < 4; i++) {
      const tx = 10 + Math.random() * 80;
      const ty = 10 + Math.random() * 80;
      ps.push({ id: i, x: tx, y: ty, role: 'covered' });
      ps.push({ id: i + 10, x: tx + (Math.random() * 8 - 4), y: ty + (Math.random() * 8 - 4), role: 'defender' });
    }

    setPlayers(ps);
    setSelected(null);
    setTrialStart(Date.now());
  };

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 70;
          const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : 600;
          onComplete(accuracy, avg);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, correct, total, reactions, onComplete]);

  useEffect(() => {
    if (active) generateTrial();
  }, [active]);

  const handleSelect = (p: Player) => {
    if (selected !== null || p.role === 'self' || p.role === 'defender') return;
    const reaction = Date.now() - trialStart;
    setReactions((r) => [...r, reaction]);
    const isCorrect = p.role === 'open';
    if (isCorrect) setCorrect((c) => c + 1);
    setTotal((t) => t + 1);
    setSelected(p.id);
    setTimeout(generateTrial, 1100);
  };

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const roleColor = (p: Player, isSelected: boolean) => {
    if (p.role === 'self') return '#ffffff';
    if (p.role === 'defender') return '#ef4444';
    if (isSelected) return p.role === 'open' ? '#22c55e' : '#ef4444';
    return '#3b82f6';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span className="text-green-400 text-xs">Click the open (unmarked) teammate</span>
        <span>{accuracy}%</span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-white font-bold mb-2">Teammate Awareness Sim</h3>
          <p className="text-gray-400 text-sm mb-4">
            You hold the ball (⭕). Defenders (🛡) mark some teammates. Click the <strong className="text-white">open</strong> teammate with no defender nearby.
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
          <div
            className="relative w-full max-w-md h-64 rounded-xl overflow-hidden select-none"
            style={{ background: 'linear-gradient(135deg, #052e16 0%, #0f2210 100%)' }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-0 border-2 border-green-900/40 m-3 rounded" />
            <div className="absolute left-1/2 top-3 bottom-3 w-px bg-green-900/25" />
            <div
              className="absolute w-16 h-16 rounded-full border border-green-900/30"
              style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
            />

            {players.map((p) => {
              const isSelected = selected === p.id;
              const col = roleColor(p, isSelected);
              const clickable = p.role !== 'self' && p.role !== 'defender';
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  disabled={!clickable || selected !== null}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    clickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'
                  } ${isSelected && p.role === 'open' ? 'ring-2 ring-green-400' : isSelected ? 'ring-2 ring-red-400' : ''}`}
                  style={{
                    left: `${p.x}%`,
                    top: `${p.y}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: col + '33',
                    border: `2px solid ${col}`,
                    color: col,
                  }}
                >
                  {p.role === 'self' ? '⭕' : p.role === 'defender' ? '🛡' : ''}
                </button>
              );
            })}
          </div>

          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-emerald-500 transition-all"
              style={{ width: `${(timeLeft / 120) * 100}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
