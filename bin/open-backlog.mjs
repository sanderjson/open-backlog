#!/usr/bin/env node
import * as fs from 'node:fs/promises';
import { resolve, join } from 'node:path';
import * as core from '../web/core.js';

const usage = `Usage: node bin/open-backlog.mjs <command> [arguments]

  check [directory] [--json]
  next [directory] [--json]
  prompt <slug> [directory]
  index [directory] --check|--write
  new "<title>" [directory] [--field name=value]... [--weight <n>] [--tags a,b]
      [--items a,b,c | --epic <slug>]

Directory defaults to docs/backlog. Index generation replaces only a marked region.

new writes an item from _template.md and its index row. --field sets a choice field (once per
field), --items makes the item an epic over those items in work order, and --epic adds it to an
existing epic. If anything is wrong, it says why and writes nothing.

Examples:
  node bin/open-backlog.mjs new "Export to CSV" --field status=idea --field priority=mid --tags export
  node bin/open-backlog.mjs new "Retry failed payments" --epic checkout --field status=ready
  node bin/open-backlog.mjs new "Checkout v2" --items cart-rules,payment-retry,receipt-email
`;

async function read(dir) {
  const path = resolve(dir);
  const files = {};
  for (const entry of await fs.readdir(path, { withFileTypes: true })) {
    if (entry.isFile() && core.FILE_NAME.test(entry.name)) files[entry.name] = await fs.readFile(join(path, entry.name), 'utf8');
  }
  return { path, files, s: core.parseBacklog({ files, dir, path }) };
}

// Writes each file only if it still holds what was read (or, for a new one, still doesn't exist),
// through a hidden temporary file and a rename. Several files aren't one transaction: if a later
// write fails, the error names the ones already written.
async function writeChecked(dir, path, files, writes, changed) {
  const written = [];
  try {
    for (const [name, text] of Object.entries(writes)) {
      const target = join(path, name);
      const current = await fs.readFile(target, 'utf8').catch((e) => { if (e.code === 'ENOENT') return null; throw e; });
      if (current !== (files[name] ?? null)) throw new Error(`${join(dir, name)} ${changed}`);
      const temp = join(path, `.${name}.${process.pid}.tmp`);
      await fs.writeFile(temp, text, { flag: 'wx' });
      await fs.rename(temp, target);
      written.push(join(dir, name));
    }
  } catch (e) {
    if (written.length) e.written = written;
    throw e;
  }
  return written;
}

// new "<title>" [directory] and its flags, read in full before the backlog is touched.
function createOptions(args) {
  const valued = ['--field', '--weight', '--tags', '--items', '--epic'];
  const options = { fields: {}, tags: [] };
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg.startsWith('--')) { positional.push(arg); continue; }
    const [flag, inline] = arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, undefined];
    if (!valued.includes(flag)) throw new Error(`new doesn't take ${flag}\n\n${usage}`);
    const value = inline ?? args[++i];
    if (value == null || (inline == null && value.startsWith('--'))) throw new Error(`${flag} needs a value`);
    const list = () => value.split(',').map((x) => x.trim()).filter(Boolean);
    if (flag === '--field') {
      const at = value.indexOf('=');
      const [name, v] = [value.slice(0, at).trim(), value.slice(at + 1).trim()];
      if (at < 1 || !v) throw new Error(`--field takes name=value, not ${value}`);
      if (options.fields[name] != null && options.fields[name] !== v) throw new Error(`--field ${name} is given twice, as ${options.fields[name]} and ${v}`);
      options.fields[name] = v;
    } else if (flag === '--tags') {
      options.tags.push(...list());
    } else {
      const key = flag.slice(2);
      if (options[key] != null) throw new Error(`${flag} is given twice`);
      options[key] = key === 'items' ? list() : value.trim();
      if (key === 'items' && !options.items.length) throw new Error('--items needs at least one item slug');
    }
  }
  if (options.items && options.epic) throw new Error("--items and --epic can't go together: epics can't contain epics");
  const [title, dir = 'docs/backlog', ...extra] = positional;
  if (!title?.trim()) throw new Error(`new needs a title\n\n${usage}`);
  if (extra.length) throw new Error(`new takes a title and a directory, not ${extra.join(' ')}`);
  return { title, dir, options };
}

async function create(args) {
  const { title, dir, options } = createOptions(args);
  const { path, files, s } = await read(dir);
  for (const name of Object.keys(options.fields)) {
    if (!s.fields.some((f) => f.name === name)) throw new Error(`there's no field called ${name}; the fields are ${s.fields.map((f) => f.name).join(', ') || 'none'}`);
  }
  const { slug, writes } = core.planCreate(s, { title, ...options });
  try {
    const written = await writeChecked(dir, path, files, writes, 'changed since it was read; nothing was written, so run it again');
    process.stdout.write(`Created ${slug}\n${written.map((name) => `  ${name}\n`).join('')}`);
    return 0;
  } catch (e) {
    if (!e.written) throw e;
    process.stderr.write(`Couldn't finish: ${e.message}\nAlready written: ${e.written.join(', ')}. Review them before running it again.\n`);
    return 1;
  }
}

async function main(args) {
  if (!args.length || args.includes('--help')) { process.stdout.write(usage); return 0; }
  const command = args.shift();
  if (command === 'new') return create(args);
  const flags = args.filter((a) => a.startsWith('--'));
  const positional = args.filter((a) => !a.startsWith('--'));
  const allowed = command === 'index' ? ['--check', '--write'] : ['check', 'next'].includes(command) ? ['--json'] : [];
  if (!['check', 'next', 'prompt', 'index'].includes(command) || flags.some((f) => !allowed.includes(f)) || positional.length > (command === 'prompt' ? 2 : 1)) throw new Error(usage);
  if (command === 'index' && flags.length !== 1) throw new Error('index needs exactly one of --check or --write');
  const slug = command === 'prompt' ? positional.shift() : '';
  if (command === 'prompt' && !slug) throw new Error('prompt needs an item slug');
  const dir = positional[0] || 'docs/backlog';
  const { path, files, s } = await read(dir);
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
      // Don't overwrite an edit made while the index was generated.
      await writeChecked(dir, path, files, writes, 'changed while the index was generated; run it again');
    }
    return 0;
  }
  const ok = !s.problems.some((problem) => !problem.notice);
  process.stdout.write(flags.includes('--json') ? JSON.stringify({ ok, items: s.items.length, problems: s.problems }, null, 2) + '\n' : s.problems.map((problem) => `${problem.notice ? 'notice' : 'error'} ${problem.slug ? join(dir, problem.slug + '.md') : dir}: ${problem.message}\n`).join('') || `${s.items.length} items checked\n`);
  return ok ? 0 : 1;
}

try { process.exitCode = await main(process.argv.slice(2)); }
catch (e) { process.stderr.write(e.message + '\n'); process.exitCode = 2; }
