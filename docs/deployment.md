# Deployment (Railway)

Deploy **two services** from [github.com/tmorse01/live-captions](https://github.com/tmorse01/live-captions).

## 1. Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select `live-captions`
3. Create **two services** from the same repo (duplicate the service or add a second)

## 2. API service (`live-captions-api`)

| Setting | Value |
|---------|-------|
| **Root directory** | `apps/api` |
| **Start command** | `node dist/index.js` |

**Build command** (Settings → Build):

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @live-captions/contracts build && pnpm --filter @live-captions/config build && pnpm --filter @live-captions/api build
```

**Environment variables:**

| Variable | Value |
|----------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SERVICE_ACCOUNT_JSON` | Full contents of your service account JSON key |
| `WEB_ORIGIN` | Your web URL (set after step 3), e.g. `https://live-captions-web-production.up.railway.app` |
| `NODE_ENV` | `production` |

Railway sets `PORT` automatically — the API reads it.

**Health check path:** `/health`

Generate a public domain: Settings → Networking → **Generate Domain**

Note the API URL, e.g. `https://live-captions-api-production.up.railway.app`

## 3. Web service (`live-captions-web`)

| Setting | Value |
|---------|-------|
| **Root directory** | `apps/web` |
| **Start command** | `pnpm exec vite preview --host 0.0.0.0 --port $PORT` |

**Build command:**

```bash
cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @live-captions/contracts build && pnpm --filter @live-captions/ui build && pnpm --filter @live-captions/web build
```

**Environment variables (build time — Vite embeds these):**

| Variable | Value |
|----------|-------|
| `VITE_API_WS_URL` | `wss://YOUR-API-DOMAIN.up.railway.app/ws` |

Replace with your actual API domain from step 2.

Generate a public domain for the web service.

## 4. Finish API CORS

Go back to the **API service** and set `WEB_ORIGIN` to your **web** domain (exact URL, including `https://`).

Redeploy the API if it was deployed before this was set.

## 5. Verify

1. Open the web URL on your phone
2. Tap **Start** → allow microphone
3. Speak — captions should appear (HTTPS works natively on Railway)

## CLI alternative

```bash
# From repo root, with Railway CLI logged in
railway login
railway init
```

Create services in the dashboard with root directories as above — monorepo deploy is easiest via the UI.

## Local vs production

| | Local (phone on LAN) | Production (Railway) |
|--|-------------------|---------------------|
| Web | `https://192.168.x.x:5173` | `https://*.up.railway.app` |
| WebSocket | Proxied via Vite `/ws` | `wss://api-domain/ws` |
| GCP creds | `.env` file | `GCP_SERVICE_ACCOUNT_JSON` secret |
