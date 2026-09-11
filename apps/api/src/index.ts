import './load-env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { parseApiEnv } from '@live-captions/config';
import { bootstrapGcpCredentials } from './env-bootstrap.js';
import { getActiveSpeechMode, registerRealtimeRoutes } from './realtime/routes.js';

bootstrapGcpCredentials();

const env = parseApiEnv();

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: env.WEB_ORIGIN,
});

await app.register(websocket);
await registerRealtimeRoutes(app);

app.get('/health', async () => ({ status: 'ok' }));

try {
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  const speechMode = getActiveSpeechMode();
  app.log.info(`API listening on port ${env.API_PORT}`);
  app.log.info(`Speech provider: ${speechMode}${speechMode === 'google' ? ' (GCP)' : ' (set GOOGLE_APPLICATION_CREDENTIALS for real speech)'}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
