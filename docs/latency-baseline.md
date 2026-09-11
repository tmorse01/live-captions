# Latency Baseline

## Enable debug mode

Add to the **repo root** [`.env`](../.env) (loaded via Vite `envDir`):

```env
VITE_LATENCY_DEBUG=true
```

Restart the dev server after changing `.env`:

```bash
pnpm dev
```

A latency bar appears **below the header** with color-coded tags.

## Metrics (client-side)

| Metric | What it measures |
|--------|------------------|
| **First interim** | Session start → first partial caption on screen |
| **First final** | Session start → first finalized caption line |
| **capture→receive** | Mic buffer captured → transcript WS message received (includes network + GCP) |
| **render** | Transcript received → React state updated |
| **Rolling p50 / p95** | Median and 95th percentile of recent capture→receive samples (last 20) |

Note: `capture→receive` bundles network upload, server processing, and GCP speech latency — we do not split server hops in this MVP.

## Rating thresholds

| Metric | GOOD | OK | BAD |
|--------|------|-----|-----|
| First interim | ≤ 800 ms | ≤ 1500 ms | > 1500 ms |
| First final | ≤ 2000 ms | ≤ 3500 ms | > 3500 ms |
| capture→receive (p50) | ≤ 600 ms | ≤ 1200 ms | > 1200 ms |
| capture→receive (p95) | ≤ 800 ms | ≤ 1500 ms | > 1500 ms |
| render (p50) | ≤ 16 ms | ≤ 50 ms | > 50 ms |

Tags show text labels (GOOD / OK / BAD) in addition to color.

## Testing procedure

1. `pnpm dev` with `VITE_LATENCY_DEBUG=true`
2. Tap **Start**, speak 10 short phrases near the microphone
3. Record from the latency bar:
   - First interim (GOOD/OK/BAD)
   - Rolling p50 and p95 after ~10 updates
4. Repeat on production: https://live-captions.up.railway.app (compare LAN vs cloud)

## Baseline results (fill in)

| Environment | First interim p50 | capture→receive p50 | capture→receive p95 | Notes |
|-------------|-------------------|---------------------|---------------------|-------|
| Local (desktop) | — | — | — | |
| Local (phone LAN) | — | — | — | `pnpm dev:network` |
| Production | — | — | — | Railway |

## Console logs

Each caption update also logs to the browser console:

```text
[latency] interim capture→receive: 680ms (GOOD) · receive→render: 4ms
```

On **Stop**, a session summary is logged.
