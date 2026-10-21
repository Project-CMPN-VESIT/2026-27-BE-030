# Deploying MindQuest / PsychTriage (free)

This replaces the earlier static-only guide. The project is no longer a single
static site — it is now **three services**:

| Piece | What it is | Free host |
| --- | --- | --- |
| Frontend | Vite + React SPA, builds to `dist/` | **Vercel** |
| Backend | FastAPI + uvicorn (`backend/main.py`) | **Render** |
| Database | MongoDB (accessed with `motor`) | **MongoDB Atlas M0** |

Deploy them in the order below — the frontend needs the backend's URL, and the
backend needs the database's URL, so working backwards means redoing steps.

---

## 0. Push your latest code first

**Your GitHub repo is currently 4 commits behind your local machine.**

`https://github.com/BinaryByteSid/MindQuest-Project` is at `821b008`. Your local
`main` is at `1f877f2`. The four commits that have not been pushed are:

```
1f877f2  Fix stopSession call to endSession in VoiceTriageCall.tsx
63fc188  Clean up conflict artifacts in AiBuddyScreen.tsx
7267714  Merge origin/main and resolve merge conflicts
34c7255  Production-ready build
```

Deploying from the repo as it stands right now would ship leftover merge-conflict
artifacts, the wrong `stopSession` call, and none of the deployment config
(`vercel.json`, `netlify.toml`, `public/_redirects`, `tsconfig.json`). Push before
you do anything else.

Your `origin` still points at the old fork, so add the new repo and push to it:

```bash
git remote add project https://github.com/BinaryByteSid/MindQuest-Project.git
git push project main
```

Then verify on GitHub that the newest commit shown is `1f877f2`, and that
`vercel.json` and `backend/main.py` are both visible in the file listing.

> If the push is rejected, the two histories have diverged. Do **not** reach for
> `--force` straight away — check what is on the remote that you do not have
> locally with `git fetch project && git log project/main --oneline -5`.

### Sanity-check the build before deploying

```bash
npm install
npm run typecheck
npm run build
```

All three pass on the current code — if one fails for you, fix that before touching a host.

---

## 1. Two things to fix before you deploy

### 1a. Your `.env` is missing two variables the code actually reads

`.env.example` lists them, but your local `.env` does not have them:

| Missing variable | What breaks without it |
| --- | --- |
| `VITE_BACKEND_URL` | Falls back to `http://localhost:8000`. A deployed site would call *the visitor's own machine* — every backend call fails. |
| `VITE_GOOGLE_CLIENT_ID` | Falls back to the literal string `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`. Google sign-in fails. |

Both are read at build time (`src/app/screens/AiBuddyScreen.tsx`,
`src/app/context/AuthContext.tsx`, `src/main.tsx`). Add them locally, and set them on
Vercel in step 4.

### 1b. `VITE_GEMINI_LIVE_API_KEY` is publicly readable — plan for it

This is the one genuine security problem in the current design, and it is worth
understanding rather than just working around.

`AiBuddyScreen.tsx` calls the Gemini Live API **directly from the browser** using
`VITE_GEMINI_LIVE_API_KEY`. Vite inlines every `VITE_`-prefixed value into the public
JavaScript bundle. So on a deployed site, anyone can open devtools, search the bundle,
and read your Gemini API key. They can then use it on your quota and, if billing is
enabled, on your card.

There is no way to hide it while the browser calls Google directly. What you can do:

- **Use a separate key** for `VITE_GEMINI_LIVE_API_KEY` — never the same key as the
  backend's `GEMINI_API_KEY`. They already are separate variables; keep them separate
  in practice too, so a leaked frontend key does not also expose the backend.
- **Restrict the key** in Google Cloud Console → *Credentials* → your key:
  - *Application restrictions* → **HTTP referrers**, listing only your deployed domain.
  - *API restrictions* → **Generative Language API** only.
- **Cap the quota** on that key so a leak cannot run away.
- **Never enable billing** on the project that key belongs to while it is public. Stay
  on the free tier so the worst case is an exhausted quota, not a bill.

> The proper fix is to have `backend/main.py` mint short-lived ephemeral tokens and have
> the browser use those instead of the raw key. That is a code change, not a deployment
> step, so it is out of scope here — but it is the right answer if this ever goes past a
> classroom demo, and it is a good thing to be able to explain in a viva.

