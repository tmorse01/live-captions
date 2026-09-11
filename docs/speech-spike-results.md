# Speech Spike Results

Template for documenting spike observations after running `pnpm speech-spike`.

## Environment

- Date:
- GCP region:
- Audio source: (live mic / WAV file / silence)

## Observations

| Metric | Value |
|--------|-------|
| First interim result | ___ ms |
| First final result | ___ ms |
| Stream duration tested | ___ min |
| Errors | none / describe |

## Notes

- Streaming with `LINEAR16`, 16 kHz, mono, `interimResults: true`
- Long-running stream (>5 min) should be tested separately before production

## Mock fallback

When `GOOGLE_APPLICATION_CREDENTIALS` is not set, the API uses `MockSpeechProvider` automatically for local development without GCP.
