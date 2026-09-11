import { describe, expect, it } from 'vitest';
import { TranscriptBuffer } from './transcript-buffer';

describe('TranscriptBuffer', () => {
  it('accumulates finalized lines and replaces interim', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      text: 'Hel',
      isFinal: false,
      timestampMs: 1,
    });
    expect(buffer.getState().interim?.text).toBe('Hel');

    buffer.apply({
      type: 'transcript',
      id: '1',
      text: 'Hello',
      isFinal: true,
      timestampMs: 2,
    });

    const state = buffer.getState();
    expect(state.finalized).toHaveLength(1);
    expect(state.finalized[0]?.text).toBe('Hello');
    expect(state.interim).toBeNull();
  });

  it('limits finalized lines', () => {
    const buffer = new TranscriptBuffer();
    for (let i = 0; i < 12; i++) {
      buffer.apply({
        type: 'transcript',
        id: String(i),
        text: `line ${i}`,
        isFinal: true,
        timestampMs: i,
      });
    }
    expect(buffer.getState().finalized).toHaveLength(8);
  });
});
