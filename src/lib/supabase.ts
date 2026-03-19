import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[SportVision] Supabase env vars missing. Running in offline/demo mode.\n' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ─── Row types matching the DB schema ────────────────────────────────────────

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: 'athlete' | 'coach';
  dob: string | null;
  gender: string | null;
  dominant_eye: string | null;
  training_freq: number | null;
  skill_level: string | null;
  primary_sport: string | null;
  position: string | null;
  secondary_sports: string[] | null;
  corrective_lenses: boolean | null;
  known_conditions: string | null;
  onboarding_complete: boolean;
  created_at: string;
}

export interface AssessmentRow {
  id: string;
  user_id: string;
  dva: number;
  cs: number;
  pa: number;
  dp: number;
  at_score: number;
  composite: number;
  date: string;
}

export interface SessionRow {
  id: string;
  user_id: string;
  date: string;
  sport: string;
  exercises_completed: number;
  total_accuracy: number;
  duration: number;
}
