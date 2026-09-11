import type { CaptionLine } from './transcript-buffer';

export type ActiveVariant = 'active' | 'interim';

export interface CaptionLayout {
  historyLines: CaptionLine[];
  activeLine: CaptionLine | null;
  activeVariant: ActiveVariant | null;
}

/**
 * Derive history vs single active slot from buffer state.
 *
 * When a new utterance starts, the previous finalized line moves to history
 * immediately (no threshold delay) so it never flashes large→small mid-phrase.
 */
export function computeCaptionLayout(
  finalizedLines: CaptionLine[],
  interimLine: CaptionLine | null,
): CaptionLayout {
  const lastFinalized =
    finalizedLines.length > 0 ? finalizedLines[finalizedLines.length - 1]! : null;

  if (interimLine) {
    const isNewUtterance = Boolean(
      lastFinalized?.utteranceId &&
        interimLine.utteranceId &&
        interimLine.utteranceId !== lastFinalized.utteranceId,
    );

    return {
      historyLines: isNewUtterance ? finalizedLines : finalizedLines.slice(0, -1),
      activeLine: interimLine,
      activeVariant: 'interim',
    };
  }

  if (lastFinalized) {
    return {
      historyLines: finalizedLines.slice(0, -1),
      activeLine: lastFinalized,
      activeVariant: 'active',
    };
  }

  return {
    historyLines: [],
    activeLine: null,
    activeVariant: null,
  };
}

export function getActiveLineKey(line: CaptionLine): string {
  return line.utteranceId ?? line.id;
}
