import { useCallback, useState } from 'react';
import { CaptionDisplay } from './components/CaptionDisplay';
import { ControlBar } from './components/ControlBar';
import { ErrorBanner } from './components/ErrorBanner';
import { SettingsIcon } from './components/icons';
import { LatencyDebugPanel } from './components/LatencyDebugPanel';
import { ListeningIndicator } from './components/ListeningIndicator';
import { SettingsSheet } from './components/SettingsSheet';
import { useCaptionSession } from './hooks/useCaptionSession';
import { usePreferences } from './hooks/usePreferences';

export default function App() {
  const {
    preferences,
    setTheme,
    setTextSize,
    increaseTextSize,
    decreaseTextSize,
    canIncreaseTextSize,
    canDecreaseTextSize,
  } = usePreferences();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dismissedError, setDismissedError] = useState(false);

  const session = useCaptionSession();

  const handleStart = useCallback(async () => {
    setDismissedError(false);
    await session.start();
  }, [session]);

  const handleStop = useCallback(() => {
    session.stop();
  }, [session]);

  const visibleError = session.error && !dismissedError ? session.error : null;
  const isListening = session.status === 'listening' || session.status === 'reconnecting';

  return (
    <div className="flex h-full min-h-[100dvh] flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
      <a href="#captions" className="skip-link">
        Skip to captions
      </a>

      <header
        className="relative flex items-center justify-center px-4 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <div className="absolute left-4">
          <ListeningIndicator active={isListening} />
        </div>

        <h1 className="text-base font-medium tracking-wide">Live Captions</h1>

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

      <ErrorBanner error={visibleError} onDismiss={() => setDismissedError(true)} />

      <CaptionDisplay
        finalizedLines={session.finalizedLines}
        interimLine={session.interimLine}
        status={session.status}
      />

      <ControlBar
        isActive={session.isActive}
        disabled={session.status === 'requesting_mic'}
        canDecreaseTextSize={canDecreaseTextSize}
        canIncreaseTextSize={canIncreaseTextSize}
        onStart={handleStart}
        onStop={handleStop}
        onDecreaseTextSize={decreaseTextSize}
        onIncreaseTextSize={increaseTextSize}
      />

      <SettingsSheet
        open={settingsOpen}
        theme={preferences.theme}
        textSize={preferences.textSize}
        onClose={() => setSettingsOpen(false)}
        onThemeChange={setTheme}
        onTextSizeChange={setTextSize}
      />
    </div>
  );
}
