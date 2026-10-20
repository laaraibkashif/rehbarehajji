# Rehbar-e-Hajji — Deployment Guide

## Architecture

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Vercel /   │  API  │  Render /    │  DB   │  MongoDB     │
│   Netlify    │◄──────┤  Railway     ├──────►│  Atlas       │
│  (React SPA) │       │  (Express)   │       │  (Cluster)   │
└──────────────┘       └──────────────┘       └──────────────┘
```

---

## 1. MongoDB Atlas — Database

### Step 1: Create a free cluster

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up / log in.
2. Click **"Create a Deployment"**.
3. Choose **M0 Free Cluster** (shared RAM, 512 MB storage — enough for this app).
4. Select a cloud provider and region close to your target users (e.g. AWS / eu-west-1).
5. Click **"Create Cluster"** (takes 1–3 minutes).

### Step 2: Set up database access

1. In the left sidebar, go to **Security → Database Access**.
2. Click **"Add New Database User"**.
3. Enter a username and a strong password.
4. Set **"Built-in Role"** to `Read and write to any database`.
5. Click **"Add User"**.

### Step 3: Whitelist IP addresses

1. In the left sidebar, go to **Security → Network Access**.
2. Click **"Add IP Address"**.
3. For Render/Railway (dynamic IPs), add `0.0.0.0/0` (allow from anywhere).
4. Click **"Confirm"**.

### Step 4: Get the connection string

1. In your cluster dashboard, click **"Connect"**.
2. Choose **"Connect your application"**.
3. Copy the connection string — it looks like:

   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/rehbar-e-hajji?retryWrites=true&w=majority&appName=Cluster0
   ```

4. Replace `<username>`, `<password>` and the database name (`rehbar-e-hajji`) with your values.

---

## 2. Server — Deploy to Render or Railway

### Prerequisites

- Your code is in a Git repository (GitHub, GitLab, etc.).
- A MongoDB Atlas connection string (from step 1).

### Render