The backend's own `GEMINI_API_KEY` (used for transcript summarisation) is **not** exposed
— it lives in Render's environment and never reaches the browser. That one is safe.

---

## 2. Database — MongoDB Atlas (free M0)

1. Sign up at **[cloud.mongodb.com](https://cloud.mongodb.com)**.
2. Create a **free M0 cluster**. Any region is fine; pick one near you.
3. **Database Access** → *Add New Database User*. Use a password with no special
   characters, or you will have to URL-encode it in the connection string.
4. **Network Access** → *Add IP Address* → **Allow access from anywhere (`0.0.0.0/0`)**.

   Render's free tier does not give you a static outbound IP, so an allow-list of
   specific IPs cannot work. This is the single most common reason a backend deploys
   fine and then times out on every database call.
5. **Connect → Drivers → Python** and copy the connection string. It looks like:

   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   Replace `USER` and `PASSWORD` with the credentials from step 3.

The app creates the `Mindquest` database and `users` collection on first write — you do
not need to create them by hand.

---

## 3. Backend — Render (free web service)

`backend/main.py` binds `0.0.0.0` and reads `PORT` from the environment, which is exactly
what Render needs, so no code changes are required.

1. Sign in to **[render.com](https://render.com)** with GitHub.
2. **New → Web Service**, connect `MindQuest-Project`.
3. Configure:

   | Field | Value |
   | --- | --- |
   | Root Directory | `backend` |
   | Runtime | Python 3 |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
   | Instance Type | Free |

   **Root Directory must be `backend`.** Leave it blank and Render looks for
   `requirements.txt` at the repo root, finds none, and fails the build.

4. Add environment variables (**Environment** tab):

   | Name | Value |
   | --- | --- |
   | `MONGODB_URI` | the Atlas string from step 2 |
   | `DB_NAME` | `Mindquest` |
   | `COLLECTION_USERS` | `users` |
   | `GEMINI_API_KEY` | a Gemini key — **a different one from the frontend's** |
   | `ELEVENLABS_WEBHOOK_SECRET` | leave blank unless you use the webhook |

   Do **not** set `PORT` yourself. Render injects it, and overriding it stops the service
   binding to the port Render is watching.

5. Deploy. You get a URL like `https://mindquest-api.onrender.com`.

### Confirm it actually works

The app has a built-in diagnostic endpoint. Open:

```
https://YOUR-BACKEND.onrender.com/api/debug/config
```

It reports which parts of the pipeline are configured without printing any secret values.
If it says MongoDB is not reachable, go back to step 2.4 (the `0.0.0.0/0` rule).

Interactive API docs are at `/docs` — useful in a demo. Note there is no route at `/`, so
the bare URL returns a 404. That is expected, not a broken deploy.

> **Free-tier cold starts.** Render spins a free service down after ~15 minutes of no
> traffic, and the next request takes **around 50 seconds** while it wakes up. During a
> live demo this reads as "the app is broken". Load the backend URL a minute before you
> present. If you want to avoid it entirely, a free uptime pinger like UptimeRobot hitting
> `/api/debug/config` every 10 minutes keeps it warm.

---

## 4. Frontend — Vercel

1. Sign in to **[vercel.com](https://vercel.com)** with GitHub.
2. **Add New… → Project**, import `MindQuest-Project`.
3. Leave Root Directory as the repo root. `vercel.json` supplies the rest — framework
   Vite, build `npm run build`, output `dist`, and the SPA rewrite.
4. Add environment variables, ticking **Production**, **Preview**, and **Development**:

   | Name | Value |
   | --- | --- |
   | `VITE_BACKEND_URL` | your Render URL, **no trailing slash** — `https://mindquest-api.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | from step 5 |
   | `VITE_GEMINI_LIVE_API_KEY` | your restricted browser-side key (§1b) |
   | `VITE_ELEVENLABS_AGENT_ID` | only if you still use the ElevenLabs path |

5. **Deploy.**

> Vite bakes these values in **at build time**, not at runtime. Every time you add or
> change one, you must redeploy for it to take effect: **Deployments → ⋯ → Redeploy**.
> A changed variable with no redeploy is the most common "I set it and nothing happened".

A trailing slash on `VITE_BACKEND_URL` produces request URLs like
`https://api.onrender.com//api/users`, which 404. Leave it off.

---

## 5. Google OAuth

In **[console.cloud.google.com](https://console.cloud.google.com)** → *APIs & Services →
Credentials* → your **OAuth 2.0 Client ID** (type: Web application):

**Authorised JavaScript origins** — add every origin the app is served from:

```
http://localhost:5173
https://your-project.vercel.app
```

Origins are scheme + host + port only. No paths, no trailing slash. `http://localhost:5173`
and `https://localhost:5173` are different origins, as are `example.com` and
`www.example.com`.

You do not need a redirect URI: `@react-oauth/google` uses the popup/token flow, not a
server redirect.

Copy the Client ID into `VITE_GOOGLE_CLIENT_ID` on Vercel (step 4), then redeploy.

> Vercel gives every deployment its own preview URL. Those origins are not registered, so
> Google sign-in only works on your stable production domain unless you add each preview
> URL too. Demo from the production URL.

---

## 6. About the Dockerfile

The `Dockerfile` at the repo root runs `npm run dev` on port 5173 — it is a **development**
container, not a production image. Do not point a host at it expecting a production build:
you would be serving the unminified dev server with hot-reload enabled.

Nothing in this guide uses it. Leave it for local container work.

---

## 7. Post-deploy checklist

Walk this on the live URLs before demoing. The highlighted rows are the ones that fail
silently.

- [ ] Backend `/api/debug/config` returns JSON and reports MongoDB reachable
- [ ] Backend `/docs` renders the FastAPI page
- [ ] Frontend home page loads; favicon appears in the tab
- [ ] **Google sign-in completes and lands you back in the app**
- [ ] **Open devtools → Network, sign in, confirm requests go to your Render URL and not `localhost:8000`**
- [ ] A user document appears in Atlas (**Browse Collections** → `Mindquest` → `users`)
- [ ] Start Game Quest → breathing → Level 1 → Level 2 → Level 3 → result
- [ ] Refresh the page *during* Level 2 — it reloads the game, does not 404
- [ ] Paste `/mindquest/level1` into a fresh tab — it loads
- [ ] A nonsense URL like `/xyz` gives the styled 404 screen
- [ ] Measure Manually → answer all 16 → report renders
- [ ] **Answer everything *Not at all* except question 9, set that to *Nearly every day* → the report must show the red "Please reach out today" banner and HIGH, despite low totals**
- [ ] AI Buddy: mic prompt appears, Buddy responds, and the conversation summary saves
- [ ] Emergency screen: `tel:` links open the dialler on a real phone
- [ ] Open it on an actual phone, not just a narrow desktop window

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Frontend calls `localhost:8000` in production | `VITE_BACKEND_URL` unset at build time | Set it on Vercel, then **redeploy** (§4) |
| All backend calls 404 with a doubled `//api/` | Trailing slash on `VITE_BACKEND_URL` | Remove it, redeploy |
| Backend build fails: `requirements.txt` not found | Root Directory not set | Set it to `backend` (§3.3) |
| Backend starts, every DB call hangs then times out | Atlas IP allow-list | Add `0.0.0.0/0` (§2.4) |
| Backend logs "MongoDB ping FAILED" | Bad URI or password | Re-copy the string; URL-encode special characters in the password |
| First request after a break takes ~50s | Render free tier cold start | Expected. Pre-warm before demoing (§3) |
| Google sign-in: `origin_mismatch` / popup closes instantly | Origin not registered | Add the exact origin (§5) |
| Google sign-in fails only on a preview URL | Preview origins unregistered | Demo from the production URL |
| AI Buddy: no audio, console shows a 4xx from Google | Bad or over-restricted Gemini key | Check the key's referrer restrictions include your domain |
| Deep links 404, home page fine | SPA rewrite missing | Confirm `vercel.json` is committed — this is one of the 4 unpushed commits (§0) |
| Blank page, console 404s on `/assets/index-*.js` | Wrong base path | Only set `base` in `vite.config.ts` when deploying to a subpath |
| Old version keeps showing | Browser cache | Hard-reload (`Ctrl+Shift+R`) |

---

## 9. Cost

Free at this scale, with two things to watch:

- **Vercel Hobby** and **MongoDB Atlas M0** are permanently free and comfortably sized
  for a college project.
- **Render free tier** is free but sleeps after 15 minutes idle (§3).
- **Gemini** has a free monthly quota. The frontend key is publicly readable (§1b), so
  keep billing **disabled** on that project — then an exhausted quota just breaks AI
  Buddy temporarily instead of generating a bill. The rest of the app keeps working.
