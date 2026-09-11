import type { SessionStatus } from '../hooks/useCaptionSession';
import { WifiOffIcon } from './icons';

interface SessionIndicatorProps {
  status: SessionStatus;
}

export function SessionIndicator({ status }: SessionIndicatorProps) {
  if (status === 'listening') {
    return (
      <div className="flex h-6 items-end gap-0.5" role="img" aria-label="Listening">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="waveform-bar w-1 rounded-full bg-[var(--color-accent)]"
            style={{
              height: '100%',
              animationDelay: `${i * 0.12}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (status === 'reconnecting') {
    return (
      <div className="flex max-w-[7rem] items-center gap-1" role="status">
        <WifiOffIcon size={18} className="shrink-0 text-[var(--color-warning)]" />
        <span className="truncate text-xs font-bold text-[var(--color-warning)]">Reconnecting</span>
      </div>
    );
  }

  return <div className="h-6 w-6" aria-hidden="true" />;
}
