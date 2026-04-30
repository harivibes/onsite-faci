# Deploy to Netlify via GitHub

Step-by-step. ~10 minutes.

---

## 1 · Push to GitHub

### 1a · Create the GitHub repo
- Go to https://github.com/new
- Name: `onsite-faci` (or anything)
- Visibility: **Private** is recommended (the repo doesn't contain secrets, but private is safer)
- Don't add README / gitignore / license — already in the project
- Click **Create repository**
- Copy the URL it shows, e.g. `https://github.com/yourname/onsite-faci.git`

### 1b · Initialize git locally and push

Open PowerShell in the project folder and run these commands one by one:

```powershell
# Set up git identity (only needed once per machine)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Initialize the repo
git init
git add .
git commit -m "Initial commit: Octopus Floor v0.1"

# Connect to GitHub and push
git branch -M main
git remote add origin https://github.com/YOURNAME/onsite-faci.git
git push -u origin main
```

If GitHub asks for credentials, use a [Personal Access Token](https://github.com/settings/tokens) (Settings → Developer settings → Personal access tokens → Generate new token, with `repo` scope) — GitHub stopped accepting passwords for git push in 2021.

If you've never used git on this machine, you may also need to install it: https://git-scm.com/download/win

---

## 2 · Connect Netlify

### 2a · Sign in
- Go to https://app.netlify.com/
- Sign in with GitHub (recommended — it auto-authorizes)

### 2b · Import the repo
- Click **Add new site → Import an existing project**
- Pick **Deploy with GitHub** → authorize Netlify access to the repo
- Select your `onsite-faci` repo

### 2c · Build settings
Netlify auto-detects Next.js. Confirm these values (should be pre-filled):
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Base directory:** *(empty)*

Don't click Deploy yet — first add env vars.

### 2d · Environment variables
Click **Add environment variables** before deploy:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://akzowonjjnyavmbinehr.supabase.co` (your Supabase project URL) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (your anon key from Supabase Settings → API) |

These are the same values currently in your `.env.local`.

### 2e · Deploy
Click **Deploy** (or "Deploy [site name]"). First build takes ~2 minutes.

When done, Netlify shows a URL like `https://octopus-floor.netlify.app` (or a random one — you can rename later under Site settings → Change site name).

---

## 3 · Update Supabase

### 3a · URL Configuration
Supabase → **Authentication → URL Configuration**

- **Site URL:** change to your Netlify URL (e.g. `https://octopus-floor.netlify.app`)
- **Redirect URLs** — add (don't remove the existing dev ones; keep them all):
  - `https://octopus-floor.netlify.app/auth/callback`
  - `https://octopus-floor.netlify.app/**` (wildcard for safety)

Save.

---

## 4 · Update Google Cloud Console

Google Cloud Console → **APIs & Services → Credentials → your OAuth client**

### 4a · Authorized JavaScript origins
Add: `https://octopus-floor.netlify.app`

### 4b · Authorized redirect URIs
Already has `https://akzowonjjnyavmbinehr.supabase.co/auth/v1/callback` — no change needed (Supabase is the OAuth callback endpoint).

Save.

### 4c · Test users (if consent screen still in Testing)
If your OAuth consent screen is still in "Testing" mode (it is by default), only the Google emails you've explicitly added as test users can sign in. Add your team's emails under **OAuth consent screen → Test users → + Add users**.

When you're ready to open it to anyone with a Google account, you can publish the consent screen — Google may require basic verification depending on the scopes (we use only basic profile/email, so usually no review needed).

---

## 5 · Test the live site

1. Open `https://octopus-floor.netlify.app` on your phone (or any device)
2. Click **Continue with Google**
3. Pick your account → grant access
4. Should land on `/auth/callback` for ~1s then route to your role's page

Sign-in should now work cleanly on phone, because the entire OAuth round-trip happens over public HTTPS — no LAN or Tailscale dependency.

---

## 6 · Future deploys

Every push to `main` auto-deploys. To ship a change:

```powershell
git add .
git commit -m "Describe your change"
git push
```

Netlify will rebuild and redeploy in ~1–2 minutes.

For preview branches, push to a non-main branch and Netlify will give you a unique preview URL.

---

## Troubleshooting

**Build fails on Netlify with "Module not found"**
- Make sure `package-lock.json` is committed (it should be — already in the repo)

**Build succeeds but signing in fails with "redirect_uri_mismatch"**
- The Netlify URL isn't in Google's Authorized JavaScript origins, OR Supabase's Redirect URLs allow list. Re-check steps 3 and 4.

**Sign in succeeds but you land on /pending instead of /admin**
- New users always start as pending facilitator. Run this in Supabase SQL Editor:
  ```sql
  update public.users
    set role = 'admin', status = 'verified', verified_at = now()
    where email = 'YOUR-GOOGLE-EMAIL@gmail.com';
  ```

**Photos don't upload**
- Make sure Supabase Storage buckets `exhibit-images` and `observation-photos` exist (the SQL migrations create them, but verify in Supabase → Storage)

**App loads but data is empty / errors in console**
- Verify env vars are set in Netlify (step 2d) — they need to be exactly `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Trigger a redeploy after editing env vars: Netlify → Deploys → Trigger deploy → Clear cache and deploy site

---

## Custom domain (later)

Once you have a domain (e.g. `octopus.parsec.in`):
1. Netlify → Domain settings → Add custom domain → follow DNS instructions
2. Netlify auto-provisions HTTPS via Let's Encrypt (1–2 minutes)
3. Update Supabase Site URL + Redirect URLs + Google JavaScript origins to include the new domain
