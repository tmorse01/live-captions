# Live Captions

A mobile-first web app for deaf and hard-of-hearing users to caption in-person conversations in real time.

**Open app → Start captions → Read**

## Features

- Real-time English speech recognition
- Large, readable rolling captions with interim/final states
- Adjustable text size and light/dark/high-contrast themes
- No account required — audio and transcripts are never stored
- Resilient WebSocket connection with auto-reconnect

## Architecture

```text
Browser (React)
  │ microphone → PCM 16kHz
  │ WebSocket
  ▼
Node.js API (Fastify)
  │ streaming
  ▼
Google Cloud Speech-to-Text
```

## Quick start

```bash
pnpm install
cp .env.example .env
# Configure GCP credentials (see docs/gcp-setup.md)
pnpm build
pnpm dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

**Phone testing on LAN:** `pnpm dev:network` then open the `https://192.168.x.x:5173` URL (HTTPS required for mobile mic). Desktop localhost stays HTTP with plain `pnpm dev`.

Without GCP credentials, the API uses a mock speech provider for development.

## Monorepo structure

```text
apps/web     — React + Vite frontend
apps/api     — Fastify + WebSocket backend
packages/contracts — Shared Zod schemas
packages/config    — Environment parsing
packages/ui        — Shared UI utilities
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start web + API in parallel |
| `pnpm build` | Build all packages |
| `pnpm test` | Run Vitest tests |
| `pnpm lint` | ESLint |
| `pnpm speech-spike` | GCP streaming spike (in apps/api) |

## Privacy

Audio is processed in real time and discarded immediately. No database, no authentication, no transcript persistence.

## Deployment

See [docs/deployment.md](docs/deployment.md) for Railway setup.

## Accessibility

Built accessibility-first: ARIA live regions for captions, large touch targets (44px+), keyboard navigation, high-contrast theme, reduced motion support, and semantic HTML throughout.

## Brand

Visual identity, colors, typography, and icon rules: [docs/brand.md](docs/brand.md).
