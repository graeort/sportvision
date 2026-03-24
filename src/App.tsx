import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import { supabase } from './lib/supabase';
import { AppShell } from './components/layout/AppShell';
import { Landing } from './pages/Landing';
import { Auth } from './pages/Auth';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Training } from './pages/Training';
import { Assessment } from './pages/Assessment';
import { ExerciseLibrary } from './pages/ExerciseLibrary';
import { Analytics } from './pages/Analytics';
import { CoachPortal } from './pages/CoachPortal';
import { Settings } from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAppStore((s) => s.user);
  const authInitialized = useAppStore((s) => s.authInitialized);

  // Wait for the initial session check before deciding to redirect
  if (!authInitialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function AuthListener() {
  const { login, logout, initFromSupabase, setAuthInitialized } = useAppStore();

  useEffect(() => {
    // Restore session on mount (handles page refresh + OAuth callback code exchange)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const user = session.user;
        const meta = user.user_metadata as { name?: string; role?: string; full_name?: string };
        login({
          id: user.id,
          name: meta?.full_name || meta?.name || user.email?.split('@')[0] || 'Athlete',
          email: user.email!,
          role: (meta?.role as 'athlete' | 'coach') || 'athlete',
        });
        await initFromSupabase(user.id);
      }
      setAuthInitialized();
    });

    // Listen for auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user = session.user;
        const meta = user.user_metadata as { name?: string; role?: string; full_name?: string };
        login({
          id: user.id,
          name: meta?.full_name || meta?.name || user.email?.split('@')[0] || 'Athlete',
          email: user.email!,
          role: (meta?.role as 'athlete' | 'coach') || 'athlete',
        });
        await initFromSupabase(user.id);
      } else if (event === 'SIGNED_OUT') {
        logout();
      }
    });

    return () => subscription.unsubscribe();
  }, [login, logout, initFromSupabase, setAuthInitialized]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/training"
          element={
            <ProtectedRoute>
              <Training />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assessment"
          element={
            <ProtectedRoute>
              <Assessment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exercises"
          element={
            <ProtectedRoute>
              <ExerciseLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coach"
          element={
            <ProtectedRoute>
              <CoachPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
