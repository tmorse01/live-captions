import { AUDIO_SAMPLE_RATE } from '@live-captions/contracts';

export type AudioChunkHandler = (pcmData: Int16Array, timestampMs: number) => void;

export class AudioCapture {
  private context: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onChunk: AudioChunkHandler | null = null;
  private running = false;

  async start(onChunk: AudioChunkHandler): Promise<void> {
    if (this.running) return;

    this.onChunk = onChunk;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    this.context = new AudioContext();
    const inputSampleRate = this.context.sampleRate;
    this.source = this.context.createMediaStreamSource(this.stream);

    // ScriptProcessor for broad mobile Safari compatibility (~128ms at 16 kHz)
    this.processor = this.context.createScriptProcessor(2048, 1, 1);
    this.processor.onaudioprocess = (event) => {
      if (!this.onChunk) return;
      const input = event.inputBuffer.getChannelData(0);
      const pcm = downsampleToInt16(input, inputSampleRate, AUDIO_SAMPLE_RATE);
      this.onChunk(pcm, Date.now());
    };

    this.source.connect(this.processor);
    this.processor.connect(this.context.destination);
    this.running = true;
  }

  stop(): void {
    this.running = false;
    this.onChunk = null;

    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.context) {
      void this.context.close();
      this.context = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}

function downsampleToInt16(
  input: Float32Array,
  inputRate: number,
  outputRate: number,
): Int16Array {
  if (inputRate === outputRate) {
    return floatTo16BitPCM(input);
  }

  const ratio = inputRate / outputRate;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Int16Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = Math.floor(i * ratio);
    const sample = input[srcIndex] ?? 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  return output;
}

function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const sample = input[i] ?? 0;
    const clamped = Math.max(-1, Math.min(1, sample));
    output[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return output;
}

export function int16ToBase64(pcm: Int16Array): string {
  const bytes = new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}
