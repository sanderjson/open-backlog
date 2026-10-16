import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { startServer } from './server.mjs';

const post = (server, changes, headers = {}) => fetch(server.url + 'files', { method: 'POST', headers: { 'X-Open-Backlog': '1', ...headers }, body: JSON.stringify({ changes }) });

test('checked batches reject conflicts before writing and serialize racing requests', async (t) => {
  const server = await startServer();
  t.after(() => server.close());
  const before = await fs.readFile(join(server.dir, 'a.md'), 'utf8');
  const changes = [{ name: 'a.md', before, after: before + '\nnew text\n' }];
  let res = await post(server, [...changes, { name: 'b.md', before: 'stale', after: 'wrong' }]);
  assert.equal(res.status, 409);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), before);
  const racing = await Promise.all([post(server, changes), post(server, [{ ...changes[0], after: 'other writer' }])]);
  assert.deepEqual(racing.map((r) => r.status).sort(), [204, 409]);
  res = await post(server, [{ name: 'new.md', before: null, after: 'new item' }]);
  assert.equal(res.status, 204);
  assert.equal((await post(server, [{ name: 'new.md', before: null, after: 'overwrite' }])).status, 409);
});

test('reference routes preserve the legacy contract, reject unsafe inputs and honor read-only', async (t) => {
  const server = await startServer({ files: { '_template.md': 'Template', 'a.md': 'A', '.hidden.md': 'hidden' } });
  t.after(() => server.close());
  const response = await fetch(server.url + 'files');
  const payload = await response.json();
  assert.deepEqual(Object.keys(payload.files).sort(), ['_template.md', 'a.md']);
  assert.equal(payload.capabilities.changes, true);
  assert.equal((await fetch(server.url + 'files', { headers: { 'If-None-Match': response.headers.get('ETag') } })).status, 304);
  assert.equal((await fetch(server.url + 'files/a.md', { method: 'PUT', body: 'x' })).status, 403);
  assert.equal((await fetch(server.url + 'files/a.md', { method: 'PUT', headers: { 'X-Open-Backlog': '1' }, body: 'updated' })).status, 204);
  for (const changes of [null, [null], [{ name: '../outside.md', before: null, after: 'x' }], [{ name: '.hidden.md', before: null, after: 'x' }], [{ name: 'a.md', before: 'updated', after: 'x' }, { name: 'a.md', before: 'x', after: 'y' }]]) assert.equal((await post(server, changes)).status, 400);
  await fs.symlink(join(server.dir, 'a.md'), join(server.dir, 'link.md'));
  assert.equal((await post(server, [{ name: 'link.md', before: 'updated', after: 'changed' }])).status, 400);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), 'updated');
  const readonly = await startServer({ writable: false });
  t.after(() => readonly.close());
  assert.equal((await fetch(readonly.url + 'files').then((r) => r.json())).writable, false);
  assert.equal((await post(readonly, [{ name: 'new.md', before: null, after: 'x' }])).status, 403);
});

test('an interrupted save resumes from its journal; conflicting external edits stay intact', async (t) => {
  const server = await startServer({ files: { 'a.md': 'before-a', 'b.md': 'before-b' } });
  t.after(() => server.close());
  const journal = join(server.dir, '.open-backlog-transaction');
  const changes = [{ name: 'a.md', before: 'before-a', after: 'after-a' }, { name: 'b.md', before: 'before-b', after: 'after-b' }];
  await fs.mkdir(journal);
  await fs.writeFile(join(journal, 'owner.json'), JSON.stringify({ pid: process.pid, token: 'interrupted' }));
  await fs.writeFile(join(journal, 'changes.json'), JSON.stringify({ changes }));
  await fs.writeFile(join(server.dir, 'a.md'), 'after-a');
  let snapshot = await fetch(server.url + 'files').then((r) => r.json());
  assert.equal(snapshot.files['b.md'], 'after-b');
  assert.equal(snapshot.writable, true);
  await assert.rejects(fs.stat(journal), { code: 'ENOENT' });
  await fs.mkdir(journal);
  await fs.writeFile(join(journal, 'owner.json'), JSON.stringify({ pid: process.pid, token: 'interrupted' }));
  await fs.writeFile(join(journal, 'changes.json'), JSON.stringify({ changes }));
  await fs.writeFile(join(server.dir, 'b.md'), 'external edit');
  snapshot = await fetch(server.url + 'files').then((r) => r.json());
  assert.equal(snapshot.files['b.md'], 'external edit');
  assert.equal(snapshot.writable, false);
  assert.match(snapshot.saveError, /conflicts with b.md/);
  assert.equal(await fs.readFile(join(server.dir, 'b.md'), 'utf8'), 'external edit');
  assert((await fs.stat(join(journal, 'changes.json'))).isFile());
});

test('a live writer in another process is never mistaken for an interrupted save', async (t) => {
  const server = await startServer({ files: { 'a.md': 'before' } });
  t.after(() => server.close());
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)']);
  await once(child, 'spawn');
  t.after(() => { child.kill(); });
  const journal = join(server.dir, '.open-backlog-transaction');
  await fs.mkdir(journal);
  await fs.writeFile(join(journal, 'owner.json'), JSON.stringify({ pid: child.pid, token: 'live-writer' }));
  await fs.writeFile(join(journal, 'changes.json'), JSON.stringify({ changes: [{ name: 'a.md', before: 'before', after: 'after' }] }));
  const snapshot = await fetch(server.url + 'files').then((r) => r.json());
  assert.equal(snapshot.files['a.md'], 'before');
  assert.equal(snapshot.writable, false);
  assert.match(snapshot.saveError, /another process/);
  assert((await fs.stat(journal)).isDirectory());
});

test('body limits and missing POST headers fail without changing files', async (t) => {
  const server = await startServer({ maxBody: 100 });
  t.after(() => server.close());
  assert.equal((await post(server, [{ name: 'new.md', before: null, after: 'x'.repeat(200) }])).status, 413);
  assert.equal((await fetch(server.url + 'files', { method: 'POST', body: '{"changes":[]}' })).status, 403);
  await assert.rejects(fs.stat(join(server.dir, 'new.md')), { code: 'ENOENT' });
});
