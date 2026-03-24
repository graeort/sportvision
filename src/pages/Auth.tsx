import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';

interface AuthProps {
  mode: 'login' | 'register';
}

export function Auth({ mode }: AuthProps) {
  const [tab, setTab] = useState<'login' | 'register'>(mode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, initFromSupabase, onboardingComplete } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (tab === 'register' && !name) {
      setError('Please enter your name.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    if (tab === 'register') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role: 'athlete' },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      // If email confirmation is required, the session will be null
      if (!data.session) {
        setInfo('Check your email — we sent you a confirmation link. Once confirmed, sign in below.');
        setTab('login');
        setLoading(false);
        return;
      }

      // Auto-confirmed (e.g. Supabase "Confirm email" disabled)
      const user = data.user!;
      login({
        id: user.id,
        name: name || user.email?.split('@')[0] || 'Athlete',
        email: user.email!,
        role: 'athlete',
      });
      await initFromSupabase(user.id);
      setLoading(false);
      navigate('/onboarding');
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      const user = data.user;
      const meta = user.user_metadata as { name?: string; role?: string };
      login({
        id: user.id,
        name: meta?.name || user.email?.split('@')[0] || 'Athlete',
        email: user.email!,
        role: (meta?.role as 'athlete' | 'coach') || 'athlete',
      });
      await initFromSupabase(user.id);
      setLoading(false);

      if (!onboardingComplete) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    setLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success the browser redirects to /auth/callback
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl">
              SV
            </div>
            <span className="text-white font-bold text-xl">SportVision</span>
          </Link>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {/* Tabs */}
          <div className="flex bg-gray-800 rounded-lg p-1 mb-8">
            <button
              onClick={() => { setTab('login'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'login'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); setInfo(''); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                tab === 'register'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {tab === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {tab === 'login'
              ? 'Sign in to continue your vision training.'
              : 'Start training your eyes for peak performance.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-sm text-gray-300 mb-1.5 font-medium">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1.5 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-all mt-2"
            >
              {loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-800" />
            <span className="text-gray-600 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-800" />
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-lg transition-all text-sm disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <button
              onClick={() => handleOAuth('apple')}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-black font-medium py-3 rounded-lg transition-all text-sm disabled:opacity-50"
            >
              <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-43.4-150.3-109.2C74.5 716.5 55.3 614.1 55.3 515.4c0-185.5 130.3-284 262.3-284 66.8 0 122.5 44.1 164.2 44.1 39.7 0 103.7-47.3 179.6-47.3zm-87.5-156.7c34.5-40.8 60.7-97.4 60.7-154.7 0-8.4-.7-17-2.1-25.6-58.1 2.6-126.7 38.6-168.3 82.9-31.8 35.6-61.8 93.2-61.8 151.4 0 9.7 1.9 19.5 2.6 22.8 3.3.6 8.4 1.3 13.6 1.3 52 0 117.3-34.5 155.3-78.1z"/>
              </svg>
              Continue with Apple
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-6">
            {tab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setTab('register')} className="text-blue-400 hover:underline">
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setTab('login')} className="text-blue-400 hover:underline">
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
