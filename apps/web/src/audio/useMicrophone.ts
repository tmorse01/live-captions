import { useCallback, useState } from 'react';

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface MicrophoneState {
  permission: MicPermissionState;
  error: string | null;
}

export function useMicrophone() {
  const [state, setState] = useState<MicrophoneState>({
    permission: 'prompt',
    error: null,
  });

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ permission: 'unsupported', error: 'Microphone not supported in this browser' });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      setState({ permission: 'granted', error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      setState({ permission: 'denied', error: message });
      return false;
    }
  }, []);

  return { ...state, requestPermission };
}
