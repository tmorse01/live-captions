import type { WebSocket } from 'ws';
import {
  parseClientMessage,
  type ErrorEvent,
  type ServerMessage,
  type StatusEvent,
} from '@live-captions/contracts';
import type { SpeechProvider, SpeechProviderFactory } from '../speech/provider.js';

function send(socket: WebSocket, message: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function sendStatus(socket: WebSocket, state: StatusEvent['state']): void {
  send(socket, { type: 'status', state });
}

function sendError(
  socket: WebSocket,
  code: string,
  message: string,
  recoverable: boolean,
): void {
  const event: ErrorEvent = { type: 'error', code, message, recoverable };
  send(socket, event);
}

export class RealtimeSession {
  private socket: WebSocket;
  private factory: SpeechProviderFactory;
  private speech: SpeechProvider | null = null;
  private active = false;

  constructor(socket: WebSocket, factory: SpeechProviderFactory) {
    this.socket = socket;
    this.factory = factory;
  }

  handleMessage(raw: string | Buffer): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString());
    } catch {
      sendError(this.socket, 'INVALID_JSON', 'Invalid message format', false);
      return;
    }

    let message;
    try {
      message = parseClientMessage(parsed);
    } catch {
      sendError(this.socket, 'INVALID_MESSAGE', 'Invalid message schema', false);
      return;
    }

    switch (message.type) {
      case 'start':
        this.startSession();
        break;
      case 'stop':
        this.stopSession();
        break;
      case 'ping':
        sendStatus(this.socket, 'listening');
        break;
      case 'audio':
        if (this.active && this.speech) {
          const buffer = Buffer.from(message.data, 'base64');
          this.speech.writeAudio(buffer);
        }
        break;
    }
  }

  private startSession(): void {
    if (this.active) return;

    this.speech = this.factory.createSession();
    this.active = true;
    sendStatus(this.socket, 'listening');

    this.speech.start({
      onTranscript: (event) => send(this.socket, event),
      onError: (err) => {
        sendError(this.socket, 'SPEECH_ERROR', err.message, true);
        sendStatus(this.socket, 'idle');
        this.cleanupSpeech();
      },
    });
  }

  private stopSession(): void {
    this.cleanupSpeech();
    sendStatus(this.socket, 'idle');
  }

  private cleanupSpeech(): void {
    if (this.speech) {
      this.speech.stop();
      this.speech = null;
    }
    this.active = false;
  }

  dispose(): void {
    this.cleanupSpeech();
  }
}
