import { useCallback, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'high-contrast';
export type TextSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface Preferences {
  theme: Theme;
  textSize: TextSize;
}

const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  textSize: 'medium',
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
  }, [preferences]);

  const setTheme = useCallback((theme: Theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setTextSize = useCallback((textSize: TextSize) => {
    setPreferences((prev) => ({ ...prev, textSize }));
  }, []);

  useEffect(() => {
    localStorage.setItem('live-captions-prefs', JSON.stringify(preferences));
  }, [preferences]);

  return { preferences, setTheme, setTextSize };
}
