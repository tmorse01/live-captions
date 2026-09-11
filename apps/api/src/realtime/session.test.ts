import { describe, expect, it } from 'vitest';
import type { SpeechProvider, SpeechProviderCallbacks, SpeechProviderFactory } from '../speech/provider.js';
import { RealtimeSession } from './session.js';

class FakeSocket {
  readyState = 1;
  OPEN = 1;
  sent: string[] = [];
  handlers: Record<string, ((...args: unknown[]) => void)[]> = {};

  send(data: string) {
    this.sent.push(data);
  }

  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers[event] = this.handlers[event] ?? [];
    this.handlers[event].push(handler);
  }

  lastSent() {
    return JSON.parse(this.sent[this.sent.length - 1]!);
  }
}

class TestSpeechProvider implements SpeechProvider {
  callbacks: SpeechProviderCallbacks | null = null;

  start(callbacks: SpeechProviderCallbacks) {
    this.callbacks = callbacks;
  }

  writeAudio() {}

  stop() {
    this.callbacks = null;
  }
}

class TestFactory implements SpeechProviderFactory {
  provider = new TestSpeechProvider();

  createSession() {
    return this.provider;
  }
}

describe('RealtimeSession', () => {
  it('starts session and sends listening status', () => {
    const socket = new FakeSocket();
    const factory = new TestFactory();
    const session = new RealtimeSession(socket as unknown as import('ws').WebSocket, factory);

    session.handleMessage(JSON.stringify({ type: 'start' }));

    expect(socket.lastSent()).toEqual({ type: 'status', state: 'listening' });
  });

  it('forwards transcript events from speech provider', () => {
    const socket = new FakeSocket();
    const factory = new TestFactory();
    const session = new RealtimeSession(socket as unknown as import('ws').WebSocket, factory);

    session.handleMessage(JSON.stringify({ type: 'start' }));
    factory.provider.callbacks?.onTranscript({
      type: 'transcript',
      id: '1',
      text: 'hello',
      isFinal: false,
      timestampMs: Date.now(),
    });

    const last = socket.lastSent();
    expect(last.type).toBe('transcript');
    expect(last.text).toBe('hello');
  });

  it('cleans up on stop', () => {
    const socket = new FakeSocket();
    const factory = new TestFactory();
    const session = new RealtimeSession(socket as unknown as import('ws').WebSocket, factory);

    session.handleMessage(JSON.stringify({ type: 'start' }));
    session.handleMessage(JSON.stringify({ type: 'stop' }));

    expect(socket.lastSent()).toEqual({ type: 'status', state: 'idle' });
    expect(factory.provider.callbacks).toBeNull();
  });
});
