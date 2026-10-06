import { it, expect } from 'vitest';
import fs from 'node:fs';
it('board commands delegate before preparation and direct tool configs guard mutation', () => {
  const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
  expect(scripts.test).toBe('node ../scripts/run-tests.js board');
  expect(scripts['test:e2e']).toBe('node ../scripts/run-tests.js board-e2e');
  expect(scripts.pretest).toBeUndefined();
  expect(scripts['pretest:e2e']).toBeUndefined();
  for (const file of ['vite.config.ts', 'playwright.config.ts']) expect(fs.readFileSync(file, 'utf8')).toContain('testContext.authorize');
});
