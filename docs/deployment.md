# Deployment (Railway — single service)

One Railway service runs the API **and** serves the built React app from the same domain. WebSocket captions use `wss://your-domain/ws` on the same origin — no separate web service needed.

## Prerequisites

- GitHub repo pushed: `github.com/tmorse01/live-captions`
- GCP service account JSON ready
- Railway project `live-captions` created

## Railway setup

1. Open your **live-captions** project in [Railway](https://railway.app)
2. **New Service** → **GitHub Repo** → select `live-captions`
3. Leave **root directory** as `/` (repo root)
4. Railway reads [`railway.toml`](railway.toml) automatically:
   - **Build:** `pnpm build:prod`
   - **Start:** `node apps/api/dist/index.js`
   - **Health check:** `/health`

## Environment variables

Set these on the service (**Variables** tab):

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SERVICE_ACCOUNT_JSON` | Full contents of your service account JSON key |

`WEB_ORIGIN` is optional — if unset, the API uses `https://$RAILWAY_PUBLIC_DOMAIN` automatically.

Do **not** set `VITE_API_WS_URL` — the web app connects to `/ws` on the same host.

## Generate domain

Settings → **Networking** → **Generate Domain**

Your app is live at `https://live-captions-production.up.railway.app` (or similar).

## Verify

1. Open the Railway URL on your phone
2. Tap **Start** → allow microphone
3. Speak — captions should appear

## CLI deploy

```bash
railway link          # select live-captions project
railway up            # deploy current branch
railway domain        # generate public URL
railway logs          # tail logs
```

Set secrets via CLI:

```bash
railway variables set NODE_ENV=production
railway variables set GCP_PROJECT_ID=your-project-id
railway variables set GCP_SERVICE_ACCOUNT_JSON="$(Get-Content -Raw .\secrets\your-key.json)"
```

## Local production smoke test

```bash
pnpm build:prod
NODE_ENV=production node apps/api/dist/index.js
# Open http://localhost:3001
```
