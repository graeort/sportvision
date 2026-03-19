import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { SPORTS } from '../data/sports';
import { PageHeader } from '../components/layout/PageHeader';

export function Settings() {
  const { user, profile, setProfile, logout } = useAppStore();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saved, setSaved] = useState(false);

  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyReport: true,
    achievements: true,
    coachMessages: false,
  });

  const [reminderDays, setReminderDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri
  const [reminderTime, setReminderTime] = useState('08:00');
  const [highContrast, setHighContrast] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [exportMsg, setExportMsg] = useState(false);

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDay = (day: number) => {
    setReminderDays((d) => d.includes(day) ? d.filter((x) => x !== day) : [...d, day]);
  };

  const handleSaveProfile = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDeleteAccount = () => {
    logout();
    navigate('/');
  };

  const handleChangePassword = () => {
    if (!currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setPasswordMsg(null);
      setShowPasswordForm(false);
    }, 2000);
  };

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: { name, email, sport: profile?.primarySport, skillLevel: profile?.skillLevel },
      settings: { notifications, reminderDays, reminderTime, highContrast },
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sportvision-data.json';
    link.click();
    URL.revokeObjectURL(url);
    setExportMsg(true);
    setTimeout(() => setExportMsg(false), 2500);
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-600/20 border-2 border-blue-600 flex items-center justify-center text-2xl font-black text-blue-400">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold">{name || 'Athlete'}</p>
              <p className="text-gray-500 text-sm">{email}</p>
              {profile?.primarySport && (
                <p className="text-gray-500 text-sm">
                  {SPORTS.find((s) => s.id === profile.primarySport)?.icon}{' '}
                  {SPORTS.find((s) => s.id === profile.primarySport)?.name}
                  {profile.position && ` · ${profile.position}`}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            {profile && (
              <>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Primary Sport</label>
                  <select
                    value={profile.primarySport}
                    onChange={(e) => setProfile({ ...profile, primarySport: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    {SPORTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5 font-medium">Skill Level</label>
                  <select
                    value={profile.skillLevel}
                    onChange={(e) => setProfile({ ...profile, skillLevel: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
                  >
                    {['Recreational', 'Club / Amateur', 'Semi-Professional', 'Professional', 'Elite / National'].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleSaveProfile}
            className={`mt-4 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {saved ? '✓ Saved!' : 'Save Changes'}
          </button>
        </section>

        {/* Notifications */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Notifications</h2>
          <div className="space-y-4">
            {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => {
              const labels: Record<keyof typeof notifications, { label: string; desc: string }> = {
                dailyReminder: { label: 'Daily Training Reminder', desc: 'Remind me to train each day' },
                weeklyReport: { label: 'Weekly Progress Report', desc: 'Summary of your week\'s performance' },
                achievements: { label: 'Achievement Alerts', desc: 'Notify when you hit new milestones' },
                coachMessages: { label: 'Coach Messages', desc: 'Receive messages from your coach' },
              };
              return (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{labels[key].label}</p>
                    <p className="text-gray-500 text-xs">{labels[key].desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key] }))}
                    className={`relative w-11 h-6 rounded-full transition-all ${val ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${val ? 'right-0.5' : 'left-0.5'}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Training Reminders */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Training Schedule</h2>
          <div className="mb-4">
            <label className="block text-sm text-gray-300 mb-3 font-medium">Reminder Days</label>
            <div className="flex gap-2">
              {DAY_NAMES.map((day, i) => (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-10 h-10 rounded-full text-xs font-bold transition-all ${
                    reminderDays.includes(i)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5 font-medium">Reminder Time</label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
        </section>

        {/* Display Preferences */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Display</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">High Contrast Mode</p>
              <p className="text-gray-500 text-xs">Increase contrast for better visibility during exercises</p>
            </div>
            <button
              onClick={() => setHighContrast(!highContrast)}
              className={`relative w-11 h-6 rounded-full transition-all ${highContrast ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${highContrast ? 'right-0.5' : 'left-0.5'}`} />
            </button>
          </div>
        </section>

        {/* Account */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-bold text-lg mb-5">Account</h2>
          <div className="space-y-3">
            <button
              onClick={() => { setShowPasswordForm((v) => !v); setPasswordMsg(null); }}
              className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all"
            >
              {showPasswordForm ? 'Cancel Password Change' : 'Change Password'}
            </button>

            {showPasswordForm && (
              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Min. 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Repeat new password"
                  />
                </div>
                {passwordMsg && (
                  <p className={`text-xs font-medium ${passwordMsg.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {passwordMsg.type === 'success' ? '✓ ' : '✗ '}{passwordMsg.text}
                  </p>
                )}
                <button
                  onClick={handleChangePassword}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg text-sm transition-all"
                >
                  Update Password
                </button>
              </div>
            )}

            <button
              onClick={handleExportData}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                exportMsg
                  ? 'bg-green-600/20 border border-green-500/40 text-green-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              {exportMsg ? '✓ Data exported!' : 'Export My Data'}
            </button>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full text-left px-4 py-3 rounded-lg bg-gray-800 hover:bg-red-500/10 text-red-400 text-sm font-medium transition-all"
            >
              Sign Out
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full text-left px-4 py-3 rounded-lg border border-red-500/20 hover:border-red-500/40 text-red-500 hover:text-red-400 text-sm font-medium transition-all"
              >
                Delete Account
              </button>
            ) : (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-red-400 text-sm font-medium mb-3">
                  Are you sure? This will permanently delete all your data.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 border border-gray-700 text-gray-300 py-2 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
