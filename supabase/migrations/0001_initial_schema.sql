-- =====================================================================
-- OCTOPUS FLOOR — Initial schema (v0, mock auth)
-- Paste this entire file into Supabase SQL Editor and Run.
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =====================================================================
-- USERS
-- =====================================================================
-- v0 has no real auth; we treat this as the source of truth.
-- When Google OAuth is added, we'll link auth.users.id ↔ public.users.id
-- and turn on RLS.
-- =====================================================================
create table if not exists public.users (
  id              uuid primary key default uuid_generate_v4(),
  email           text unique not null,
  display_name    text not null,
  profile_photo   text,
  age             int,
  phone           text,
  languages       text[] default '{}',
  role            text not null check (role in ('admin','curator','facilitator','maintenance','social','research')),
  status          text not null default 'pending' check (status in ('pending','verified','rejected','suspended')),
  verified_at     timestamptz,
  verified_by     uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- =====================================================================
-- GALLERIES
-- =====================================================================
create table if not exists public.galleries (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  cover_image     text,
  active          boolean not null default true,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

-- =====================================================================
-- EXHIBITS
-- =====================================================================
create table if not exists public.exhibits (
  id              uuid primary key default uuid_generate_v4(),
  gallery_id      uuid not null references public.galleries(id) on delete cascade,
  name            text not null,
  image_url       text,
  description     text,
  active          boolean not null default true,
  created_by      uuid references public.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists exhibits_gallery_idx on public.exhibits(gallery_id);

-- =====================================================================
-- CURATOR ASSIGNMENTS (curator ↔ gallery)
-- =====================================================================
create table if not exists public.curator_assignments (
  curator_id      uuid not null references public.users(id) on delete cascade,
  gallery_id      uuid not null references public.galleries(id) on delete cascade,
  assigned_by     uuid references public.users(id) on delete set null,
  assigned_at     timestamptz not null default now(),
  primary key (curator_id, gallery_id)
);

-- =====================================================================
-- SESSIONS (visitor sessions, for Problem-1 cross-stream join later)
-- session_id on observations is nullable for v0
-- =====================================================================
create table if not exists public.sessions (
  id              uuid primary key default uuid_generate_v4(),
  short_code      text unique,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  notes           text
);

-- =====================================================================
-- OBSERVATIONS — the core entries facilitators log
-- =====================================================================
create table if not exists public.observations (
  id                  uuid primary key default uuid_generate_v4(),
  facilitator_id      uuid not null references public.users(id) on delete restrict,
  exhibit_id          uuid not null references public.exhibits(id) on delete restrict,
  gallery_id          uuid not null references public.galleries(id) on delete restrict,
  session_id          uuid references public.sessions(id) on delete set null,
  category            text not null check (category in ('question','suggestion','appreciation','reframing','maintenance','research')),
  sub_type            text,
  fields              jsonb not null default '{}'::jsonb,
  free_text           text,
  photo_url           text,
  status              text not null default 'new' check (status in ('new','acknowledged','in_progress','resolved','dismissed')),
  status_updated_at   timestamptz,
  status_updated_by   uuid references public.users(id) on delete set null,
  created_at          timestamptz not null default now()
);

create index if not exists observations_gallery_idx     on public.observations(gallery_id, created_at desc);
create index if not exists observations_category_idx    on public.observations(category, created_at desc);
create index if not exists observations_facilitator_idx on public.observations(facilitator_id, created_at desc);
create index if not exists observations_session_idx     on public.observations(session_id);
create index if not exists observations_status_idx      on public.observations(status);

-- =====================================================================
-- REPLIES (curator ↔ facilitator threading)
-- =====================================================================
create table if not exists public.replies (
  id              uuid primary key default uuid_generate_v4(),
  observation_id  uuid not null references public.observations(id) on delete cascade,
  author_id       uuid not null references public.users(id) on delete restrict,
  body            text not null,
  attachment_url  text,
  is_internal     boolean not null default false,
  created_at      timestamptz not null default now()
);

create index if not exists replies_observation_idx on public.replies(observation_id, created_at);

-- =====================================================================
-- READ RECEIPTS (for unread badges)
-- =====================================================================
create table if not exists public.read_receipts (
  user_id         uuid not null references public.users(id) on delete cascade,
  observation_id  uuid not null references public.observations(id) on delete cascade,
  last_read_at    timestamptz not null default now(),
  primary key (user_id, observation_id)
);

-- =====================================================================
-- STORAGE BUCKETS
-- =====================================================================
insert into storage.buckets (id, name, public)
  values ('exhibit-images','exhibit-images', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('observation-photos','observation-photos', true)
  on conflict (id) do nothing;

-- Open public read on these buckets for v0 (we'll lock down later)
do $$
begin
  -- exhibit-images
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='exhibit_images_public_read'
  ) then
    create policy exhibit_images_public_read on storage.objects
      for select using (bucket_id = 'exhibit-images');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='exhibit_images_anon_write'
  ) then
    create policy exhibit_images_anon_write on storage.objects
      for insert with check (bucket_id = 'exhibit-images');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='exhibit_images_anon_update'
  ) then
    create policy exhibit_images_anon_update on storage.objects
      for update using (bucket_id = 'exhibit-images');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='exhibit_images_anon_delete'
  ) then
    create policy exhibit_images_anon_delete on storage.objects
      for delete using (bucket_id = 'exhibit-images');
  end if;

  -- observation-photos
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='observation_photos_public_read'
  ) then
    create policy observation_photos_public_read on storage.objects
      for select using (bucket_id = 'observation-photos');
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='observation_photos_anon_write'
  ) then
    create policy observation_photos_anon_write on storage.objects
      for insert with check (bucket_id = 'observation-photos');
  end if;
