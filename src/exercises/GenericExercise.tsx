import { useState, useEffect } from 'react';
import type { Exercise } from '../data/exercises';

interface Props {
  exercise: Exercise;
  onComplete: (accuracy: number, avgReactionMs: number) => void;
}

export function GenericExercise({ exercise, onComplete }: Props) {
  const [timeLeft, setTimeLeft] = useState(exercise.durationSecs);
  const [clicks, setClicks] = useState(0);
  const [targets, setTargets] = useState(0);
  const [active, setActive] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [showTarget, setShowTarget] = useState(false);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          const accuracy = targets > 0 ? Math.round((clicks / targets) * 100) : 70;
          onComplete(Math.min(accuracy, 100), 400);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, clicks, targets]);

  useEffect(() => {
    if (!active) return;
    const flash = () => {
      const x = 10 + Math.random() * 80;
      const y = 15 + Math.random() * 70;
      setTargetPos({ x, y });
      setShowTarget(true);
      setTargets((t) => t + 1);
      setTimeout(() => setShowTarget(false), 600);
    };

    const interval = setInterval(flash, 1200);
    flash();
    return () => clearInterval(interval);
  }, [active]);

  const handleTargetClick = () => {
    if (!showTarget) return;
    setClicks((c) => c + 1);
    setShowTarget(false);
  };

  const accuracy = targets > 0 ? Math.round((clicks / targets) * 100) : 0;

  const DOMAIN_COLORS: Record<string, string> = {
    dva: '#3b82f6', cs: '#a855f7', pa: '#22c55e', dp: '#eab308', at: '#f97316', gaze: '#ef4444',
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full text-sm text-gray-400">
        <span>⏱ {timeLeft}s</span>
        <span style={{ color: DOMAIN_COLORS[exercise.domain] || '#3b82f6' }}>
          {accuracy}% accuracy
        </span>
      </div>

      {!active ? (
        <div className="w-full max-w-md bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">{exercise.domain === 'dva' ? '👁️' : exercise.domain === 'cs' ? '🌫️' : exercise.domain === 'pa' ? '👀' : exercise.domain === 'dp' ? '📐' : exercise.domain === 'at' ? '⚡' : '🎯'}</div>
          <h3 className="text-white font-bold mb-2">{exercise.title}</h3>
          <p className="text-gray-400 text-sm mb-4">{exercise.description}</p>
          <p className="text-gray-600 text-xs italic mb-5">"{exercise.evidence}"</p>
          <button
            onClick={() => setActive(true)}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3 rounded-xl"
          >
            Start Exercise
          </button>
        </div>
      ) : (
        <div
          className="relative w-full max-w-md h-64 bg-gray-900 border border-gray-800 rounded-xl overflow-hidden cursor-pointer select-none"
          onClick={handleTargetClick}
        >
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #fff, #fff 1px, transparent 1px, transparent 40px)'
            }}
          />

          {showTarget && (
            <div
              className="absolute w-10 h-10 rounded-full border-2 transition-transform"
              style={{
                left: `${targetPos.x}%`,
                top: `${targetPos.y}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: DOMAIN_COLORS[exercise.domain] + '33',
                borderColor: DOMAIN_COLORS[exercise.domain],
                boxShadow: `0 0 15px ${DOMAIN_COLORS[exercise.domain]}66`,
              }}
            />
          )}

          <div className="absolute bottom-3 left-0 right-0 text-center text-gray-600 text-xs">
            Click the target when it appears
          </div>
        </div>
      )}

      {active && (
        <>
          <div className="w-full max-w-md bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all"
              style={{ width: `${(timeLeft / exercise.durationSecs) * 100}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">Targets hit: {clicks} / {targets}</p>
        </>
      )}
    </div>
  );
}
