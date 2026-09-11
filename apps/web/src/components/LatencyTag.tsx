import { cn } from '@live-captions/ui';
import type { LatencyRating } from '../realtime/latency';

interface LatencyTagProps {
  label: string;
  valueMs: number | null;
  rating: LatencyRating | null;
}

const RATING_STYLES: Record<LatencyRating, string> = {
  good: 'border-[var(--color-status)] text-[var(--color-status)]',
  ok: 'border-[var(--color-warning)] text-[var(--color-warning)]',
  bad: 'border-[var(--color-error)] text-[var(--color-error)]',
};

export function LatencyTag({ label, valueMs, rating }: LatencyTagProps) {
  if (valueMs === null || rating === null) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs opacity-60"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {label}: —
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium',
        RATING_STYLES[rating],
      )}
    >
      {label}: {Math.round(valueMs)}ms {rating.toUpperCase()}
    </span>
  );
}
