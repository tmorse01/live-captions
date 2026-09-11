import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import type { FastifyInstance } from 'fastify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** apps/web/dist relative to apps/api/dist */
export function getWebDistPath(): string {
  return path.resolve(__dirname, '../../web/dist');
}

export async function registerStaticWeb(app: FastifyInstance): Promise<boolean> {
  const webDist = getWebDistPath();

  if (!fs.existsSync(webDist)) {
    app.log.warn(`Web dist not found at ${webDist} — static hosting disabled`);
    return false;
  }

  await app.register(fastifyStatic, {
    root: webDist,
    prefix: '/',
    wildcard: false,
  });

  app.setNotFoundHandler((request, reply) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      reply.code(404).send({ error: 'Not found' });
      return;
    }
    reply.sendFile('index.html', webDist);
  });

  app.log.info(`Serving web app from ${webDist}`);
  return true;
}
