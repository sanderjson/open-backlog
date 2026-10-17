import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import * as core from '../web/core.js';

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

test("CLI next lists what the board's Can start shows, in the same order", async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-cli-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const files = {
    'backlog.yml': 'fields:\n  status: [idea, ready, done]\n  priority: [high, low]\nstartable: [idea, ready]\n',
    'a.md': '---\ntitle: A\nstatus: ready\npriority: low\nweight: 2\n---\n\n# A\n',
    'b.md': '---\ntitle: B\nstatus: idea\npriority: high\nweight: 2\n---\n\n# B\n',
    'c.md': '---\ntitle: C\nstatus: ready\ndepends_on: [a]\n---\n\n# C\n',
    'd.md': '---\ntitle: D\nstatus: done\nweight: 1\n---\n\n# D\n',
    'e.md': '---\ntitle: E\nstatus: idea\n---\n\n# E\n',
    'epic.md': '---\ntitle: Epic\nstatus: ready\nweight: 1\nitems: [a, c]\n---\n\n# Epic\n',
  };
  for (const [name, text] of Object.entries(files)) await fs.writeFile(join(dir, name), text);
  const s = core.parseBacklog({ files, dir });
  const board = core.viewItems(s, core.viewParams(s, '?next=1')).map((item) => item.slug);
  assert.deepEqual(board, ['epic', 'b', 'a', 'e']);
  assert.deepEqual(JSON.parse(run('next', dir, '--json').stdout).map((item) => item.slug), board);
});