end $$;

-- =====================================================================
-- RLS — DISABLED for v0 (mock auth handled in app layer)
-- =====================================================================
alter table public.users               disable row level security;
alter table public.galleries           disable row level security;
alter table public.exhibits            disable row level security;
alter table public.curator_assignments disable row level security;
alter table public.sessions            disable row level security;
alter table public.observations        disable row level security;
alter table public.replies             disable row level security;
alter table public.read_receipts       disable row level security;

-- =====================================================================
-- SEED DATA — so you can log in immediately and test the flow
-- =====================================================================

-- 1 admin
insert into public.users (id, email, display_name, role, status, verified_at)
values (
  '11111111-1111-1111-1111-111111111111',
  'admin@parsec.local',
  'Admin (Jayanagar)',
  'admin',
  'verified',
  now()
) on conflict (id) do nothing;

-- 1 facilitator (verified)
insert into public.users (id, email, display_name, role, status, age, verified_at, verified_by)
values (
  '22222222-2222-2222-2222-222222222222',
  'facilitator@parsec.local',
  'Riya (Facilitator)',
  'facilitator',
  'verified',
  24,
  now(),
  '11111111-1111-1111-1111-111111111111'
) on conflict (id) do nothing;

-- 1 facilitator (pending — to test the verify flow)
insert into public.users (id, email, display_name, role, status, age)
values (
  '33333333-3333-3333-3333-333333333333',
  'newbie@parsec.local',
  'Arjun (Pending)',
  'facilitator',
  'pending',
  22
) on conflict (id) do nothing;

-- 1 curator
insert into public.users (id, email, display_name, role, status, verified_at, verified_by)
values (
  '44444444-4444-4444-4444-444444444444',
  'curator@parsec.local',
  'Dr. Mehta (Curator)',
  'curator',
  'verified',
  now(),
  '11111111-1111-1111-1111-111111111111'
) on conflict (id) do nothing;

-- 1 maintenance
insert into public.users (id, email, display_name, role, status, verified_at, verified_by)
values (
  '55555555-5555-5555-5555-555555555555',
  'maintenance@parsec.local',
  'Maintenance Team',
  'maintenance',
  'verified',
  now(),
  '11111111-1111-1111-1111-111111111111'
) on conflict (id) do nothing;

-- 1 social media
insert into public.users (id, email, display_name, role, status, verified_at, verified_by)
values (
  '66666666-6666-6666-6666-666666666666',
  'social@parsec.local',
  'Social Media Team',
  'social',
  'verified',
  now(),
  '11111111-1111-1111-1111-111111111111'
) on conflict (id) do nothing;

-- Galleries
insert into public.galleries (id, name, description, created_by)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Physics Gallery', 'Mechanics, optics, electricity, magnetism', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Biology Gallery', 'Living systems and ecosystems', '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

-- Exhibits
insert into public.exhibits (id, gallery_id, name, description, created_by)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Spin Exhibit', 'Conservation of angular momentum demonstration', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pendulum',     'Foucault-style pendulum',                          '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Optics Bench', 'Refraction, reflection, lenses',                   '11111111-1111-1111-1111-111111111111'),
  ('dddddddd-dddd-dddd-dddd-dddddddddd01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'DNA Model',    'Large-scale DNA double helix',                     '11111111-1111-1111-1111-111111111111')
on conflict (id) do nothing;

-- Assign the curator to Physics Gallery
insert into public.curator_assignments (curator_id, gallery_id, assigned_by)
values ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111')
on conflict do nothing;

-- =====================================================================
-- Done. You should now be able to log in as any of the seeded users
-- via the mock-login picker in the app.
-- =====================================================================
