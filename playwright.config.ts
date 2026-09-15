import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true, workers: 2,
  use: { baseURL: 'http://127.0.0.1:3000/Derivacion-/', headless: true,
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {} },
  webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:3000/Derivacion-/', reuseExistingServer: !process.env.CI },
});
