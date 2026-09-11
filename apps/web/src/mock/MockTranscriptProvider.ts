import type { TranscriptEvent } from '@live-captions/contracts';

const MOCK_CONVERSATION = [
  { text: 'Good', isFinal: false },
  { text: 'Good morning', isFinal: false },
  { text: 'Good morning, how', isFinal: false },
  { text: 'Good morning, how are you today?', isFinal: true },
  { text: "I'm", isFinal: false },
  { text: "I'm doing", isFinal: false },
  { text: "I'm doing well,", isFinal: false },
  { text: "I'm doing well, thank you.", isFinal: true },
  { text: 'Would', isFinal: false },
  { text: 'Would you like', isFinal: false },
  { text: 'Would you like to grab coffee?', isFinal: true },
];

export class MockTranscriptProvider {
  private interval: ReturnType<typeof setInterval> | null = null;
  private index = 0;
  private counter = 0;

  start(onTranscript: (event: TranscriptEvent) => void): void {
    this.stop();
    this.index = 0;

    this.interval = setInterval(() => {
      const entry = MOCK_CONVERSATION[this.index % MOCK_CONVERSATION.length];
      if (!entry) return;

      onTranscript({
        type: 'transcript',
        id: `mock-${++this.counter}`,
        text: entry.text,
        isFinal: entry.isFinal,
        timestampMs: Date.now(),
      });

      this.index++;
      if (this.index >= MOCK_CONVERSATION.length * 2) {
        this.stop();
      }
    }, 900);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
