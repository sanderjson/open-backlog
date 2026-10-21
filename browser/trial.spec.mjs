import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { startServer, example } from '../test/server.mjs';
import { NOTES_FILE } from '../web/trial.js';
import { VERSION } from '../web/core.js';

const openNotes = async (page) => {
  const panel = page.locator('.bb-panel');
  await (await panel.count() ? panel : page.locator('.bb-trial')).getByRole('button', { name: 'Trial notes', exact: true }).click();
  return page.getByRole('dialog', { name: 'Trial notes', exact: true });
};

for (const versions of [true, false]) {
  test(`trial notes save alongside work without changing items (versions=${versions})`, async ({ page }) => {
    const server = await startServer({ versions });
    try {
      await page.goto(server.url);
      await expect(page.locator('.bb-card')).toHaveCount(2);
      const dialog = await openNotes(page);
      await dialog.getByLabel('What happened?').fill('I could read the waiting label.');
      await dialog.getByRole('combobox', { name: 'Topic', exact: true }).selectOption('Grayscale');
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', { name: 'Trial notes', exact: true })).toBeFocused();
      await page.reload();
      await expect(page.locator('.bb-card')).toHaveCount(2);
      await openNotes(page);
      await expect(dialog.getByLabel('What happened?')).toHaveValue('I could read the waiting label.');
      await dialog.getByRole('button', { name: 'Save note', exact: true }).click();
      await expect(dialog.locator('[data-el="notesSaveStatus"]')).toContainText(`Saved to`);
      await expect(dialog.getByLabel('What happened?')).toHaveValue('');
      await fs.appendFile(join(server.dir, NOTES_FILE), '\nA hand-written observation.\n');
      await dialog.getByLabel('What happened?').fill('A second note.');
      await dialog.getByRole('button', { name: 'Save note', exact: true }).click();
      await expect(dialog.getByLabel('What happened?')).toHaveValue('');
      const notes = await fs.readFile(join(server.dir, NOTES_FILE), 'utf8');
      expect(notes).toContain(`Version: v${VERSION}`);
      expect(notes).toContain('Appearance: grayscale');
      expect(notes).toContain('A hand-written observation.');
      expect(notes).toContain('A second note.');
      expect(await fs.readFile(join(server.dir, 'a.md'), 'utf8')).toBe(example()['a.md']);
      expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toBe(example()['README.md']);
      const writes = server.requests.filter(([method]) => method === 'PUT');
      expect(writes).toHaveLength(2);
      expect(writes.every(([, url]) => url.endsWith('/' + NOTES_FILE))).toBe(true);
      expect(writes[0][2]).toBe(versions ? '*' : undefined);
      await dialog.getByRole('button', { name: 'Close', exact: true }).click();
      await expect(page.locator('.bb-card')).toHaveCount(2);
    } finally { await server.close(); }
  });
}

test('a checked notes conflict preserves both the external edit and recoverable draft', async ({ page }) => {
  const files = { ...example(), [NOTES_FILE]: '# Trial notes\n' };
  let conflict = true;
  const server = await startServer({ files, intercept: async (req) => {
    if (conflict && req.method === 'PUT' && req.url.endsWith('/' + NOTES_FILE)) {
      conflict = false;
      await fs.appendFile(join(server.dir, NOTES_FILE), '\nAnother observer wrote this.\n');
    }
    return false;
  } });
  try {
    await page.goto(server.url);
    await expect(page.locator('.bb-card')).toHaveCount(2);
    const dialog = await openNotes(page);
    await dialog.getByLabel('What happened?').fill('My observation.');
    await dialog.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText('changed since the board read it');
    await expect(dialog.getByLabel('What happened?')).toHaveValue('My observation.');
    expect(await fs.readFile(join(server.dir, NOTES_FILE), 'utf8')).not.toContain('My observation.');
    await dialog.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(dialog.getByLabel('What happened?')).toHaveValue('');
    const saved = await fs.readFile(join(server.dir, NOTES_FILE), 'utf8');
    expect(saved).toContain('Another observer wrote this.');
    expect(saved.match(/My observation\./g)).toHaveLength(1);
  } finally { await server.close(); }
});

test('read-only notes allow drafts and downloads, and show saved HTML as plain text', async ({ page }) => {
  const files = { ...example(), [NOTES_FILE]: '# Notes\n\n<img src=x onerror="window.injected=true">\n' };
  const server = await startServer({ files, writable: false });
  try {
    await page.goto(server.url);
    await expect(page.locator('.bb-card')).toHaveCount(2);
    const dialog = await openNotes(page);
    await expect(dialog.getByRole('button', { name: 'Save note', exact: true })).toBeDisabled();
    await dialog.getByText('Saved notes', { exact: true }).click();
    await expect(dialog.locator('pre')).toContainText('<img');
    await expect(dialog.locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => window.injected)).toBeUndefined();
    await dialog.getByLabel('What happened?').fill('Download this unsaved observation.');
    await expect(dialog.locator('[data-el="notesSaveStatus"]')).toContainText('read-only');
    const downloading = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Download notes', exact: true }).click();
    const download = await downloading;
    const text = await fs.readFile(await download.path(), 'utf8');
    expect(text).toContain('Download this unsaved observation.');
    expect(text).toContain('<img');
    expect(server.requests.some(([method]) => method === 'PUT')).toBe(false);
  } finally { await server.close(); }
});

