-- ============================================================
--  SportVision – Initial Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. Profiles ──────────────────────────────────────────────
-- Extends auth.users with athlete/coach profile data
create table if not exists public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  name             text        not null,
  email            text        not null,
  role             text        not null default 'athlete',
  -- Onboarding fields
  dob              text,
  gender           text,
  dominant_eye     text,
  training_freq    integer,
  skill_level      text,
  primary_sport    text,
  position         text,
  secondary_sports text[],
  corrective_lenses boolean,
  known_conditions text,
  onboarding_complete boolean not null default false,
  created_at       timestamptz not null default now()
);

-- ── 2. Assessments ───────────────────────────────────────────
create table if not exists public.assessments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  dva        integer not null,
  cs         integer not null,
  pa         integer not null,
  dp         integer not null,
  at_score   integer not null,   -- "at" is a pg keyword, use at_score
  composite  integer not null,
  date       timestamptz not null default now()
);

create index if not exists assessments_user_id_date_idx
  on public.assessments(user_id, date desc);

-- ── 3. Training Sessions ─────────────────────────────────────
create table if not exists public.sessions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  date                 timestamptz not null default now(),
  sport                text not null,
  exercises_completed  integer not null,
  total_accuracy       integer not null,
  duration             integer not null   -- seconds
);

create index if not exists sessions_user_id_date_idx
  on public.sessions(user_id, date desc);

-- ── 4. Row Level Security ────────────────────────────────────
alter table public.profiles   enable row level security;
alter table public.assessments enable row level security;
alter table public.sessions    enable row level security;

-- Profiles: users can only read/write their own row
create policy "profiles: own read"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: own insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- Assessments: own rows only
create policy "assessments: own read"   on public.assessments for select using (auth.uid() = user_id);
create policy "assessments: own insert" on public.assessments for insert with check (auth.uid() = user_id);

-- Sessions: own rows only
create policy "sessions: own read"   on public.sessions for select using (auth.uid() = user_id);
create policy "sessions: own insert" on public.sessions for insert with check (auth.uid() = user_id);

-- ── 5. Auto-create profile on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'athlete')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
