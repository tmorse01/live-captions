export interface LatencyMark {
  stage: string;
  timestampMs: number;
}

class LatencyTracker {
  private marks: LatencyMark[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.VITE_LATENCY_DEBUG === 'true';
  }

  mark(stage: string): void {
    if (!this.enabled) return;
    this.marks.push({ stage, timestampMs: performance.now() });
    if (this.marks.length > 50) {
      this.marks.shift();
    }
  }

  logPipeline(fromStage: string, toStage: string): void {
    if (!this.enabled) return;
    const from = [...this.marks].reverse().find((m) => m.stage === fromStage);
    const to = [...this.marks].reverse().find((m) => m.stage === toStage);
    if (from && to) {
      console.debug(`[latency] ${fromStage} → ${toStage}: ${(to.timestampMs - from.timestampMs).toFixed(1)}ms`);
    }
  }

  getMarks(): LatencyMark[] {
    return [...this.marks];
  }

  reset(): void {
    this.marks = [];
  }
}

export const latencyTracker = new LatencyTracker();
