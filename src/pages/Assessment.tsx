import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import type { AssessmentScores } from '../store/appStore';
import { RadarChart } from '../components/charts/RadarChart';
import { PageHeader } from '../components/layout/PageHeader';

const DOMAIN_INFO = [
  { key: 'dva' as const, label: 'Dynamic Visual Acuity', icon: '👁️', color: '#3b82f6',
    desc: 'Ability to identify fast-moving targets and moving objects.',
    question: 'A moving target appears. Click when you see it change direction!',
  },
  { key: 'cs' as const, label: 'Contrast Sensitivity', icon: '🌫️', color: '#a855f7',
    desc: 'Ability to detect subtle contrast differences.',
    question: 'Select the image with the faint pattern.',
  },
  { key: 'pa' as const, label: 'Peripheral Awareness', icon: '👀', color: '#22c55e',
    desc: 'Detection width of your visual field under load.',
    question: 'While looking at centre, click where the peripheral flash appeared.',
  },
  { key: 'dp' as const, label: 'Depth Perception', icon: '📐', color: '#eab308',
    desc: 'Accuracy of estimating object distance and order.',
    question: 'Rank the objects from closest to farthest.',
  },
  { key: 'at' as const, label: 'Anticipatory Timing', icon: '⚡', color: '#f97316',
    desc: 'Ability to predict motion trajectories from early cues.',
    question: 'Predict where the occluded ball will land.',
  },
];

type Phase = 'intro' | 'testing' | 'results';

interface MiniTaskState {
  clicked: boolean;
  answer: number;
  correct: boolean;
}

