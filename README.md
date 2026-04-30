# Octopus Floor — ParSEC Jayanagar Facilitator Capture System (v0)

A mobile-first PWA for ParSEC Jayanagar facilitators to log:
- Visitor questions they couldn't answer (→ curator)
- Visitor suggestions (→ curator)
- Visitor appreciation moments (→ social media)
- Novel reframings (→ curator)
- Maintenance signals (→ maintenance team)
- Research observations (→ research database)

Each entry becomes a thread the routed team can reply to in-portal. No emails.

> **v0 note:** Google sign-in is not yet wired up. The app uses a "pick a user" mock-login picker for development and demos. Real Google OAuth will be added later — the data model is already designed for it.

---

## 1. Prerequisites

Install on your machine if not already:

- **Node.js 18+** — https://nodejs.org/  
- **npm** (comes with Node)
- A free **Supabase** account — https://supabase.com

That's it. No Docker, no Postgres install.

---

## 2. Set up Supabase

1. Go to https://supabase.com → **New project**
2. Pick:
   - Project name: `octopus-floor` (anything works)
   - Database password: anything strong (you won't need it for v0)
   - Region: **Mumbai** or **Singapore** (closest to India)
3. Wait ~2 minutes for it to provision
4. In the project sidebar → **SQL Editor** → click **New query**
5. Open `supabase/migrations/0001_initial_schema.sql` from this repo, copy the entire contents, paste into the SQL editor, click **Run**
6. You should see "Success. No rows returned." If you see an error, scroll to the line and re-run

After running you'll have:
- All tables created (users, galleries, exhibits, observations, replies, etc.)
- 2 storage buckets (`exhibit-images`, `observation-photos`)
- 6 seeded users (admin, 2 facilitators, curator, maintenance, social)
- 2 galleries with 4 exhibits

---

## 3. Get your Supabase keys

In your Supabase project:

1. Settings → **API**
2. Copy two values:
   - **Project URL** (e.g. `https://abcdefg.supabase.co`)
   - **anon public** key (a long JWT)

---

## 4. Set up the app locally

```bash
# In the project root:
npm install

# Create your env file
cp .env.local.example .env.local
# (on Windows: copy .env.local.example .env.local)
```

Edit `.env.local` and paste your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-long-key...
```

Then run:

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 5. Try the flow

You'll land on the mock-login picker showing 6 seeded users.

### As Admin (`Admin (Jayanagar)`)
- Visit **Galleries** — see Physics + Biology galleries
- Visit **Exhibits** — add a new exhibit (try uploading an image)
- Visit **Users** — verify the pending user "Arjun"; assign curator "Dr. Mehta" to galleries

### As Facilitator (`Riya (Facilitator)`)
- See the gallery cards
- Tap a gallery → see exhibit cards
- Tap an exhibit → see 6 category buttons
- Tap **Maintenance** → fill the form, attach a photo, submit
- Visit **My logs** — see your submission

### As Curator (`Dr. Mehta (Curator)`)
- See observations from your assigned galleries
- Tap an entry → reply in-thread, change status

### As Maintenance / Social
- Each sees only the entries tagged for them

---

## 6. Project structure

```
onsite-faci/
├── package.json              ← npm config
├── next.config.mjs           ← Next.js config
├── tailwind.config.ts        ← Tailwind config
├── .env.local.example        ← copy to .env.local and fill in
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql   ← run this in Supabase SQL editor
├── public/
│   └── manifest.json         ← PWA manifest
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx          ← redirect based on role
    │   ├── login/page.tsx    ← mock login picker
    │   ├── pending/page.tsx  ← shown while awaiting verification
    │   ├── admin/
    │   │   ├── page.tsx
    │   │   ├── galleries/page.tsx
    │   │   ├── exhibits/page.tsx
    │   │   └── users/page.tsx
    │   ├── facilitator/
    │   │   ├── page.tsx
    │   │   ├── gallery/[id]/page.tsx
    │   │   ├── exhibit/[id]/page.tsx
    │   │   ├── log/[exhibitId]/[category]/page.tsx
    │   │   └── my-logs/page.tsx
    │   └── curator/
    │       ├── page.tsx
    │       └── thread/[id]/page.tsx
    ├── components/
    │   ├── Shell.tsx         ← top bar + layout
    │   └── AuthGuard.tsx     ← role-based redirect
    └── lib/
        ├── supabase.ts       ← client
        ├── auth.ts           ← cookie-based current user
        ├── upload.ts         ← image upload helper
        └── types.ts          ← TypeScript types + UI metadata
```

---

## 7. Data model summary

| Table | Purpose |
|---|---|
| `users` | All people (admin, curator, facilitator, maintenance, social, research) |
| `galleries` | Top-level groupings of exhibits |
| `exhibits` | Individual exhibits, belong to a gallery, have an image |
| `curator_assignments` | Many-to-many: which curator covers which gallery |
| `sessions` | (placeholder) Visitor session IDs — for Problem 1 cross-stream join later |
| `observations` | Every facilitator log entry. Tagged by `category`. Joins to exhibit + gallery |
| `replies` | Threaded responses to an observation |
| `read_receipts` | (for badges later) per-user read state per observation |

---

## 8. What v0 doesn't do yet (and what's next)

- **Google OAuth.** Mock login for now. Adding Google = enabling the provider in Supabase Auth + replacing the login picker page. The `users` table already has `email` as the link.
- **Row-Level Security.** Disabled in v0 (mock auth handled in app layer). Will be turned on with Google OAuth.
- **Session-ID linkage.** `observations.session_id` is nullable. Once Problem 1's session-token flow is decided, we attach session IDs at submit time.
- **Push notifications** for maintenance items (PWA web-push).
- **Offline queue** for unstable network areas of the centre.
- **Edit / undo** on submitted observations.
- **Read receipts / unread badges** in the curator inbox.

---

## 9. Troubleshooting

### "Couldn't load users" on login screen
- Check `.env.local` has the correct Supabase URL and anon key
- Check that you ran the SQL migration in the Supabase SQL editor
- Open browser DevTools console for the actual error

### Image upload fails
- Make sure storage buckets exist (the SQL creates them automatically)
- Check Supabase → Storage → you should see `exhibit-images` and `observation-photos`

### "permission denied for table users"
- RLS may have been turned on accidentally. The migration explicitly disables it for v0. Re-run the migration's RLS section.

### Can't see a gallery / exhibit you just created
- Make sure `active` is true (admin pages let you toggle this)
- Refresh the page

---

## 10. Changelog

- **2026-04-30 · v0.1** — Initial build. Admin CRUD, facilitator log flow (5 streams + research), curator threaded inbox, mock login.
