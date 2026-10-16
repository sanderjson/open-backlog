// The test host follows the contract in README.md: these are the checks PROMPT.md asks of every
// host, whatever its language, plus the optional versions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { startServer, version } from './server.mjs';

const put = (server, name, body, headers = {}) =>
  fetch(server.url + 'files/' + name, { method: 'PUT', headers: { 'X-Open-Backlog': '1', ...headers }, body });

test('GET lists the backlog files, with a version for each', async (t) => {
  const server = await startServer({ files: { '_template.md': 'Template', 'a.md': 'A', '.hidden.md': 'hidden', 'run.sh': 'x' } });
  t.after(() => server.close());
  const response = await fetch(server.url + 'files');
  const payload = await response.json();
  assert.deepEqual(Object.keys(payload.files).sort(), ['_template.md', 'a.md']);
  assert.equal(payload.versions['a.md'], version('A'));
  assert.equal(payload.writable, true);
  assert.equal((await fetch(server.url + 'files', { headers: { 'If-None-Match': response.headers.get('ETag') } })).status, 304);
});

test('PUT writes a file only with the header and a safe name', async (t) => {
  const server = await startServer({ files: { 'a.md': 'A' } });
  t.after(() => server.close());
  assert.equal((await fetch(server.url + 'files/a.md', { method: 'PUT', body: 'x' })).status, 403);
  for (const name of ['..%2Foutside.md', 'run.sh', '.hidden.md']) assert.equal((await put(server, name, 'x')).status, 400);
  await assert.rejects(fs.stat(join(server.dir, '..', 'outside.md')), { code: 'ENOENT' });
  assert.equal((await put(server, 'a.md', 'updated')).status, 204);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), 'updated');
  await fs.symlink(join(server.dir, 'a.md'), join(server.dir, 'link.md'));
  assert.equal((await put(server, 'link.md', 'changed')).status, 400);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), 'updated');
});

test('versions make saves conditional: a stale one changes nothing', async (t) => {
  const server = await startServer({ files: { 'a.md': 'A' } });
  t.after(() => server.close());
  assert.equal((await put(server, 'a.md', 'stale', { 'If-Match': `"${version('old')}"` })).status, 412);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), 'A');
  const racing = await Promise.all(['one', 'two'].map((text) => put(server, 'a.md', text, { 'If-Match': `"${version('A')}"` })));
  assert.deepEqual(racing.map((r) => r.status).sort(), [204, 412]);
  assert.equal((await put(server, 'a.md', 'again', { 'If-None-Match': '*' })).status, 412);
  assert.equal((await put(server, 'new.md', 'new', { 'If-None-Match': '*' })).status, 204);
  assert.equal(await fs.readFile(join(server.dir, 'new.md'), 'utf8'), 'new');
});

test('a host without versions still takes plain PUTs', async (t) => {
  const server = await startServer({ files: { 'a.md': 'A' }, versions: false });
  t.after(() => server.close());
  assert.equal((await fetch(server.url + 'files').then((r) => r.json())).versions, undefined);
  assert.equal((await put(server, 'a.md', 'updated')).status, 204);
  assert.equal(await fs.readFile(join(server.dir, 'a.md'), 'utf8'), 'updated');
});

test('a read-only host and an oversized body change nothing', async (t) => {
  const readonly = await startServer({ writable: false });
  t.after(() => readonly.close());
  assert.equal((await fetch(readonly.url + 'files').then((r) => r.json())).writable, false);
  assert.equal((await put(readonly, 'new.md', 'x')).status, 403);
  const small = await startServer({ maxBody: 100 });
  t.after(() => small.close());
  assert.equal((await put(small, 'new.md', 'x'.repeat(200))).status, 413);
  await assert.rejects(fs.stat(join(small.dir, 'new.md')), { code: 'ENOENT' });
});
