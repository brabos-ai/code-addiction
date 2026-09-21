import { defineConfig, devices } from '@playwright/test';

// The e2e suite runs the BUILT app through server.mjs over a fixture project,
// so what it proves is what `npm run board` serves. `e2e/global-setup.ts`
// writes the fixture board; the port is fixed away from the default 4317 so a
// board already open on this machine does not answer the tests.
const PORT = 4399;

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  fullyParallel: true,
  reporter: [['list']],
  globalSetup: './e2e/global-setup.ts',
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: {
    command: `node server.mjs --root ./test-results/fixture --scripts ../framwork/.codeadd/scripts --port ${PORT} --no-open`,
    url: `http://127.0.0.1:${PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
  },
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 900 } } },
  ],
});
