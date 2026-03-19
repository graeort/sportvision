import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { EXERCISES } from '../data/exercises';
import { SPORTS } from '../data/sports';
import { ExerciseRunner } from '../components/ExerciseRunner';
import { PageHeader } from '../components/layout/PageHeader';

const DOMAIN_META: Record<string, { label: string; color: string }> = {
  dva: { label: 'Dynamic Visual Acuity', color: '#3b82f6' },
  cs: { label: 'Contrast Sensitivity', color: '#a855f7' },
  pa: { label: 'Peripheral Awareness', color: '#22c55e' },
  dp: { label: 'Depth Perception', color: '#eab308' },
  at: { label: 'Anticipatory Timing', color: '#f97316' },
  gaze: { label: 'Gaze Control', color: '#ef4444' },
};

const SESSION_STRUCTURE = [
  { label: 'Warm-up', domains: ['gaze', 'pa'], description: 'Eye mobility and peripheral priming' },
  { label: 'Primary', domains: ['dva', 'at'], description: 'Core sport-specific skill training' },
  { label: 'Challenge', domains: ['cs', 'dp'], description: 'High-difficulty contrast and depth work' },
  { label: 'Cool-down', domains: ['gaze'], description: 'Fixation stability and relaxation' },
];

export function Training() {
  const { profile, currentSession, startSession, submitExerciseResult, completeSession } = useAppStore();
  const navigate = useNavigate();

  const sport = SPORTS.find((s) => s.id === profile?.primarySport);

  // Get recommended exercises based on sport
  const recommended = EXERCISES.filter(
    (e) => !sport || e.sports.includes(sport.id)
  ).slice(0, 5);

  const sessionExercises = currentSession
    ? currentSession.exerciseIds
        .map((id) => EXERCISES.find((e) => e.id === id))
        .filter(Boolean) as typeof EXERCISES
    : [];

  const currentExercise = currentSession
    ? sessionExercises[currentSession.currentIndex]
    : null;

  const handleStartSession = () => {
    const ids = recommended.map((e) => e.id);
    startSession(ids);
  };

  const handleExerciseComplete = (accuracy: number, reactionMs: number) => {
    if (!currentSession || !currentExercise) return;
    submitExerciseResult(currentExercise.id, accuracy, reactionMs);

    // Check if all exercises done
    if (currentSession.currentIndex + 1 >= currentSession.exerciseIds.length) {
      completeSession();
      navigate('/dashboard');
    }
  };

  const handleSkip = () => {
    if (!currentSession || !currentExercise) return;
    submitExerciseResult(currentExercise.id, 0, 0);
    if (currentSession.currentIndex + 1 >= currentSession.exerciseIds.length) {
      completeSession();
      navigate('/dashboard');
    }
  };

  // Session summary view while in session
  if (currentSession && currentExercise) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm">Active Session {sport ? `— ${sport.icon} ${sport.name}` : ''}</p>
            <h1 className="text-2xl font-bold text-white">
              Exercise {currentSession.currentIndex + 1} of {currentSession.exerciseIds.length}
            </h1>
          </div>
          <button
            onClick={() => { completeSession(); navigate('/dashboard'); }}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            End Session
          </button>
        </div>

        <ExerciseRunner
          exercise={currentExercise}
          exerciseIndex={currentSession.currentIndex}
          totalExercises={currentSession.exerciseIds.length}
          onNext={handleExerciseComplete}
          onSkip={handleSkip}
        />
      </div>
    );
  }

  // Setup view
  return (
    <div>
      <PageHeader
        title={`Training ${sport ? sport.icon : '🎯'}`}
        subtitle="Build your visual edge with today's personalised session"
      />

      {/* Session Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today's session card */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Today's Session</h2>
            <span className="text-gray-500 text-sm">
              ~{Math.round(recommended.reduce((a, e) => a + e.durationSecs, 0) / 60)} min
            </span>
          </div>

          <div className="space-y-3 mb-6">
            {recommended.map((ex, i) => {
              const dm = DOMAIN_META[ex.domain];
              return (
                <div
                  key={ex.id}
                  className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: dm.color + '20', color: dm.color }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{ex.title}</p>
                    <p className="text-gray-500 text-xs">{dm.label} · {Math.round(ex.durationSecs / 60)}m</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: dm.color + '20', color: dm.color }}
                  >
                    {ex.difficulty}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleStartSession}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Start Session →
          </button>
        </div>

        {/* Session structure */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Session Structure</h3>
          <div className="space-y-3">
            {SESSION_STRUCTURE.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-xs text-blue-400 font-bold">
                    {i + 1}
                  </div>
                  {i < SESSION_STRUCTURE.length - 1 && (
                    <div className="w-px flex-1 bg-gray-800 mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <p className="text-white text-sm font-medium">{phase.label}</p>
                  <p className="text-gray-500 text-xs">{phase.description}</p>
                  <div className="flex gap-1 mt-1.5">
                    {phase.domains.map((d) => (
                      <span
                        key={d}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: DOMAIN_META[d].color + '20',
                          color: DOMAIN_META[d].color,
                        }}
                      >
                        {d.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick start specific exercises */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Quick Start — Single Exercise</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {recommended.map((ex) => {
            const dm = DOMAIN_META[ex.domain];
            return (
              <button
                key={ex.id}
                onClick={() => { startSession([ex.id]); }}
                className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-left transition-all group"
              >
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
                  style={{ backgroundColor: dm.color + '20', color: dm.color }}
                >
                  {ex.domain.toUpperCase()}
                </span>
                <p className="text-white text-sm font-medium group-hover:text-blue-300 transition-colors leading-tight">
                  {ex.title}
                </p>
                <p className="text-gray-600 text-xs mt-1">{Math.round(ex.durationSecs / 60)} min</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
