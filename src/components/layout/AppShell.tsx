import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { SPORTS } from '../../data/sports';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/training', label: 'Training', icon: '🎯' },
  { to: '/assessment', label: 'Assessment', icon: '🔬' },
  { to: '/exercises', label: 'Exercises', icon: '📚' },
  { to: '/analytics', label: 'Analytics', icon: '📈' },
  { to: '/coach', label: 'Coach Portal', icon: '👥' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, logout } = useAppStore();
  const navigate = useNavigate();

  const sport = SPORTS.find((s) => s.id === profile?.primarySport);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
            SV
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">SportVision</p>
            <p className="text-gray-500 text-xs mt-0.5">Eye Training Platform</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-800 p-4">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: sport?.color ? `${sport.color}33` : '#1e40af33', border: `2px solid ${sport?.color || '#3b82f6'}` }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name}</p>
                <p className="text-gray-500 text-xs truncate">{sport ? `${sport.icon} ${sport.name}` : user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-6xl mx-auto px-4 py-6 md:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex justify-around overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-2 py-2 text-xs transition-all shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-gray-500'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              <span className="whitespace-nowrap">{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
