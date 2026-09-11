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

## Perceived speed improvements (2026-03)

### Display smoothing (committed + draft)

Interim captions now use a **committed + draft** merge policy (`apps/web/src/realtime/transcript-display.ts`):

- Stable words lock forward and never shrink mid-utterance
- Trailing guesses render in muted draft text
- Layout keeps the previous active line pinned until the new interim draft exceeds 3 characters

This eliminates the visible "flash back" when ASR sends shorter correction interims.

### Audio capture buffer

| Setting | Before | After | Expected impact |
|---------|--------|-------|-----------------|
| ScriptProcessor buffer | 4096 samples (~256 ms @ 16 kHz) | 2048 samples (~128 ms @ 16 kHz) | ~128 ms faster time-to-first-audio-chunk |

`RealtimeClient` sends each captured chunk immediately — no client-side batching queue.

### Utterance identity

Transcript events now include `utteranceId` (stable per phrase) and optional GCP `stability` for interim results. This gives React stable keys and cleaner interim→final correlation.

## Testing procedure

1. `pnpm dev` with `VITE_LATENCY_DEBUG=true`
2. Tap **Start**, speak 10 short phrases near the microphone
3. Record from the latency bar:
   - First interim (GOOD/OK/BAD)
   - Rolling p50 and p95 after ~10 updates
4. Verify no visible text shrink during mid-phrase ASR corrections
5. Repeat on production: https://live-captions.up.railway.app (compare LAN vs cloud)

## Baseline results (fill in)

| Environment | First interim p50 | capture→receive p50 | capture→receive p95 | Notes |
|-------------|-------------------|---------------------|---------------------|-------|
| Local (desktop) | — | — | — | Post buffer reduction |
| Local (phone LAN) | — | — | — | `pnpm dev:network` |
| Production | — | — | — | Railway |

## Console logs

Each caption update also logs to the browser console:

```text
[latency] interim capture→receive: 680ms (GOOD) · receive→render: 4ms
```

On **Stop**, a session summary is logged.
