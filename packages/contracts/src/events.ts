import { z } from 'zod';

/** Audio format: LINEAR16, 16 kHz, mono */
export const AUDIO_SAMPLE_RATE = 16000;
export const AUDIO_ENCODING = 'LINEAR16' as const;

export const AudioChunkMessageSchema = z.object({
  type: z.literal('audio'),
  seq: z.number().int().nonnegative(),
  timestampMs: z.number(),
  data: z.string(),
});

export const ControlMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('stop') }),
  z.object({ type: z.literal('ping') }),
]);

export const ClientMessageSchema = z.discriminatedUnion('type', [
  AudioChunkMessageSchema,
  ...ControlMessageSchema.options,
]);

export const TranscriptEventSchema = z.object({
  type: z.literal('transcript'),
  id: z.string(),
  /** Stable id for all interim + final events in one spoken phrase */
  utteranceId: z.string().optional(),
  text: z.string(),
  isFinal: z.boolean(),
  timestampMs: z.number(),
  /** GCP interim stability 0–1; omitted for finals */
  stability: z.number().min(0).max(1).optional(),
});

export const StatusStateSchema = z.enum(['idle', 'listening', 'processing', 'reconnecting']);

export const StatusEventSchema = z.object({
  type: z.literal('status'),
  state: StatusStateSchema,
});

export const ErrorEventSchema = z.object({
  type: z.literal('error'),
  code: z.string(),
  message: z.string(),
  recoverable: z.boolean(),
});

export const ServerMessageSchema = z.discriminatedUnion('type', [
  TranscriptEventSchema,
  StatusEventSchema,
  ErrorEventSchema,
]);

export type AudioChunkMessage = z.infer<typeof AudioChunkMessageSchema>;
export type ControlMessage = z.infer<typeof ControlMessageSchema>;
export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type TranscriptEvent = z.infer<typeof TranscriptEventSchema>;
export type StatusState = z.infer<typeof StatusStateSchema>;
export type StatusEvent = z.infer<typeof StatusEventSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export type ServerMessage = z.infer<typeof ServerMessageSchema>;

export function parseClientMessage(data: unknown): ClientMessage {
  return ClientMessageSchema.parse(data);
}

export function parseServerMessage(data: unknown): ServerMessage {
  return ServerMessageSchema.parse(data);
}

export function safeParseServerMessage(data: unknown): ServerMessage | null {
  const result = ServerMessageSchema.safeParse(data);
  return result.success ? result.data : null;
}
