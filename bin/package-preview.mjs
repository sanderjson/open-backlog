#!/usr/bin/env node
// Packages a local preview without copying this checkout's backlog or development files.
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from '../web/core.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== '--out')) {
  process.stderr.write('Usage: node bin/package-preview.mjs [--out <directory>]\n');
  process.exit(2);
}
const output = resolve(args[1] || join(root, 'artifacts'));
const name = `open-backlog-v${VERSION}`;
const staging = await mkdtemp(join(tmpdir(), 'open-backlog-preview-'));
const source = join(staging, name);
try {
  await mkdir(source);
  for (const path of ['web', 'bin/open-backlog.mjs', 'LICENSE', 'README.md', 'CHANGELOG.md',
    'PROMPT.md', 'docs/backlog-guidance/working-the-backlog.md', '.claude/skills/open-backlog/SKILL.md',
    'docs/trials/grayscale-preview.md', 'docs/trials/five-project-notes.md']) {
    await mkdir(dirname(join(source, path)), { recursive: true });
    await cp(join(root, path), join(source, path), { recursive: true });
  }
  await writeFile(join(source, 'VERSION'), `v${VERSION}\n`);
  const files = {};
  const walk = async (relative = '') => {
    for (const entry of (await readdir(join(source, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) await walk(path);
      else files[path] = createHash('sha256').update(await readFile(join(source, path))).digest('hex');
    }
  };
  await walk();
  await writeFile(join(source, 'MANIFEST.json'), JSON.stringify({ version: `v${VERSION}`, files }, null, 2) + '\n');
  await mkdir(output, { recursive: true });
  const archive = join(output, `${name}.tar.gz`);
  execFileSync('tar', ['-czf', archive, '-C', staging, name]);
  const checksum = createHash('sha256').update(await readFile(archive)).digest('hex');
  await writeFile(`${archive}.sha256`, `${checksum}  ${name}.tar.gz\n`);
  const guide = await readFile(join(source, 'docs/trials/grayscale-preview.md'), 'utf8');
  const prompt = guide.match(/```text\n([\s\S]*?)\n```/)?.[1];
  if (!prompt) throw new Error('The trial guide has no project update prompt.');
  await writeFile(join(output, 'UPDATE-PROMPT.md'), `Archive SHA-256: ${checksum}\nLocal archive: ${archive}\n\n${prompt}\n`);
  await writeFile(join(output, 'UPDATE-FROM-RELEASE.md'), `Release: https://github.com/sanderjson/open-backlog/releases/tag/v${VERSION}\nArchive SHA-256: ${checksum}\n\n${prompt}\n`);
  process.stdout.write(`${archive}\nSHA-256: ${checksum}\n${Object.keys(files).length} files; no project backlog or notes included.\n`);
} finally {
  await rm(staging, { recursive: true, force: true });
}