test('grayscale is remembered per installation and covers both themes and the notes dialog', async ({ page }) => {
  const server = await startServer();
  try {
    await page.goto(server.url);
    await expect(page.locator('.bb-card')).toHaveCount(2);
    const grayscale = page.getByRole('checkbox', { name: 'Grayscale', exact: true });
    await expect(grayscale).toBeChecked();
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      const neutral = await page.locator('.bb').evaluate(root => {
        const css = getComputedStyle(root);
        return ['--bg', '--ink', '--accent', '--muted'].map(key => css.getPropertyValue(key).trim());
      });
      for (const hex of neutral) expect(hex.slice(1, 3)).toBe(hex.slice(3, 5));
      for (const hex of neutral) expect(hex.slice(3, 5)).toBe(hex.slice(5, 7));
      const dialog = await openNotes(page);
      expect(await dialog.evaluate(node => getComputedStyle(node).backgroundColor)).toBe(scheme === 'light' ? 'rgb(245, 245, 245)' : 'rgb(21, 21, 21)');
      await page.keyboard.press('Escape');
    }
    await grayscale.uncheck();
    await page.reload();
    await expect(grayscale).not.toBeChecked();
    await page.evaluate(async () => {
      const root = document.createElement('div');
      root.id = 'second-mount';
      root.dataset.openBacklog = '';
      root.dataset.api = '/another-backlog/';
      document.body.append(root);
      const { mount } = await import('./board.js');
      mount(root);
    });
    await expect(page.locator('#second-mount').getByRole('checkbox', { name: 'Grayscale', exact: true })).toBeChecked();
  } finally { await server.close(); }
});

test('cards expose priority and state words and progress fills only for done members', async ({ page }) => {
  const files = example();
  files['c.md'] = '---\ntitle: Finished\nstatus: done\npriority: low\n---\n\n# Finished\n';
  files['e.md'] = '---\ntitle: Launch\nstatus: ready\npriority: high\nitems: [a, b, c]\n---\n\n# Launch\n';
  files['zero.md'] = '---\ntitle: Zero\nstatus: ready\npriority: high\nitems: [a, b]\n---\n\n# Zero\n';
  files['full.md'] = '---\ntitle: Full\nstatus: done\npriority: high\nitems: [c]\n---\n\n# Full\n';
  const server = await startServer({ files });
  try {
    await page.goto(server.url);
    const card = slug => page.locator(`.bb-card[data-item="${slug}"]`);
    await expect(card('a')).toContainText('High priority');
    await expect(card('a')).toContainText('Weight 10');
    await expect(card('a')).toContainText('Can start');
    await expect(card('b')).toContainText('Waits on 1');
    await expect(card('c')).toContainText('Status: Done');
    await expect(card('c').locator('.bb-chip .bb-i')).toHaveCount(1);
    await expect(card('e').locator('.bb-epic-badge')).toHaveCount(1);
    for (const [slug, done, total] of [['zero', '0', '2'], ['e', '1', '3'], ['full', '1', '1']]) {
      await expect(card(slug).locator('progress')).toHaveAttribute('value', done);
      await expect(card(slug).locator('progress')).toHaveAttribute('max', total);
      await expect(card(slug)).toContainText(`${done}/${total} done`);
    }
    await card('a').click();
    const panel = page.locator('.bb-panel');
    const dialog = await openNotes(page);
    await dialog.getByLabel('What happened?').fill('Note while viewing an item.');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await card('b').click();
    await page.reload();
    await expect(panel).toBeVisible();
    await openNotes(page);
    await expect(dialog.locator('[data-el="notesContext"]')).toContainText('Alpha');
    await dialog.getByRole('button', { name: 'Save note', exact: true }).click();
    await expect(dialog.getByLabel('What happened?')).toHaveValue('');
    expect(await fs.readFile(join(server.dir, NOTES_FILE), 'utf8')).toContain('Item: a');
    await page.keyboard.press('Escape');
    await expect(panel).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Trial notes', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(panel).toHaveCount(0);
  } finally { await server.close(); }
});

test('trial controls fit narrow hosts and notes remain reachable at larger text sizes', async ({ page }) => {
  const server = await startServer();
  const embedded = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Host</title>
    <link rel="stylesheet" href="board.css"><script type="module" src="board.js"></script></head>
    <body style="margin:0"><button id="host-action">Host action</button><div data-open-backlog data-api="/dev/backlog/" style="width:320px;overflow:hidden"></div></body></html>`;
  try {
    await page.route('**/dev/backlog/trial-host.html', route => route.fulfill({ contentType: 'text/html', body: embedded }));
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(server.url + 'trial-host.html');
    await expect(page.locator('.bb-card')).toHaveCount(2);
    for (const size of [14, 16, 18]) {
      await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px`; }, size);
      for (const control of await page.locator('.bb-trial button, .bb-trial input').all()) {
        const box = await control.boundingBox();
        expect(box.x).toBeGreaterThanOrEqual(0);
        expect(box.x + box.width).toBeLessThanOrEqual(320);
      }
      const dialog = await openNotes(page);
      const box = await dialog.boundingBox();
      expect(box.width).toBeGreaterThan(320);
      await dialog.getByLabel('What happened?').fill(`A note at ${size}px.`);
      await page.keyboard.press('Escape');
      await expect(page.locator('.bb-trial').getByRole('button', { name: 'Trial notes', exact: true })).toBeFocused();
    }
    await expect(page).toHaveTitle('Host');
    await expect(page.locator('#host-action')).toBeEnabled();
  } finally { await server.close(); }
});
