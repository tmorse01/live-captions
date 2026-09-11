import type { TranscriptEvent } from '@live-captions/contracts';
import {
  createUtteranceState,
  finalizeUtterance,
  getDisplayedText,
  mergeInterim,
  type UtteranceDisplayState,
} from './transcript-display';

export interface CaptionLine {
  id: string;
  committedText: string;
  draftText: string;
  isFinal: boolean;
  timestampMs?: number;
  utteranceId?: string;
  /** Full display string for finalized lines and convenience accessors */
  text: string;
}

const MAX_FINALIZED_LINES = 8;
const FALLBACK_UTTERANCE_ID = 'utterance-local';

function toCaptionLine(
  id: string,
  segment: { committedText: string; draftText: string },
  opts: { isFinal: boolean; timestampMs?: number; utteranceId?: string },
): CaptionLine {
  return {
    id,
    committedText: segment.committedText,
    draftText: segment.draftText,
    text: getDisplayedText(segment),
    isFinal: opts.isFinal,
    timestampMs: opts.timestampMs,
    utteranceId: opts.utteranceId,
  };
}

export class TranscriptBuffer {
  private finalized: CaptionLine[] = [];
  private interim: CaptionLine | null = null;
  private utterance: UtteranceDisplayState | null = null;

  apply(event: TranscriptEvent): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    const utteranceId = event.utteranceId ?? FALLBACK_UTTERANCE_ID;

    if (event.isFinal) {
      if (!this.utterance || this.utterance.utteranceId !== utteranceId) {
        this.utterance = createUtteranceState(utteranceId);
        this.utterance = mergeInterim(this.utterance, event.text);
      }

      const finalText = finalizeUtterance(this.utterance, event.text);
      this.finalized = [
        ...this.finalized,
        toCaptionLine(utteranceId, { committedText: finalText, draftText: '' }, {
          isFinal: true,
          timestampMs: event.timestampMs,
          utteranceId,
        }),
      ].slice(-MAX_FINALIZED_LINES);

      this.interim = null;
      this.utterance = null;
    } else {
      if (!this.utterance || this.utterance.utteranceId !== utteranceId) {
        this.utterance = createUtteranceState(utteranceId);
      }

      this.utterance = mergeInterim(this.utterance, event.text);
      this.interim = toCaptionLine(utteranceId, {
          committedText: this.utterance.committedText,
          draftText: this.utterance.draftText,
        },
        { isFinal: false, utteranceId },
      );
    }

    return this.getState();
  }

  clearInterim(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    if (this.interim && this.utterance) {
      const promotedText = getDisplayedText(this.utterance);
      if (promotedText) {
        this.finalized = [
          ...this.finalized,
          toCaptionLine(
            this.interim.id,
            { committedText: promotedText, draftText: '' },
            {
              isFinal: true,
              timestampMs: Date.now(),
              utteranceId: this.utterance.utteranceId,
            },
          ),
        ].slice(-MAX_FINALIZED_LINES);
      }
    }

    this.interim = null;
    this.utterance = null;
    return this.getState();
  }

  reset(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    this.finalized = [];
    this.interim = null;
    this.utterance = null;
    return this.getState();
  }

  getState(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    return {
      finalized: [...this.finalized],
      interim: this.interim ? { ...this.interim } : null,
    };
  }
}
