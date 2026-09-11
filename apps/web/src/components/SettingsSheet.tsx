import { useEffect, useRef } from 'react';
import type { TextSize, Theme } from '../hooks/usePreferences';
import { CloseIcon } from './icons';
import { PrivacyNotice } from './PrivacyNotice';

interface SettingsSheetProps {
  open: boolean;
  theme: Theme;
  textSize: TextSize;
  onClose: () => void;
  onThemeChange: (theme: Theme) => void;
  onTextSizeChange: (size: TextSize) => void;
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light (default)' },
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
    if (open) closeButtonRef.current?.focus();
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
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ backgroundColor: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl p-6 sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--color-modal-bg)',
          color: 'var(--color-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 id="settings-title" className="text-xl font-bold">
            Settings
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--color-subtle)] hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2"
            aria-label="Close settings"
          >
            <CloseIcon />
          </button>
        </div>

        <fieldset className="mb-6 space-y-3">
          <legend className="mb-2 text-sm text-[var(--color-subtle)]">Theme</legend>
          {THEMES.map((t) => (
            <label
              key={t.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-modal-hover)]"
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
          <legend className="mb-2 text-sm text-[var(--color-subtle)]">Text size preset</legend>
          {TEXT_SIZES.map((s) => (
            <label
              key={s.value}
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-modal-hover)]"
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

        <p className="mt-6 text-xs text-[var(--color-subtle)]">
          Use A− and A+ at the bottom of the screen for quick size changes.
        </p>

        <div
          className="mt-6 border-t pt-4"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <PrivacyNotice className="!px-0" />
        </div>
      </div>
    </div>
  );
}
