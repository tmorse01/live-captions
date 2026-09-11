import { describe, expect, it } from 'vitest';
import {
  createUtteranceState,
  finalizeUtterance,
  getDisplayedText,
  mergeInterim,
} from './transcript-display';

describe('transcript-display merge policy', () => {
  it('progressively grows interim text', () => {
    let state = createUtteranceState('u1');

    state = mergeInterim(state, 'Good');
    expect(getDisplayedText(state)).toBe('Good');

    state = mergeInterim(state, 'Good morning');
    expect(getDisplayedText(state)).toBe('Good morning');

    state = mergeInterim(state, 'Good morning, how are you?');
    expect(getDisplayedText(state)).toBe('Good morning, how are you?');
  });

  it('does not shrink displayed text on ASR correction', () => {
    let state = createUtteranceState('u1');

    state = mergeInterim(state, 'Good morning, how are');
    expect(getDisplayedText(state)).toBe('Good morning, how are');

    state = mergeInterim(state, 'Good morning, how');
    expect(getDisplayedText(state)).toBe('Good morning, how are');
    expect(getDisplayedText(state).length).toBeGreaterThanOrEqual('Good morning, how are'.length);
  });

  it('locks stable prefix across two consecutive updates', () => {
    let state = createUtteranceState('u1');

    state = mergeInterim(state, 'Hello');
    state = mergeInterim(state, 'Hello there');

    expect(state.committedText).toBe('Hello');
    expect(state.draftText).toBe('there');
  });

  it('finalizes with longest text', () => {
    let state = createUtteranceState('u1');
    state = mergeInterim(state, 'Hello there');

    expect(finalizeUtterance(state, 'Hello there!')).toBe('Hello there!');
    expect(finalizeUtterance(state, 'Hello')).toBe('Hello there');
  });

});
