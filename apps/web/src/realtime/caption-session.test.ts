import { describe, expect, it } from 'vitest';
import {
  CaptionSession,
  hasFlushSubstance,
  MAX_HISTORY_BLOCKS,
} from './caption-session';

function finalEvent(
  text: string,
  utteranceId: string,
  timestampMs: number,
  id = 't1',
) {
  return {
    type: 'transcript' as const,
    id,
    utteranceId,
    text,
    isFinal: true,
    timestampMs,
  };
}

function interimEvent(
  text: string,
  utteranceId: string,
  timestampMs: number,
  id = 't1',
) {
  return {
    type: 'transcript' as const,
    id,
    utteranceId,
    text,
    isFinal: false,
    timestampMs,
  };
}

describe('CaptionSession', () => {
  it('integration: multiple ASR finals become one history paragraph', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('I think', 'u1', 1000, '1'));
    session.apply(finalEvent('we should', 'u2', 1500, '2'));
    session.apply(finalEvent('go to the park.', 'u3', 2000, '3'));
    expect(session.getViewState().history).toHaveLength(0);

    session.tick(7000);

    const view = session.getViewState();
    expect(view.history).toHaveLength(1);
    expect(view.history[0]?.text).toBe('I think we should go to the park.');
    expect(view.live).toBeNull();
  });

  it('accumulates multiple ASR finals into one pending live caption', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('I think', 'u1', 1000, '1'));
    session.apply(finalEvent('we should', 'u2', 1500, '2'));
    session.apply(finalEvent('go to the park.', 'u3', 2000, '3'));

    const view = session.getViewState();
    expect(view.history).toHaveLength(0);
    expect(view.live?.committedText).toBe('I think we should go to the park.');
    expect(view.live?.isInterim).toBe(false);
  });

  it('flushes one history paragraph after pause', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('I think we should go to the park.', 'u1', 1000));
    session.tick(6000);

    const view = session.getViewState();
    expect(view.history).toHaveLength(1);
    expect(view.history[0]?.text).toBe('I think we should go to the park.');
    expect(view.live).toBeNull();
  });

  it('commits displaced short fragments to history so nothing vanishes', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('and then', 'u1', 1000));
    session.apply(interimEvent('we walked to the store today', 'u2', 6000, '2'));

    const view = session.getViewState();
    expect(view.history).toHaveLength(1);
    expect(view.history[0]?.text).toBe('and then');
    const liveText = `${view.live?.committedText ?? ''} ${view.live?.draftText ?? ''}`.trim();
    expect(liveText).toContain('we walked');
  });

  it('commits displaced medium pending immediately instead of merging later', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('one two three four five six', 'u1', 1000));
    session.apply(interimEvent('alpha beta gamma delta', 'u2', 1100, '2'));
    session.apply(finalEvent('alpha beta gamma delta epsilon zeta.', 'u2', 2000, '3'));
    session.tick(10000);

    const view = session.getViewState();
    expect(view.history).toHaveLength(2);
    expect(view.history[0]?.text).toBe('one two three four five six');
    expect(view.history[1]?.text).toBe('alpha beta gamma delta epsilon zeta.');
  });

  it('flushes to history immediately when new speech displaces pending', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('One two three four five six seven.', 'u1', 1000));
    session.apply(
      interimEvent('alpha beta gamma delta epsilon', 'u2', 1200, '2'),
    );

    const view = session.getViewState();
    expect(view.history).toHaveLength(1);
    expect(view.history[0]?.text).toBe('One two three four five six seven.');
    expect(view.live?.isInterim).toBe(true);
    const liveText = `${view.live?.committedText ?? ''} ${view.live?.draftText ?? ''}`.trim();
    expect(liveText).toContain('alpha');
  });

  it('folds pending into live when same utterance resumes', () => {
    const session = new CaptionSession();

    session.apply(finalEvent('Hello there', 'u1', 1000));
    session.apply(interimEvent('Hello there friend', 'u1', 1100, '2'));

    const view = session.getViewState();
    expect(view.history).toHaveLength(0);
    const liveText = `${view.live?.committedText ?? ''} ${view.live?.draftText ?? ''}`.trim();
    expect(liveText).toMatch(/Hello there friend/);
  });

  it('caps history at MAX_HISTORY_BLOCKS', () => {
    const session = new CaptionSession();

    for (let i = 0; i < MAX_HISTORY_BLOCKS + 5; i++) {
      const text = `Paragraph number ${i} with enough words to flush properly.`;
      session.apply(finalEvent(text, `u${i}`, i * 10000));
      session.tick(i * 10000 + 5000);
    }

    expect(session.getViewState().history).toHaveLength(MAX_HISTORY_BLOCKS);
  });

  it('preserves interim merge policy on live caption', () => {
    const session = new CaptionSession();

    session.apply(interimEvent('Good morning, how are', 'u1', 1000));
    session.apply(interimEvent('Good morning, how', 'u1', 1100));

    const view = session.getViewState();
    expect(view.live?.committedText).toBe('Good morning, how');
    expect(view.live?.draftText).toBe('are');
  });
});

describe('hasFlushSubstance', () => {
  it('requires eight words or a punctuated sentence', () => {
    expect(hasFlushSubstance('one two three four five six seven eight')).toBe(true);
    expect(hasFlushSubstance('Hello there my good friend.')).toBe(true);
    expect(hasFlushSubstance('short bit')).toBe(false);
  });
});
