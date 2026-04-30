-- =====================================================================
-- 0004 — Real Google OAuth
-- Links public.users to Supabase auth.users via a nullable auth_id column.
-- Existing seeded users keep their UUIDs; the first time a person signs in
-- with Google whose email matches a seeded user, the app "claims" that
-- record by setting its auth_id to the auth user's id.
--
-- Paste into Supabase SQL Editor and Run.
-- =====================================================================

-- 1. auth_id column on public.users
alter table public.users
  add column if not exists auth_id uuid unique
    references auth.users(id) on delete set null;

create index if not exists users_auth_id_idx on public.users(auth_id);

-- 2. AFTER your first Google sign-in, run this manually to make yourself
--    admin. Replace the email with the Google address you signed in with.
--
-- update public.users
--   set role = 'admin', status = 'verified', verified_at = now()
--   where email = 'YOUR-GOOGLE-EMAIL@gmail.com';
--
-- (Or, claim the seeded admin record by updating its email FIRST so the
-- app links them automatically:
--
-- update public.users
--   set email = 'YOUR-GOOGLE-EMAIL@gmail.com'
--   where id = '11111111-1111-1111-1111-111111111111';
--
-- — then sign in with Google. The seeded admin record gets claimed.)
