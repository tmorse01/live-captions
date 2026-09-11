import type { SessionStatus } from '../hooks/useCaptionSession';
import type { ConnectionState } from '../realtime/client';

interface StatusIndicatorProps {
  status: SessionStatus;
  connectionState: ConnectionState;
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: 'Ready',
  requesting_mic: 'Requesting microphone…',
  listening: 'Listening',
  reconnecting: 'Reconnecting…',
  error: 'Error',
};

export function StatusIndicator({ status, connectionState }: StatusIndicatorProps) {
  const label = STATUS_LABELS[status];
  const isActive = status === 'listening';

  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
      <span
        className={`inline-block h-2.5 w-2.5 rounded-full ${isActive ? 'animate-pulse' : ''}`}
        style={{
          backgroundColor:
            status === 'error'
              ? 'var(--color-error)'
              : status === 'reconnecting'
                ? '#eab308'
                : 'var(--color-status)',
        }}
        aria-hidden="true"
      />
      <span aria-live="polite">{label}</span>
      {connectionState === 'connected' && status === 'listening' && (
        <span className="sr-only">Connected</span>
      )}
    </div>
  );
}
