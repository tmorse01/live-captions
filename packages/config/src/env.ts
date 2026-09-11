import { z } from 'zod';

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().default(3001),
  GCP_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return apiEnvSchema.parse(env);
}
