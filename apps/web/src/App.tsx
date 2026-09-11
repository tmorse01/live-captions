import { useCallback, useState } from 'react';
import { CaptionDisplay } from './components/CaptionDisplay';
import { ErrorBanner } from './components/ErrorBanner';
import { LatencyDebugPanel } from './components/LatencyDebugPanel';
import { PrivacyNotice } from './components/PrivacyNotice';
import { SettingsSheet } from './components/SettingsSheet';
import { StartStopButton } from './components/StartStopButton';
import { StatusIndicator } from './components/StatusIndicator';
import { useCaptionSession } from './hooks/useCaptionSession';
import { usePreferences } from './hooks/usePreferences';

export default function App() {
  const { preferences, setTheme, setTextSize } = usePreferences();
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

  return (
    <div className="flex h-full min-h-[100dvh] flex-col">
      <a href="#captions" className="skip-link">
        Skip to captions
      </a>
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <h1 className="text-lg font-semibold">Live Captions</h1>
        <div className="flex items-center gap-4">
          <StatusIndicator status={session.status} connectionState={session.connectionState} />
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="min-h-[44px] min-w-[44px] rounded-lg px-3 py-2 text-sm focus:outline-none focus-visible:ring-2"
            aria-label="Open settings"
          >
            Settings
          </button>
        </div>
      </header>

      <LatencyDebugPanel />

      <ErrorBanner error={visibleError} onDismiss={() => setDismissedError(true)} />

      <CaptionDisplay
        finalizedLines={session.finalizedLines}
        interimLine={session.interimLine}
        status={session.status}
      />

      <footer className="flex flex-col items-center gap-4 px-4 py-6">
        <StartStopButton
          isActive={session.isActive}
          disabled={session.status === 'requesting_mic'}
          onStart={handleStart}
          onStop={handleStop}
        />
        <PrivacyNotice />
      </footer>

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
