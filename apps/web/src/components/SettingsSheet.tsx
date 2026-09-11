import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import {
  TEXT_SIZE_MAX,
  TEXT_SIZE_MIN,
  parseTextSize,
  type HistoryLimit,
  type TextSize,
  type Theme,
} from '../hooks/usePreferences';
import { CloseIcon } from './icons';
import { PrivacyNotice } from './PrivacyNotice';

interface SettingsSheetProps {
  open: boolean;
  theme: Theme;
  textSize: TextSize;
  historyLimit: HistoryLimit;
  onClose: () => void;
  onThemeChange: (theme: Theme) => void;
  onTextSizeChange: (size: TextSize) => void;
  onHistoryLimitChange: (limit: HistoryLimit) => void;
}

const THEMES: { value: Theme; label: string }[] = [
  { value: 'light', label: 'Light (default)' },
  { value: 'dark', label: 'Dark' },
  { value: 'high-contrast', label: 'High contrast' },
];

const THEME_SWATCHES: Record<Theme, { bg: string; text: string; accent: string }> = {
  light: { bg: '#ffffff', text: '#1a1a1a', accent: '#115e59' },
  dark: { bg: '#000000', text: '#ffffff', accent: '#2dd4bf' },
  'high-contrast': { bg: '#000000', text: '#ffffff', accent: '#ffff00' },
};

const HISTORY_LIMITS: { value: HistoryLimit; label: string }[] = [
  { value: 3, label: 'Last 3 lines' },
  { value: 5, label: 'Last 5 lines' },
  { value: 10, label: 'Last 10 lines' },
  { value: 'all', label: 'Show all' },
];

function ThemeSwatch({ theme }: { theme: Theme }) {
  const swatch = THEME_SWATCHES[theme];
  return (
    <span className="ml-auto flex gap-1" aria-hidden="true">
      <span
        className="h-4 w-4 rounded-sm border"
        style={{ backgroundColor: swatch.bg, borderColor: swatch.text }}
      />
      <span className="h-4 w-4 rounded-sm" style={{ backgroundColor: swatch.accent }} />
    </span>
  );
}

export function SettingsSheet({
  open,
  theme,
  textSize,
  historyLimit,
  onClose,
  onThemeChange,
  onTextSizeChange,
  onHistoryLimitChange,
}: SettingsSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap(panelRef, open);

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

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
      style={{ backgroundColor: 'var(--color-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="flex w-full max-w-md max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-1rem))] flex-col overflow-hidden rounded-t-2xl sm:max-h-[min(85dvh,calc(100dvh-2rem))] sm:rounded-2xl"
        style={{
          backgroundColor: 'var(--color-modal-bg)',
          color: 'var(--color-text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center justify-between px-6 pb-4 pt-6"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
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

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
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
                <ThemeSwatch theme={t.value} />
              </label>
            ))}
          </fieldset>

          <fieldset className="mb-6">
            <legend className="mb-2 text-sm text-[var(--color-subtle)]">Text size</legend>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-subtle)]">{TEXT_SIZE_MIN}</span>
              <span className="font-bold tabular-nums">
                {textSize} / {TEXT_SIZE_MAX}
              </span>
              <span className="text-[var(--color-subtle)]">{TEXT_SIZE_MAX}</span>
            </div>
            <input
              type="range"
              name="textSize"
              min={TEXT_SIZE_MIN}
              max={TEXT_SIZE_MAX}
              step={1}
              value={textSize}
              onChange={(e) => onTextSizeChange(parseTextSize(Number(e.target.value)))}
              className="text-size-slider mt-2 min-h-[44px] cursor-pointer"
              aria-label="Caption text size"
              aria-valuetext={`Size ${textSize} of ${TEXT_SIZE_MAX}`}
            />
            <div
              data-text-size={String(textSize)}
              className="mt-3 rounded-lg border p-3"
              style={{ borderColor: 'var(--color-border)' }}
              aria-hidden="true"
            >
              <p
                className="break-words font-bold leading-[var(--caption-line-height)] tracking-tight"
                style={{ fontSize: 'var(--caption-font-size)' }}
              >
                Sample caption text
              </p>
              <p
                className="mt-1 break-words text-[var(--color-text-muted)]"
                style={{ fontSize: 'var(--caption-font-size-history)' }}
              >
                Earlier caption line
              </p>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm text-[var(--color-subtle)]">History shown</legend>
            {HISTORY_LIMITS.map((option) => (
              <label
                key={String(option.value)}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--color-modal-hover)]"
              >
                <input
                  type="radio"
                  name="historyLimit"
                  value={option.value}
                  checked={historyLimit === option.value}
                  onChange={() => onHistoryLimitChange(option.value)}
                  className="h-5 w-5"
                />
                {option.label}
              </label>
            ))}
          </fieldset>

          <p className="mt-6 text-xs text-[var(--color-subtle)]">
            Use A− and A+ at the bottom of the screen for quick size changes.
          </p>

          <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
            <PrivacyNotice className="!px-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
