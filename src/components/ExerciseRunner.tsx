import { useState } from 'react';
import type { Exercise } from '../data/exercises';
import { MovingOptotype } from '../exercises/MovingOptotype';
import { CentralLock } from '../exercises/CentralLock';
import { FixationStability } from '../exercises/FixationStability';
import { ServePrediction } from '../exercises/ServePrediction';
import { DepthOrder } from '../exercises/DepthOrder';
import { GaborPatch } from '../exercises/GaborPatch';
import { SaccadicHunt } from '../exercises/SaccadicHunt';
import { BallVelocity } from '../exercises/BallVelocity';
import { DualPursuit } from '../exercises/DualPursuit';
import { ContrastChase } from '../exercises/ContrastChase';
import { WideFlash } from '../exercises/WideFlash';
import { ExpandingRing } from '../exercises/ExpandingRing';
import { TeammateAwareness } from '../exercises/TeammateAwareness';
import { BowlerPreload } from '../exercises/BowlerPreload';
import { PenaltyRead } from '../exercises/PenaltyRead';
import { GapDecision } from '../exercises/GapDecision';
import { AntiSaccade } from '../exercises/AntiSaccade';
import { SmoothPursuit } from '../exercises/SmoothPursuit';
import { LoopingCatch } from '../exercises/LoopingCatch';
import { AerialJudge } from '../exercises/AerialJudge';
import { PadelWallRead } from '../exercises/PadelWallRead';
import { GenericExercise } from '../exercises/GenericExercise';

const DOMAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  dva: { label: 'Dynamic Visual Acuity', color: '#3b82f6', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  cs: { label: 'Contrast Sensitivity', color: '#a855f7', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  pa: { label: 'Peripheral Awareness', color: '#22c55e', bg: 'bg-green-500/15 text-green-400 border-green-500/30' },
  dp: { label: 'Depth Perception', color: '#eab308', bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  at: { label: 'Anticipatory Timing', color: '#f97316', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  gaze: { label: 'Gaze Control', color: '#ef4444', bg: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

type RunnerState = 'ready' | 'running' | 'done';

interface ExerciseResult {
  accuracy: number;
  reactionMs: number;
}

interface Props {
  exercise: Exercise;
  exerciseIndex: number;
  totalExercises: number;
  onNext: (accuracy: number, reactionMs: number) => void;
  onSkip: () => void;
}

export function ExerciseRunner({ exercise, exerciseIndex, totalExercises, onNext, onSkip }: Props) {
  const [state, setState] = useState<RunnerState>('ready');
  const [result, setResult] = useState<ExerciseResult | null>(null);

  const dm = DOMAIN_META[exercise.domain];

  const handleComplete = (accuracy: number, reactionMs: number) => {
    setResult({ accuracy, reactionMs });
    setState('done');
  };

  const handleNext = () => {
    if (result) {
      onNext(result.accuracy, result.reactionMs);
    }
  };

  const renderExercise = () => {
    switch (exercise.component) {
      case 'MovingOptotype':      return <MovingOptotype onComplete={handleComplete} />;
      case 'CentralLock':        return <CentralLock onComplete={handleComplete} />;
      case 'FixationStability':  return <FixationStability onComplete={handleComplete} />;
      case 'ServePrediction':    return <ServePrediction onComplete={handleComplete} />;
      case 'DepthOrder':         return <DepthOrder onComplete={handleComplete} />;
      case 'GaborPatch':         return <GaborPatch onComplete={handleComplete} />;
      case 'SaccadicHunt':       return <SaccadicHunt onComplete={handleComplete} />;
      case 'BallVelocity':       return <BallVelocity onComplete={handleComplete} />;
      case 'DualPursuit':        return <DualPursuit onComplete={handleComplete} />;
      case 'ContrastChase':      return <ContrastChase onComplete={handleComplete} />;
      case 'WideFlash':          return <WideFlash onComplete={handleComplete} />;
      case 'ExpandingRing':      return <ExpandingRing onComplete={handleComplete} />;
      case 'TeammateAwareness':  return <TeammateAwareness onComplete={handleComplete} />;
      case 'BowlerPreload':      return <BowlerPreload onComplete={handleComplete} />;
      case 'PenaltyRead':        return <PenaltyRead onComplete={handleComplete} />;
      case 'GapDecision':        return <GapDecision onComplete={handleComplete} />;
      case 'AntiSaccade':        return <AntiSaccade onComplete={handleComplete} />;
      case 'SmoothPursuit':      return <SmoothPursuit onComplete={handleComplete} />;
      case 'LoopingCatch':       return <LoopingCatch onComplete={handleComplete} />;
      case 'AerialJudge':        return <AerialJudge onComplete={handleComplete} />;
      case 'PadelWallRead':      return <PadelWallRead onComplete={handleComplete} />;
      default:
        return <GenericExercise exercise={exercise} onComplete={handleComplete} />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${dm.bg}`}>
            {exercise.domain.toUpperCase()} · {dm.label}
          </span>
          <h2 className="text-xl font-bold text-white mt-2">{exercise.title}</h2>
          <p className="text-gray-400 text-sm mt-0.5">{exercise.description}</p>
        </div>
        <button
          onClick={onSkip}
          className="text-gray-600 hover:text-gray-400 text-sm transition-colors shrink-0 ml-4"
        >
          Skip →
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: totalExercises }, (_, i) => (
          <div
            key={i}
            className={`flex-1 h-1 rounded-full transition-all ${
              i < exerciseIndex
                ? 'bg-green-500'
                : i === exerciseIndex
                ? `bg-gradient-to-r from-blue-600 to-cyan-500 ${state === 'running' ? 'animate-pulse' : ''}`
                : 'bg-gray-800'
            }`}
          />
        ))}
      </div>

      {/* Ready State */}
      {state === 'ready' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ backgroundColor: dm.color + '20', border: `2px solid ${dm.color}40` }}
          >
            {exercise.domain === 'dva' ? '👁️' : exercise.domain === 'cs' ? '🌫️' : exercise.domain === 'pa' ? '👀' : exercise.domain === 'dp' ? '📐' : exercise.domain === 'at' ? '⚡' : '🎯'}
          </div>
          <h3 className="text-white font-bold text-lg mb-2">{exercise.title}</h3>
          <p className="text-gray-400 text-sm mb-4 max-w-sm mx-auto">{exercise.description}</p>

          <div className="bg-gray-800/50 rounded-xl p-3 mb-6 text-left">
            <p className="text-gray-500 text-xs font-medium mb-1">RESEARCH BASIS</p>
            <p className="text-gray-400 text-xs italic leading-relaxed">"{exercise.evidence}"</p>
          </div>

          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <div className="text-center">
              <p className="text-white font-bold">{Math.round(exercise.durationSecs / 60)}m</p>
              <p className="text-gray-600 text-xs">Duration</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-white font-bold capitalize">{exercise.difficulty}</p>
              <p className="text-gray-600 text-xs">Difficulty</p>
            </div>
            <div className="w-px h-8 bg-gray-700" />
            <div className="text-center">
              <p className="text-white font-bold">{exerciseIndex + 1}/{totalExercises}</p>
              <p className="text-gray-600 text-xs">Exercise</p>
            </div>
          </div>

          <button
            onClick={() => setState('running')}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-10 py-3 rounded-xl transition-all"
          >
            Begin Exercise →
          </button>
        </div>
      )}

      {/* Running State */}
      {state === 'running' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          {renderExercise()}
        </div>
      )}

      {/* Done State */}
      {state === 'done' && result && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">
            {result.accuracy >= 80 ? '🎯' : result.accuracy >= 60 ? '👍' : '💪'}
          </div>
          <h3 className="text-2xl font-black text-white mb-1">Exercise Complete!</h3>
          <p className="text-gray-400 text-sm mb-6">{exercise.title}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div
              className="bg-gray-800 rounded-xl p-4"
              style={{ borderLeft: `3px solid ${dm.color}` }}
            >
              <p
                className="text-3xl font-black mb-1"
                style={{ color: result.accuracy >= 80 ? '#22c55e' : result.accuracy >= 60 ? '#f97316' : '#ef4444' }}
              >
                {result.accuracy}%
              </p>
              <p className="text-gray-500 text-xs">Accuracy</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-3xl font-black text-blue-400 mb-1">
                {result.reactionMs < 1000
                  ? `${result.reactionMs}ms`
                  : `${(result.reactionMs / 1000).toFixed(1)}s`}
              </p>
              <p className="text-gray-500 text-xs">Avg Reaction Time</p>
            </div>
          </div>

          {exerciseIndex < totalExercises - 1 ? (
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all"
            >
              Next Exercise →
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold py-3 rounded-xl transition-all"
            >
              Complete Session 🎉
            </button>
          )}
        </div>
      )}
    </div>
  );
}
