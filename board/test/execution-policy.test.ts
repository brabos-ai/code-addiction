import { it, expect } from 'vitest';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
it('real skipped-only Playwright selection refuses with persisted evidence', () => {
  const file = 'e2e/audit-skipped-probe.spec.ts';
  fs.writeFileSync(file, 'import {test} from "@playwright/test"; test.skip("audit skipped probe",()=>{});');
  try {
    const result = spawnSync(process.execPath, ['../scripts/run-tests.js', 'board-e2e', 'audit-skipped-probe'], { encoding: 'utf8', env: { ...process.env, VITEST: '', NODE_OPTIONS: '', CODEADD_TESTS_CONTEXT: 'github-actions', CODEADD_TESTS_SELECTION: 'board-e2e', CODEADD_TESTS_LEAF: '', GITHUB_ACTIONS: 'true', CI: 'true' } });
    expect(result.status).toBe(2); expect(result.stderr).toContain('selected no tests');
    expect(fs.existsSync('playwright-report/index.html')).toBe(true);
  } finally { fs.rmSync(file, { force: true }); }
}, 30000);
it('direct tools refuse generic CI/copy flags before fixture mutation', () => {
  for (const tool of [['node_modules/vitest/vitest.mjs', 'run', 'execution-policy'], ['node_modules/@playwright/test/cli.js', 'test', '--list']]) {
    const result = spawnSync(process.execPath, tool, { encoding: 'utf8', env: { ...process.env, NODE_OPTIONS: '', CODEADD_TESTS_CONTEXT: '', CODEADD_TESTS_SELECTION: '', CODEADD_TESTS_LEAF: '', CI: 'true', CODEADD_TESTS_COPY: '1' } });
    expect(result.status).not.toBe(0); expect(result.stderr).toMatch(/REFUSED|Unauthorized/);
  }
});
it('board commands delegate before preparation and direct tool configs guard mutation', () => {
  const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
  expect(scripts.test).toBe('node ../scripts/run-tests.js board');
  expect(scripts['test:e2e']).toBe('node ../scripts/run-tests.js board-e2e');
  expect(scripts.pretest).toBeUndefined();
  expect(scripts['pretest:e2e']).toBeUndefined();
  for (const file of ['vite.config.ts', 'playwright.config.ts']) expect(fs.readFileSync(file, 'utf8')).toContain('testContext.authorize');
});
