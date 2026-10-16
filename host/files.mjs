// Optional Node adapter for the host file routes. Mount one instance per backlog directory in
// development only. Its queue covers host requests; external editors do not share that queue.
import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { FILE_NAME } from '../web/core.js';

const JOURNAL = '.open-backlog-transaction';
const activeSaves = new Set();
const error = (status, message) => Object.assign(new Error(message), { status });

function changesFrom(value) {
  if (!Array.isArray(value) || !value.length || value.length > 1000) throw error(400, 'changes must be a nonempty list of at most 1000 files');
  const names = new Set();
  return value.map((change) => {
    if (!change || typeof change !== 'object' || Array.isArray(change)) throw error(400, 'each change must be an object');
    const { name, before, after } = change;
    if (typeof name !== 'string' || !FILE_NAME.test(name) || names.has(name)) throw error(400, 'each change needs a unique backlog file name');
    if (before !== null && typeof before !== 'string' || typeof after !== 'string') throw error(400, 'each change needs before (text or null) and after (text)');
    names.add(name);
    return { name, before, after };
  });
}

async function read(path) {
  let handle;
  try {
    handle = await fs.open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    if (!(await handle.stat()).isFile()) throw error(400, 'a backlog target is not a regular file');
    return await handle.readFile('utf8');
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    if (e.code === 'ELOOP') throw error(400, 'symlink targets are not backlog files');
    throw e;
  } finally { await handle?.close(); }
}

