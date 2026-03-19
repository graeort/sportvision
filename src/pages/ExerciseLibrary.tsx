import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EXERCISES } from '../data/exercises';
import type { SkillDomain, DifficultyTier } from '../data/exercises';
import { SPORTS } from '../data/sports';
import { PageHeader } from '../components/layout/PageHeader';
import { useAppStore } from '../store/appStore';

const DOMAIN_META: Record<SkillDomain, { label: string; color: string; bg: string }> = {
  dva: { label: 'Dynamic Visual Acuity', color: '#3b82f6', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  cs: { label: 'Contrast Sensitivity', color: '#a855f7', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  pa: { label: 'Peripheral Awareness', color: '#22c55e', bg: 'bg-green-500/15 text-green-400 border-green-500/30' },
  dp: { label: 'Depth Perception', color: '#eab308', bg: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  at: { label: 'Anticipatory Timing', color: '#f97316', bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  gaze: { label: 'Gaze Control', color: '#ef4444', bg: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

const DIFFICULTY_META: Record<DifficultyTier, { label: string; color: string }> = {
  foundation: { label: 'Foundation', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  development: { label: 'Development', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  elite: { label: 'Elite', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

const ALL_DOMAINS: (SkillDomain | 'all')[] = ['all', 'dva', 'cs', 'pa', 'dp', 'at', 'gaze'];

export function ExerciseLibrary() {
  const navigate = useNavigate();
  const { startSession } = useAppStore();
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyTier | 'all'>('all');

  const filtered = EXERCISES.filter((e) => {
    if (selectedSport !== 'all' && !e.sports.includes(selectedSport)) return false;
    if (selectedDomain !== 'all' && e.domain !== selectedDomain) return false;
    if (selectedDifficulty !== 'all' && e.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const handleStart = (exerciseId: string) => {
    startSession([exerciseId]);
    navigate('/training');
  };

  return (
    <div>
      <PageHeader
        title="Exercise Library"
        subtitle={`${EXERCISES.length} exercises across 6 vision domains`}
      />

      {/* Filters */}
      <div className="space-y-4 mb-8">
        {/* Sport Filter */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-400 text-sm font-medium">Sport:</span>
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Sports</option>
            {SPORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.icon} {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Domain Tabs */}
        <div className="flex gap-2 flex-wrap">
          {ALL_DOMAINS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedDomain === d
                  ? d === 'all'
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : `border text-white ${DOMAIN_META[d as SkillDomain].bg}`
                  : 'border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              {d === 'all' ? 'All Domains' : DOMAIN_META[d as SkillDomain].label.split(' ').map(w => w[0]).join('')}
            </button>
          ))}
        </div>

        {/* Difficulty chips */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'foundation', 'development', 'elite'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedDifficulty === d
                  ? d === 'all'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : DIFFICULTY_META[d].color + ' border'
                  : 'border-gray-700 text-gray-500 hover:border-gray-600'
              }`}
            >
              {d === 'all' ? 'All Levels' : DIFFICULTY_META[d].label}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-sm">{filtered.length} exercises found</p>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((ex) => {
          const dm = DOMAIN_META[ex.domain];
          const diff = DIFFICULTY_META[ex.difficulty];
          return (
            <div
              key={ex.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col hover:border-gray-700 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${dm.bg} mb-2`}>
                    {ex.domain.toUpperCase()}
                  </span>
                  <h3 className="text-white font-bold text-base group-hover:text-blue-300 transition-colors">
                    {ex.title}
                  </h3>
                </div>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${diff.color}`}>
                  {diff.label}
                </span>
              </div>

              <p className="text-gray-400 text-sm leading-relaxed flex-1 mb-4">
                {ex.description}
              </p>

              {/* Evidence */}
              <p className="text-gray-600 text-xs italic mb-4 leading-relaxed">
                "{ex.evidence}"
              </p>

              {/* Footer */}
              <div className="flex items-center gap-3">
                {/* Sport icons */}
                <div className="flex gap-1 flex-1">
                  {ex.sports.slice(0, 4).map((sid) => {
                    const sp = SPORTS.find((s) => s.id === sid);
                    return sp ? (
                      <span key={sid} className="text-sm" title={sp.name}>
                        {sp.icon}
                      </span>
                    ) : null;
                  })}
                  {ex.sports.length > 4 && (
                    <span className="text-gray-600 text-xs">+{ex.sports.length - 4}</span>
                  )}
                </div>

                <span className="text-gray-500 text-xs">⏱ {Math.round(ex.durationSecs / 60)}m</span>

                <button
                  onClick={() => handleStart(ex.id)}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shrink-0"
                >
                  Start →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-lg">No exercises match your filters.</p>
          <button
            onClick={() => { setSelectedSport('all'); setSelectedDomain('all'); setSelectedDifficulty('all'); }}
            className="mt-4 text-blue-400 hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
