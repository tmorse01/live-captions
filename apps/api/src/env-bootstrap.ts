/**
 * Writes GCP service account JSON from env var to a temp file for Railway deployment.
 * Set GCP_SERVICE_ACCOUNT_JSON in production instead of mounting a file.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function bootstrapGcpCredentials(): void {
  const json = process.env.GCP_SERVICE_ACCOUNT_JSON;
  if (!json || process.env.GOOGLE_APPLICATION_CREDENTIALS) return;

  const tmpPath = path.join(os.tmpdir(), 'gcp-credentials.json');
  fs.writeFileSync(tmpPath, json, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
}
