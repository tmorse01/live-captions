import { useCallback, useState } from 'react';

export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface MicrophoneState {
  permission: MicPermissionState;
  error: string | null;
}

function getMicErrorMessage(err: unknown): string {
  if (!window.isSecureContext) {
    return 'Microphone requires HTTPS on this device. Run pnpm dev:network and use the https:// LAN URL.';
  }

  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
        return 'Microphone access was blocked. Check browser site settings and allow the microphone, then tap Start again.';
      case 'NotFoundError':
        return 'No microphone found on this device.';
      case 'NotReadableError':
        return 'Microphone is in use by another app.';
      default:
        return err.message || 'Microphone access denied';
    }
  }

  return err instanceof Error ? err.message : 'Microphone access denied';
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

    if (!window.isSecureContext) {
      setState({
        permission: 'unsupported',
        error:
          'Microphone requires HTTPS on this device. Run pnpm dev:network and open the https:// LAN address from the terminal.',
      });
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      stream.getTracks().forEach((track) => track.stop());
      setState({ permission: 'granted', error: null });
      return true;
    } catch (err) {
      setState({ permission: 'denied', error: getMicErrorMessage(err) });
      return false;
    }
  }, []);

  return { ...state, requestPermission };
}
