import { useSyncExternalStore } from 'react';
import {
  isLatencyDebugEnabled,
  latencyTracker,
  LATENCY_THRESHOLDS,
  rateLatency,
} from '../realtime/latency';
import { LatencyTag } from './LatencyTag';

export function LatencyDebugPanel() {
  const summary = useSyncExternalStore(
    (cb) => latencyTracker.subscribe(cb),
    () => latencyTracker.getSnapshot(),
    () => latencyTracker.getSnapshot(),
  );

  if (!isLatencyDebugEnabled()) return null;

  const { firstInterimMs, firstFinalMs, lastUpdate, rolling, hasHighLatency } = summary;

  const p50Rating =
    rolling.captureToReceiveP50 !== null
      ? rateLatency(rolling.captureToReceiveP50, LATENCY_THRESHOLDS.captureToReceiveP50)
      : null;
  const p95Rating =
    rolling.captureToReceiveP95 !== null
      ? rateLatency(rolling.captureToReceiveP95, LATENCY_THRESHOLDS.captureToReceiveP95)
      : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b px-4 py-2 text-xs"
      style={{
        borderColor: 'var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}
    >
      {hasHighLatency && (
        <p className="mb-1 font-medium" style={{ color: 'var(--color-error)' }}>
          High latency detected
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold" style={{ color: 'var(--color-text-muted)' }}>
          Latency
        </span>

        <LatencyTag
          label="First interim"
          valueMs={firstInterimMs}
          rating={
            firstInterimMs !== null
              ? rateLatency(firstInterimMs, LATENCY_THRESHOLDS.firstInterim)
              : null
          }
        />

        <LatencyTag
          label="First final"
          valueMs={firstFinalMs}
          rating={
            firstFinalMs !== null
              ? rateLatency(firstFinalMs, LATENCY_THRESHOLDS.firstFinal)
              : null
          }
        />

        {lastUpdate && (
          <>
            <LatencyTag
              label="capture→receive"
              valueMs={lastUpdate.captureToReceive}
              rating={rateLatency(
                lastUpdate.captureToReceive,
                LATENCY_THRESHOLDS.captureToReceiveP50,
              )}
            />
            <LatencyTag
              label="render"
              valueMs={lastUpdate.receiveToRender}
              rating={rateLatency(
                lastUpdate.receiveToRender,
                LATENCY_THRESHOLDS.receiveToRenderP50,
              )}
            />
          </>
        )}
      </div>

      {rolling.sampleCount > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <LatencyTag
            label="Rolling p50"
            valueMs={rolling.captureToReceiveP50}
            rating={p50Rating}
          />
          <LatencyTag
            label="Rolling p95"
            valueMs={rolling.captureToReceiveP95}
            rating={p95Rating}
          />
          <span style={{ color: 'var(--color-text-muted)' }}>(n={rolling.sampleCount})</span>
        </div>
      )}
    </div>
  );
}
