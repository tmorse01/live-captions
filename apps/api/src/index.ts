import './load-env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { parseApiEnv } from '@live-captions/config';
import { bootstrapGcpCredentials } from './env-bootstrap.js';
import { getActiveSpeechMode, registerRealtimeRoutes } from './realtime/routes.js';
import { registerStaticWeb } from './static.js';

bootstrapGcpCredentials();

const env = parseApiEnv();
const isProduction = process.env.NODE_ENV === 'production';

const webOrigin =
  env.WEB_ORIGIN !== 'http://localhost:5173'
    ? env.WEB_ORIGIN
    : process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : env.WEB_ORIGIN;

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: isProduction ? webOrigin : true,
});

await app.register(websocket);
await registerRealtimeRoutes(app);

app.get('/health', async () => ({ status: 'ok' }));

if (isProduction) {
  await registerStaticWeb(app);
}

try {
  await app.listen({ port: env.API_PORT, host: '0.0.0.0' });
  const speechMode = getActiveSpeechMode();
  app.log.info(`Listening on port ${env.API_PORT}`);
  app.log.info(`Speech provider: ${speechMode}${speechMode === 'google' ? ' (GCP)' : ' (set GOOGLE_APPLICATION_CREDENTIALS for real speech)'}`);
  if (isProduction) {
    app.log.info(`Web origin: ${webOrigin}`);
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
