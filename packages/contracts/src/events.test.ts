import { describe, expect, it } from 'vitest';
import {
  parseClientMessage,
  parseServerMessage,
  safeParseServerMessage,
} from './events.js';

describe('contracts', () => {
  it('parses audio chunk messages', () => {
    const msg = parseClientMessage({
      type: 'audio',
      seq: 1,
      timestampMs: 100,
      data: 'abc123',
    });
    expect(msg.type).toBe('audio');
  });

  it('parses control messages', () => {
    expect(parseClientMessage({ type: 'start' }).type).toBe('start');
    expect(parseClientMessage({ type: 'stop' }).type).toBe('stop');
  });

  it('parses transcript events', () => {
    const event = parseServerMessage({
      type: 'transcript',
      id: 't1',
      utteranceId: 'u1',
      text: 'hello',
      isFinal: false,
      timestampMs: 200,
      stability: 0.7,
    });
    expect(event.type).toBe('transcript');
    if (event.type === 'transcript') {
      expect(event.text).toBe('hello');
      expect(event.utteranceId).toBe('u1');
      expect(event.stability).toBe(0.7);
    }
  });

  it('returns null for invalid server messages', () => {
    expect(safeParseServerMessage({ type: 'unknown' })).toBeNull();
  });
});
