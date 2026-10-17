import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { VERSION } from '../web/core.js';

const at = (path) => fileURLToPath(new URL(path, import.meta.url));

test('the version in core.js is the latest changelog entry, the PROMPT example and what --help prints', async () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  const changelog = await fs.readFile(at('../CHANGELOG.md'), 'utf8');
  const latest = changelog.match(/^## v(\d+\.\d+\.\d+) - \d{4}-\d{2}-\d{2}$/m)?.[1];
  assert.equal(latest, VERSION, 'the first "## vX.Y.Z - date" heading in CHANGELOG.md is the version in web/core.js');
  const prompt = await fs.readFile(at('../PROMPT.md'), 'utf8');
  assert.ok(prompt.includes(`\`v${VERSION}\``), 'PROMPT.md names the current tag as its example');
  const help = spawnSync(process.execPath, [at('../bin/open-backlog.mjs'), '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.ok(help.stdout.startsWith(`open-backlog v${VERSION}\n`), '--help opens with the version');
});
