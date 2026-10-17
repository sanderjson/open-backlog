// A throwaway host for the tests: README.md's contract written out here, so the tests depend on
// no host project. It isn't for projects to run. Each project's own dev server serves the same
// few routes, in its own language. `npm run dev` (test/dev.mjs) runs it over the kit's own
// backlog, docs/backlog, for working on the kit.
import { createServer } from 'node:http';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { FILE_NAME } from '../web/core.js';

export const example = () => ({
  'backlog.yml': 'fields:\n  status: [idea, ready, in-progress, done]\n  priority: [high, mid, low]\n  area: [one, two]\nstartable: [ready]\ndone: [done]\n',
  'a.md': '---\ntitle: Alpha\nstatus: ready\npriority: high\narea: one\nweight: 10\n---\n\n# Alpha\n\nFirst task.\n',
  'b.md': '---\ntitle: Beta\nstatus: ready\npriority: mid\narea: two\nweight: 20\ndepends_on: [a]\n---\n\n# Beta\n\nSecond task.\n',
  'README.md': '| Item | Priority | Status |\n| --- | --- | --- |\n| [Alpha](a.md) | high | ready |\n| [Beta](b.md) | mid | ready |\n',
});

const MOUNT = '/dev/backlog/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
export const version = (text) => createHash('sha256').update(text).digest('hex');

const fail = (res, status, error) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error }));

async function readText(path) {
  try { return await fs.readFile(path, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}

// Serves a temporary copy of `files`, deleted by close(), or, given `dir`, that folder as it is.
// `versions: false` gives a host with only the two required routes. `intercept` can answer a
// request itself (return true); `after` runs once a GET of the files has been answered.
export async function startServer({ files = example(), versions = true, writable = true, maxBody = 1 << 20, intercept, after, dir: folder = '', port = 0 } = {}) {
  const temp = !folder;
  const dir = temp ? await fs.mkdtemp(join(tmpdir(), 'open-backlog-test-')) : resolve(folder);
  if (temp) for (const [name, text] of Object.entries(files)) await fs.writeFile(join(dir, name), text);
  // The folder as the project names it: docs/backlog, not the absolute path.
  const rel = relative(process.cwd(), dir);
  const shown = temp || !rel || rel.startsWith('..') ? dir : rel;
  const web = fileURLToPath(new URL('../web/', import.meta.url));
  const requests = [];
  let saving = Promise.resolve(); // one save at a time, so two saves can't pass the same check

  async function list() {
    const out = {};
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if (entry.isFile() && FILE_NAME.test(entry.name)) out[entry.name] = await fs.readFile(join(dir, entry.name), 'utf8');
    }
    return out;
  }

  async function get(req, res) {
    const current = await list();
    const payload = { files: current, dir: shown, path: dir, writable };
    if (versions) payload.versions = Object.fromEntries(Object.entries(current).map(([name, text]) => [name, version(text)]));
    const body = JSON.stringify(payload);
    const etag = `"${version(body)}"`;
    if (req.headers['if-none-match'] === etag) res.writeHead(304, { ETag: etag }).end();
    else res.writeHead(200, { 'Content-Type': 'application/json', ETag: etag }).end(body);
    await after?.(req, dir);
  }

  async function put(req, res, name) {
    if (req.headers['x-open-backlog'] !== '1') return fail(res, 403, 'missing the X-Open-Backlog header');
    if (!FILE_NAME.test(name)) return fail(res, 400, `can't write ${name}`);
    if (!writable) return fail(res, 403, 'the backlog is read-only');
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBody) return fail(res, 413, 'too large');
      chunks.push(chunk);
    }
    const target = join(dir, name);
    const save = saving.then(async () => {
      const info = await fs.lstat(target).catch(() => null);
      if (info && !info.isFile()) return fail(res, 400, `${name} isn't a regular file`);
      const current = await readText(target);
      if (versions) {
        if (req.headers['if-none-match'] === '*' && current != null) return fail(res, 412, `${name} exists already`);
        const match = req.headers['if-match']?.replace(/^"|"$/g, '');
        if (match != null && (current == null || match !== version(current))) return fail(res, 412, `${name} changed since it was read`);
      }
      const temp = join(dir, `.${name}.${randomUUID()}.tmp`);
      await fs.writeFile(temp, Buffer.concat(chunks), { flag: 'wx' });
      await fs.rename(temp, target);
      res.writeHead(204).end();
    });
    saving = save.catch(() => {});
    await save;
  }

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (temp) requests.push([req.method, url.pathname, req.headers['if-match'] ?? (req.method === 'PUT' ? req.headers['if-none-match'] : undefined)]);
      if (await intercept?.(req, res, dir)) return;
      if (req.method === 'GET' && url.pathname === `${MOUNT}files`) return await get(req, res);
      if (req.method === 'PUT' && url.pathname.startsWith(`${MOUNT}files/`)) return await put(req, res, decodeURIComponent(url.pathname.slice(`${MOUNT}files/`.length)));
      const name = url.pathname === MOUNT ? 'index.html' : decodeURIComponent(url.pathname.slice(MOUNT.length));
      const file = resolve(web, name);
      if (req.method !== 'GET' || !url.pathname.startsWith(MOUNT) || !file.startsWith(web) || !(await fs.stat(file)).isFile()) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'text/plain' }).end(await fs.readFile(file));
    } catch { if (!res.headersSent) res.writeHead(404).end(); else res.destroy(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  return { dir, url: `http://127.0.0.1:${server.address().port}${MOUNT}`, requests,
    // The page is still open and polling, so its keep-alive connection may never go idle: end
    // every connection, or close() waits until the test times out.
    async close() {
      await new Promise((done) => { server.close(done); server.closeAllConnections(); });
      if (temp) await fs.rm(dir, { recursive: true, force: true });
    } };
}
