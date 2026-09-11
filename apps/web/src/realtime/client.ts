import {
  safeParseServerMessage,
  type ClientMessage,
  type ServerMessage,
  type TranscriptEvent,
} from '@live-captions/contracts';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

export interface RealtimeClientOptions {
  url: string;
  onMessage: (message: ServerMessage) => void;
  onConnectionChange: (state: ConnectionState) => void;
  maxRetries?: number;
}

export class RealtimeClient {
  private url: string;
  private ws: WebSocket | null = null;
  private seq = 0;
  private onMessage: (message: ServerMessage) => void;
  private onConnectionChange: (state: ConnectionState) => void;
  private maxRetries: number;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;
  private started = false;

  constructor(options: RealtimeClientOptions) {
    this.url = options.url;
    this.onMessage = options.onMessage;
    this.onConnectionChange = options.onConnectionChange;
    this.maxRetries = options.maxRetries ?? 5;
  }

  connect(): void {
    this.intentionalClose = false;
    this.retryCount = 0;
    this.openSocket();
  }

  private openSocket(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.onConnectionChange(this.retryCount > 0 ? 'reconnecting' : 'connecting');

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.onConnectionChange('connected');
      if (this.started) {
        this.send({ type: 'start' });
      }
    };

    this.ws.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.data as string);
      } catch {
        return;
      }
      const message = safeParseServerMessage(parsed);
      if (message) {
        this.onMessage(message);
      }
    };

    this.ws.onclose = () => {
      this.ws = null;
      if (this.intentionalClose) {
        this.onConnectionChange('disconnected');
        return;
      }
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose handles reconnection
    };
  }

  private scheduleReconnect(): void {
    if (this.intentionalClose) return;

    if (this.retryCount >= this.maxRetries) {
      this.onConnectionChange('disconnected');
      this.onMessage({
        type: 'error',
        code: 'CONNECTION_FAILED',
        message: 'Unable to reconnect to caption service',
        recoverable: false,
      });
      return;
    }

    this.onConnectionChange('reconnecting');
    const delay = Math.min(1000 * 2 ** this.retryCount, 10000);
    this.retryCount++;

    this.retryTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  start(): void {
    this.started = true;
    this.send({ type: 'start' });
  }

  stop(): void {
    this.started = false;
    this.send({ type: 'stop' });
  }

  sendAudio(base64Data: string, timestampMs: number): void {
    this.send({
      type: 'audio',
      seq: this.seq++,
      timestampMs,
      data: base64Data,
    });
  }

  private send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.intentionalClose = true;
    this.started = false;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.onConnectionChange('disconnected');
  }

  getConnectionState(): ConnectionState {
    if (!this.ws) return 'disconnected';
    if (this.ws.readyState === WebSocket.CONNECTING) return 'connecting';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }
}

export type TranscriptHandler = (event: TranscriptEvent) => void;
