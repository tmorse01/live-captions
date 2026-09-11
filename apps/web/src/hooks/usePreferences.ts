import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';
export type TextSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type HistoryLimit = 3 | 5 | 10 | 'all';

export interface Preferences {
  theme: Theme;
  textSize: TextSize;
  historyLimit: HistoryLimit;
}

export const TEXT_SIZE_MIN = 1;
export const TEXT_SIZE_MAX = 10;

const LEGACY_TEXT_SIZES: Record<string, TextSize> = {
  small: 2,
  medium: 4,
  large: 5,
  xlarge: 6,
};

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  textSize: 4,
  historyLimit: 'all',
};

function isTextSize(value: unknown): value is TextSize {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= TEXT_SIZE_MIN &&
    value <= TEXT_SIZE_MAX
  );
}

export function parseTextSize(value: unknown): TextSize {
  if (isTextSize(value)) return value;
  if (typeof value === 'string') {
    const legacy = LEGACY_TEXT_SIZES[value];
    if (legacy) return legacy;
    const numeric = Number(value);
    if (isTextSize(numeric)) return numeric;
  }
  return DEFAULT_PREFERENCES.textSize;
}

const THEME_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#000000',
  'high-contrast': '#000000',
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = localStorage.getItem('live-captions-prefs');
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Preferences>;
        return {
          ...DEFAULT_PREFERENCES,
          ...parsed,
          textSize: parseTextSize(parsed.textSize),
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.textSize = String(preferences.textSize);

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', THEME_COLORS[preferences.theme]);
    }
  }, [preferences]);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setPreferences((prev) => ({ ...prev, textSize: parseTextSize(textSize) }));
  }, []);

  const setHistoryLimit = useCallback((historyLimit: HistoryLimit) => {
    setPreferences((prev) => ({ ...prev, historyLimit }));
  }, []);

  const increaseTextSize = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      textSize: Math.min(prev.textSize + 1, TEXT_SIZE_MAX) as TextSize,
    }));
  }, []);

  const decreaseTextSize = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      textSize: Math.max(prev.textSize - 1, TEXT_SIZE_MIN) as TextSize,
    }));
  }, []);

  const canIncreaseTextSize = preferences.textSize < TEXT_SIZE_MAX;
  const canDecreaseTextSize = preferences.textSize > TEXT_SIZE_MIN;

  useEffect(() => {
    localStorage.setItem('live-captions-prefs', JSON.stringify(preferences));
  }, [preferences]);

  return {
    preferences,
    setTheme,
    setTextSize,
    setHistoryLimit,
    increaseTextSize,
    decreaseTextSize,
    canIncreaseTextSize,
    canDecreaseTextSize,
  };
}
