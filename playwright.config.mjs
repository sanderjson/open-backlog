import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './browser',
  workers: 1,
  reporter: 'line',
  use: { browserName: 'chromium', headless: true, trace: 'retain-on-failure' },
});
