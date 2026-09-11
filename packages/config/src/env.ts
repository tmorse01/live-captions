import { z } from 'zod';

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().optional(),
  PORT: z.coerce.number().optional(),
  GCP_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema> & { API_PORT: number };

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = apiEnvSchema.parse(env);
  return {
    ...parsed,
    API_PORT: parsed.API_PORT ?? parsed.PORT ?? 3001,
  };
}
