import { createServer } from 'node:http';
import * as fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFilesHandler } from '../host/files.mjs';
import { FILE_NAME } from '../web/core.js';

export const example = () => ({
  'backlog.yml': 'fields:\n  status: [idea, ready, in-progress, done]\n  priority: [high, mid, low]\n  area: [one, two]\nstartable: [ready]\ndone: [done]\n',
  'a.md': '---\ntitle: Alpha\nstatus: ready\npriority: high\narea: one\nweight: 10\n---\n\n# Alpha\n\nFirst task.\n',
  'b.md': '---\ntitle: Beta\nstatus: ready\npriority: mid\narea: two\nweight: 20\ndepends_on: [a]\n---\n\n# Beta\n\nSecond task.\n',
  'README.md': '| Item | Priority | Status |\n| --- | --- | --- |\n| [Alpha](a.md) | high | ready |\n| [Beta](b.md) | mid | ready |\n',
});

export async function startServer({ files = example(), legacy = false, writable = true, maxBody, intercept } = {}) {
  const dir = await fs.mkdtemp(join(tmpdir(), 'open-backlog-test-'));
  for (const [name, text] of Object.entries(files)) await fs.writeFile(join(dir, name), text);
  const handler = createFilesHandler({ dir, writable, maxBody });
  const web = fileURLToPath(new URL('../web/', import.meta.url));
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      requests.push([req.method, req.url]);
      if (await intercept?.(req, res, dir)) return;
      if (legacy && req.method === 'GET' && req.url === '/dev/backlog/files') {
        const snapshot = {};
        for (const entry of await fs.readdir(dir, { withFileTypes: true })) if (entry.isFile() && FILE_NAME.test(entry.name)) snapshot[entry.name] = await fs.readFile(join(dir, entry.name), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ files: snapshot, dir, path: dir, writable }));
        return;
      }
      if (await handler(req, res)) return;
      const url = new URL(req.url, 'http://localhost');
      const name = url.pathname === '/dev/backlog/' ? 'index.html' : decodeURIComponent(url.pathname.replace('/dev/backlog/', ''));
      const file = resolve(web, name);
      if (!url.pathname.startsWith('/dev/backlog/') || !file.startsWith(web) || !(await fs.stat(file)).isFile()) { res.writeHead(404).end(); return; }
      const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
      res.writeHead(200, { 'Content-Type': types[extname(file)] || 'text/plain' }).end(await fs.readFile(file));
    } catch { if (!res.headersSent) res.writeHead(404).end(); else res.destroy(); }
  });
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  return { dir, url: `http://127.0.0.1:${server.address().port}/dev/backlog/`, requests,
    async close() { await new Promise((done) => server.close(done)); await fs.rm(dir, { recursive: true, force: true }); } };
}
