// The kit's own backlog on the throwaway test host, for working on the kit:
//
//   npm run dev                       docs/backlog at http://127.0.0.1:3737/dev/backlog/
//   PORT=4000 npm run dev -- a/dir    another port, another folder
//
// This isn't a server for projects: their own dev server mounts the board (see PROMPT.md).
import { stat } from 'node:fs/promises';
import { startServer } from './server.mjs';

const dir = process.argv[2] || 'docs/backlog';
if (!(await stat(dir).catch(() => null))?.isDirectory()) {
  process.stderr.write(`${dir} isn't a folder\n`);
  process.exit(2);
}
const server = await startServer({ dir, port: Number(process.env.PORT) || 3737 });
process.stdout.write(`Serving ${dir} at ${server.url}\n`);
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close().then(() => process.exit(0)));
