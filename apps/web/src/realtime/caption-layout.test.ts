import { describe, expect, it } from 'vitest';
import type { CaptionLine } from './transcript-buffer';
import { computeCaptionLayout } from './caption-layout';

function line(
  id: string,
  text: string,
  opts: { utteranceId?: string; isFinal?: boolean; timestampMs?: number } = {},
): CaptionLine {
  return {
    id,
    utteranceId: opts.utteranceId ?? id,
    committedText: text,
    draftText: '',
    text,
    isFinal: opts.isFinal ?? true,
    timestampMs: opts.timestampMs,
  };
}

describe('computeCaptionLayout', () => {
  it('shows only active line while first phrase is interim', () => {
    const layout = computeCaptionLayout([], {
      id: 'u1',
      utteranceId: 'u1',
      committedText: 'Hello',
      draftText: '',
      text: 'Hello',
      isFinal: false,
    });

    expect(layout.historyLines).toHaveLength(0);
    expect(layout.activeLine?.text).toBe('Hello');
    expect(layout.activeVariant).toBe('interim');
  });

  it('keeps finalized phrase active until next utterance', () => {
    const finalized = [line('u1', 'First phrase.', { utteranceId: 'u1' })];
    const layout = computeCaptionLayout(finalized, null);

    expect(layout.historyLines).toHaveLength(0);
    expect(layout.activeLine?.text).toBe('First phrase.');
    expect(layout.activeVariant).toBe('active');
  });

  it('does not duplicate previous phrase when new utterance starts', () => {
    const finalized = [line('u1', 'First phrase.', { utteranceId: 'u1' })];
    const layout = computeCaptionLayout(finalized, {
      id: 'u2',
      utteranceId: 'u2',
      committedText: 'G',
      draftText: '',
      text: 'G',
      isFinal: false,
    });

    expect(layout.historyLines).toHaveLength(1);
    expect(layout.historyLines[0]?.text).toBe('First phrase.');
    expect(layout.activeLine?.text).toBe('G');
    expect(layout.activeVariant).toBe('interim');
  });

  it('avoids threshold flip-flop that showed two large lines then demoted', () => {
    const finalized = [line('u1', 'First phrase.', { utteranceId: 'u1' })];

    const earlyInterim = computeCaptionLayout(finalized, {
      id: 'u2',
      utteranceId: 'u2',
      committedText: 'Go',
      draftText: '',
      text: 'Go',
      isFinal: false,
    });

    const laterInterim = computeCaptionLayout(finalized, {
      id: 'u2',
      utteranceId: 'u2',
      committedText: 'Good',
      draftText: 'morning',
      text: 'Good morning',
      isFinal: false,
    });

    expect(earlyInterim.historyLines).toEqual(laterInterim.historyLines);
    expect(earlyInterim.historyLines).toHaveLength(1);
    expect(earlyInterim.activeVariant).toBe('interim');
    expect(laterInterim.activeVariant).toBe('interim');
  });

  it('transitions interim to active on finalize without layout duplication', () => {
    const finalized = [line('u1', 'Hello there.', { utteranceId: 'u1' })];
    const afterFinal = computeCaptionLayout(finalized, null);

    expect(afterFinal.historyLines).toHaveLength(0);
    expect(afterFinal.activeLine?.utteranceId).toBe('u1');
    expect(afterFinal.activeVariant).toBe('active');
  });
});
