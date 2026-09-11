import { useEffect, useRef } from 'react';
import type { TextSize, Theme } from '../hooks/usePreferences';

interface SettingsSheetProps {
  open: boolean;
  theme: Theme;
  textSize: TextSize;
  onClose: () => void;
  onThemeChange: (theme: Theme) => void;
  onTextSizeChange: (size: TextSize) => void;
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
];

const TEXT_SIZES: { value: TextSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'xlarge', label: 'Extra large' },
];

export function SettingsSheet({
  open,
  theme,
  textSize,
  onClose,
  onThemeChange,
  onTextSizeChange,
}: SettingsSheetProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      closeButtonRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="settings-title" className="text-xl font-semibold">
            Settings
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2"
            aria-label="Close settings"
          >
            Close
          </button>
        </div>

        <fieldset className="mb-6 space-y-3">
          <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Theme
          </legend>
          {THEMES.map((t) => (
            <label
              key={t.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
            >
              <input
                type="radio"
                name="theme"
                value={t.value}
                checked={theme === t.value}
                onChange={() => onThemeChange(t.value)}
                className="h-5 w-5"
              />
              {t.label}
            </label>
          ))}
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Text size
          </legend>
          {TEXT_SIZES.map((s) => (
            <label
              key={s.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2"
            >
              <input
                type="radio"
                name="textSize"
                value={s.value}
                checked={textSize === s.value}
                onChange={() => onTextSizeChange(s.value)}
                className="h-5 w-5"
              />
              {s.label}
            </label>
          ))}
        </fieldset>
      </div>
    </div>
  );
}
