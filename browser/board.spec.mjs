import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { startServer, example } from '../test/server.mjs';

test('edit, drag, create and copy operate through the host', async ({ page, context }) => {
  const server = await startServer();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await page.locator('.bb-panel').getByRole('combobox', { name: 'Status', exact: true }).selectOption('done');
    await expect.poll(() => fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('| [Alpha](a.md) | high | done |');
    await page.locator('.bb-panel').getByRole('button', { name: 'Close', exact: true }).click();
    await page.locator('.bb-card[data-item="b"]').dragTo(page.locator('.bb-column[data-drop="in-progress"]'));
    await expect.poll(() => fs.readFile(join(server.dir, 'b.md'), 'utf8')).toContain('status: in-progress');
    await page.getByRole('button', { name: 'New item', exact: true }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.getByLabel('Title', { exact: true }).fill('Gamma');
    await dialog.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('mid');
    await dialog.getByRole('combobox', { name: 'Area', exact: true }).selectOption('one');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('.bb-item-title')).toHaveText('Gamma');
    await page.getByRole('button', { name: 'Copy as prompt', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Work on this item from the backlog: Gamma');
    expect(server.requests.some(([method]) => method === 'POST')).toBe(true);
    expect(errors).toEqual([]);
  } finally { await server.close(); }
});

test('rapid edits are serialized and preserve both changes', async ({ page }) => {
  const server = await startServer({ intercept: async (req) => { if (req.method === 'POST') await new Promise((done) => setTimeout(done, 40)); return false; } });
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await page.locator('.bb-panel').evaluate((panel) => {
      for (const [name, value] of [['status', 'done'], ['priority', 'low']]) {
        const select = panel.querySelector(`[data-field="${name}"]`);
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    await expect.poll(() => fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('| [Alpha](a.md) | low | done |');
    const file = await fs.readFile(join(server.dir, 'a.md'), 'utf8');
    expect(file).toContain('status: done');
    expect(file).toContain('priority: low');
  } finally { await server.close(); }
});

test('an agent edit between read and save produces a conflict without overwrite', async ({ page }) => {
  let changed = false;
  const server = await startServer({ intercept: async (req, res, dir) => {
    if (req.method === 'POST' && !changed) { changed = true; await fs.appendFile(join(dir, 'a.md'), '\nAcceptance added by the agent.\n'); }
    return false;
  } });
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await page.locator('.bb-panel').getByRole('combobox', { name: 'Status', exact: true }).selectOption('done');
    await expect(page.getByRole('alert')).toContainText('changed since it was read');
    const file = await fs.readFile(join(server.dir, 'a.md'), 'utf8');
    expect(file).toContain('status: ready');
    expect(file).toContain('Acceptance added by the agent.');
    expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('| high | ready |');
  } finally { await server.close(); }
});

test('external refresh preserves a focused value and the following save keeps new content', async ({ page }) => {
  const server = await startServer();
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    const weight = page.locator('.bb-panel [data-field="weight"]');
    await weight.fill('77');
    await fs.appendFile(join(server.dir, 'a.md'), '\nExternal context.\n');
    const refresh = page.waitForResponse((response) => response.url().endsWith('/files') && response.request().method() === 'GET');
    await page.evaluate(() => window.dispatchEvent(new Event('open-backlog:refresh')));
    await refresh;
    await expect(weight).toHaveValue('77');
    await expect(weight).toBeFocused();
    await weight.press('Tab');
    await expect.poll(() => fs.readFile(join(server.dir, 'a.md'), 'utf8')).toContain('weight: 77');
    expect(await fs.readFile(join(server.dir, 'a.md'), 'utf8')).toContain('External context.');
    const first = page.locator('.bb-panel [data-el-open]');
    await first.focus();
    await expect(page.locator('.bb-toolbar')).toHaveJSProperty('inert', true);
    await page.keyboard.press('Shift+Tab');
    await expect(page.locator('.bb-panel .bb-relations a').last()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.bb-panel')).toHaveCount(0);
    await expect(page.locator('.bb-card[data-item="a"]')).toBeFocused();
  } finally { await server.close(); }
});

test('a legacy partial save is reported and immediately refreshed', async ({ page }) => {
  const server = await startServer({ legacy: true, intercept: async (req, res) => {
    if (req.method === 'PUT' && req.url.endsWith('/README.md')) { res.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Index unavailable' })); return true; }
    return false;
  } });
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await page.locator('.bb-panel').getByRole('combobox', { name: 'Status', exact: true }).selectOption('done');
    await expect(page.getByRole('alert')).toContainText('Already saved: a.md');
    await expect(page.locator('.bb-item-problems')).toContainText('index says status ready');
    expect(await fs.readFile(join(server.dir, 'a.md'), 'utf8')).toContain('status: done');
    expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('| high | ready |');
    expect(server.requests.some(([method]) => method === 'POST')).toBe(false);
  } finally { await server.close(); }
});

test('epic creation, membership and prompts use the checked save path', async ({ page, context }) => {
  const files = example();
  files['launch.md'] = '---\ntitle: Launch\nstatus: ready\npriority: high\narea: one\nitems: [a]\n---\n\n# Launch\n\nShip the two tasks.\n';
  files['README.md'] += '| [Launch](launch.md) | high | ready |\n';
  const server = await startServer({ files });
  try {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="launch"]').click();
    await page.getByRole('button', { name: 'Copy epic as prompt', exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain('Work through this epic from the backlog: Launch');
    await page.getByRole('button', { name: 'New item in this epic', exact: true }).click();
    const dialog = page.locator('dialog[open]');
    await dialog.getByLabel('Title', { exact: true }).fill('Gamma');
    await dialog.getByRole('combobox', { name: 'Priority', exact: true }).selectOption('mid');
    await dialog.getByRole('combobox', { name: 'Area', exact: true }).selectOption('one');
    await dialog.getByRole('button', { name: 'Create', exact: true }).click();
    await expect(page.locator('.bb-item-title')).toHaveText('Gamma');
    await expect.poll(() => fs.readFile(join(server.dir, 'launch.md'), 'utf8')).toContain('items: [a, gamma]');
    await page.getByRole('button', { name: 'Take it out of Launch', exact: true }).click();
    await expect.poll(() => fs.readFile(join(server.dir, 'launch.md'), 'utf8')).toContain('items: [a]');
    await page.getByRole('combobox', { name: 'Add it to an epic', exact: true }).selectOption('launch');
    await expect.poll(() => fs.readFile(join(server.dir, 'launch.md'), 'utf8')).toContain('items: [a, gamma]');
    expect(server.requests.filter(([method]) => method === 'POST')).toHaveLength(3);
    expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('[Gamma](gamma.md)');
  } finally { await server.close(); }
});