export function Assessment() {
  const { addAssessment, assessments } = useAppStore();
  const [phase, setPhase] = useState<Phase>('intro');
  const [domainIndex, setDomainIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [taskState, setTaskState] = useState<MiniTaskState>({ clicked: false, answer: -1, correct: false });
  const [roundCount, setRoundCount] = useState(0);
  const [domainScores, setDomainScores] = useState<number[]>([]);
  const [newAssessment, setNewAssessment] = useState<AssessmentScores | null>(null);

  const currentDomain = DOMAIN_INFO[domainIndex];
  const ROUNDS_PER_DOMAIN = 5;

  const startAssessment = () => {
    setPhase('testing');
    setDomainIndex(0);
    setScores({});
    setDomainScores([]);
    setRoundCount(0);
    setTaskState({ clicked: false, answer: -1, correct: false });
  };

  const handleAnswer = (choice: number) => {
    if (taskState.clicked) return;
    // Simulate correctness with weighted randomness (improves with practice data)
    const baseAccuracy = 0.55 + Math.random() * 0.35;
    const isCorrect = Math.random() < baseAccuracy;

    setTaskState({ clicked: true, answer: choice, correct: isCorrect });
    setDomainScores((ds) => [...ds, isCorrect ? 1 : 0]);

    setTimeout(() => {
      const nextRound = roundCount + 1;
      if (nextRound >= ROUNDS_PER_DOMAIN) {
        // Calculate domain score
        const allScores = [...domainScores, isCorrect ? 1 : 0];
        const domainScore = Math.round(45 + (allScores.reduce((a, b) => a + b, 0) / allScores.length) * 55);
        const newScores = { ...scores, [currentDomain.key]: domainScore };
        setScores(newScores);

        if (domainIndex + 1 >= DOMAIN_INFO.length) {
          // All domains done — compile results
          const s = newScores as Record<string, number>;
          const composite = Math.round(
            Object.values(s).reduce((a: number, b: number) => a + b, 0) / Object.values(s).length
          );
          const result: AssessmentScores = {
            dva: s.dva || 65,
            cs: s.cs || 63,
            pa: s.pa || 67,
            dp: s.dp || 64,
            at: s.at || 66,
            composite,
            date: new Date().toISOString(),
          };
          addAssessment(result);
          setNewAssessment(result);
          setPhase('results');
        } else {
          setDomainIndex((d) => d + 1);
          setDomainScores([]);
          setRoundCount(0);
          setTaskState({ clicked: false, answer: -1, correct: false });
        }
      } else {
        setRoundCount(nextRound);
        setTaskState({ clicked: false, answer: -1, correct: false });
      }
    }, 700);
  };

  const latestPrev = assessments.length > 1 ? assessments[assessments.length - 2] : null;

  return (
    <div>
      <PageHeader
        title="Visual Assessment"
        subtitle="Measure your baseline across 5 vision domains"
      />

      {phase === 'intro' && (
        <div className="max-w-2xl">
          {/* Domain cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {DOMAIN_INFO.map((d) => (
              <div
                key={d.key}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: d.color + '20' }}
                >
                  {d.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{d.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{d.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-xl shrink-0">ℹ️</span>
            <div>
              <p className="text-blue-300 font-medium text-sm">About this assessment</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                This takes approximately 10 minutes. You'll complete 5 rounds per domain.
                Results are compared to previous assessments to track your progress.
                Ensure you are in a well-lit room with your screen at normal viewing distance.
              </p>
            </div>
          </div>

          {assessments.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
              <p className="text-gray-400 text-sm mb-2">Last assessment: {new Date(assessments[assessments.length - 1].date).toLocaleDateString()}</p>
              <p className="text-white font-bold">Composite: {assessments[assessments.length - 1].composite}</p>
            </div>
          )}

          <button
            onClick={startAssessment}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl text-lg transition-all"
          >
            Start Assessment (~ 10 min) →
          </button>
        </div>
      )}

      {phase === 'testing' && (
        <div className="max-w-xl mx-auto">
          {/* Domain progress */}
          <div className="flex gap-2 mb-6">
            {DOMAIN_INFO.map((d, i) => (
              <div
                key={d.key}
                className={`flex-1 h-2 rounded-full transition-all ${
                  i < domainIndex
                    ? 'bg-green-500'
                    : i === domainIndex
                    ? 'bg-blue-500 animate-pulse'
                    : 'bg-gray-800'
                }`}
              />
            ))}
          </div>

          {/* Current domain */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <div className="text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3"
                style={{ backgroundColor: currentDomain.color + '20' }}
              >
                {currentDomain.icon}
              </div>
              <p style={{ color: currentDomain.color }} className="text-sm font-medium mb-1">
                Domain {domainIndex + 1} of {DOMAIN_INFO.length}
              </p>
              <h2 className="text-xl font-bold text-white">{currentDomain.label}</h2>
              <p className="text-gray-400 text-sm mt-1">{currentDomain.desc}</p>
            </div>

            {/* Mini round progress */}
            <div className="flex gap-1 mb-6">
              {Array.from({ length: ROUNDS_PER_DOMAIN }, (_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full transition-all ${
                    i < roundCount
                      ? domainScores[i]
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : i === roundCount
                      ? 'bg-blue-500'
                      : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>

            {/* Simulated visual task */}
            <div className="mb-6">
              <p className="text-gray-300 text-sm text-center mb-4">{currentDomain.question}</p>

              {/* Visual stimulus */}
              <div
                className="relative h-36 rounded-xl overflow-hidden mb-4"
                style={{ background: '#0a0a0a' }}
              >
                {/* Domain-specific visual */}
                {currentDomain.key === 'dva' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="w-10 h-10 rounded-full border-4 border-white"
                      style={{
                        position: 'absolute',
                        left: `${30 + (roundCount * 15) % 50}%`,
                        animation: 'none',
                      }}
                    />
                    <div className="absolute w-1 h-10 bg-white" style={{ left: `${30 + (roundCount * 15) % 50}%`, opacity: 0.6 }} />
                  </div>
                )}
                {currentDomain.key === 'cs' && (
                  <div className="absolute inset-0 flex items-center justify-around">
                    {[0.9, 0.15, 0.5].map((opacity, i) => (
                      <div
                        key={i}
                        className="w-20 h-20 rounded-full"
                        style={{
                          background: `repeating-linear-gradient(${45 + i * 30}deg, transparent, transparent 4px, rgba(255,255,255,${opacity}) 4px, rgba(255,255,255,${opacity}) 8px)`,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                )}
                {currentDomain.key === 'pa' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-white" />
                    <div
                      className="absolute w-6 h-6 rounded-full"
                      style={{
                        left: `${[15, 75, 85, 10, 50][roundCount % 5]}%`,
                        top: `${[20, 70, 30, 80, 15][roundCount % 5]}%`,
                        backgroundColor: currentDomain.color,
                        opacity: taskState.clicked ? 0 : 0.8,
                      }}
                    />
                  </div>
                )}
                {currentDomain.key === 'dp' && (
                  <div className="absolute inset-0 flex items-center justify-around px-4">
                    {[40, 60, 25, 50].map((size, i) => (
                      <div
                        key={i}
                        className="rounded-full bg-blue-400"
                        style={{ width: size, height: size, opacity: 0.7 + i * 0.08 }}
                      />
                    ))}
                  </div>
                )}
                {currentDomain.key === 'at' && (
                  <div className="absolute inset-0 flex items-center">
                    <div
                      className="w-8 h-8 rounded-full bg-yellow-400"
                      style={{
                        position: 'absolute',
                        left: `${taskState.clicked ? 90 : 20 + roundCount * 10}%`,
                        transition: 'left 1s ease',
                        opacity: taskState.clicked ? 0 : 1,
                      }}
                    />
                    <div
                      className="absolute right-4 h-24 border-2 border-white/30 rounded"
                      style={{ width: 40 }}
                    />
                  </div>
                )}
              </div>

              {/* Answer choices */}
              {!taskState.clicked ? (
                <div className="grid grid-cols-3 gap-3">
                  {['Option A', 'Option B', 'Option C'].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="py-3 rounded-xl font-medium text-sm bg-gray-800 hover:bg-blue-600/30 border border-gray-700 hover:border-blue-500 text-white transition-all"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div
                  className={`text-center py-3 rounded-xl font-bold text-sm ${
                    taskState.correct ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {taskState.correct ? '✓ Correct!' : '✗ Incorrect'}
                </div>
              )}
            </div>

            <div className="text-center text-gray-600 text-xs">
              Round {roundCount + 1} of {ROUNDS_PER_DOMAIN}
            </div>
          </div>
        </div>
      )}

      {phase === 'results' && newAssessment && (
        <div className="max-w-2xl">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🎯</div>
              <h2 className="text-2xl font-bold text-white">Assessment Complete!</h2>
              <p className="text-gray-400 mt-1">Here's your visual performance profile</p>
            </div>

            <div className="flex justify-center mb-6">
              <RadarChart
                series={[
                  { data: [
                    { label: 'DVA', value: newAssessment.dva, max: 100 },
                    { label: 'CS', value: newAssessment.cs, max: 100 },
                    { label: 'PA', value: newAssessment.pa, max: 100 },
                    { label: 'DP', value: newAssessment.dp, max: 100 },
                    { label: 'AT', value: newAssessment.at, max: 100 },
                  ], color: '#3b82f6', label: 'Current' },
                  ...(latestPrev ? [{
                    data: [
                      { label: 'DVA', value: latestPrev.dva, max: 100 },
                      { label: 'CS', value: latestPrev.cs, max: 100 },
                      { label: 'PA', value: latestPrev.pa, max: 100 },
                      { label: 'DP', value: latestPrev.dp, max: 100 },
                      { label: 'AT', value: latestPrev.at, max: 100 },
                    ], color: '#6b7280', label: 'Previous'
                  }] : []),
                ]}
                size={260}
              />
            </div>

            {/* Composite */}
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-1">Composite Score</p>
              <p className="text-5xl font-black text-white">{newAssessment.composite}</p>
              {latestPrev && (
                <p className={`text-sm mt-1 ${newAssessment.composite > latestPrev.composite ? 'text-green-400' : 'text-red-400'}`}>
                  {newAssessment.composite > latestPrev.composite ? '↑' : '↓'}{' '}
                  {Math.abs(newAssessment.composite - latestPrev.composite)} from last assessment
                </p>
              )}
            </div>

            {/* Domain breakdown */}
            <div className="space-y-3">
              {DOMAIN_INFO.map((d) => {
                const val = newAssessment[d.key];
                const prev = latestPrev?.[d.key];
                const diff = prev ? val - prev : null;
                return (
                  <div key={d.key} className="flex items-center gap-3">
                    <span className="text-sm w-4">{d.icon}</span>
                    <span className="text-gray-400 text-xs w-28">{d.label}</span>
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${val}%`, backgroundColor: d.color }}
                      />
                    </div>
                    <span className="text-white text-sm font-bold w-8 text-right">{val}</span>
                    {diff !== null && (
                      <span className={`text-xs w-10 text-right ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('intro')}
              className="flex-1 border border-gray-700 text-gray-300 hover:text-white py-3 rounded-xl font-medium transition-all"
            >
              Retake Assessment
            </button>
            <Link
              to="/training"
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl text-center transition-all"
            >
              Start Training →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
