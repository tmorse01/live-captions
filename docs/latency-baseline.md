# Latency Baseline

Enable latency debug in the web app:

```env
VITE_LATENCY_DEBUG=true
```

## Pipeline stages

```text
capture → send → serverReceive → speechResult → clientReceive → render
```

## Target metrics (to fill after testing)

| Metric | p50 | p95 |
|--------|-----|-----|
| First interim caption | — | — |
| First final caption | — | — |
| Interim update interval | — | — |

## Testing procedure

1. Start API and web locally
2. Enable `VITE_LATENCY_DEBUG=true`
3. Tap Start, speak a short phrase near the microphone
4. Check browser console for `[latency]` logs
5. Repeat 10 times and record values
