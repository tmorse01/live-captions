import type { TranscriptEvent } from '@live-captions/contracts';

export interface CaptionLine {
  id: string;
  text: string;
  isFinal: boolean;
  timestampMs?: number;
}

const MAX_FINALIZED_LINES = 8;

export class TranscriptBuffer {
  private finalized: CaptionLine[] = [];
  private interim: CaptionLine | null = null;

  apply(event: TranscriptEvent): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    if (event.isFinal) {
      this.finalized = [
        ...this.finalized,
        {
          id: event.id,
          text: event.text,
          isFinal: true,
          timestampMs: event.timestampMs,
        },
      ].slice(-MAX_FINALIZED_LINES);
      this.interim = null;
    } else {
      this.interim = { id: event.id, text: event.text, isFinal: false };
    }

    return this.getState();
  }

  clearInterim(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    this.interim = null;
    return this.getState();
  }

  reset(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    this.finalized = [];
    this.interim = null;
    return this.getState();
  }

  getState(): { finalized: CaptionLine[]; interim: CaptionLine | null } {
    return {
      finalized: [...this.finalized],
      interim: this.interim ? { ...this.interim } : null,
    };
  }
}
