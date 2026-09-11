import { useCallback, useState } from 'react';
import { CaptionDisplay } from './components/CaptionDisplay';
import { ClearCaptionsButton } from './components/ClearCaptionsButton';
import { ControlBar } from './components/ControlBar';
import { ErrorBanner } from './components/ErrorBanner';
import { BrandMark, SettingsIcon } from './components/icons';
import { LatencyDebugPanel } from './components/LatencyDebugPanel';
import { PrivacyNotice } from './components/PrivacyNotice';
import { SessionIndicator } from './components/SessionIndicator';
import { SettingsSheet } from './components/SettingsSheet';
import { useCaptionSession, type SessionStatus } from './hooks/useCaptionSession';
import { usePreferences } from './hooks/usePreferences';
import { useWakeLock } from './hooks/useWakeLock';

const STATUS_ANNOUNCEMENTS: Partial<Record<SessionStatus, string>> = {
  requesting_mic: 'Requesting microphone',
  listening: 'Listening',
  reconnecting: 'Reconnecting',
};

export default function App() {
  const {
    preferences,
    setTheme,
    setTextSize,
    setHistoryLimit,
    increaseTextSize,
    decreaseTextSize,
    canIncreaseTextSize,
    canDecreaseTextSize,
  } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  const session = useCaptionSession();
  useWakeLock(session.isActive);

  const handleStart = useCallback(async () => {
    setDismissedError(false);
    await session.start();
  }, [session]);

  const handleStop = useCallback(() => {
    session.stop();
  }, [session]);

  const handleClearCaptions = useCallback(() => {
    if (session.status === 'idle') {
      session.clearCaptions();
    }
  }, [session]);

  const visibleError = session.error && !dismissedError ? session.error : null;
  const hasCaptions = session.history.length > 0 || session.live !== null;
  const showClearCaptions = session.status === 'idle' && hasCaptions;

  return (
    <div className="flex h-full min-h-[100dvh] flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <a href="#captions" className="skip-link">
        Skip to captions
      </a>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {STATUS_ANNOUNCEMENTS[session.status] ?? ''}
      </p>

      <header
        className="relative flex items-center justify-center px-4 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="absolute left-4">
          <SessionIndicator status={session.status} />
        </div>

        <h1 className="flex items-center gap-2 text-base font-bold tracking-wide">
          <BrandMark size={20} className="text-[var(--color-accent)]" />
          Live Captions
        </h1>

        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full text-[var(--color-subtle)] transition-colors hover:text-[var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="Open settings"
        >
          <SettingsIcon />
        </button>
      </header>

      <LatencyDebugPanel />

      <ErrorBanner
        error={visibleError}
        onDismiss={() => setDismissedError(true)}
        onRetry={handleStart}
      />

      <CaptionDisplay
        history={session.history}
        live={session.live}
        status={session.status}
        historyLimit={preferences.historyLimit}
      />

      {showClearCaptions && <ClearCaptionsButton onClear={handleClearCaptions} />}

      <ControlBar
        isActive={session.isActive}
        isLoading={session.status === 'requesting_mic'}
        disabled={session.status === 'requesting_mic'}
        canDecreaseTextSize={canDecreaseTextSize}
        canIncreaseTextSize={canIncreaseTextSize}
        onStart={handleStart}
        onStop={handleStop}
        onDecreaseTextSize={decreaseTextSize}
        onIncreaseTextSize={increaseTextSize}
      />

      <div style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <PrivacyNotice />
      </div>

      <SettingsSheet
        open={settingsOpen}
        theme={preferences.theme}
        textSize={preferences.textSize}
        historyLimit={preferences.historyLimit}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={setTheme}
        onTextSizeChange={setTextSize}
        onHistoryLimitChange={setHistoryLimit}
      />
    </div>
  );
}
