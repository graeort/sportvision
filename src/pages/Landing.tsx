import { Link } from 'react-router-dom';
import { SPORTS } from '../data/sports';

const FEATURES = [
  { icon: '🎯', title: 'Sport-Specific', desc: 'Tailored exercises for Tennis, Soccer, Rugby, Field Hockey, Cricket & Basketball.' },
  { icon: '🤖', title: 'AI-Adaptive', desc: 'Difficulty adjusts in real-time based on your performance and progress.' },
  { icon: '🔬', title: 'Visual Assessment', desc: 'Baseline assessment across 5 vision domains with detailed scoring.' },
  { icon: '📈', title: 'Progress Analytics', desc: 'Track improvement over time with rich charts and domain breakdowns.' },
  { icon: '👥', title: 'Coach Portal', desc: 'Coaches can monitor athletes, assign programmes and compare progress.' },
  { icon: '📱', title: 'PWA Ready', desc: 'Install on any device. Train anywhere, even offline.' },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">
              SV
            </div>
            <span className="text-white font-bold text-lg">SportVision</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 text-center py-20">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-black text-3xl mb-8 shadow-2xl shadow-blue-500/30">
            SV
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Train Your Eyes.
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dominate Your Sport.
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Science-backed sports vision training for elite athletes. Improve dynamic visual acuity,
            peripheral awareness, anticipatory timing, and more — in just 15 minutes a day.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5"
            >
              Start Free Trial →
            </Link>
            <Link
              to="/login"
              className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Sport Icons */}
          <div className="mt-16 flex flex-wrap justify-center gap-6">
            {SPORTS.map((sport) => (
              <div
                key={sport.id}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800"
              >
                <span className="text-xl">{sport.icon}</span>
                <span className="text-gray-300 text-sm font-medium">{sport.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Everything You Need to See Better</h2>
            <p className="text-gray-400 text-lg">Comprehensive vision training platform built for serious athletes.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-blue-600/40 transition-all group"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-blue-400 transition-colors">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '20+', label: 'Exercises' },
            { value: '6', label: 'Sports' },
            { value: '5', label: 'Vision Domains' },
            { value: '15min', label: 'Daily Sessions' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-blue-400">{s.value}</p>
              <p className="text-gray-500 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Footer */}
      <section className="bg-gradient-to-r from-blue-900/40 to-cyan-900/20 border-t border-blue-800/30 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to train your vision?</h2>
          <p className="text-gray-400 mb-8">Join athletes already improving their visual performance with SportVision.</p>
          <Link
            to="/register"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold text-lg px-10 py-4 rounded-xl hover:from-blue-500 hover:to-cyan-400 transition-all inline-block shadow-lg shadow-blue-500/25"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-800 py-6 px-4 text-center">
        <p className="text-gray-600 text-sm">© 2026 SportVision. Built for athletes who see the game differently.</p>
      </footer>
    </div>
  );
}
