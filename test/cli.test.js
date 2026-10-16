import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const cli = fileURLToPath(new URL('../bin/open-backlog.mjs', import.meta.url));
const run = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });

test('CLI exposes the same checks, suggestions and prompts without changing files', async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-cli-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const text = '---\ntitle: A\nstatus: ready\ndepends_on: [missing]\n---\n\n# A\n';
  await fs.writeFile(join(dir, 'a.md'), text);
  let result = run('check', dir, '--json');
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).ok, false);
  assert.deepEqual(JSON.parse(run('next', dir, '--json').stdout), []);
  assert.match(run('prompt', 'a', dir).stdout, /depends_on names missing/);
  assert.equal(await fs.readFile(join(dir, 'a.md'), 'utf8'), text);
  await fs.writeFile(join(dir, 'a.md'), text.replace('[missing]', '[]'));
  assert.equal(run('check', dir).status, 0);
  assert.equal(JSON.parse(run('next', dir, '--json').stdout)[0].slug, 'a');
  assert.equal(run('check', dir, '--unknown').status, 2);
  assert.equal(run('prompt').status, 2);
});

test('CLI index check is read-only; write updates only the managed region', async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-index-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(join(dir, 'a.md'), '---\ntitle: A\nstatus: ready\n---\n\n# A\n');
  const original = 'Before\n\n<!-- open-backlog:index start -->\n<!-- open-backlog:index end -->\nAfter\n';
  await fs.writeFile(join(dir, 'README.md'), original);
  assert.equal(run('index', dir, '--check').status, 1);
  assert.equal(await fs.readFile(join(dir, 'README.md'), 'utf8'), original);
  assert.equal(run('index', dir, '--write').status, 0);
  assert.equal(run('index', dir, '--check').status, 0);
  assert.equal(run('check', dir).status, 0);
  const generated = await fs.readFile(join(dir, 'README.md'), 'utf8');
  assert(generated.startsWith('Before\n'));
  assert(generated.endsWith('After\n'));
  assert.match(generated, /\[A\]\(a.md\)/);
});
