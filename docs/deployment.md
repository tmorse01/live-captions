# Deployment (Railway)

## Services

Deploy two Railway services from this repository:

| Service | Root directory | Port |
|---------|---------------|------|
| `live-captions-api` | `apps/api` | `$PORT` (Railway assigns) |
| `live-captions-web` | `apps/web` | `$PORT` |

## API environment variables

| Variable | Description |
|----------|-------------|
| `GCP_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to SA JSON (write from secret at startup if needed) |
| `WEB_ORIGIN` | Web app URL for CORS (e.g. `https://live-captions-web.up.railway.app`) |
| `API_PORT` | Use `$PORT` on Railway |

## Web environment variables (build time)

| Variable | Description |
|----------|-------------|
| `VITE_API_WS_URL` | WebSocket URL (e.g. `wss://live-captions-api.up.railway.app/ws`) |

## GCP credentials on Railway

Option A: Store full JSON as `GCP_SERVICE_ACCOUNT_JSON` secret. At API startup, write to `/tmp/gcp-credentials.json` and set `GOOGLE_APPLICATION_CREDENTIALS`.

Option B: Use Railway's GCP integration if available.

## Health checks

- API: `GET /health` → `{ "status": "ok" }`
- Web: `GET /`

## Local development

```bash
pnpm install
pnpm build
pnpm dev
```

Web: http://localhost:5173  
API: http://localhost:3001
