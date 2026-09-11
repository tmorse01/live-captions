import { useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorEvent, ServerMessage } from '@live-captions/contracts';
import { AudioCapture, int16ToBase64 } from '../audio/capture';
import { useMicrophone } from '../audio/useMicrophone';
import {
  CaptionSession,
  type CaptionViewState,
  type HistoryBlock,
  type LiveCaption,
} from '../realtime/caption-session';
import { RealtimeClient, type ConnectionState } from '../realtime/client';
import { getWsUrl } from '../realtime/ws-url';
import { latencyTracker } from '../realtime/latency';

export type SessionStatus =
  | 'idle'
  | 'requesting_mic'
  | 'listening'
  | 'reconnecting'
  | 'error';

export type { HistoryBlock, LiveCaption, CaptionViewState };

export function useCaptionSession() {
  const mic = useMicrophone();
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [captionView, setCaptionView] = useState<CaptionViewState>({
    history: [],
    live: null,
  });
  const [error, setError] = useState<ErrorEvent | null>(null);

  const clientRef = useRef<RealtimeClient | null>(null);
  const captureRef = useRef<AudioCapture | null>(null);
  const sessionRef = useRef(new CaptionSession());

  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'transcript': {
        latencyTracker.onTranscript(message);
        const view = sessionRef.current.apply(message);
        setCaptionView(view);
        latencyTracker.onRenderComplete();
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

    sessionRef.current.reset();
    setCaptionView({ history: [], live: null });
    latencyTracker.startSession();

    const client = new RealtimeClient({
      url: getWsUrl(),
      onMessage: handleServerMessage,
      onConnectionChange: (state) => {
        setConnectionState(state);
        if (state === 'reconnecting') {
          setStatus('reconnecting');
          const view = sessionRef.current.clearLiveInterim();
          setCaptionView(view);
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
        latencyTracker.onCapture();
        client.sendAudio(int16ToBase64(pcm), timestampMs);
        latencyTracker.onAudioSent();
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
    latencyTracker.logSummary();
    captureRef.current?.stop();
    captureRef.current = null;
    clientRef.current?.stop();
    clientRef.current?.disconnect();
    clientRef.current = null;
    const view = sessionRef.current.endSession();
    setCaptionView(view);
    setStatus('idle');
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    if (status !== 'listening' && status !== 'reconnecting') return;

    const timer = setInterval(() => {
      const view = sessionRef.current.tick();
      setCaptionView((prev) => {
        if (
          prev.history.length === view.history.length &&
          prev.live?.committedText === view.live?.committedText &&
          prev.live?.draftText === view.live?.draftText &&
          prev.live?.isInterim === view.live?.isInterim
        ) {
          return prev;
        }
        return view;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    return () => {
      captureRef.current?.stop();
      clientRef.current?.disconnect();
    };
  }, []);

  const clearCaptions = useCallback(() => {
    const view = sessionRef.current.reset();
    setCaptionView(view);
  }, []);

  return {
    status,
    connectionState,
    micPermission: mic.permission,
    history: captionView.history,
    live: captionView.live,
    error,
    start,
    stop,
    clearCaptions,
    isActive: status === 'listening' || status === 'reconnecting',
  };
}
