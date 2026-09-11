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

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [finalizedLines, interimLine]);

  const isEmpty = finalizedLines.length === 0 && !interimLine;

  return (
    <section
      id="captions"
      className="flex flex-1 flex-col justify-end overflow-hidden px-4 pb-4 pt-2"
      aria-label="Live captions"
    >
      <div
        ref={scrollRef}
        className="flex max-h-full flex-col gap-3 overflow-y-auto overscroll-contain"
      >
        <div aria-live="off" aria-atomic="false">
          {finalizedLines.map((line) => (
            <CaptionLine key={line.id} text={line.text} isFinal={true} />
          ))}
        </div>

        {interimLine && (
          <div aria-live="polite" aria-atomic="true">
            <CaptionLine text={interimLine.text} isFinal={false} />
          </div>
        )}

        {isEmpty && status === 'idle' && (
          <p className="text-center text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Tap Start to begin captioning
          </p>
        )}

        {isEmpty && status === 'listening' && (
          <p className="text-center text-lg" style={{ color: 'var(--color-text-muted)' }}>
            Listening…
          </p>
        )}
      </div>
    </section>
  );
}
