#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as core from '../web/core.js';

const usage = `Usage: node bin/open-backlog.mjs <command> [arguments]\n\n  check [directory] [--json]\n  next [directory] [--json]\n  prompt <slug> [directory]\n  index [directory] --check|--write\n\nDirectory defaults to docs/backlog. Index generation replaces only a marked region.\n`;

async function main(args) {
  if (!args.length || args.includes('--help')) { process.stdout.write(usage); return 0; }
  const command = args.shift();
  const flags = args.filter((a) => a.startsWith('--'));
  const positional = args.filter((a) => !a.startsWith('--'));
  const allowed = command === 'index' ? ['--check', '--write'] : ['check', 'next'].includes(command) ? ['--json'] : [];
  if (!['check', 'next', 'prompt', 'index'].includes(command) || flags.some((f) => !allowed.includes(f)) || positional.length > (command === 'prompt' ? 2 : 1)) throw new Error(usage);
  if (command === 'index' && flags.length !== 1) throw new Error('index needs exactly one of --check or --write');
  const slug = command === 'prompt' ? positional.shift() : '';
  if (command === 'prompt' && !slug) throw new Error('prompt needs an item slug');
  const dir = positional[0] || 'docs/backlog';
  const path = resolve(dir);
  const files = {};
  for (const entry of await fs.readdir(path, { withFileTypes: true })) {
    if (entry.isFile() && core.FILE_NAME.test(entry.name)) files[entry.name] = await fs.readFile(join(path, entry.name), 'utf8');
  }
  const s = core.parseBacklog({ files, dir, path });
  if (command === 'prompt') {
    process.stdout.write(core.isEpic?.(s.bySlug.get(slug)) && core.epicPrompt ? core.epicPrompt(s, slug) : core.itemPrompt(s, slug));
    return 0;
  }
  if (command === 'next') {
    const items = s.items.filter((item) => item.startable).map((item) => ({ slug: item.slug, title: item.title, file: join(dir, item.file), weight: item.weight, fields: item.fields }));
    process.stdout.write(flags.includes('--json') ? JSON.stringify(items, null, 2) + '\n' : items.map((item) => `${item.weight || '—'}\t${item.slug}\t${item.title}\n`).join(''));
    return 0;
  }
  if (command === 'index') {
    const writes = core.planIndex(s);
    if (flags.includes('--check')) {
      if (Object.keys(writes).length) { process.stderr.write(`${join(dir, s.index)} needs regeneration\n`); return 1; }
    } else {
      // Don't overwrite an edit made while the index was generated: write only if the file still
      // holds what was read, through a hidden temporary file and a rename.
      for (const [name, text] of Object.entries(writes)) {
        const target = join(path, name);
        const current = await fs.readFile(target, 'utf8').catch((e) => { if (e.code === 'ENOENT') return null; throw e; });
        if (current !== (files[name] ?? null)) throw new Error(`${join(dir, name)} changed while the index was generated; run it again`);
        const temp = join(path, `.${name}.${process.pid}.tmp`);
        await fs.writeFile(temp, text, { flag: 'wx' });
        await fs.rename(temp, target);
      }
    }
    return 0;
  }
  const ok = !s.problems.some((problem) => !problem.notice);
  process.stdout.write(flags.includes('--json') ? JSON.stringify({ ok, items: s.items.length, problems: s.problems }, null, 2) + '\n' : s.problems.map((problem) => `${problem.notice ? 'notice' : 'error'} ${problem.slug ? join(dir, problem.slug + '.md') : dir}: ${problem.message}\n`).join('') || `${s.items.length} items checked\n`);
  return ok ? 0 : 1;
}

try { process.exitCode = await main(process.argv.slice(2)); }
catch (e) { process.stderr.write(e.message + '\n'); process.exitCode = 2; }
