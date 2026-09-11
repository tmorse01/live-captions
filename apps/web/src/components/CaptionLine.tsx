export type CaptionVariant = 'history' | 'active' | 'interim';

interface CaptionLineProps {
  text: string;
  variant: CaptionVariant;
  timestampMs?: number;
}

function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CaptionLine({ text, variant, timestampMs }: CaptionLineProps) {
  const isHistory = variant === 'history';
  const isInterim = variant === 'interim';

  return (
    <article className="mb-6 last:mb-0">
      <p
        className={`leading-[var(--caption-line-height)] ${
          isHistory ? 'font-normal' : 'font-bold tracking-tight'
        } ${isInterim ? 'opacity-90' : ''}`}
        style={{
          fontSize: isHistory ? 'var(--caption-font-size-history)' : 'var(--caption-font-size)',
          color: isHistory ? 'var(--color-text-muted)' : 'var(--color-text)',
        }}
      >
        {text}
      </p>
      {isHistory && timestampMs !== undefined && (
        <time
          className="mt-1 block text-sm text-[var(--color-subtle)]"
          dateTime={new Date(timestampMs).toISOString()}
        >
          {formatTime(timestampMs)}
        </time>
      )}
    </article>
  );
}
