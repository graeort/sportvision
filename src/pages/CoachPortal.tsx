import { useState } from 'react';
import { RadarChart } from '../components/charts/RadarChart';
import { PageHeader } from '../components/layout/PageHeader';

interface AthleteRow {
  id: string;
  name: string;
  sport: string;
  sportIcon: string;
  position: string;
  lastActive: string;
  composite: number;
  dva: number;
  cs: number;
  pa: number;
  dp: number;
  at: number;
  trend: 'up' | 'down' | 'stable';
  sessionsWeek: number;
}

const MOCK_ATHLETES: AthleteRow[] = [
  { id: '1', name: 'Alex Chen', sport: 'Tennis', sportIcon: '🎾', position: 'Baseline Player', lastActive: '2026-03-16', composite: 78, dva: 82, cs: 75, pa: 76, dp: 79, at: 80, trend: 'up', sessionsWeek: 5 },
  { id: '2', name: 'Maya Rodriguez', sport: 'Soccer', sportIcon: '⚽', position: 'Midfielder', lastActive: '2026-03-17', composite: 71, dva: 68, cs: 70, pa: 80, dp: 65, at: 74, trend: 'up', sessionsWeek: 4 },
  { id: '3', name: 'Jake Thompson', sport: 'Rugby', sportIcon: '🏉', position: 'Wing / Fullback', lastActive: '2026-03-15', composite: 65, dva: 62, cs: 58, pa: 72, dp: 64, at: 70, trend: 'stable', sessionsWeek: 3 },
  { id: '4', name: 'Sophie Williams', sport: 'Field Hockey', sportIcon: '🏑', position: 'Striker', lastActive: '2026-03-14', composite: 83, dva: 85, cs: 82, pa: 80, dp: 84, at: 85, trend: 'up', sessionsWeek: 6 },
  { id: '5', name: 'Liam Patel', sport: 'Cricket', sportIcon: '🏏', position: 'Opener', lastActive: '2026-03-12', composite: 59, dva: 64, cs: 55, pa: 52, dp: 60, at: 66, trend: 'down', sessionsWeek: 2 },
  { id: '6', name: 'Emma Johnson', sport: 'Basketball', sportIcon: '🏀', position: 'Point Guard', lastActive: '2026-03-17', composite: 74, dva: 70, cs: 68, pa: 82, dp: 71, at: 77, trend: 'up', sessionsWeek: 5 },
  { id: '7', name: 'Noah Kim', sport: 'Tennis', sportIcon: '🎾', position: 'Net Rusher', lastActive: '2026-03-16', composite: 67, dva: 70, cs: 65, pa: 63, dp: 68, at: 72, trend: 'stable', sessionsWeek: 3 },
  { id: '8', name: 'Isla Brown', sport: 'Soccer', sportIcon: '⚽', position: 'Goalkeeper', lastActive: '2026-03-13', composite: 56, dva: 55, cs: 50, pa: 65, dp: 54, at: 58, trend: 'down', sessionsWeek: 1 },
];

const DOMAIN_COLORS: Record<string, string> = {
  dva: '#3b82f6', cs: '#a855f7', pa: '#22c55e', dp: '#eab308', at: '#f97316',
};

