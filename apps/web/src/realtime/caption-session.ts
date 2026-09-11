import type { TranscriptEvent } from '@live-captions/contracts';
import {
  createUtteranceState,
  finalizeUtterance,
  getDisplayedText,
  mergeInterim,
  tokenize,
  type UtteranceDisplayState,
} from './transcript-display';

export const MAX_HISTORY_BLOCKS = 20;
export const PAUSE_FLUSH_MS = 4000;
export const MIN_WORDS_SUBSTANCE = 8;
export const MIN_WORDS_SENTENCE = 5;
export const MIN_FRAGMENT_WORDS = 5;

const SENTENCE_END = /[.!?]["')\]]*\s*$/;
const FALLBACK_UTTERANCE_ID = 'utterance-local';

export interface HistoryBlock {
  id: string;
  text: string;
  flushedAtMs: number;
}

export interface LiveCaption {
  committedText: string;
  draftText: string;
  utteranceId: string;
  isInterim: boolean;
}

export interface CaptionViewState {
  history: HistoryBlock[];
  live: LiveCaption | null;
}

interface InternalState {
  history: HistoryBlock[];
  historyCounter: number;
  pendingText: string;
  pendingStartedAtMs: number;
  pendingVisibleSinceMs: number;
  lastEventMs: number;
  utterance: UtteranceDisplayState | null;
  lastFinalUtteranceId: string | null;
}

export function estimatedReadingMs(text: string): number {
  const words = Math.max(1, tokenize(text).length);
  return Math.max(2500, words * 400);
}

export function hasFlushSubstance(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const words = tokenize(trimmed).length;
  if (words >= MIN_WORDS_SUBSTANCE) return true;
  return words >= MIN_WORDS_SENTENCE && SENTENCE_END.test(trimmed);
}

export function isShortFragment(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  const words = tokenize(trimmed).length;
  return words < MIN_FRAGMENT_WORDS && !SENTENCE_END.test(trimmed);
}

function appendPendingText(current: string, addition: string): string {
  const a = current.trimEnd();
  const b = addition.trim();
  if (!a) return b;
  if (!b) return a;
  return `${a} ${b}`;
}

function createHistoryBlock(id: string, text: string, flushedAtMs: number): HistoryBlock {
  return { id, text: text.trim(), flushedAtMs };
}

export class CaptionSession {
  private state: InternalState = this.createInitialState();

  private createInitialState(): InternalState {
    return {
      history: [],
      historyCounter: 0,
      pendingText: '',
      pendingStartedAtMs: 0,
      pendingVisibleSinceMs: 0,
      lastEventMs: 0,
      utterance: null,
      lastFinalUtteranceId: null,
    };
  }

  reset(): CaptionViewState {
    this.state = this.createInitialState();
    return this.getViewState();
  }

  getViewState(): CaptionViewState {
    return {
      history: [...this.state.history],
      live: this.buildLiveCaption(),
    };
  }

  private buildLiveCaption(): LiveCaption | null {
    const pending = this.state.pendingText.trim();

    if (this.state.utterance) {
      const utterance = this.state.utterance;
      // Never hide pending behind interim — prefix it until displacement flush runs.
      const committedText = pending
        ? appendPendingText(pending, utterance.committedText)
        : utterance.committedText;

      return {
        committedText,
        draftText: utterance.draftText,
        utteranceId: utterance.utteranceId,
        isInterim: true,
      };
    }

    if (pending) {
      return {
        committedText: pending,
        draftText: '',
        utteranceId: this.state.lastFinalUtteranceId ?? 'pending',
        isInterim: false,
      };
    }

    return null;
  }

  apply(event: TranscriptEvent, nowMs: number = Date.now()): CaptionViewState {
    const effectiveNow = event.timestampMs || nowMs;
    this.state.lastEventMs = effectiveNow;
    const utteranceId = event.utteranceId ?? FALLBACK_UTTERANCE_ID;

    if (event.isFinal) {
      this.applyFinal(event, utteranceId, effectiveNow);
    } else {
      this.applyInterim(event, utteranceId, effectiveNow);
    }

    return this.getViewState();
  }

  /** Call periodically to flush pending on pause. */
  tick(nowMs: number = Date.now()): CaptionViewState {
    if (
      this.state.pendingText.trim() &&
      nowMs - this.state.lastEventMs >= PAUSE_FLUSH_MS
    ) {
      this.tryFlushPending(nowMs, 'pause');
    }
    return this.getViewState();
  }

  endSession(nowMs: number = Date.now()): CaptionViewState {
    if (this.state.pendingText.trim() && hasFlushSubstance(this.state.pendingText)) {
      this.flushPending(nowMs);
    } else {
      this.clearPending();
    }
    this.state.utterance = null;
    return this.getViewState();
  }

  clearLiveInterim(nowMs: number = Date.now()): CaptionViewState {
    if (this.state.utterance) {
      const text = getDisplayedText(this.state.utterance);
      if (text) {
        this.state.pendingText = appendPendingText(this.state.pendingText, text);
        if (!this.state.pendingStartedAtMs) {
          this.state.pendingStartedAtMs = nowMs;
        }
        this.state.pendingVisibleSinceMs = this.state.pendingVisibleSinceMs || nowMs;
      }
    }
    this.state.utterance = null;
    return this.getViewState();
  }

  private applyFinal(event: TranscriptEvent, utteranceId: string, nowMs: number): void {
    if (!this.state.utterance || this.state.utterance.utteranceId !== utteranceId) {
      this.state.utterance = createUtteranceState(utteranceId);
      this.state.utterance = mergeInterim(this.state.utterance, event.text);
    }

    const finalText = finalizeUtterance(this.state.utterance, event.text);
    this.state.utterance = null;
    this.state.lastFinalUtteranceId = utteranceId;

    if (!this.state.pendingStartedAtMs) {
      this.state.pendingStartedAtMs = nowMs;
      this.state.pendingVisibleSinceMs = nowMs;
    }

    this.state.pendingText = appendPendingText(this.state.pendingText, finalText);

    if (SENTENCE_END.test(finalText.trim()) && hasFlushSubstance(this.state.pendingText)) {
      const visibleFor = nowMs - (this.state.pendingVisibleSinceMs || nowMs);
      if (visibleFor >= estimatedReadingMs(this.state.pendingText)) {
        this.tryFlushPending(nowMs, 'sentence');
      }
    }
  }

  private applyInterim(event: TranscriptEvent, utteranceId: string, nowMs: number): void {
    const pending = this.state.pendingText.trim();

    if (pending) {
      const isNewUtterance =
        Boolean(this.state.lastFinalUtteranceId) &&
        utteranceId !== this.state.lastFinalUtteranceId;

      if (isNewUtterance) {
        // New speech displaces pending from the live slot — flush to history now.
        this.tryFlushPending(nowMs, 'new_utterance');
      } else {
        // Same utterance continues: fold pending into the interim line.
        this.foldPendingIntoUtterance(utteranceId, event.text);
        return;
      }
    }

    if (!this.state.utterance || this.state.utterance.utteranceId !== utteranceId) {
      this.state.utterance = createUtteranceState(utteranceId);
    }

    this.state.utterance = mergeInterim(this.state.utterance, event.text);
  }

  /** Merge pending finals into a resumed interim so text does not vanish from live. */
  private foldPendingIntoUtterance(utteranceId: string, interimText: string): void {
    const pending = this.state.pendingText.trim();
    this.clearPending();

    this.state.utterance = createUtteranceState(utteranceId);
    if (pending) {
      this.state.utterance = mergeInterim(this.state.utterance, pending);
    }
    this.state.utterance = mergeInterim(this.state.utterance, interimText);
  }

  private tryFlushPending(
    nowMs: number,
    reason: 'pause' | 'sentence' | 'new_utterance',
  ): void {
    const pending = this.state.pendingText.trim();
    if (!pending) return;

    if (reason === 'new_utterance') {
      this.flushPending(nowMs, true);
      return;
    }

    if (!hasFlushSubstance(pending)) {
      return;
    }

    const visibleFor = nowMs - (this.state.pendingVisibleSinceMs || nowMs);
    const readTimeMet = visibleFor >= estimatedReadingMs(pending);

    const shouldFlush = reason === 'pause' || (reason === 'sentence' && readTimeMet);

    if (shouldFlush) {
      this.flushPending(nowMs);
    }
  }

  private flushPending(nowMs: number, force = false): void {
    const text = this.state.pendingText.trim();
    if (!text) {
      this.clearPending();
      return;
    }

    if (!force && !hasFlushSubstance(text)) {
      return;
    }

    if (force && !hasFlushSubstance(text)) {
      if (this.state.history.length > 0) {
        const last = this.state.history[this.state.history.length - 1]!;
        this.state.history = [
          ...this.state.history.slice(0, -1),
          createHistoryBlock(last.id, appendPendingText(last.text, text), last.flushedAtMs),
        ];
      } else {
        const block = createHistoryBlock(`h-${++this.state.historyCounter}`, text, nowMs);
        this.state.history = [block];
      }
    } else {
      const block = createHistoryBlock(`h-${++this.state.historyCounter}`, text, nowMs);
      this.state.history = [...this.state.history, block].slice(-MAX_HISTORY_BLOCKS);
    }

    this.clearPending();
  }

  private clearPending(): void {
    this.state.pendingText = '';
    this.state.pendingStartedAtMs = 0;
    this.state.pendingVisibleSinceMs = 0;
  }
}
