import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        lockRef.current = await navigator.wakeLock.request('screen');
      } catch {
        // Unsupported or permission denied — no-op
      }
    };

    void acquire();

    const onVisibilityChange = () => {
      if (cancelled || document.visibilityState !== 'visible') return;
      void acquire();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, [active]);
}
