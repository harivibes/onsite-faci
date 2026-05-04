# Octopus Floor — ParSEC Jayanagar

Facilitator capture system for **Project Octopus**, the visitor-research data infrastructure of ParSEC, Param Foundation.

Live: https://param-onsite.netlify.app/

---

## What this is, in one paragraph

Facilitators on the floor of ParSEC Jayanagar see things no sensor can capture — visitor questions they couldn't answer, suggestions, appreciation moments, novel reframings, and structured session-end ratings of how each visitor engaged with a gallery. Octopus Floor is a single mobile-first PWA where facilitators log all of that in seconds, the right teams see it routed to them in-portal, and the IRIA Lab gets a clean quantitative research stream out the other end. Built on Next.js + Supabase + Tailwind, deployed on Netlify, real Google sign-in, real RBAC.

---

## Two streams, one app

After a facilitator signs in they land on a chooser with two doorways:

### 🐙 Octopus — primary research data stream

Per-visitor structured rating, captured at the end of a visit. The quantitative half of Project Octopus.

For each visitor in each gallery, exactly one row:

- **Engagement** — 0 to 10 slider (entirely passive ↔ fully immersed)
- **Curiosity** — 0 to 10 slider (none ↔ relentless)
- **Social behaviour** — 0 to 10 slider (solo throughout ↔ constantly social)
- **Unsolicited contribution** — yes / no (did they introduce an idea unprompted?)
- **Open observation note** — one sentence of free text

Visitors are auto-numbered globally per day (`visitor1`, `visitor2`…) — placeholder until RFID tags replace it. The same visitor can be seen across multiple galleries; uniqueness is enforced as one observation per (visitor, gallery, day).

**Who can see Octopus data:** IRIA Lab and Admin only.

### 🌉 Bridge — facilitator ↔ specialist team channel

In-the-moment qualitative capture. Each entry is tap-coded into one of six categories, optionally photo-attached, and routed as a thread the receiving team can reply to in-portal.

| Category | Routes to |
|---|---|
| ❓ Question I couldn't answer | Curator |
| 💡 Visitor suggestion | Curator |
| ❤️ Appreciation moment | Social media team |
| 🔄 Novel reframing | Curator |
| 🔧 Maintenance issue | Maintenance team |
| 🧠 Research observation | Research team |

**Who can see Bridge data:** Curators see all six categories across all galleries; specialist roles (social, maintenance, research) see only their tagged stream.

**Admin can toggle Bridge visibility** for facilitators. When off, facilitators see only the Octopus button on the chooser.

---

## Roles

| Role | Sees | Lands on |
|---|---|---|
| **Admin** | Everything (Bridge + Octopus + admin pages + toggles) | `/admin` |
| **IRIA Lab** | Octopus stream only | `/octopus` |
| **Curator** | All Bridge categories, all galleries | `/curator` |
| **Maintenance** | Bridge → maintenance entries only | `/curator` |
| **Social Media** | Bridge → appreciation entries only | `/curator` |
| **Research** | Bridge → research observations only | `/curator` |
| **Facilitator** | Their own logs + replies; can write to both Bridge + Octopus | `/facilitator` |

New users that sign in for the first time arrive as **pending facilitator**. An admin verifies them before they can start logging.

---

## Tech stack

- **Next.js 14** (App Router) deployed as a PWA
- **Supabase** — managed PostgreSQL + Auth (Google OAuth) + Storage
- **Tailwind CSS** with a brutalist design system (cream/navy/red/yellow palette, hard offset shadows, four real fonts via `next/font`)
- **Netlify** — auto-deploy on every push to `main`
- **GitHub** — source of truth, CI/CD via Netlify

Fonts loaded: DM Serif Display (display headings), Inter (body), Space Grotesk (alt sans), Space Mono (eyebrows + monospace details).

---

## Setup from scratch

If you're cloning this repo to a fresh laptop or a fresh deployment:

### 1. Prerequisites

