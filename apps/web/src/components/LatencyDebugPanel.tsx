import { latencyTracker } from '../realtime/latency';

export function LatencyDebugPanel() {
  if (import.meta.env.VITE_LATENCY_DEBUG !== 'true') return null;

  const marks = latencyTracker.getMarks();

  return (
    <details className="mx-4 rounded border p-2 text-xs" style={{ borderColor: 'var(--color-border)' }}>
      <summary>Latency debug</summary>
      <ul className="mt-2 max-h-32 overflow-y-auto">
        {marks.slice(-10).map((mark, i) => (
          <li key={`${mark.stage}-${i}`}>
            {mark.stage}: {mark.timestampMs.toFixed(1)}ms
          </li>
        ))}
      </ul>
    </details>
  );
}
