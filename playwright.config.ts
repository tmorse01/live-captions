import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: 'pnpm --filter @live-captions/api dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: { USE_MOCK_SPEECH: 'true' },
    },
    {
      command: 'pnpm --filter @live-captions/web dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
