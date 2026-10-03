#!/usr/bin/env node
/**
 * build-board-runtime.js — Copy canonical backlog core/storage to board/runtime/
 *
 * Usage: node scripts/build-board-runtime.js
 *
 * Copies exactly two files from framwork/.codeadd/scripts/ to board/runtime/:
 *   - backlog-core.cjs
 *   - backlog-storage.cjs
 *
 * The board server imports the generated copy directly, eliminating the
 * subprocess Bash dependency. This script is builtins-only (no npm deps).
 *
 * Exit codes:
 *   0 — success (copied or already fresh)
 *   1 — source missing or copy failed
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'framwork', '.codeadd', 'scripts');
const TARGET_DIR = path.join(ROOT, 'board', 'runtime');

const FILES = ['backlog-core.cjs', 'backlog-storage.cjs'];

function main() {
  // Ensure target directory exists
  fs.mkdirSync(TARGET_DIR, { recursive: true });

  // Prune obsolete files: only the two canonical files belong in board/runtime/
  const existing = fs.readdirSync(TARGET_DIR, { withFileTypes: true });
  for (const entry of existing) {
    if (entry.isFile() && !FILES.includes(entry.name)) {
      fs.unlinkSync(path.join(TARGET_DIR, entry.name));
      console.log(`  PRUNE board/runtime/${entry.name}`);
    }
  }

  let copied = 0;
  for (const name of FILES) {
    const src = path.join(SOURCE_DIR, name);
    const dest = path.join(TARGET_DIR, name);

    if (!fs.existsSync(src)) {
      console.error(`ERROR: source not found: ${path.relative(ROOT, src)}`);
      process.exit(1);
    }

    const srcContent = fs.readFileSync(src, 'utf8');
    const destContent = fs.existsSync(dest) ? fs.readFileSync(dest, 'utf8') : null;

    if (srcContent === destContent) {
      console.log(`  FRESH board/runtime/${name}`);
    } else {
      fs.writeFileSync(dest, srcContent, 'utf8');
      console.log(`  COPY  board/runtime/${name}`);
      copied++;
    }
  }

  console.log(`Board runtime ready: ${copied} copied, ${FILES.length - copied} already fresh`);
}

main();
