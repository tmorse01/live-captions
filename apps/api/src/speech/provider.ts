import type { TranscriptEvent } from '@live-captions/contracts';
import { AUDIO_ENCODING, AUDIO_SAMPLE_RATE } from '@live-captions/contracts';

export interface SpeechProviderCallbacks {
  onTranscript: (event: TranscriptEvent) => void;
  onError: (error: Error) => void;
}

export interface SpeechProvider {
  start(callbacks: SpeechProviderCallbacks): void;
  writeAudio(chunk: Buffer): void;
  stop(): void;
}

export interface SpeechProviderFactory {
  createSession(): SpeechProvider;
}

export const speechConfig = {
  encoding: AUDIO_ENCODING,
  sampleRateHertz: AUDIO_SAMPLE_RATE,
  languageCode: 'en-US',
  enableAutomaticPunctuation: true,
  interimResults: true,
};
