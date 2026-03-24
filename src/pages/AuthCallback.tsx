import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

/**
 * Handles the OAuth redirect after Google / Apple sign-in.
 * Supabase JS v2 automatically exchanges the `code` query param for a session
 * when `getSession()` is called — which AuthListener in App.tsx does on mount.
 * This page simply waits for `user` to be set in the store, then navigates.
 */
export function AuthCallback() {
  const user = useAppStore((s) => s.user);
  const authInitialized = useAppStore((s) => s.authInitialized);
  const onboardingComplete = useAppStore((s) => s.onboardingComplete);
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  // Navigate once auth is resolved
  useEffect(() => {
    if (!authInitialized) return;
    if (user) {
      navigate(onboardingComplete ? '/dashboard' : '/onboarding', { replace: true });
    } else {
      // Auth initialized but no user — something went wrong
      setTimedOut(true);
    }
  }, [authInitialized, user, onboardingComplete, navigate]);

  // Failsafe: if still no user after 8s, show error
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (timedOut) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-white font-semibold mb-2">Sign-in could not be completed</p>
          <p className="text-gray-400 text-sm mb-6">
            The OAuth provider may not be enabled yet, or the redirect URL is not whitelisted in Supabase.
          </p>
          <Link
            to="/login"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-2.5 rounded-lg text-sm"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Completing sign-in…</p>
      </div>
    </div>
  );
}
