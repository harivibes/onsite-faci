-- =====================================================================
-- 0005 — Octopus Stream (Stream 4): quantitative facilitator observation
--
-- Adds:
--   1. octopus_observations table — one row per (visitor, gallery, date)
--   2. next_visitor_label(date) helper — generates 'visitor1', 'visitor2'…
--   3. app_settings table — global toggles (e.g., bridge visibility)
--
-- Paste into Supabase SQL Editor and Run. Idempotent — safe to re-run.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Octopus observations table
-- ---------------------------------------------------------------------
create table if not exists public.octopus_observations (
  id                       uuid primary key default uuid_generate_v4(),
  facilitator_id           uuid not null references public.users(id) on delete restrict,
  gallery_id               uuid not null references public.galleries(id) on delete restrict,
  visitor_label            text not null,
  visit_date               date not null default current_date,
  engagement               int  not null check (engagement between 0 and 10),
  curiosity                int  not null check (curiosity between 0 and 10),
  social                   int  not null check (social between 0 and 10),
  unsolicited_contribution boolean not null,
  open_note                text,
  session_id               uuid references public.sessions(id) on delete set null,
  created_at               timestamptz not null default now(),
  -- One observation per (visitor, gallery, date). Per the brief.
  constraint octopus_unique_visit unique (visitor_label, gallery_id, visit_date)
);

create index if not exists octopus_gallery_idx
  on public.octopus_observations(gallery_id, created_at desc);

create index if not exists octopus_facilitator_idx
  on public.octopus_observations(facilitator_id, created_at desc);

create index if not exists octopus_visit_idx
  on public.octopus_observations(visit_date desc, gallery_id);

-- v0 has no RLS (mock-auth-era). Real OAuth is now in place; flipping RLS
-- on is a follow-up — for now anon role can read/write to keep dev parity
-- with the rest of the app.
alter table public.octopus_observations disable row level security;

-- ---------------------------------------------------------------------
-- 2. next_visitor_label(date) — generates 'visitor1', 'visitor2'…
-- Counts distinct visitor_labels for the date across all galleries
-- (visitor1 in Physics is the same visitor1 if seen in Biology).
-- ---------------------------------------------------------------------
create or replace function public.next_visitor_label(p_visit_date date)
returns text
language plpgsql
as $$
declare
  next_num int;
begin
  select coalesce(
    max(
      case
        when visitor_label ~ '^visitor[0-9]+$'
          then substring(visitor_label from 8)::int
        else 0
      end
    ),
    0
  ) + 1
  into next_num
  from (
    select distinct visitor_label
    from public.octopus_observations
    where visit_date = p_visit_date
  ) v;

  return 'visitor' || next_num;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. app_settings — global toggles (e.g., bridge visibility)
-- ---------------------------------------------------------------------
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id) on delete set null
);

alter table public.app_settings disable row level security;

-- Default: Bridge is visible to facilitators
insert into public.app_settings (key, value)
values ('bridge_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- =====================================================================
-- Done. octopus_observations is live and ready to receive Stream 4 data.
-- =====================================================================
