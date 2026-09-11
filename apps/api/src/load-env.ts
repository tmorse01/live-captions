import { loadMonorepoEnv } from '@live-captions/config';
import { bootstrapGcpCredentials } from './env-bootstrap.js';

loadMonorepoEnv();
bootstrapGcpCredentials();
