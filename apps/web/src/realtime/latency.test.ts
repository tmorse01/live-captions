import { describe, expect, it } from 'vitest';
import {
  LatencyTracker,
  LATENCY_THRESHOLDS,
  percentile,
  rateLatency,
} from './latency';

describe('rateLatency', () => {
  it('rates values against thresholds', () => {
    const t = LATENCY_THRESHOLDS.firstInterim;
    expect(rateLatency(500, t)).toBe('good');
    expect(rateLatency(1000, t)).toBe('ok');
    expect(rateLatency(2000, t)).toBe('bad');
  });
});

describe('percentile', () => {
  it('returns null for empty arrays', () => {
    expect(percentile([], 50)).toBeNull();
  });

  it('computes p50 and p95', () => {
    const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    expect(percentile(values, 50)).toBe(500);
    expect(percentile(values, 95)).toBe(1000);
  });
});

describe('LatencyTracker', () => {
  it('is a no-op when disabled', () => {
    const tracker = new LatencyTracker(false);
    tracker.startSession();
    tracker.onCapture();
    tracker.onAudioSent();
    tracker.onTranscript({
      type: 'transcript',
      id: '1',
      text: 'hi',
      isFinal: false,
      timestampMs: Date.now(),
    });
    expect(tracker.getSessionSummary().firstInterimMs).toBeNull();
  });

  it('records first interim and final milestones', () => {
    let clock = 0;
    const tracker = new LatencyTracker(true, () => clock);

    tracker.startSession();

    clock = 10;
    tracker.onCapture();
    tracker.onAudioSent();
    clock = 510;
    tracker.onTranscript({
      type: 'transcript',
      id: '1',
      text: 'hello',
      isFinal: false,
      timestampMs: Date.now(),
    });
    tracker.onRenderComplete();

    expect(tracker.getSessionSummary().firstInterimMs).toBe(510);

    clock = 1510;
    tracker.onCapture();
    tracker.onAudioSent();
    clock = 1810;
    tracker.onTranscript({
      type: 'transcript',
      id: '2',
      text: 'hello world',
      isFinal: true,
      timestampMs: Date.now(),
    });
    tracker.onRenderComplete();

    expect(tracker.getSessionSummary().firstFinalMs).toBe(1810);
  });

  it('returns stable snapshot reference until notify', () => {
    const tracker = new LatencyTracker(true);
    const a = tracker.getSnapshot();
    const b = tracker.getSnapshot();
    expect(a).toBe(b);
  });

  it('flags high latency when first interim is bad', () => {
    let clock = 0;
    const tracker = new LatencyTracker(true, () => clock);
    tracker.startSession();

    clock = 2000;
    tracker.onCapture();
    tracker.onAudioSent();
    tracker.onTranscript({
      type: 'transcript',
      id: '1',
      text: 'slow',
      isFinal: false,
      timestampMs: Date.now(),
    });

    expect(tracker.getSessionSummary().hasHighLatency).toBe(true);
  });
});
