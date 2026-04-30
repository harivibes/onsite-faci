-- =====================================================================
-- 0003 — Add IRIA role
-- IRIA (Param IRIA Lab) sees everything from the floor EXCEPT maintenance.
-- Project Octopus is a research data stream — maintenance is its own track.
-- Paste into Supabase SQL Editor and Run.
-- =====================================================================

-- 1. Replace the role check constraint to include 'iria'
alter table public.users drop constraint if exists users_role_check;

alter table public.users
  add constraint users_role_check
  check (role in (
    'admin',
    'iria',
    'curator',
    'facilitator',
    'maintenance',
    'social',
    'research'
  ));

-- 2. Seed an IRIA Lab user so you can log in and test
insert into public.users (id, email, display_name, role, status, verified_at, verified_by)
values (
  '77777777-7777-7777-7777-777777777777',
  'iria@parsec.local',
  'IRIA Lab',
  'iria',
  'verified',
  now(),
  '11111111-1111-1111-1111-111111111111'
) on conflict (id) do nothing;
