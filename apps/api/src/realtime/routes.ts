import type { FastifyInstance } from 'fastify';
import {
  createSpeechProviderFactory,
  getSpeechProviderMode,
} from '../speech/google-speech.js';
import { RealtimeSession } from './session.js';

const factory = createSpeechProviderFactory();

export function getActiveSpeechMode(): string {
  return getSpeechProviderMode();
}

export async function registerRealtimeRoutes(app: FastifyInstance): Promise<void> {
  app.get('/ws', { websocket: true }, (socket) => {
    const session = new RealtimeSession(socket, factory);

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
