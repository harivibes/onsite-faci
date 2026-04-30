-- =====================================================================
-- 0002 — Notifications support
-- Paste into Supabase SQL Editor and Run.
-- =====================================================================

-- Track when a user last opened their inbox / cleared notifications
alter table public.users
  add column if not exists last_seen_at timestamptz not null default now();

-- Helpful index for the "what's new" queries
create index if not exists observations_created_idx
  on public.observations(created_at desc);
create index if not exists replies_created_idx
  on public.replies(created_at desc);
