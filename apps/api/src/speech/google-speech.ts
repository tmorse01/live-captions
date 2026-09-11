import { SpeechClient, type protos } from '@google-cloud/speech';
import type { TranscriptEvent } from '@live-captions/contracts';
import type {
  SpeechProvider,
  SpeechProviderCallbacks,
  SpeechProviderFactory,
} from './provider.js';
import { speechConfig } from './provider.js';

type StreamingRecognizeStream = ReturnType<SpeechClient['streamingRecognize']>;

class GoogleSpeechProvider implements SpeechProvider {
  private client: SpeechClient;
  private stream: StreamingRecognizeStream | null = null;
  private callbacks: SpeechProviderCallbacks | null = null;
  private transcriptCounter = 0;
  private utteranceCounter = 0;
  private currentUtteranceId = '';
  private lastWasFinal = true;

  constructor(client: SpeechClient) {
    this.client = client;
  }

  start(callbacks: SpeechProviderCallbacks): void {
    this.callbacks = callbacks;
    this.transcriptCounter = 0;
    this.utteranceCounter = 0;
    this.currentUtteranceId = '';
    this.lastWasFinal = true;

    this.stream = this.client.streamingRecognize({
      config: {
        encoding: speechConfig.encoding,
        sampleRateHertz: speechConfig.sampleRateHertz,
        languageCode: speechConfig.languageCode,
        enableAutomaticPunctuation: speechConfig.enableAutomaticPunctuation,
      },
      interimResults: speechConfig.interimResults,
    });

    this.stream.on('data', (response: protos.google.cloud.speech.v1.IStreamingRecognizeResponse) => {
      const result = response.results?.[0];
      if (!result?.alternatives?.[0]) return;

      const alternative = result.alternatives[0];
      const text = alternative.transcript ?? '';
      if (!text.trim()) return;

      const isFinal = Boolean(result.isFinal);
      if (this.lastWasFinal || !this.currentUtteranceId) {
        this.currentUtteranceId = `u-${++this.utteranceCounter}`;
      }
      this.lastWasFinal = isFinal;

      const stability =
        !isFinal && typeof result.stability === 'number' ? result.stability : undefined;

      const event: TranscriptEvent = {
        type: 'transcript',
        id: `t-${++this.transcriptCounter}`,
        utteranceId: this.currentUtteranceId,
        text,
        isFinal,
        timestampMs: Date.now(),
        ...(stability !== undefined ? { stability } : {}),
      };

      this.callbacks?.onTranscript(event);
    });

    this.stream.on('error', (err: Error) => {
      this.callbacks?.onError(err);
    });
  }

  writeAudio(chunk: Buffer): void {
    this.stream?.write(chunk);
  }

  stop(): void {
    if (this.stream) {
      this.stream.end();
      this.stream.removeAllListeners();
      this.stream = null;
    }
    this.callbacks = null;
  }
}

export class GoogleSpeechProviderFactory implements SpeechProviderFactory {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient();
  }

  createSession(): SpeechProvider {
    return new GoogleSpeechProvider(this.client);
  }
}

export class MockSpeechProvider implements SpeechProvider {
  private interval: ReturnType<typeof setInterval> | null = null;
  private counter = 0;
  private phrases = [
    'Hello',
    'Hello there',
    'Hello there, how',
    'Hello there, how are you?',
  ];

  start(callbacks: SpeechProviderCallbacks): void {
    this.counter = 0;
    let phraseIndex = 0;
    let utteranceCounter = 0;
    let currentUtteranceId = '';

    this.interval = setInterval(() => {
      const text = this.phrases[phraseIndex % this.phrases.length]!;
      const isFinal = phraseIndex % this.phrases.length === this.phrases.length - 1;

      if (phraseIndex % this.phrases.length === 0) {
        currentUtteranceId = `mock-u-${++utteranceCounter}`;
      }

      callbacks.onTranscript({
        type: 'transcript',
        id: `mock-${++this.counter}`,
        utteranceId: currentUtteranceId,
        text,
        isFinal,
        timestampMs: Date.now(),
        ...(!isFinal ? { stability: 0.4 + (phraseIndex % this.phrases.length) * 0.1 } : {}),
      });

      phraseIndex++;
      if (phraseIndex >= this.phrases.length * 3) {
        this.stop();
      }
    }, 800);
  }

  writeAudio(): void {
    // Mock provider ignores audio
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export class MockSpeechProviderFactory implements SpeechProviderFactory {
  createSession(): SpeechProvider {
    return new MockSpeechProvider();
  }
}

export type SpeechProviderMode = 'google' | 'mock';

function hasGcpCredentials(): boolean {
  return Boolean(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_SERVICE_ACCOUNT_JSON,
  );
}

export function getSpeechProviderMode(): SpeechProviderMode {
  if (process.env.USE_MOCK_SPEECH === 'true') {
    return 'mock';
  }
  if (!hasGcpCredentials()) {
    return 'mock';
  }
  return 'google';
}

export function createSpeechProviderFactory(): SpeechProviderFactory {
  const mode = getSpeechProviderMode();
  if (mode === 'mock') {
    const reason = process.env.USE_MOCK_SPEECH === 'true'
      ? 'USE_MOCK_SPEECH=true'
      : 'no GCP credentials found';
    console.warn(`[speech] Using mock provider: ${reason}`);
    return new MockSpeechProviderFactory();
  }
  return new GoogleSpeechProviderFactory();
}