export function CoachPortal() {
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'composite' | 'lastActive'>('composite');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedProgramme, setSelectedProgramme] = useState<string>('');
  const [assignToast, setAssignToast] = useState<string | null>(null);

  const sorted = [...MOCK_ATHLETES].sort((a, b) => {
    if (sortKey === 'name') return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortKey === 'lastActive') return sortDir === 'asc' ? a.lastActive.localeCompare(b.lastActive) : b.lastActive.localeCompare(a.lastActive);
    return sortDir === 'asc' ? a.composite - b.composite : b.composite - a.composite;
  });

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedAthletes((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Sport', 'Position', 'Last Active', 'Composite', 'DVA', 'CS', 'PA', 'DP', 'AT', 'Sessions/Week'];
    const rows = MOCK_ATHLETES.map((a) =>
      [a.name, a.sport, a.position, a.lastActive, a.composite, a.dva, a.cs, a.pa, a.dp, a.at, a.sessionsWeek].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sportvision-squad.csv';
    link.click();
  };

  const compareAthletes = MOCK_ATHLETES.filter((a) => selectedAthletes.includes(a.id));
  const radarColors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7'];

  return (
    <div>
      <PageHeader
        title="Coach Portal"
        subtitle="Monitor squad performance and assign programmes"
      />

      {/* Assignment Toast */}
      {assignToast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-pulse">
          {assignToast}
        </div>
      )}

      {/* Squad Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Athletes', value: MOCK_ATHLETES.length, color: '#3b82f6' },
          { label: 'Avg Composite', value: Math.round(MOCK_ATHLETES.reduce((a, x) => a + x.composite, 0) / MOCK_ATHLETES.length), color: '#22c55e' },
          { label: 'Active This Week', value: MOCK_ATHLETES.filter((a) => a.sessionsWeek > 0).length, color: '#f97316' },
          { label: 'Needs Attention', value: MOCK_ATHLETES.filter((a) => a.trend === 'down').length, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-5">
        <button
          onClick={() => setShowAssignModal(true)}
          disabled={selectedAthletes.length === 0}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-sm px-4 py-2 rounded-lg transition-all"
        >
          Assign Programme ({selectedAthletes.length})
        </button>
        <button
          onClick={handleExportCSV}
          className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-medium text-sm px-4 py-2 rounded-lg transition-all"
        >
          Export CSV
        </button>
        {selectedAthletes.length > 0 && (
          <button
            onClick={() => setSelectedAthletes([])}
            className="text-gray-500 hover:text-white text-sm px-3 py-2 transition-all"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Squad Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-800">
              <tr>
                <th className="w-10 py-3 px-4 text-left">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={selectedAthletes.length === MOCK_ATHLETES.length}
                    onChange={(e) => setSelectedAthletes(e.target.checked ? MOCK_ATHLETES.map((a) => a.id) : [])}
                  />
                </th>
                {[
                  { key: 'name', label: 'Athlete' },
                  { key: null, label: 'Sport' },
                  { key: 'lastActive', label: 'Last Active' },
                  { key: 'composite', label: 'Composite' },
                  { key: null, label: 'DVA' },
                  { key: null, label: 'CS' },
                  { key: null, label: 'PA' },
                  { key: null, label: 'DP' },
                  { key: null, label: 'AT' },
                  { key: null, label: 'Trend' },
                  { key: null, label: 'Wk Sessions' },
                ].map((h) => (
                  <th
                    key={h.label}
                    className={`text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase ${h.key ? 'cursor-pointer hover:text-white' : ''}`}
                    onClick={() => h.key && toggleSort(h.key as typeof sortKey)}
                  >
                    {h.label}
                    {h.key && sortKey === h.key && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((athlete) => (
                <tr
                  key={athlete.id}
                  className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                    selectedAthletes.includes(athlete.id) ? 'bg-blue-500/5' : ''
                  }`}
                >
                  <td className="py-3 px-4">
                    <input
                      type="checkbox"
                      className="accent-blue-500"
                      checked={selectedAthletes.includes(athlete.id)}
                      onChange={() => toggleSelect(athlete.id)}
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-xs font-bold text-blue-400">
                        {athlete.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-medium text-xs">{athlete.name}</p>
                        <p className="text-gray-600 text-xs">{athlete.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">
                    {athlete.sportIcon} {athlete.sport}
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">
                    {new Date(athlete.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="text-sm font-black"
                      style={{
                        color: athlete.composite >= 75 ? '#22c55e' : athlete.composite >= 60 ? '#f97316' : '#ef4444',
                      }}
                    >
                      {athlete.composite}
                    </span>
                  </td>
                  {(['dva', 'cs', 'pa', 'dp', 'at'] as const).map((d) => (
                    <td key={d} className="py-3 px-3 text-xs" style={{ color: DOMAIN_COLORS[d] }}>
                      {athlete[d]}
                    </td>
                  ))}
                  <td className="py-3 px-3">
                    <span
                      className={`text-sm font-bold ${
                        athlete.trend === 'up' ? 'text-green-400' :
                        athlete.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      }`}
                    >
                      {athlete.trend === 'up' ? '↑' : athlete.trend === 'down' ? '↓' : '→'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{athlete.sessionsWeek}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radar Comparison */}
      {compareAthletes.length >= 2 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-4">Athlete Comparison</h3>
          <div className="flex justify-center">
            <RadarChart
              series={compareAthletes.slice(0, 4).map((a, i) => ({
                data: [
                  { label: 'DVA', value: a.dva, max: 100 },
                  { label: 'CS', value: a.cs, max: 100 },
                  { label: 'PA', value: a.pa, max: 100 },
                  { label: 'DP', value: a.dp, max: 100 },
                  { label: 'AT', value: a.at, max: 100 },
                ],
                color: radarColors[i],
                label: a.name.split(' ')[0],
              }))}
              size={300}
            />
          </div>
          <div className="flex flex-wrap gap-4 justify-center mt-3">
            {compareAthletes.slice(0, 4).map((a, i) => (
              <div key={a.id} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: radarColors[i] }} />
                <span className="text-gray-400 text-xs">{a.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-white font-bold text-lg mb-4">Assign Programme</h3>
            <p className="text-gray-400 text-sm mb-4">
              Assigning to {selectedAthletes.length} athlete{selectedAthletes.length !== 1 ? 's' : ''}:{' '}
              {MOCK_ATHLETES.filter((a) => selectedAthletes.includes(a.id)).map((a) => a.name.split(' ')[0]).join(', ')}
            </p>

            <div className="space-y-3 mb-6">
              {['Foundation Vision Pack (4 weeks)', 'Sport-Specific Intensive (6 weeks)', 'Pre-Season Accelerator (8 weeks)', 'Custom Programme…'].map((prog) => (
                <label key={prog} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${selectedProgramme === prog ? 'bg-blue-600/20 border border-blue-500/40' : 'bg-gray-800 hover:bg-gray-700 border border-transparent'}`}>
                  <input
                    type="radio"
                    name="programme"
                    className="accent-blue-500"
                    checked={selectedProgramme === prog}
                    onChange={() => setSelectedProgramme(prog)}
                  />
                  <span className="text-gray-300 text-sm">{prog}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAssignModal(false); setSelectedProgramme(''); }}
                className="flex-1 border border-gray-700 text-gray-300 py-2.5 rounded-lg text-sm hover:border-gray-500 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!selectedProgramme}
                onClick={() => {
                  const names = MOCK_ATHLETES
                    .filter((a) => selectedAthletes.includes(a.id))
                    .map((a) => a.name.split(' ')[0])
                    .join(', ');
                  setShowAssignModal(false);
                  setSelectedAthletes([]);
                  setSelectedProgramme('');
                  setAssignToast(`✓ "${selectedProgramme}" assigned to ${names}`);
                  setTimeout(() => setAssignToast(null), 4000);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
              >
                Assign →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
