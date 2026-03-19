import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { SPORTS } from '../data/sports';
import { EXERCISES } from '../data/exercises';
import { RadarChart } from '../components/charts/RadarChart';
import { HeatmapCalendar } from '../components/charts/HeatmapCalendar';
import { PageHeader } from '../components/layout/PageHeader';

const DOMAIN_COLORS: Record<string, string> = {
  dva: '#3b82f6',
  cs: '#a855f7',
  pa: '#22c55e',
  dp: '#eab308',
  at: '#f97316',
};


export function Dashboard() {
  const { user, profile, assessments, sessions } = useAppStore();
  const navigate = useNavigate();

  const sport = SPORTS.find((s) => s.id === profile?.primarySport);
  const latestAssessment = assessments[assessments.length - 1];

  // Weekly streak calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const sessionDays = new Set(
    sessions.map((s) => new Date(s.date).toISOString().slice(0, 10))
  );

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessionDays.has(d.toISOString().slice(0, 10))) {
      streak++;
    } else {
      break;
    }
  }

  const recentSessions = [...sessions].reverse().slice(0, 5);
  const avgAccuracy =
    sessions.length > 0
      ? Math.round(sessions.reduce((a, s) => a + s.totalAccuracy, 0) / sessions.length)
      : 0;

  // Recommended exercises
  const recommended = EXERCISES.filter(
    (e) => !sport || e.sports.includes(sport.id)
  ).slice(0, 4);

  const radarData = latestAssessment
    ? [
        { label: 'DVA', value: latestAssessment.dva, max: 100 },
        { label: 'CS', value: latestAssessment.cs, max: 100 },
        { label: 'PA', value: latestAssessment.pa, max: 100 },
        { label: 'DP', value: latestAssessment.dp, max: 100 },
        { label: 'AT', value: latestAssessment.at, max: 100 },
      ]
    : [];

  const compositeScore = latestAssessment?.composite || 0;
  const scoreColor =
    compositeScore >= 75 ? '#22c55e' : compositeScore >= 50 ? '#f97316' : '#ef4444';

  // Improvement from first to last assessment
  const improvement =
    assessments.length >= 2
      ? Math.round(
          ((assessments[assessments.length - 1].composite - assessments[0].composite) /
            assessments[0].composite) *
            100
        )
      : 0;

  return (
    <div>
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${user?.name?.split(' ')[0] || 'Athlete'} ${sport?.icon || '👋'}`}
        subtitle={`${sport?.name || 'SportVision'} Training Dashboard`}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: '🎯', color: 'blue' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: '📊', color: 'purple' },
          { label: 'Current Streak', value: `${streak}d`, icon: '🔥', color: 'orange' },
          { label: 'Improvement', value: `+${improvement}%`, icon: '📈', color: 'green' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-2xl font-black text-white">{stat.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Today's Session CTA */}
        <div className="lg:col-span-2">
          <div
            className="relative overflow-hidden rounded-2xl p-6 border border-blue-600/30"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(6,182,212,0.08) 100%)' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12" />
            <div className="relative">
              <p className="text-blue-400 text-sm font-medium mb-1">TODAY'S SESSION</p>
              <h2 className="text-2xl font-bold text-white mb-2">
                {recommended.length} exercises ready for you
              </h2>
              <p className="text-gray-400 text-sm mb-5">
                {recommended.map((e) => e.title).join(' • ')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/training')}
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20"
                >
                  Start Session →
                </button>
                <button
                  onClick={() => navigate('/exercises')}
                  className="border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 px-5 py-3 rounded-xl text-sm font-medium transition-all"
                >
                  Browse All
                </button>
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Weekly Activity</h3>
              <span className="text-gray-500 text-sm">{streak} day streak 🔥</span>
            </div>
            <div className="flex gap-2">
              {last7.map((d, i) => {
                const key = d.toISOString().slice(0, 10);
                const hasSession = sessionDays.has(key);
                const isToday = i === 6;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full aspect-square rounded-lg border transition-all ${
                        hasSession
                          ? 'bg-blue-600 border-blue-500'
                          : isToday
                          ? 'border-blue-500/50 border-dashed bg-blue-500/5'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                    <span className="text-gray-600 text-xs">
                      {d.toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-semibold">Vision Profile</h3>
            <div
              className="text-2xl font-black"
              style={{ color: scoreColor }}
            >
              {compositeScore}
            </div>
          </div>
          <p className="text-gray-500 text-xs mb-4">Composite score</p>
          {radarData.length > 0 ? (
            <div className="flex justify-center">
              <RadarChart
                series={[{ data: radarData, color: sport?.color || '#3b82f6', label: 'Current' }]}
                size={240}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-gray-500 text-sm mb-3">No assessment yet</p>
              <button
                onClick={() => navigate('/assessment')}
                className="text-xs bg-blue-600/20 border border-blue-600/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-600/30 transition-all"
              >
                Take Assessment →
              </button>
            </div>
          )}

          {latestAssessment && (
            <div className="mt-4 space-y-1.5">
              {Object.entries({ dva: latestAssessment.dva, cs: latestAssessment.cs, pa: latestAssessment.pa, dp: latestAssessment.dp, at: latestAssessment.at }).map(
                ([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: DOMAIN_COLORS[key] }}
                    />
                    <span className="text-gray-500 text-xs flex-1">{key.toUpperCase()}</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${val}%`, backgroundColor: DOMAIN_COLORS[key] }}
                      />
                    </div>
                    <span className="text-white text-xs w-8 text-right">{val}</span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Sessions</h3>
          {recentSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions yet. Start your first session!</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const sp = SPORTS.find((sp) => sp.id === s.sport);
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg"
                  >
                    <span className="text-xl">{sp?.icon || '🎯'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">
                        {s.exercisesCompleted} exercises completed
                      </p>
                      <p className="text-gray-500 text-xs">
                        {new Date(s.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{
                          color:
                            s.totalAccuracy >= 75
                              ? '#22c55e'
                              : s.totalAccuracy >= 50
                              ? '#f97316'
                              : '#ef4444',
                        }}
                      >
                        {s.totalAccuracy}%
                      </p>
                      <p className="text-gray-600 text-xs">accuracy</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Activity Calendar</h3>
          <HeatmapCalendar sessions={sessions} weeks={12} />
          <p className="text-gray-600 text-xs mt-3">Darker = more sessions that day</p>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
