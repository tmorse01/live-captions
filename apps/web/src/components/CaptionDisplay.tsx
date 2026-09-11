import { useEffect, useRef } from 'react';
import type { CaptionLine as CaptionLineType } from '../realtime/transcript-buffer';
import { computeCaptionLayout, getActiveLineKey } from '../realtime/caption-layout';
import { CaptionLine } from './CaptionLine';

interface CaptionDisplayProps {
  finalizedLines: CaptionLineType[];
  interimLine: CaptionLineType | null;
  status: string;
}

export function CaptionDisplay({ finalizedLines, interimLine, status }: CaptionDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeEndRef = useRef<HTMLDivElement>(null);
  const prevActiveTextRef = useRef('');

  const { historyLines, activeLine, activeVariant } = computeCaptionLayout(
    finalizedLines,
    interimLine,
  );

  const activeText = activeLine?.text ?? '';

  useEffect(() => {
    if (activeText.length >= prevActiveTextRef.current.length) {
      activeEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
    prevActiveTextRef.current = activeText;
  }, [activeText, historyLines.length]);

  const isEmpty = finalizedLines.length === 0 && !interimLine;

  return (
    <section
      id="captions"
      className="flex flex-1 flex-col overflow-hidden px-5 pb-2 pt-4"
      aria-label="Live captions"
    >
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        {historyLines.length > 0 && (
          <div aria-live="off" className="mb-4">
            {historyLines.map((line) => (
              <CaptionLine
                key={getActiveLineKey(line)}
                committedText={line.committedText || line.text}
                draftText={line.draftText}
                variant="history"
                timestampMs={line.timestampMs}
              />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col justify-end" ref={activeEndRef}>
          {activeLine && activeVariant && (
            <div aria-live="polite" aria-atomic="true">
              <CaptionLine
                key={getActiveLineKey(activeLine)}
                committedText={activeLine.committedText || activeLine.text}
                draftText={activeLine.draftText}
                variant={activeVariant}
                timestampMs={activeVariant === 'active' ? activeLine.timestampMs : undefined}
              />
            </div>
          )}

          {isEmpty && status === 'idle' && (
            <p className="text-center text-base text-[var(--color-subtle)]">Tap Start to begin captioning</p>
          )}

          {isEmpty && status === 'listening' && (
            <p className="text-center text-base text-[var(--color-subtle)]">Listening…</p>
          )}

          {status === 'requesting_mic' && (
            <p className="text-center text-base text-[var(--color-subtle)]">Requesting microphone…</p>
          )}

          {status === 'reconnecting' && (
            <p className="text-center text-base text-amber-500">Reconnecting…</p>
          )}
        </div>
      </div>
    </section>
  );
}
