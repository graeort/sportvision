-- ============================================================
--  Migration 002 – Fix profile auto-creation for OAuth users
--  (Google sends full_name, Apple sends full_name or name)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',   -- Google / Apple OAuth
      new.raw_user_meta_data->>'name',        -- email signup
      split_part(new.email, '@', 1)           -- fallback
    ),
    coalesce(new.email, new.raw_user_meta_data->>'email', ''),
    coalesce(new.raw_user_meta_data->>'role', 'athlete')
  )
  on conflict (id) do update set
    name  = excluded.name,
    email = excluded.email;
  return new;
end;
$$;
