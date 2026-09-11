import { useEffect, useRef } from 'react';
import type { CaptionLine as CaptionLineType } from '../realtime/transcript-buffer';
import { CaptionLine } from './CaptionLine';

interface CaptionDisplayProps {
  finalizedLines: CaptionLineType[];
  interimLine: CaptionLineType | null;
  status: string;
}

export function CaptionDisplay({ finalizedLines, interimLine, status }: CaptionDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [finalizedLines, interimLine]);

  const isEmpty = finalizedLines.length === 0 && !interimLine;
  const historyLines = interimLine ? finalizedLines : finalizedLines.slice(0, -1);
  const lastFinalized =
    !interimLine && finalizedLines.length > 0
      ? finalizedLines[finalizedLines.length - 1]
      : null;

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
                key={line.id}
                text={line.text}
                variant="history"
                timestampMs={line.timestampMs}
              />
            ))}
          </div>
        )}

        <div className="mt-auto flex flex-col justify-end" ref={activeEndRef}>
          {interimLine && (
            <div aria-live="polite" aria-atomic="true">
              <CaptionLine text={interimLine.text} variant="interim" />
            </div>
          )}

          {!interimLine && lastFinalized && (
            <div aria-live="polite" aria-atomic="true">
              <CaptionLine text={lastFinalized.text} variant="active" />
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
