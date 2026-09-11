import type { TranscriptEvent } from '@live-captions/contracts';

export type LatencyRating = 'good' | 'ok' | 'bad';

export interface LatencyThresholds {
  good: number;
  ok: number;
}

export const LATENCY_THRESHOLDS = {
  firstInterim: { good: 800, ok: 1500 },
  firstFinal: { good: 2000, ok: 3500 },
  captureToReceiveP50: { good: 600, ok: 1200 },
  receiveToRenderP50: { good: 16, ok: 50 },
  captureToReceiveP95: { good: 800, ok: 1500 },
} as const;

export function rateLatency(ms: number, thresholds: LatencyThresholds): LatencyRating {
  if (ms <= thresholds.good) return 'good';
  if (ms <= thresholds.ok) return 'ok';
  return 'bad';
}

export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)] ?? null;
}

export interface LatencyUpdate {
  captureToSend: number;
  sendToReceive: number;
  receiveToRender: number;
  captureToReceive: number;
  isFinal: boolean;
}

export interface RollingStats {
  captureToReceiveP50: number | null;
  captureToReceiveP95: number | null;
  receiveToRenderP50: number | null;
  receiveToRenderP95: number | null;
  sampleCount: number;
}

export interface SessionSummary {
  firstInterimMs: number | null;
  firstFinalMs: number | null;
  lastUpdate: LatencyUpdate | null;
  rolling: RollingStats;
  hasHighLatency: boolean;
}

const ROLLING_WINDOW = 20;

export const EMPTY_SESSION_SUMMARY: SessionSummary = {
  firstInterimMs: null,
  firstFinalMs: null,
  lastUpdate: null,
  rolling: {
    captureToReceiveP50: null,
    captureToReceiveP95: null,
    receiveToRenderP50: null,
    receiveToRenderP95: null,
    sampleCount: 0,
  },
  hasHighLatency: false,
};

function isEnabled(): boolean {
  return import.meta.env.VITE_LATENCY_DEBUG === 'true';
}

export class LatencyTracker {
  private enabled: boolean;
  private listeners = new Set<() => void>();
  private sessionStartMs: number | null = null;
  private lastCaptureMs: number | null = null;
  private lastSendMs: number | null = null;
  private lastReceiveMs: number | null = null;

  private firstInterimMs: number | null = null;
  private firstFinalMs: number | null = null;

  private captureToReceiveSamples: number[] = [];
  private receiveToRenderSamples: number[] = [];
  private lastUpdate: LatencyUpdate | null = null;
  private cachedSnapshot: SessionSummary = EMPTY_SESSION_SUMMARY;

  private now: () => number;

  constructor(enabled = isEnabled(), now: () => number = () => performance.now()) {
    this.enabled = enabled;
    this.now = now;
    this.rebuildSnapshot();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.rebuildSnapshot();
    for (const listener of this.listeners) {
      listener();
    }
  }

  private rebuildSnapshot(): void {
    const rolling: RollingStats = {
      captureToReceiveP50: percentile(this.captureToReceiveSamples, 50),
      captureToReceiveP95: percentile(this.captureToReceiveSamples, 95),
      receiveToRenderP50: percentile(this.receiveToRenderSamples, 50),
      receiveToRenderP95: percentile(this.receiveToRenderSamples, 95),
      sampleCount: this.captureToReceiveSamples.length,
    };

    const hasHighLatency =
      (this.firstInterimMs !== null &&
        rateLatency(this.firstInterimMs, LATENCY_THRESHOLDS.firstInterim) === 'bad') ||
      (rolling.captureToReceiveP95 !== null &&
        rateLatency(rolling.captureToReceiveP95, LATENCY_THRESHOLDS.captureToReceiveP95) ===
          'bad');

    this.cachedSnapshot = {
      firstInterimMs: this.firstInterimMs,
      firstFinalMs: this.firstFinalMs,
      lastUpdate: this.lastUpdate ? { ...this.lastUpdate } : null,
      rolling: { ...rolling },
      hasHighLatency,
    };
  }

  startSession(): void {
    if (!this.enabled) return;
    this.sessionStartMs = this.now();
    this.lastCaptureMs = null;
    this.lastSendMs = null;
    this.lastReceiveMs = null;
    this.firstInterimMs = null;
    this.firstFinalMs = null;
    this.captureToReceiveSamples = [];
    this.receiveToRenderSamples = [];
    this.lastUpdate = null;
    this.notify();
  }

  onCapture(): void {
    if (!this.enabled) return;
    this.lastCaptureMs = this.now();
  }

  onAudioSent(): void {
    if (!this.enabled) return;
    this.lastSendMs = this.now();
  }

  onTranscript(event: TranscriptEvent): void {
    if (!this.enabled || this.sessionStartMs === null) return;

    const now = this.now();
    this.lastReceiveMs = now;

    const captureToSend =
      this.lastCaptureMs !== null && this.lastSendMs !== null
        ? this.lastSendMs - this.lastCaptureMs
        : 0;
    const sendToReceive =
      this.lastSendMs !== null ? now - this.lastSendMs : 0;
    const captureToReceive =
      this.lastCaptureMs !== null ? now - this.lastCaptureMs : sendToReceive;

    if (!event.isFinal && this.firstInterimMs === null) {
      this.firstInterimMs = now - this.sessionStartMs;
    }
    if (event.isFinal && this.firstFinalMs === null) {
      this.firstFinalMs = now - this.sessionStartMs;
    }

    this.lastUpdate = {
      captureToSend,
      sendToReceive,
      receiveToRender: 0,
      captureToReceive,
      isFinal: event.isFinal,
    };

    this.captureToReceiveSamples.push(captureToReceive);
    if (this.captureToReceiveSamples.length > ROLLING_WINDOW) {
      this.captureToReceiveSamples.shift();
    }

    this.notify();
  }

  onRenderComplete(): void {
    if (!this.enabled || !this.lastUpdate || this.lastReceiveMs === null) return;

    const now = this.now();
    const receiveToRender = now - this.lastReceiveMs;
    this.lastUpdate = { ...this.lastUpdate, receiveToRender };

    this.receiveToRenderSamples.push(receiveToRender);
    if (this.receiveToRenderSamples.length > ROLLING_WINDOW) {
      this.receiveToRenderSamples.shift();
    }

    this.logUpdate(this.lastUpdate);
    this.notify();
  }

  private logUpdate(update: LatencyUpdate): void {
    const kind = update.isFinal ? 'final' : 'interim';
    console.debug(
      `[latency] ${kind} capture→receive: ${update.captureToReceive.toFixed(0)}ms` +
        ` (${rateLatency(update.captureToReceive, LATENCY_THRESHOLDS.captureToReceiveP50).toUpperCase()})` +
        ` · receive→render: ${update.receiveToRender.toFixed(0)}ms`,
    );
  }

  /** Stable reference for useSyncExternalStore — only changes when notify() runs. */
  getSnapshot(): SessionSummary {
    return this.cachedSnapshot;
  }

  getSessionSummary(): SessionSummary {
    return this.getSnapshot();
  }

  logSummary(): void {
    if (!this.enabled) return;
    const s = this.getSessionSummary();
    console.debug('[latency] session summary', {
      firstInterimMs: s.firstInterimMs,
      firstFinalMs: s.firstFinalMs,
      rollingP50: s.rolling.captureToReceiveP50,
      rollingP95: s.rolling.captureToReceiveP95,
    });
  }

  reset(): void {
    this.startSession();
  }
}

export const latencyTracker = new LatencyTracker();

export function isLatencyDebugEnabled(): boolean {
  return isEnabled();
}
