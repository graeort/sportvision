import { useAppStore } from '../store/appStore';
import { RadarChart } from '../components/charts/RadarChart';
import { LineChart } from '../components/charts/LineChart';
import { HeatmapCalendar } from '../components/charts/HeatmapCalendar';
import { PageHeader } from '../components/layout/PageHeader';

const DOMAIN_INFO = [
  { key: 'dva' as const, label: 'Dynamic Visual Acuity', icon: '👁️', color: '#3b82f6', abbr: 'DVA' },
  { key: 'cs' as const, label: 'Contrast Sensitivity', icon: '🌫️', color: '#a855f7', abbr: 'CS' },
  { key: 'pa' as const, label: 'Peripheral Awareness', icon: '👀', color: '#22c55e', abbr: 'PA' },
  { key: 'dp' as const, label: 'Depth Perception', icon: '📐', color: '#eab308', abbr: 'DP' },
  { key: 'at' as const, label: 'Anticipatory Timing', icon: '⚡', color: '#f97316', abbr: 'AT' },
];

export function Analytics() {
  const { assessments, sessions } = useAppStore();

  const latest = assessments[assessments.length - 1];
  const baseline = assessments[0];

  // Composite score over time
  const compositeHistory = assessments.map((a) => ({
    date: a.date,
    value: a.composite,
  }));

  // Session accuracy over time
  const accuracyHistory = sessions.slice(-20).map((s) => ({
    date: s.date,
    value: s.totalAccuracy,
  }));

  const totalMinutes = sessions.reduce((a, s) => a + s.duration / 60, 0);
  const avgAccuracy = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.totalAccuracy, 0) / sessions.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Analytics"
        subtitle="Track your visual performance over time"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Sessions', value: sessions.length, icon: '🎯', color: '#3b82f6' },
          { label: 'Training Minutes', value: Math.round(totalMinutes), icon: '⏱️', color: '#22c55e' },
          { label: 'Avg Accuracy', value: `${avgAccuracy}%`, icon: '🎯', color: '#f97316' },
          { label: 'Composite Score', value: latest?.composite || 0, icon: '📊', color: '#a855f7' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="text-xl mb-1">{s.icon}</div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar comparison */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Vision Profile — Current vs Baseline</h3>
          {latest ? (
            <>
              <div className="flex justify-center">
                <RadarChart
                  series={[
                    {
                      data: DOMAIN_INFO.map((d) => ({ label: d.abbr, value: latest[d.key], max: 100 })),
                      color: '#3b82f6',
                      label: 'Current',
                    },
                    ...(baseline && baseline !== latest
                      ? [{
                          data: DOMAIN_INFO.map((d) => ({ label: d.abbr, value: baseline[d.key], max: 100 })),
                          color: '#6b7280',
                          label: 'Baseline',
                        }]
                      : []),
                  ]}
                  size={260}
                />
              </div>
              {baseline && baseline !== latest && (
                <div className="mt-3 flex items-center gap-4 justify-center text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-gray-400">Current</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-500" /><span className="text-gray-400">Baseline</span></div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              Complete an assessment to see your profile
            </div>
          )}
        </div>

        {/* Composite score trend */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Composite Score Trend</h3>
          {compositeHistory.length >= 2 ? (
            <LineChart data={compositeHistory} color="#3b82f6" height={180} width={400} />
          ) : (
            <div className="flex items-center justify-center h-44 text-gray-500 text-sm">
              Complete more assessments to see trends
            </div>
          )}
        </div>
      </div>

      {/* Domain Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {DOMAIN_INFO.map((d) => {
          const current = latest?.[d.key] || 0;
          const prev = assessments.length > 1 ? assessments[assessments.length - 2][d.key] : null;
          const diff = prev !== null ? current - prev : null;

          // Mini sparkline data
          const sparkData = assessments.map((a) => ({ date: a.date, value: a[d.key] }));

          return (
            <div
              key={d.key}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
              style={{ borderTop: `2px solid ${d.color}` }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{d.icon}</span>
                {diff !== null && (
                  <span className={`text-xs font-bold ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {diff > 0 ? `+${diff}` : diff}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black" style={{ color: d.color }}>{current || '—'}</p>
              <p className="text-gray-500 text-xs">{d.abbr}</p>
              {sparkData.length >= 2 && (
                <div className="mt-2">
                  <LineChart data={sparkData} color={d.color} height={40} width={150} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Session accuracy trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Session Accuracy (Last 20)</h3>
          {accuracyHistory.length >= 2 ? (
            <LineChart data={accuracyHistory} color="#22c55e" height={160} width={400} />
          ) : (
            <div className="flex items-center justify-center h-36 text-gray-500 text-sm">
              Complete more sessions to see trends
            </div>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Activity Heatmap</h3>
          <HeatmapCalendar sessions={sessions} weeks={16} />
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              {['rgba(255,255,255,0.05)', '#1d4ed8', '#2563eb', '#3b82f6'].map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Session breakdown */}
      {sessions.length > 0 && (
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Recent Session Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Date', 'Sport', 'Exercises', 'Accuracy', 'Duration'].map((h) => (
                    <th key={h} className="text-gray-500 font-medium text-left py-2 pr-4 text-xs uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sessions].reverse().slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-300 text-xs">
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-300 text-xs capitalize">{s.sport}</td>
                    <td className="py-2.5 pr-4 text-gray-300">{s.exercisesCompleted}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className="text-xs font-bold"
                        style={{
                          color: s.totalAccuracy >= 75 ? '#22c55e' : s.totalAccuracy >= 50 ? '#f97316' : '#ef4444',
                        }}
                      >
                        {s.totalAccuracy}%
                      </span>
                    </td>
                    <td className="py-2.5 text-gray-400 text-xs">{Math.round(s.duration / 60)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