1. Log in to [render.com](https://render.com).
2. Click **"New +" → "Web Service"**.
3. Connect your Git repository.
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `rehbar-e-hajji-api` |
   | **Region** | Choose closest to your users |
   | **Branch** | `main` (or your deploy branch) |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Plan** | Free |

5. Add the following **Environment Variables**:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A random 64-character string (`openssl rand -hex 32`) |
   | `AI_API_KEY` | Your OpenAI API key |
   | `ALLOWED_ORIGINS` | Comma-separated list: `https://your-app.vercel.app,https://your-app.netlify.app` |
   | `NODE_ENV` | `production` |

6. Click **"Create Web Service"**.
7. After deployment, note your service URL (e.g. `https://rehbar-e-hajji-api.onrender.com`).

### Railway

1. Log in to [railway.com](https://railway.com).
2. Click **"New Project" → "Deploy from GitHub repo"**.
3. Select your repository and set **Root Directory** to `server`.
4. Add the same environment variables (see table above).
5. Railway auto-detects Node.js — no build command needed.
6. Click **"Deploy"**.
7. Note your service URL (e.g. `https://rehbar-e-hajji-api.up.railway.app`).

### Running seed scripts (one-time)

After the server is deployed, use Railway's "Connect" terminal or Render's
"Shell" feature to run these commands once:

```bash
# Seed Hajj/Umrah ritual steps
node src/seed/seedRituals.js

# Seed emergency contacts
node src/seed/seedEmergencyContacts.js
```

> **Note:** Seed scripts read `MONGO_URI` from the deployed environment
> variables, so no code changes are needed.

---

## 3. Client — Deploy to Vercel or Netlify

### Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New… → Project"**.
3. Import your Git repository.
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `client` |
   | **Framework Preset** | `Vite` |
   | **Build Command** | `npm run build` |
   | **Output Directory** | `dist` |

5. Add the **Environment Variable**:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-api-url.onrender.com` (or your Railway URL) |

6. Click **"Deploy"**.
7. After deployment, Vercel gives you a URL like `https://rehbar-e-hajji.vercel.app`.

### Netlify

1. Log in to [netlify.com](https://netlify.com).
2. Click **"Add new site" → "Import an existing project"**.
3. Connect your Git repository.
4. Configure:

   | Setting | Value |
   |---------|-------|
   | **Base directory** | `client` |
   | **Build command** | `npm run build` |
   | **Publish directory** | `client/dist` |

5. Add the **Environment Variable**:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-api-url.onrender.com` |

6. Click **"Deploy site"**.

### Enable client-side routing

Both Vercel and Netlify need a redirect rule for SPA routing (so `/dashboard`, `/planner`, etc. don't 404 on refresh).

**For Vercel** — Add to `client/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**For Netlify** — Add to `client/netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 4. Environment Variables Reference

### Server (`server/`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.xxxxx.mongodb.net/rehbar-e-hajji?retryWrites=true&w=majority` |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens | `openssl rand -hex 32` output |
| `AI_API_KEY` | ✅ | OpenAI API key for chatbot | `sk-proj-xxxxxxxxxxxx` |
| `ALLOWED_ORIGINS` | ✅ | Comma-separated allowed CORS origins | `https://myapp.vercel.app,https://myapp.netlify.app` |
| `PORT` | ❌ | Server port (default: 5000) | `8080` |
| `NODE_ENV` | ❌ | Environment name | `production` |

### Client (`client/`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ✅ | URL of the deployed API server | `https://rehbar-e-hajji-api.onrender.com` |

---

## 5. PWA / Offline Support

The client includes a service worker (via `vite-plugin-pwa`) that caches:

- **Ritual step data** (`GET /api/rituals/*`) — cache-first, 30-day expiry
- **Dua data** (`GET /api/duas/*`) — cache-first, 30-day expiry
- **All other API calls** — network-first, 1-day expiry
- **App shell** (HTML, CSS, JS) — precached on first visit

This means core content (Hajj/Umrah steps, duas) is available offline after the first successful load.

### Generating PWA icon assets

The PWA manifest references `/icon-192.png` and `/icon-512.png`. To generate
these from the SVG favicon:

```bash
cd client
npm install --save-dev sharp
node scripts/generate-assets.js
```

Or use an online tool like [realfavicongenerator.net](https://realfavicongenerator.net/)
to create the PNGs from `client/public/favicon.svg`.

> The app will still work without custom icons — it will use default browser
> icons on the home screen.

---

## 6. Smoke-Test Checklist

After deploying both server and client, run through every feature against the **production URLs**:

### Auth
- [ ] **Register** — Create a new account. Confirm you receive a success message and verification prompt.
- [ ] **Login** — Log in with the registered credentials. Confirm you're redirected to the dashboard.
- [ ] **Logout** — Log out. Confirm you're redirected to the login page.

### Dashboard
- [ ] **Dashboard loads** — After login, the dashboard shows your greeting, navigation cards, and stat cards.
- [ ] **Quick stats display** — Tawaf/Sa'i counts, checklist percentages show default zero values.

### Hajj / Umrah Guide
- [ ] **Hajj guide** — Navigate to `/guide/hajj`. Confirm ritual steps are listed.
- [ ] **Umrah guide** — Navigate to `/guide/umrah`. Confirm steps are listed.
- [ ] **Offline content** — Disconnect your device from the internet, then reload the guide. Content should still display (cache-first strategy).

### Ritual Planner
- [ ] **Generate plan** — Fill in ritual type, age group, health condition, travel mode. Submit. Confirm a timeline of steps with notes appears.
- [ ] **Edit & regenerate** — Click "Edit & Regenerate". Confirm the form is pre-filled. Submit again — confirm a new plan is generated.

### Tawaf/Sa'i Counter
- [ ] **Increment** — Tap the large button. Confirm the count increases by 1.
- [ ] **Mode switch** — Toggle to Sa'i. Confirm the mode changes and count resets for the new mode.
- [ ] **Reset** — Click Reset. Confirm count returns to 0.
- [ ] **Completion** — Tap until 7. Confirm a completion alert/message appears.

### Checklist
- [ ] **Preparation tab** — Confirm default items are loaded (passport, Ihram, etc.).
- [ ] **Toggle item** — Check an item. Confirm it shows as checked (strikethrough).
- [ ] **Ritual tab** — Switch to Ritual Progress. Confirm ritual items are loaded.
- [ ] **Add custom item** — In Preparation tab, add a custom item. Confirm it appears in the list.
- [ ] **Persistence** — Refresh the page. Confirm toggled items are still checked.

### Ask Pilgrim (Chatbot)
- [ ] **Ask a Hajj question** — Type "What are the steps of Hajj?" Send. Confirm you get a response.
- [ ] **Decline unrelated question** — Type "What is the capital of France?" Confirm the bot politely declines.
- [ ] **Chat history** — Send another message. Confirm both messages and responses are visible in the scrollable history.

### Emergency Contacts
- [ ] **Contacts load** — Navigate to Emergency. Confirm medical, helpline, and embassy contacts are shown.
- [ ] **Tap-to-call** — Tap a phone number. Confirm it opens the phone dialer (mobile) or shows the number.
- [ ] **Category filter** — Confirm contacts are grouped by category with colored badges.

### Language Switcher
- [ ] **Switch to Arabic** — Change language to العربية. Confirm the entire UI switches to RTL layout and Arabic text.
- [ ] **Switch to Urdu** — Change to اردو. Confirm Urdu text and RTL layout.
- [ ] **Switch back to English** — Change back to English. Confirm LTR layout and English text.
- [ ] **Persistence** — Refresh the page. Confirm the chosen language persists.

### PWA
- [ ] **Install prompt** — On mobile or supported desktop, confirm the browser shows an "Install" / "Add to Home Screen" prompt.
- [ ] **Offline mode** — After loading the app once, switch to airplane mode. Confirm the ritual guide still works.
- [ ] **Service worker** — In DevTools → Application → Service Workers, confirm the SW is registered and active.

### API Health
- [ ] **Health check** — Visit `https://your-api-url.onrender.com/api/health`. Confirm response: `{ "status": "ok" }`.
- [ ] **404 handler** — Visit `https://your-api-url.onrender.com/api/nonexistent`. Confirm response: `{ "error": "Route not found" }`.

---

## 7. Useful Commands

```bash
# Generate a secure JWT secret (run locally)
openssl rand -hex 32

# Run server tests
cd server && npm test

# Run client tests
cd client && npm test

# Build client for production
cd client && npm run build

# Preview production build locally
cd client && npm run preview
```
