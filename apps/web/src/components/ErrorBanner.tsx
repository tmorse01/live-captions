import type { ErrorEvent } from '@live-captions/contracts';

interface ErrorBannerProps {
  error: ErrorEvent | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mx-4 rounded-lg px-4 py-3 text-sm"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-error)',
        color: 'var(--color-error)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <p>{error.message}</p>
        {error.recoverable && onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 underline focus:outline-none focus-visible:ring-2"
            aria-label="Dismiss error"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