async function atomicText(path, text, create = false) {
  const temp = join(dirname(path), `.open-backlog-${randomUUID()}`);
  let handle;
  try {
    handle = await fs.open(temp, 'wx', 0o644);
    await handle.writeFile(text, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    if (create) {
      try { await fs.link(temp, path); } catch (e) { if (e.code === 'EEXIST') throw error(409, 'a new target was created by another writer'); throw e; }
    } else await fs.rename(temp, path);
  } finally {
    await handle?.close();
    await fs.rm(temp, { force: true });
  }
}

async function body(req, maxBody) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBody) { req.resume(); throw error(413, 'the save exceeds the request size limit'); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function fileStore(path) {
  const journal = join(path, JOURNAL);

  async function recover(ownToken = '') {
    let info;
    try { info = await fs.lstat(journal); } catch (e) { if (e.code === 'ENOENT') return; throw e; }
    if (!info.isDirectory() || info.isSymbolicLink()) throw error(409, 'the save journal is not a regular directory');
    let owner;
    try { owner = JSON.parse(await read(join(journal, 'owner.json'))); } catch { /* retain incomplete metadata */ }
    if (!Number.isInteger(owner?.pid) || owner.pid <= 0 || typeof owner.token !== 'string') throw error(409, 'the save journal has incomplete owner metadata; preserve it for manual recovery');
    if (owner.token !== ownToken) {
      let alive = true;
      try { process.kill(owner.pid, 0); } catch (e) { alive = e.code !== 'ESRCH'; }
      if (activeSaves.has(owner.token) || owner.pid !== process.pid && alive) throw error(409, 'another process is saving this backlog; try again after it finishes');
    }
    const manifest = await read(join(journal, 'changes.json'));
    if (manifest !== null) {
      let changes;
      try { changes = changesFrom(JSON.parse(manifest).changes); } catch { throw error(409, 'the save journal is invalid; preserve it for manual recovery'); }
      // Verify all targets before resuming, and again immediately before each rename. A third
      // value belongs to an external writer: never overwrite it to complete an interrupted save.
      for (const change of changes) {
        const current = await read(join(path, change.name));
        if (current !== change.before && current !== change.after) throw error(409, `unfinished save conflicts with ${change.name}; preserve ${JOURNAL}/changes.json for recovery`);
      }
      for (const change of changes) {
        const current = await read(join(path, change.name));
        if (current === change.after) continue;
        if (current !== change.before) throw error(409, `unfinished save conflicts with ${change.name}; preserve ${JOURNAL}/changes.json for recovery`);
        await atomicText(join(path, change.name), change.after, current === null);
      }
    }
    await fs.rm(journal, { recursive: true });
  }

  async function commit(changes) {
    for (const change of changes) {
      if (await read(join(path, change.name)) !== change.before) throw error(409, `${change.name} changed since it was read; reload before trying again`);
    }
    try { await fs.mkdir(journal); } catch (e) { if (e.code === 'EEXIST') throw error(409, 'another save is in progress; reload before trying again'); throw e; }
    const token = randomUUID();
    activeSaves.add(token);
    try {
      await atomicText(join(journal, 'owner.json'), JSON.stringify({ pid: process.pid, token }));
      await atomicText(join(journal, 'changes.json'), JSON.stringify({ changes }));
      await recover(token);
    } finally { activeSaves.delete(token); }
  }

  return { recover, commit };
}

export async function saveChanges(dir, changes) {
  if (!changes.length) return;
  const store = fileStore(resolve(dir));
  await store.recover();
  await store.commit(changesFrom(changes));
}

export function createFilesHandler({ dir, mount = '/dev/backlog', writable = true, maxBody = 1 << 20 }) {
  const path = resolve(dir);
  const route = mount.replace(/\/$/, '') + '/files';
  const { recover, commit } = fileStore(path);
  let tail = Promise.resolve();

  async function handle(req, res, name) {
    let recoveryError;
    if (writable) {
      try { await recover(); } catch (e) { recoveryError = e; }
    }
    if (req.method === 'GET' && name === null) {
      const files = {};
      for (const entry of await fs.readdir(path, { withFileTypes: true })) {
        if (!entry.isFile() || !FILE_NAME.test(entry.name)) continue;
        const text = await read(join(path, entry.name));
        if (text !== null) files[entry.name] = text;
      }
      const payload = JSON.stringify({ files, dir, path, writable: writable && !recoveryError, capabilities: { changes: true }, ...(recoveryError ? { saveError: recoveryError.status ? recoveryError.message : 'an interrupted save needs recovery' } : {}) });
      const etag = '"' + createHash('sha256').update(payload).digest('hex') + '"';
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', 'no-cache');
      if (req.headers['if-none-match'] === etag) { res.writeHead(304).end(); return; }
      res.writeHead(200, { 'Content-Type': 'application/json' }).end(payload);
      return;
    }
    if (recoveryError) throw recoveryError;
    if (!writable) throw error(403, 'this backlog is read-only');
    if (req.headers['x-open-backlog'] !== '1') throw error(403, 'missing the X-Open-Backlog header');
    if (req.method === 'POST' && name === null) {
      let value;
      try { value = JSON.parse(await body(req, maxBody)); } catch (e) { if (e.status) throw e; throw error(400, 'the changes request is not JSON'); }
      await commit(changesFrom(value?.changes));
    } else if (req.method === 'PUT' && name !== null) {
      if (!FILE_NAME.test(name)) throw error(400, 'not a backlog file name');
      const after = await body(req, maxBody);
      await commit([{ name, before: await read(join(path, name)), after }]);
    } else {
      throw error(405, 'method not allowed');
    }
    res.writeHead(204).end();
  }

  // Return false for unrelated routes so the host can serve the kit or its own application.
  return async function files(req, res) {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname !== route && !pathname.startsWith(route + '/')) return false;
    let name;
    try { name = pathname === route ? null : decodeURIComponent(pathname.slice(route.length + 1)); }
    catch { res.writeHead(400).end(); return true; }
    const run = tail.then(() => handle(req, res, name)).catch((e) => {
      if (!res.headersSent) res.writeHead(e.status || 500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: e.status ? e.message : 'could not read or save backlog files' }));
      else res.destroy();
    });
    tail = run.catch(() => {});
    await run;
    return true;
  };
}
