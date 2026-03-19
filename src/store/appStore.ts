import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'athlete' | 'coach';
  avatar?: string;
}

export interface AthleteProfile {
  dob: string;
  gender: string;
  dominantEye: string;
  trainingFreq: number;
  skillLevel: string;
  primarySport: string;
  position: string;
  secondarySports: string[];
  correctiveLenses?: boolean;
  knownConditions?: string;
}

export interface AssessmentScores {
  dva: number;
  cs: number;
  pa: number;
  dp: number;
  at: number;
  composite: number;
  date: string;
}

export interface SessionRecord {
  id: string;
  date: string;
  sport: string;
  exercisesCompleted: number;
  totalAccuracy: number;
  duration: number;
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  profile: AthleteProfile | null;
  assessments: AssessmentScores[];
  sessions: SessionRecord[];
  onboardingComplete: boolean;
  currentSession: {
    exerciseIds: string[];
    currentIndex: number;
    results: Array<{ exerciseId: string; accuracy: number; reactionMs: number }>;
  } | null;

  // Auth
  login: (user: User) => void;
  logout: () => Promise<void>;

  // Profile
  setProfile: (profile: AthleteProfile) => Promise<void>;
  setOnboardingComplete: () => Promise<void>;

  // Data
  addAssessment: (scores: AssessmentScores) => Promise<void>;
  addSession: (session: SessionRecord) => void;

  // Training session (in-memory only, no DB needed)
  startSession: (exerciseIds: string[]) => void;
  submitExerciseResult: (exerciseId: string, accuracy: number, reactionMs: number) => void;
  completeSession: () => void;

  // Supabase hydration
  initFromSupabase: (userId: string) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      assessments: [],
      sessions: [],
      onboardingComplete: false,
      currentSession: null,

      // ── Auth ──────────────────────────────────────────────────────────────

      login: (user) => set({ user }),

      logout: async () => {
        await supabase.auth.signOut();
        set({
          user: null,
          profile: null,
          assessments: [],
          sessions: [],
          onboardingComplete: false,
          currentSession: null,
        });
      },

      // ── Profile ───────────────────────────────────────────────────────────

      setProfile: async (profile) => {
        set({ profile });
        const { user } = get();
        if (!user) return;

        await supabase.from('profiles').update({
          dob: profile.dob,
          gender: profile.gender,
          dominant_eye: profile.dominantEye,
          training_freq: profile.trainingFreq,
          skill_level: profile.skillLevel,
          primary_sport: profile.primarySport,
          position: profile.position,
          secondary_sports: profile.secondarySports,
          corrective_lenses: profile.correctiveLenses,
          known_conditions: profile.knownConditions,
        }).eq('id', user.id);
      },

      setOnboardingComplete: async () => {
        set({ onboardingComplete: true });
        const { user } = get();
        if (!user) return;
        await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id);
      },

      // ── Assessments ───────────────────────────────────────────────────────

      addAssessment: async (scores) => {
        set((s) => ({ assessments: [...s.assessments, scores] }));
        const { user } = get();
        if (!user) return;

        await supabase.from('assessments').insert({
          user_id: user.id,
          dva: scores.dva,
          cs: scores.cs,
          pa: scores.pa,
          dp: scores.dp,
          at_score: scores.at,
          composite: scores.composite,
          date: scores.date,
        });
      },

      // ── Sessions ──────────────────────────────────────────────────────────

      addSession: (session) => {
        set((s) => ({ sessions: [...s.sessions, session] }));
        const { user } = get();
        if (!user) return;

        // Fire-and-forget — no await needed for session saves
        supabase.from('sessions').insert({
          user_id: user.id,
          date: session.date,
          sport: session.sport,
          exercises_completed: session.exercisesCompleted,
          total_accuracy: session.totalAccuracy,
          duration: session.duration,
        }).then(({ error }) => {
          if (error) console.error('[SportVision] Failed to save session:', error.message);
        });
      },

      // ── Training session (in-memory) ──────────────────────────────────────

      startSession: (exerciseIds) =>
        set({ currentSession: { exerciseIds, currentIndex: 0, results: [] } }),

      submitExerciseResult: (exerciseId, accuracy, reactionMs) =>
        set((s) => {
          if (!s.currentSession) return {};
          return {
            currentSession: {
              ...s.currentSession,
              results: [...s.currentSession.results, { exerciseId, accuracy, reactionMs }],
              currentIndex: s.currentSession.currentIndex + 1,
            },
          };
        }),

      completeSession: () => {
        const { currentSession, profile } = get();
        if (!currentSession) return;
        const avgAccuracy =
          currentSession.results.reduce((a, r) => a + r.accuracy, 0) /
          (currentSession.results.length || 1);
        get().addSession({
          id: crypto.randomUUID(),
          date: new Date().toISOString(),
          sport: profile?.primarySport || 'general',
          exercisesCompleted: currentSession.results.length,
          totalAccuracy: Math.round(avgAccuracy),
          duration: currentSession.results.length * 90,
        });
        set({ currentSession: null });
      },

      // ── Supabase hydration ────────────────────────────────────────────────

      initFromSupabase: async (userId) => {
        // Run in parallel for speed
        const [profileRes, assessmentsRes, sessionsRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('assessments').select('*').eq('user_id', userId).order('date', { ascending: true }),
          supabase.from('sessions').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(90),
        ]);

        const updates: Partial<AppState> = {};

        if (profileRes.data) {
          const p = profileRes.data;
          updates.onboardingComplete = p.onboarding_complete;
          if (p.primary_sport) {
            updates.profile = {
              dob: p.dob || '',
              gender: p.gender || '',
              dominantEye: p.dominant_eye || '',
              trainingFreq: p.training_freq || 3,
              skillLevel: p.skill_level || '',
              primarySport: p.primary_sport || '',
              position: p.position || '',
              secondarySports: p.secondary_sports || [],
              correctiveLenses: p.corrective_lenses || false,
              knownConditions: p.known_conditions || '',
            };
          }
        }

        if (assessmentsRes.data && assessmentsRes.data.length > 0) {
          updates.assessments = assessmentsRes.data.map((a) => ({
            dva: a.dva,
            cs: a.cs,
            pa: a.pa,
            dp: a.dp,
            at: a.at_score,
            composite: a.composite,
            date: a.date,
          }));
        }

        if (sessionsRes.data && sessionsRes.data.length > 0) {
          updates.sessions = sessionsRes.data.map((s) => ({
            id: s.id,
            date: s.date,
            sport: s.sport,
            exercisesCompleted: s.exercises_completed,
            totalAccuracy: s.total_accuracy,
            duration: s.duration,
          }));
        }

        if (Object.keys(updates).length > 0) set(updates as AppState);
      },
    }),
    {
      name: 'sportvision-store',
      // Only persist the session state locally — everything else comes from Supabase
      partialize: (state) => ({
        currentSession: state.currentSession,
        onboardingComplete: state.onboardingComplete,
      }),
    }
  )
);
