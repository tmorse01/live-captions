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
      className="mx-4 mt-2 rounded-lg border px-4 py-3 text-sm"
      style={{
        borderColor: 'var(--color-error-border)',
        backgroundColor: 'var(--color-error-bg)',
        color: 'var(--color-error-text)',
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
