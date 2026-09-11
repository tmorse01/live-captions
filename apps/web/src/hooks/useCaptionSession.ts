import { useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorEvent, ServerMessage } from '@live-captions/contracts';
import { AudioCapture, int16ToBase64 } from '../audio/capture';
import { useMicrophone } from '../audio/useMicrophone';
import { RealtimeClient, type ConnectionState } from '../realtime/client';
import { latencyTracker } from '../realtime/latency';
import { TranscriptBuffer, type CaptionLine } from '../realtime/transcript-buffer';

export type SessionStatus =
  | 'idle'
  | 'requesting_mic'
  | 'listening'
  | 'reconnecting'
  | 'error';

export interface CaptionSessionState {
  status: SessionStatus;
  connectionState: ConnectionState;
  micPermission: ReturnType<typeof useMicrophone>['permission'];
  finalizedLines: CaptionLine[];
  interimLine: CaptionLine | null;
  error: ErrorEvent | null;
}

const WS_URL = import.meta.env.VITE_API_WS_URL ?? 'ws://localhost:3001/ws';

export function useCaptionSession() {
  const mic = useMicrophone();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [finalizedLines, setFinalizedLines] = useState<CaptionLine[]>([]);
  const [interimLine, setInterimLine] = useState<CaptionLine | null>(null);
  const [error, setError] = useState<ErrorEvent | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const bufferRef = useRef(new TranscriptBuffer());

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'transcript': {
        latencyTracker.mark('clientReceive');
        latencyTracker.logPipeline('capture', 'clientReceive');
        const state = bufferRef.current.apply(message);
        setFinalizedLines(state.finalized);
        setInterimLine(state.interim);
        latencyTracker.mark('render');
        break;
      }
      case 'status': {
        switch (message.state) {
          case 'listening':
            setStatus('listening');
            break;
          case 'reconnecting':
            setStatus('reconnecting');
            break;
          case 'idle':
            setStatus((prev) => (prev === 'requesting_mic' ? prev : 'idle'));
            break;
          case 'processing':
            break;
        }
        break;
      }
      case 'error':
        setError(message);
        if (!message.recoverable) {
          setStatus('error');
        }
        break;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setStatus('requesting_mic');

    const granted = await mic.requestPermission();
    if (!granted) {
      setStatus('error');
      setError({
        type: 'error',
        code: 'MIC_DENIED',
        message: mic.error ?? 'Microphone access denied',
        recoverable: true,
      });
      return;
    }

    bufferRef.current.reset();
    setFinalizedLines([]);
    setInterimLine(null);
    latencyTracker.reset();

    const client = new RealtimeClient({
      url: WS_URL,
      onMessage: handleServerMessage,
      onConnectionChange: (state) => {
        setConnectionState(state);
        if (state === 'reconnecting') {
          setStatus('reconnecting');
          const cleared = bufferRef.current.clearInterim();
          setInterimLine(cleared.interim);
        }
      },
    });

    clientRef.current = client;
    client.connect();
    client.start();

    const capture = new AudioCapture();
    captureRef.current = capture;

    try {
      await capture.start((pcm, timestampMs) => {
        latencyTracker.mark('capture');
        client.sendAudio(int16ToBase64(pcm), timestampMs);
        latencyTracker.mark('send');
      });
      setStatus('listening');
    } catch (err) {
      setStatus('error');
      setError({
        type: 'error',
        code: 'CAPTURE_FAILED',
        message: err instanceof Error ? err.message : 'Failed to start audio capture',
        recoverable: true,
      });
      client.disconnect();
    }
  }, [handleServerMessage, mic]);

  const stop = useCallback(() => {
    captureRef.current?.stop();
    captureRef.current = null;
    clientRef.current?.stop();
    clientRef.current?.disconnect();
    clientRef.current = null;
    setStatus('idle');
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    return () => {
      captureRef.current?.stop();
      clientRef.current?.disconnect();
    };
  }, []);

  return {
    status,
    connectionState,
    micPermission: mic.permission,
    finalizedLines,
    interimLine,
    error,
    start,
    stop,
    isActive: status === 'listening' || status === 'reconnecting',
  };
}
