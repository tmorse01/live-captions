export interface UtteranceDisplayState {
  utteranceId: string;
  committedText: string;
  draftText: string;
  rawLatest: string;
  lastRawWords: string[];
}

export interface DisplaySegment {
  committedText: string;
  draftText: string;
}

export function getDisplayedText(segment: DisplaySegment): string {
  if (!segment.draftText) return segment.committedText;
  if (!segment.committedText) return segment.draftText;
  return `${segment.committedText} ${segment.draftText}`;
}

export function tokenize(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function commonWordPrefix(a: string[], b: string[]): number {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}

export function createUtteranceState(utteranceId: string): UtteranceDisplayState {
  return {
    utteranceId,
    committedText: '',
    draftText: '',
    rawLatest: '',
    lastRawWords: [],
  };
}

/**
 * Merge an interim transcript into committed + draft segments.
 * Displayed text never shrinks within the same utterance.
 */
export function mergeInterim(
  state: UtteranceDisplayState,
  rawText: string,
): UtteranceDisplayState {
  const trimmed = rawText.trim();
  if (!trimmed) return state;

  const newWords = tokenize(trimmed);
  const prevDisplayed = getDisplayedText(state);
  const prevWords = tokenize(prevDisplayed);

  const stablePrefix = commonWordPrefix(state.lastRawWords, newWords);
  const prevCommittedCount = tokenize(state.committedText).length;
  const committedWordCount = Math.max(prevCommittedCount, stablePrefix);

  const committedWords = pickWords(newWords, prevWords, committedWordCount);
  const committedText = committedWords.join(' ');

  const newDraftWords = newWords.slice(committedWords.length);
  let draftText = newDraftWords.join(' ');

  const newDisplayed = getDisplayedText({ committedText, draftText });
  if (newDisplayed.length < prevDisplayed.length && prevDisplayed.length > 0) {
    const preservedPrefix = commonWordPrefix(prevWords, newWords);
    const lockedCount = Math.max(committedWordCount, preservedPrefix);
    const lockedWords = pickWords(newWords, prevWords, lockedCount);
    const lockedText = lockedWords.join(' ');
    draftText = prevDisplayed.slice(lockedText.length).trimStart();
    if (draftText && lockedText) {
      // draftText is already the suffix after locked portion
    } else if (!draftText && prevDisplayed.length > lockedText.length) {
      draftText = prevDisplayed.slice(lockedText.length).trimStart();
    }

    return {
      ...state,
      committedText: lockedText,
      draftText,
      rawLatest: trimmed,
      lastRawWords: newWords,
    };
  }

  return {
    ...state,
    committedText,
    draftText,
    rawLatest: trimmed,
    lastRawWords: newWords,
  };
}

function pickWords(newWords: string[], prevWords: string[], count: number): string[] {
  if (count <= 0) return [];
  const fromNew = newWords.slice(0, count);
  if (fromNew.length >= count) return fromNew;
  const fromPrev = prevWords.slice(0, count);
  return fromPrev.length >= count ? fromPrev : fromNew.concat(fromPrev.slice(fromNew.length));
}

/**
 * Finalize an utterance — prefer final text when longer than displayed.
 */
export function finalizeUtterance(
  state: UtteranceDisplayState,
  finalText: string,
): string {
  const trimmed = finalText.trim();
  const displayed = getDisplayedText(state);
  if (!trimmed) return displayed;
  return trimmed.length >= displayed.length ? trimmed : displayed;
}
