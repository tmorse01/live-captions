import { useEffect, useRef, useState } from 'react';

export type CaptionVariant = 'history' | 'active' | 'interim';

interface CaptionLineProps {
  committedText: string;
  draftText?: string;
  variant: CaptionVariant;
  timestampMs?: number;
  utteranceKey?: string;
}

function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CaptionLine({
  committedText,
  draftText = '',
  variant,
  timestampMs,
}: CaptionLineProps) {
  const isHistory = variant === 'history';
  const isInterim = variant === 'interim';
  const hasDraft = draftText.length > 0;

  const prevDraftLenRef = useRef(0);
  const prevVariantRef = useRef(variant);
  const [draftUpdated, setDraftUpdated] = useState(false);
  const [justFinalized, setJustFinalized] = useState(false);

  useEffect(() => {
    if (isInterim && draftText.length > prevDraftLenRef.current) {
      setDraftUpdated(true);
      const timer = window.setTimeout(() => setDraftUpdated(false), 150);
      prevDraftLenRef.current = draftText.length;
      return () => window.clearTimeout(timer);
    }
    prevDraftLenRef.current = draftText.length;
  }, [draftText, isInterim]);

  useEffect(() => {
    if (prevVariantRef.current === 'interim' && variant === 'active') {
      setJustFinalized(true);
      const timer = window.setTimeout(() => setJustFinalized(false), 150);
      prevVariantRef.current = variant;
      return () => window.clearTimeout(timer);
    }
    prevVariantRef.current = variant;
  }, [variant]);

  const textColor = isHistory ? 'var(--color-text-muted)' : 'var(--color-text)';

  return (
    <article className="mb-6 last:mb-0">
      <p
        className={`leading-[var(--caption-line-height)] ${
          isHistory
            ? 'caption-history font-normal'
            : 'font-bold tracking-tight'
        } ${justFinalized ? 'caption-just-finalized' : ''}`}
        style={{
          fontSize: isHistory ? 'var(--caption-font-size-history)' : 'var(--caption-font-size)',
        }}
      >
        {committedText && (
          <span style={{ color: textColor }}>{committedText}</span>
        )}
        {hasDraft && (
          <>
            {committedText ? ' ' : null}
            <span
              className={`caption-draft${draftUpdated ? ' caption-draft-updated' : ''}`}
              style={{ color: isInterim ? 'var(--color-text-muted)' : textColor }}
            >
              {draftText}
            </span>
          </>
        )}
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
