import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';

function findRepoRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);

  while (true) {
    if (fs.existsSync(path.join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }
    current = parent;
  }
}

/**
 * Loads `.env` from the monorepo root and resolves relative credential paths
 * against that root (not the current working directory).
 */
export function loadMonorepoEnv(): string {
  const repoRoot = findRepoRoot();
  const envPath = path.join(repoRoot, '.env');

  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credentialsPath && !path.isAbsolute(credentialsPath)) {
    const resolved = path.resolve(repoRoot, credentialsPath);
    if (fs.existsSync(resolved)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
    }
  }

  return repoRoot;
}
