import { describe, expect, it } from 'vitest';
import { TranscriptBuffer } from './transcript-buffer';

describe('TranscriptBuffer', () => {
  it('accumulates finalized lines and replaces interim', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      utteranceId: 'u1',
      text: 'Hel',
      isFinal: false,
      timestampMs: 1,
    });
    expect(buffer.getState().interim?.text).toBe('Hel');

    buffer.apply({
      type: 'transcript',
      id: '2',
      utteranceId: 'u1',
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
        utteranceId: `u${i}`,
        text: `line ${i}`,
        isFinal: true,
        timestampMs: i,
      });
    }
    expect(buffer.getState().finalized).toHaveLength(8);
  });

  it('does not shrink interim text on ASR correction', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      utteranceId: 'u1',
      text: 'Good morning, how are',
      isFinal: false,
      timestampMs: 1,
    });
    expect(buffer.getState().interim?.text).toBe('Good morning, how are');

    buffer.apply({
      type: 'transcript',
      id: '2',
      utteranceId: 'u1',
      text: 'Good morning, how',
      isFinal: false,
      timestampMs: 2,
    });

    const interim = buffer.getState().interim;
    expect(interim?.text).toBe('Good morning, how are');
    expect(interim?.committedText).toBe('Good morning, how');
    expect(interim?.draftText).toBe('are');
  });

  it('progressive grow then final', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      utteranceId: 'u1',
      text: 'Good',
      isFinal: false,
      timestampMs: 1,
    });
    buffer.apply({
      type: 'transcript',
      id: '2',
      utteranceId: 'u1',
      text: 'Good morning',
      isFinal: false,
      timestampMs: 2,
    });
    buffer.apply({
      type: 'transcript',
      id: '3',
      utteranceId: 'u1',
      text: 'Good morning, how are you?',
      isFinal: true,
      timestampMs: 3,
    });

    const state = buffer.getState();
    expect(state.finalized).toHaveLength(1);
    expect(state.finalized[0]?.text).toBe('Good morning, how are you?');
    expect(state.interim).toBeNull();
  });

  it('resets draft zone for new utterance after final', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      utteranceId: 'u1',
      text: 'First phrase.',
      isFinal: true,
      timestampMs: 1,
    });
    buffer.apply({
      type: 'transcript',
      id: '2',
      utteranceId: 'u2',
      text: 'Second',
      isFinal: false,
      timestampMs: 2,
    });

    expect(buffer.getState().interim?.text).toBe('Second');
    expect(buffer.getState().finalized).toHaveLength(1);
  });

  it('promotes committed text on clearInterim', () => {
    const buffer = new TranscriptBuffer();

    buffer.apply({
      type: 'transcript',
      id: '1',
      utteranceId: 'u1',
      text: 'Good morning, how are',
      isFinal: false,
      timestampMs: 1,
    });

    const state = buffer.clearInterim();
    expect(state.interim).toBeNull();
    expect(state.finalized).toHaveLength(1);
    expect(state.finalized[0]?.text).toBe('Good morning, how are');
  });
});
