import type { FastifyInstance } from 'fastify';
import type { SpeechProviderFactory } from '../speech/provider.js';
import {
  createSpeechProviderFactory,
  getSpeechProviderMode,
} from '../speech/google-speech.js';
import { RealtimeSession } from './session.js';

let factory: SpeechProviderFactory | null = null;

function getFactory(): SpeechProviderFactory {
  if (!factory) {
    factory = createSpeechProviderFactory();
  }
  return factory;
}

export function getActiveSpeechMode(): string {
  return getSpeechProviderMode();
}

export async function registerRealtimeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws', { websocket: true }, (socket) => {
    const session = new RealtimeSession(socket, getFactory());

    socket.on('message', (raw) => {
      const data = Buffer.isBuffer(raw)
        ? raw
        : Array.isArray(raw)
          ? Buffer.concat(raw)
          : Buffer.from(raw as ArrayBuffer);
      session.handleMessage(data);
    });

    socket.on('close', () => {
      session.dispose();
    });

    socket.on('error', () => {
      session.dispose();
    });
  });
}
