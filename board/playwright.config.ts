import { defineConfig, devices } from '@playwright/test';
import { writeFixture } from './e2e/fixture';

// The e2e suite runs the BUILT app through server.mjs over a fixture project,
// so what it proves is what `npm run board` serves. The fixture is written when
// this config loads — before the web server starts. The port is fixed away from
// the default 4317 so a board already open on this machine does not answer.
const PORT = 4399;
const LAYERS_PORT = 4419;
const FIXTURE = "./test-results/fixture";
// Workers load this config too; only the main process may write the fixture,
// or a worker deletes it while the server is reading it.
if (process.env.TEST_WORKER_INDEX === undefined) writeFixture(FIXTURE);

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.ts',
  outputDir: './test-results/runs',
  fullyParallel: true,
  reporter: [['list']],
  metadata: { layersURL: `http://127.0.0.1:${LAYERS_PORT}` },
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  webServer: [{
    command: `node server.mjs --root ${FIXTURE} --scripts ../framwork/.codeadd/scripts --port ${PORT} --no-open`,
    url: `http://127.0.0.1:${PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }, {
    command: `node server.mjs --root ${FIXTURE} --scripts ../framwork/.codeadd/scripts --port ${LAYERS_PORT} --no-open --layers`,
    url: `http://127.0.0.1:${LAYERS_PORT}/api/board`,
    reuseExistingServer: false,
    timeout: 30000,
    env: { NODE_OPTIONS: '' },
  }],
  projects: [
    { name: 'mobile-360', use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 }, hasTouch: true } },
    { name: 'tablet-768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'desktop-1080', use: { ...devices['Desktop Chrome'], viewport: { width: 1080, height: 900 } } },
  ],
});
