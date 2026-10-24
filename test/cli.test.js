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

test('CLI index --write into a folder with no README starts it with the marker', async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-index-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(join(dir, 'a.md'), '---\ntitle: A\nstatus: ready\n---\n\n# A\n');
  assert.equal(run('index', dir, '--write').status, 0);
  const generated = await fs.readFile(join(dir, 'README.md'), 'utf8');
  assert(generated.startsWith('<!-- open-backlog:index start -->\n'), JSON.stringify(generated.slice(0, 40)));
  assert(generated.endsWith('<!-- open-backlog:index end -->\n'));
  assert.equal(run('index', dir, '--check').status, 0);
});

test('CLI check fails on a backlog.yaml until it is renamed', async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-yaml-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(join(dir, 'a.md'), '---\ntitle: A\nstatus: ready\n---\n\n# A\n');
  await fs.writeFile(join(dir, 'backlog.yaml'), 'title: A backlog\n');
  const failed = run('check', dir);
  assert.equal(failed.status, 1);
  assert.match(failed.stdout, /backlog\.yaml isn't read, so the fields are guessed: name it backlog\.yml/);
  await fs.rename(join(dir, 'backlog.yaml'), join(dir, 'backlog.yml'));
  assert.equal(run('check', dir).status, 0);
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

// A backlog with an ordinary index table, a template, two items and an epic over one of them.
const creatable = async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-new-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const files = {
    'backlog.yml': 'fields:\n  status: [idea, ready, done]\n  priority: [high, low]\n  epic: []\n',
    '_template.md': '# {{title}}\n\n## Why\n\n## Acceptance\n',
    'a.md': '---\ntitle: A\nstatus: ready\npriority: high\n---\n\n# A\n',
    'b.md': '---\ntitle: B\nstatus: idea\npriority: low\n---\n\n# B\n',
    'launch.md': '---\ntitle: Launch\nstatus: idea\npriority: high\nitems: [a]\n---\n\n# Launch\n',
    'README.md': '| Item | Priority | Status |\n| --- | --- | --- |\n| [A](a.md) | high | ready |\n| [B](b.md) | low | idea |\n| [Launch](launch.md) | high | idea |\n',
  };
  for (const [name, text] of Object.entries(files)) await fs.writeFile(join(dir, name), text);
  const snapshot = async () => Object.fromEntries(await Promise.all((await fs.readdir(dir)).sort().map(async (name) => [name, await fs.readFile(join(dir, name), 'utf8')])));
  return { dir, snapshot };
};

test('CLI new writes an item, an epic or an item in an epic, and prints what it wrote', async (t) => {
  const { dir } = await creatable(t);
  let result = run('new', 'Export to CSV', dir, '--field', 'status=idea', '--field=priority=low', '--tags', 'export, csv', '--tags', 'data', '--weight', '4', '--field', 'epic=q4');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `Created export-to-csv\n  ${join(dir, 'export-to-csv.md')}\n  ${join(dir, 'README.md')}\n`);
  const item = await fs.readFile(join(dir, 'export-to-csv.md'), 'utf8');
  assert.match(item, /^---\ntitle: Export to CSV\nstatus: idea\npriority: low\nepic: q4\nweight: 4\ntags: \["export", "csv", "data"\]\n/);
  assert.match(item, /\n# Export to CSV\n\n## Why\n\n## Acceptance\n$/);
  assert.match(await fs.readFile(join(dir, 'README.md'), 'utf8'), /^\| \[Export to CSV\]\(export-to-csv\.md\) \| low \| idea \|$/m);

  result = run('new', 'Q4 release', dir, '--items', 'b,export-to-csv', '--field', 'status=idea', '--field', 'priority=high');
  assert.equal(result.status, 0, result.stderr);
  assert.match(await fs.readFile(join(dir, 'q4-release.md'), 'utf8'), /^items: \[b, export-to-csv\]$/m);

  result = run('new', 'Press kit', dir, '--epic', 'launch', '--field', 'status=idea', '--field', 'priority=low');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /launch\.md\n/);
  assert.match(await fs.readFile(join(dir, 'launch.md'), 'utf8'), /^items: \[a, press-kit\]$/m);
  assert.equal(run('check', dir).status, 0, run('check', dir).stdout);
});

