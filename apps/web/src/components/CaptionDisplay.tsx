import { useCallback, useEffect, useRef } from 'react';
import type { HistoryBlock, LiveCaption } from '../hooks/useCaptionSession';
import { CaptionLine } from './CaptionLine';
import { IdlePrompt } from './IdlePrompt';

interface CaptionDisplayProps {
  history: HistoryBlock[];
  live: LiveCaption | null;
  status: string;
}

const SCROLL_PIN_THRESHOLD_PX = 48;

export function CaptionDisplay({ history, live, status }: CaptionDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveAnchorRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const prevLiveTextRef = useRef('');

  const liveText = live
    ? live.draftText
      ? `${live.committedText} ${live.draftText}`.trim()
      : live.committedText
    : '';

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    userScrolledUpRef.current = distanceFromBottom > SCROLL_PIN_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (userScrolledUpRef.current) return;
    if (liveText.length < prevLiveTextRef.current.length && history.length === 0) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    liveAnchorRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'end',
    });
    prevLiveTextRef.current = liveText;
  }, [liveText, history.length]);

  const isEmpty = history.length === 0 && !live;

  return (
    <section
      id="captions"
      className="flex flex-1 flex-col overflow-hidden px-5 pb-2 pt-4"
      aria-label="Live captions"
    >
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
      >
        {history.length > 0 && (
          <div aria-live="off" className="mb-4">
            {history.map((block) => (
              <CaptionLine
                key={block.id}
                committedText={block.text}
                variant="history"
                timestampMs={block.flushedAtMs}
              />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col justify-end" ref={liveAnchorRef}>
          {live && (
            <div aria-live="polite" aria-atomic="true">
              <CaptionLine
                key={live.utteranceId}
                committedText={live.committedText}
                draftText={live.draftText}
                variant={live.isInterim ? 'interim' : 'active'}
              />
            </div>
          )}

          {isEmpty && status === 'idle' && <IdlePrompt />}

          {isEmpty && status === 'listening' && (
            <p className="text-center text-base text-[var(--color-subtle)]">Listening…</p>
          )}

          {status === 'requesting_mic' && (
            <p className="text-center text-base text-[var(--color-subtle)]">Requesting microphone…</p>
          )}
        </div>
      </div>
    </section>
  );
}