- **Node.js 18+** — https://nodejs.org/
- **npm** (comes with Node)
- A free **Supabase** account — https://supabase.com
- A **Google Cloud Console** account (for OAuth)
- Optional: a **Netlify** account if you're deploying

### 2. Supabase project

1. https://supabase.com → **New project**
2. Name: `octopus-floor` (anything works). Region: **Mumbai** (closest to Jayanagar). Set a database password — you won't need it day-to-day.
3. Wait ~2 minutes to provision.
4. **SQL Editor → New query → run each migration in order** from `supabase/migrations/`:
   - `0001_initial_schema.sql` — core tables, storage buckets, seed users
   - `0002_notifications.sql` — `last_seen_at` column for the bell
   - `0003_iria_role.sql` — IRIA Lab role + role check constraint update
   - `0004_google_auth.sql` — `auth_id` link to `auth.users`
   - `0005_octopus_stream.sql` — Octopus table, `next_visitor_label` function, `app_settings` table
5. Run them all once for a fresh DB; each is idempotent and safe to re-run.

### 3. Google OAuth

1. https://console.cloud.google.com/ → create a project (e.g. `parsec-octopus-floor`)
2. **APIs & Services → OAuth consent screen** → External, fill in basics, add test users (your team's Google emails) until you publish the app
3. **APIs & Services → Credentials → Create OAuth client → Web application**
4. **Authorized redirect URIs** must include your Supabase callback URL:
   - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback` (find this in Supabase → Authentication → Providers → Google)
5. Copy the **Client ID** and **Client Secret**.
6. In Supabase → **Authentication → Providers → Google** → enable, paste Client ID + Secret, save.
7. Supabase → **Authentication → URL Configuration**:
   - **Site URL:** `https://param-onsite.netlify.app` (or your dev/prod URL)
   - **Redirect URLs:** add every URL the app will be served from + `/auth/callback`, e.g.:
     - `http://localhost:3000/auth/callback`
     - `https://param-onsite.netlify.app/auth/callback`

### 4. Local app

```bash
git clone https://github.com/harivibes/onsite-faci.git
cd onsite-faci
npm install

# env file
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-anon-key...
```

Run:

```bash
npm run dev          # localhost:3000 only
npm run dev:network  # also accessible from your LAN IP (handy for phone testing)
```

Open http://localhost:3000.

### 5. Bootstrap your admin account

After the first Google sign-in you'll arrive on `/pending`. To promote yourself to admin, run this in **Supabase → SQL Editor** (replace with your Google email):

```sql
update public.users
  set role = 'admin', status = 'verified', verified_at = now()
  where email = 'YOUR-GOOGLE-EMAIL@gmail.com';
```

Refresh the browser; you'll be routed to `/admin`.

### 6. Deploy to Netlify

Full step-by-step in **`DEPLOY.md`**. Short version:

1. Push the repo to GitHub
2. Netlify → Add new site → Import from GitHub → pick the repo
3. Build settings auto-detect from `netlify.toml`
4. Add env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy
6. Add the new Netlify URL to Supabase Redirect URLs and Google Authorized JavaScript origins

Every push to `main` auto-deploys in ~90 seconds.

---

## Project structure

```
onsite-faci/
├── package.json                ← deps + scripts (dev, dev:network, build, start)
├── next.config.mjs             ← Next.js config
├── tailwind.config.ts          ← brand colors, fonts, brutalist shadows
├── netlify.toml                ← Netlify build config
├── .env.local.example          ← template; copy to .env.local and fill in
├── DEPLOY.md                   ← full deploy walkthrough
├── README.md                   ← this file
│
├── public/
│   └── manifest.json           ← PWA manifest (installable from any browser)
│
├── supabase/
│   └── migrations/
│       ├── 0001_initial_schema.sql       ← core tables + buckets + seed
│       ├── 0002_notifications.sql        ← last_seen_at
│       ├── 0003_iria_role.sql            ← IRIA role + check constraint
│       ├── 0004_google_auth.sql          ← auth_id ↔ auth.users link
│       └── 0005_octopus_stream.sql       ← octopus_observations + app_settings
│
└── src/
    ├── app/
    │   ├── layout.tsx                    ← root layout, font loading, body bg
    │   ├── globals.css                   ← brutalist component classes
    │   ├── page.tsx                      ← root: redirect by role
    │   ├── login/page.tsx                ← "Continue with Google" button
    │   ├── auth/callback/page.tsx        ← OAuth callback handler
    │   ├── pending/page.tsx              ← "admin needs to verify you"
    │   │
    │   ├── facilitator/
    │   │   ├── page.tsx                  ← chooser: Bridge / Octopus tiles
    │   │   ├── bridge/                   ← Bridge stream (qualitative)
    │   │   │   ├── page.tsx              ← gallery picker
    │   │   │   ├── gallery/[id]/         ← exhibit picker
    │   │   │   ├── exhibit/[id]/         ← category picker
    │   │   │   ├── log/[exhibitId]/[category]/  ← log form
    │   │   │   └── my-logs/              ← my history
    │   │   ├── octopus/                  ← Octopus stream (quantitative)
    │   │   │   ├── page.tsx              ← gallery picker
    │   │   │   ├── [galleryId]/page.tsx  ← visitor picker (today's + new)
    │   │   │   └── [galleryId]/[visitorLabel]/  ← slider form
    │   │   └── (legacy redirects: gallery/, exhibit/, log/, my-logs/ all
    │   │     route to /facilitator/bridge/* — preserves old bookmarks)
    │   │
    │   ├── curator/                      ← Bridge inbox (curators + specialists)
    │   │   ├── page.tsx                  ← list with category tabs + status filters
    │   │   └── thread/[id]/page.tsx      ← single thread with reply form
    │   │
    │   ├── octopus/                      ← IRIA dashboard (Octopus only)
    │   │   ├── page.tsx                  ← list of all readings + filters + stats
    │   │   └── [id]/page.tsx             ← detail view of one reading
    │   │
    │   └── admin/
    │       ├── page.tsx                  ← admin home + Bridge visibility toggle
    │       ├── galleries/                ← galleries CRUD
    │       ├── exhibits/                 ← exhibits CRUD with image upload
    │       └── users/                    ← verify pending, assign roles
    │
    ├── components/
    │   ├── Shell.tsx                     ← header (back / brand / bell / avatar) + footer
    │   ├── AuthGuard.tsx                 ← role-based redirect, listens to auth state
    │   ├── Brand.tsx                     ← Wordmark + ArrowIcon
    │   ├── Hero.tsx                      ← page hero (eyebrow + title + subtitle)
    │   ├── PhotoCapture.tsx              ← Take photo / From gallery + preview
    │   ├── Slider.tsx                    ← brutalist 0–10 slider with anchor labels
    │   └── NotificationBell.tsx          ← bell + dropdown panel
    │
    └── lib/
        ├── supabase.ts                   ← client (PKCE off, implicit flow)
        ├── auth.ts                       ← Google sign-in, sign-out, ensureProfile
        ├── notifications.ts              ← per-role unread fetch + markAllSeen
        ├── upload.ts                     ← Supabase Storage upload + UUID helper
        └── types.ts                      ← all TS types + CATEGORY_META + ROLE_META
```

---

## Data model

| Table | Purpose |
|---|---|
| `users` | Everyone — admin / iria / curator / facilitator / maintenance / social / research. Linked to `auth.users` via `auth_id`. |
| `galleries` | Top-level groupings of exhibits |
| `exhibits` | Individual exhibits, belong to a gallery, have an image |
| `curator_assignments` | (now decorative) Many-to-many: curator ↔ gallery |
| `sessions` | Placeholder for Problem 1 session tokens — `session_id` columns are nullable everywhere until that lands |
| `observations` | Bridge stream entries. One row per logged moment, tagged by `category` |
| `replies` | Threaded responses to an observation |
| `read_receipts` | (not yet used) per-user read state per observation |
| `octopus_observations` | Octopus stream entries. One row per (visitor, gallery, day). Sliders + binary + open note |
| `app_settings` | Key/value global toggles (currently: `bridge_enabled`) |

Two helper SQL functions live in the DB:

- `next_visitor_label(date)` — returns the next `visitorN` for a given date, scanning across all galleries
- (none others yet)

Row-Level Security is **off** in v0; access is enforced in the app layer via `AuthGuard` and the role-based queries. Turning RLS on is a follow-up alongside any policy that needs to outlive the app's enforcement.

---

## Development

```bash
npm run dev          # localhost only
npm run dev:network  # bind to 0.0.0.0 — phone testing on same WiFi
npm run build        # production build (what Netlify runs)
npm run start        # serve a built app
npm run lint         # next lint
```

Hot reload works for everything client-side. Tailwind config or font changes need a restart.

### Phone testing

The simplest path is `npm run dev:network` on a network where your phone can reach your laptop directly. If you're on a network with client isolation (corporate / campus WiFi), use Tailscale or a Cloudflare Tunnel to get a stable HTTPS URL.

After Netlify is set up, the cleanest phone testing is just `https://param-onsite.netlify.app/` directly — works from any network and from anywhere in the world.

---

## What this system logs

### Octopus observation (`octopus_observations`)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `facilitator_id` | uuid | FK → users |
| `gallery_id` | uuid | FK → galleries |
| `visitor_label` | text | `visitor1`, `visitor2`, … (RFID later) |
| `visit_date` | date | day of the visit |
| `engagement` | int | 0–10 |
| `curiosity` | int | 0–10 |
| `social` | int | 0–10 |
| `unsolicited_contribution` | bool | yes/no |
| `open_note` | text | optional one-liner |
| `session_id` | uuid | nullable; reserved for Problem 1 token |
| `created_at` | timestamptz | server time |

Constraint: `unique (visitor_label, gallery_id, visit_date)` — one observation per visitor per gallery per day.

### Bridge observation (`observations`)

| Field | Type | Notes |
|---|---|---|
| `id` | uuid | primary key |
| `facilitator_id` | uuid | FK → users |
| `exhibit_id` | uuid | FK → exhibits |
| `gallery_id` | uuid | FK → galleries (denormalised) |
| `session_id` | uuid | nullable; reserved for Problem 1 |
| `category` | enum | question / suggestion / appreciation / reframing / maintenance / research |
| `sub_type` | text | category-specific subtype (e.g. research event type) |
| `fields` | jsonb | category-specific fields (urgency, emotion, how_left) |
| `free_text` | text | facilitator's note |
| `photo_url` | text | optional Supabase Storage URL |
| `status` | enum | new / acknowledged / in_progress / resolved / dismissed |
| `created_at` | timestamptz | server time |

Each observation can have many `replies` rows (curator/specialist + facilitator threading).

---

## Connecting to Problem 1's session token

Both `observations.session_id` and `octopus_observations.session_id` are nullable foreign keys to `sessions(id)`. As soon as Problem 1's visitor session token flow is decided (RFID wristband, QR ticket, etc.), the only change required is to:

1. Populate the `sessions` table with one row per visitor session
2. Pass the session_id when inserting into either observation table

No schema migration, no app rewrite. Cross-stream queries (`SELECT * FROM observations o JOIN octopus_observations x USING (session_id) WHERE o.session_id = …`) will work the moment the column is populated.

---

## What breaks if a system goes down

| Component | What breaks | Fallback |
|---|---|---|
| Netlify | Live site is down | Re-deploy from the last good commit; Netlify keeps history |
| Supabase | All reads + writes fail | No fallback in v0. Future: edge SQLite buffer per device that flushes when Supabase is back. |
| Google OAuth | New sign-ins fail | Already-signed-in sessions persist; refresh tokens still work for ~1 hour |
| Storage bucket | Photo uploads fail | Submission still works; photo gracefully skipped |
| `app_settings` table missing | Bridge tile disappears (defaults to off) | Re-run migration `0005` |

---

## Troubleshooting

### "Couldn't load users" on login
- Check `.env.local` has the right Supabase URL and anon key
- Confirm migrations ran in Supabase → Table Editor → `public.users` should exist
- Open browser DevTools → Console for the actual Supabase error

### Sign in fails with "PKCE code verifier not found"
This was an old issue. The Supabase client is now configured with `flowType: "implicit"` in `src/lib/supabase.ts`. If you ever switch to PKCE for SSR auth, you'll need `@supabase/ssr` to store the verifier in cookies.

### Sign in completes but lands on `/pending` indefinitely
Run the bootstrap SQL in section 5 of "Setup from scratch" above to set yourself to admin + verified.

### Octopus form throws "relation 'octopus_observations' does not exist"
Migration `0005_octopus_stream.sql` hasn't been run. Paste it into Supabase SQL Editor and execute.

### Camera button does nothing on phone
Confirm you're using HTTPS (Netlify URL) or `localhost`. Camera APIs are blocked on plain HTTP from a non-localhost address.

### Photo upload fails with "crypto.randomUUID is not a function"
Already fixed — `src/lib/upload.ts` falls back to `crypto.getRandomValues` for non-secure contexts. If you see this error, hard-refresh the browser to load the latest code.

### Curator sees "no entries" but you know entries exist
The curator inbox now ignores the old gallery assignments and shows everything. If the inbox is empty:
- Check the active category tab — switch tabs
- Switch the status filter from `open` to `all`
- Confirm the entry was actually inserted (Supabase → Table Editor → observations)

### Build fails on Netlify with a TypeScript narrowing error
Strict TS narrows `const` declarations. If you see "Property 'X' does not exist on type 'never'", look for a dead branch in a `const x: T | null = null; if (x !== null) { … }` pattern and remove it.

---

## Documentation standard (per IRIA Lab SOP)

This README + `DEPLOY.md` together cover:

- ✅ What this system does (top of file)
- ✅ How to set it up from scratch (sections 2–6)
- ✅ What it logs, in what format, with what fields ("What this system logs")
- ✅ How it connects to the session token (own section)
- ✅ What breaks if this goes down and the fallback ("What breaks if a system goes down")
- ✅ Changelog (below)

Anyone joining the team should be able to clone the repo, follow this README, and have a local copy running within 30 minutes.

---

## Changelog

| Date | Version | Change |
|---|---|---|
| 2026-04-30 | v0.1 | Initial build. Admin CRUD, facilitator log flow, curator threaded inbox, mock login picker. |
| 2026-04-30 | v0.2 | Brutalist redesign matching parsec brand: cream/navy/red palette, hard offset shadows, four real fonts (DM Serif, Inter, Space Grotesk, Space Mono). |
| 2026-04-30 | v0.3 | Notification bell with unread badge; `last_seen_at` column. |
| 2026-04-30 | v0.4 | IRIA Lab role added. Admin user-name display fix. |
| 2026-04-30 | v0.5 | Real Google OAuth replacing the mock picker. `auth_id` link to `auth.users`. |
| 2026-04-30 | v0.6 | Live deploy on Netlify at `param-onsite.netlify.app`. CI/CD via GitHub. |
| 2026-05-04 | v0.7 | Brand updated to ParSEC Jayanagar (was generic). |
| 2026-05-04 | v1.0 | **Stream 4 / Octopus** — quantitative facilitator capture with sliders, binary toggle, open note. New `/octopus` IRIA dashboard. New `/facilitator` chooser. Bridge moved under `/facilitator/bridge/*`. Admin Bridge visibility toggle. Curators expanded to see all Bridge categories across all galleries. |

---

## Built by

Hari S — Innovator Intern, IRIA Lab, Param Foundation
hari@paraminnovation.org

Project owner: R A Udaya Rakshith (AI & Robotics Lab Lead, Param Foundation)