test('CLI new refuses anything wrong before writing, on stderr with exit 2', async (t) => {
  const { dir, snapshot } = await creatable(t);
  const before = await snapshot();
  const filled = ['--field', 'status=idea', '--field', 'priority=low'];
  for (const [args, message] of [
    [['X', dir], /a new item needs status \(idea, ready, done\) and priority \(high, low\)/],
    [['X', dir, '--field', 'status=idea'], /a new item needs priority \(high, low\)/],
    [['X', dir, '--colour', 'red'], /new doesn't take --colour/],
    [['X', dir, '--field', 'status=bogus'], /bogus/],
    [['X', dir, '--field', 'kind=ops'], /there's no field called kind; the fields are status, priority, epic/],
    [['X', dir, '--field', 'status=idea', '--field', 'status=ready'], /--field status is given twice, as idea and ready/],
    [['X', dir, '--field', 'status'], /--field takes name=value/],
    [['X', dir, '--weight'], /--weight needs a value/],
    [['X', dir, '--weight', 'soon'], /weight/],
    [['X', dir, '--epic', 'launch', '--epic', 'launch'], /--epic is given twice/],
    [['X', dir, '--items', 'a', '--epic', 'launch'], /--items and --epic can't go together/],
    [['X', dir, '--items', ' , '], /--items needs at least one item slug/],
    [['X', dir, ...filled, '--items', 'a,ghost'], /there's no item called ghost/],
    [['X', dir, ...filled, '--items', 'b,b'], /b is listed twice/],
    [['X', dir, ...filled, '--items', 'launch'], /launch is an epic, and epics can't contain epics/],
    [['X', dir, ...filled, '--epic', 'a'], /a is in the epic launch/],
    [['X', join(dir, 'missing')], /ENOENT/],
    [['--field', 'status=idea'], /new needs a title/],
    [['X', dir, 'extra'], /new takes a title and a directory, not extra/],
    [['X', dir, '--slug'], /--slug needs a value/],
    [['X', dir, '--slug='], /--slug needs a value/],
    [['X', dir, '--slug', 'x', '--slug', 'y'], /--slug is given twice/],
    [['X', dir, ...filled, '--slug', 'a'], /a\.md already exists/],
    [['X', dir, ...filled, '--slug', 'x.md'], /without \.md/],
    [['X', dir, ...filled, '--slug', '../x'], /can't be a slug/],
    [['X', dir, ...filled, '--slug', 'README'], /README or index/],
  ]) {
    const result = run('new', ...args);
    assert.equal(result.status, 2, `${args.join(' ')}: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, message, args.join(' '));
    assert.equal(result.stdout, '');
  }
  assert.deepEqual(await snapshot(), before);
  const help = run('new', '--help');
  assert.equal(help.status, 0);
  assert.match(help.stdout, /new "<title>" \[directory\] \[--field name=value\]/);
  assert.match(help.stdout, /--items cart-rules,payment-retry,receipt-email/);
  assert.match(help.stdout, /\[--slug <name>\]/);
});

test('CLI new in a starter backlog takes every required field, and then check passes', async (t) => {
  const dir = await fs.mkdtemp(join(tmpdir(), 'backlog-starter-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.cp(fileURLToPath(new URL('../starter', import.meta.url)), dir, { recursive: true });
  const bare = run('new', 'Export to CSV', dir);
  assert.equal(bare.status, 2);
  assert.match(bare.stderr, /a new item needs status \(idea, ready, in-progress, parked, done\), priority \(high, mid, low\) and type \(build, spike, discuss, epic\)/);
  await assert.rejects(fs.access(join(dir, 'export-to-csv.md')));
  const full = run('new', 'Export to CSV', dir, '--field', 'status=idea', '--field', 'priority=mid', '--field', 'type=build');
  assert.equal(full.status, 0, full.stderr);
  const check = run('check', dir);
  assert.equal(check.status, 0, check.stdout);
});

test('CLI new --slug names the file the project\'s way, in the index and the epic', async (t) => {
  const { dir } = await creatable(t);
  const result = run('new', 'Export to CSV', dir, '--slug', 'api-07-export', '--epic', 'launch', '--field', 'status=idea', '--field', 'priority=low');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Created api-07-export\n/);
  assert.match(await fs.readFile(join(dir, 'api-07-export.md'), 'utf8'), /^---\ntitle: Export to CSV\n/);
  assert.match(await fs.readFile(join(dir, 'launch.md'), 'utf8'), /^items: \[a, api-07-export\]$/m);
  assert.match(await fs.readFile(join(dir, 'README.md'), 'utf8'), /^\| \[Export to CSV\]\(api-07-export\.md\) \| low \| idea \|$/m);
  await assert.rejects(fs.access(join(dir, 'export-to-csv.md')));
  assert.equal(run('check', dir).status, 0, run('check', dir).stdout);
});

test('CLI ids checks and numbers the items without one', async (t) => {
  const { dir, snapshot } = await creatable(t);
  const item = await fs.readFile(join(dir, 'a.md'), 'utf8');
  await fs.writeFile(join(dir, 'a.md'), item.replace('title: A\n', 'title: A\nid:\n'));
  const index = await fs.readFile(join(dir, 'README.md'), 'utf8');
  await fs.writeFile(join(dir, 'README.md'), index.replace('| Item |', '| ID | Item |').replace('| --- | --- | --- |', '| --- | --- | --- | --- |').replaceAll('| [', '|  | ['));
  const before = await snapshot();
  assert.equal(run('ids', dir, '--check').status, 1);
  assert.deepEqual(await snapshot(), before);
  const result = run('ids', dir, '--write');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Numbered 3 items\n/);
  assert.match(await fs.readFile(join(dir, 'a.md'), 'utf8'), /^---\ntitle: A\nid: \d\n/);
  assert.equal(run('ids', dir, '--check').status, 0);
  assert.equal(run('ids', dir, '--write').stdout, 'Every item has an ID\n');
  assert.match(run('new', 'Next one', dir, '--field', 'status=idea', '--field', 'priority=low').stdout, /Created next-one/);
  assert.match(await fs.readFile(join(dir, 'next-one.md'), 'utf8'), /^id: 4$/m);
  assert.equal(run('ids', dir).status, 2);
  assert.equal(run('check', dir).status, 0, run('check', dir).stdout);
});
