import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface Preferences {
  theme: Theme;
  textSize: TextSize;
}

const TEXT_SIZE_ORDER: TextSize[] = ['small', 'medium', 'large', 'xlarge'];

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'light',
  textSize: 'medium',
};

const THEME_COLORS: Record<Theme, string> = {
  light: '#ffffff',
  dark: '#000000',
  'high-contrast': '#000000',
};

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try {
      const stored = localStorage.getItem('live-captions-prefs');
      if (stored) return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    } catch {
      // ignore
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.dataset.textSize = preferences.textSize;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', THEME_COLORS[preferences.theme]);
    }
  }, [preferences]);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setPreferences((prev) => ({ ...prev, textSize }));
  }, []);

  const increaseTextSize = useCallback(() => {
    setPreferences((prev) => {
      const index = TEXT_SIZE_ORDER.indexOf(prev.textSize);
      const next = TEXT_SIZE_ORDER[Math.min(index + 1, TEXT_SIZE_ORDER.length - 1)]!;
      return { ...prev, textSize: next };
    });
  }, []);

  const decreaseTextSize = useCallback(() => {
    setPreferences((prev) => {
      const index = TEXT_SIZE_ORDER.indexOf(prev.textSize);
      const next = TEXT_SIZE_ORDER[Math.max(index - 1, 0)]!;
      return { ...prev, textSize: next };
    });
  }, []);

  const canIncreaseTextSize =
    TEXT_SIZE_ORDER.indexOf(preferences.textSize) < TEXT_SIZE_ORDER.length - 1;
  const canDecreaseTextSize = TEXT_SIZE_ORDER.indexOf(preferences.textSize) > 0;

  useEffect(() => {
    localStorage.setItem('live-captions-prefs', JSON.stringify(preferences));
  }, [preferences]);

  return {
    preferences,
    setTheme,
    setTextSize,
    increaseTextSize,
    decreaseTextSize,
    canIncreaseTextSize,
    canDecreaseTextSize,
  };
}
