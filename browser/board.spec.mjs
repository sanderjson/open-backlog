import { test, expect } from '@playwright/test';
import * as fs from 'node:fs/promises';
import { join } from 'node:path';
import { startServer, example } from '../test/server.mjs';

const puts = (server) => server.requests.filter(([method]) => method === 'PUT');

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
    // The host gives versions, so every save carries one, and a new file must not exist yet.
    expect(puts(server).every(([, , precondition]) => precondition)).toBe(true);
    expect(puts(server)).toContainEqual(['PUT', '/dev/backlog/files/gamma.md', '*']);
    expect(errors).toEqual([]);
  } finally { await server.close(); }
});

test('rapid edits are serialized and preserve both changes', async ({ page }) => {
  const server = await startServer({ intercept: async (req) => { if (req.method === 'PUT') await new Promise((done) => setTimeout(done, 40)); return false; } });
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
    if (req.method === 'PUT' && !changed) { changed = true; await fs.appendFile(join(dir, 'a.md'), '\nAcceptance added by the agent.\n'); }
    return false;
  } });
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await page.locator('.bb-panel').getByRole('combobox', { name: 'Status', exact: true }).selectOption('done');
    await expect(page.getByRole('alert')).toContainText("a.md changed since the board read it, so it wasn't saved");
    const file = await fs.readFile(join(server.dir, 'a.md'), 'utf8');
    expect(file).toContain('status: ready');
    expect(file).toContain('Acceptance added by the agent.');
    expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('| high | ready |');
  } finally { await server.close(); }
});

test('on a host without versions, the board reads a file again before saving it', async ({ page }) => {
  // The board's own reads for a save carry no If-None-Match (polls do). The agent writes right
  // after the first of them, the read the edit was planned on.
  let armed = false, reads = 0;
  const server = await startServer({ versions: false, after: async (req, dir) => {
    if (armed && !req.headers['if-none-match'] && ++reads === 1) await fs.appendFile(join(dir, 'a.md'), '\nNote from the agent.\n');
  } });
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    armed = true;
    await page.locator('.bb-panel').getByRole('combobox', { name: 'Status', exact: true }).selectOption('done');
    await expect(page.getByRole('alert')).toContainText("a.md changed since the board read it, so it wasn't saved");
    const file = await fs.readFile(join(server.dir, 'a.md'), 'utf8');
    expect(file).toContain('status: ready');
    expect(file).toContain('Note from the agent.');
    expect(puts(server)).toEqual([]);
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

test('a partial save is reported and immediately refreshed', async ({ page }) => {
  const server = await startServer({ versions: false, intercept: async (req, res) => {
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
    expect(puts(server).every(([, , precondition]) => !precondition)).toBe(true);
  } finally { await server.close(); }
});

const refresh = async (page) => {
  const answered = page.waitForResponse((response) => response.url().endsWith('/files') && response.request().method() === 'GET');
  await page.evaluate(() => window.dispatchEvent(new Event('open-backlog:refresh')));
  await answered;
};

test('a malformed link renders plainly and the board stays live', async ({ page }) => {
  const files = example();
  files['a.md'] = files['a.md'].replace('First task.', 'First task, see [bad](foo%E0%A4%A.md) and [Beta](b.md).');
  const server = await startServer({ files });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    const prose = page.locator('.bb-panel .bb-prose');
    await expect(prose.getByText('bad', { exact: true })).not.toHaveAttribute('href');
    await expect(prose.locator('a[data-item="b"]')).toHaveText('Beta');
    await expect(page.locator('.bb-panel')).toBeFocused();
    await fs.appendFile(join(server.dir, 'a.md'), '\nMore context.\n');
    await refresh(page);
    await expect(prose).toContainText('More context.');
    await expect(page.locator('.bb-live')).toHaveClass(/is-live/);
    expect(errors).toEqual([]);
  } finally { await server.close(); }
});

test('a render failure is reported as one, not as the host, and the next change renders', async ({ page }) => {
  const server = await startServer();
  try {
    await page.goto(server.url);
    await page.locator('.bb-card[data-item="a"]').click();
    await expect(page.locator('.bb-panel')).toBeFocused();
    // The next re-render of the open sheet refocuses its panel: make that throw, once.
    await page.evaluate(() => {
      const focus = HTMLElement.prototype.focus;
      HTMLElement.prototype.focus = function (...args) {
        HTMLElement.prototype.focus = focus;
        throw new Error('render broke');
      };
    });
    await fs.appendFile(join(server.dir, 'a.md'), '\nFirst change.\n');
    await refresh(page);
    await expect(page.getByRole('alert')).toContainText("Couldn't show the backlog: render broke");
    await expect(page.locator('.bb-live')).toHaveClass(/is-live/);
    await fs.appendFile(join(server.dir, 'a.md'), '\nSecond change.\n');
    await refresh(page);
    await expect(page.locator('.bb-panel .bb-prose')).toContainText('Second change.');
    await expect(page.locator('.bb-live')).toHaveClass(/is-live/);
  } finally { await server.close(); }
});

test('epic creation, membership and prompts use checked saves', async ({ page, context }) => {
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
    // The new file, the epic and the index, then the epic twice more: each save checked.
    expect(puts(server)).toHaveLength(5);
    expect(puts(server).every(([, , precondition]) => precondition)).toBe(true);
    expect(await fs.readFile(join(server.dir, 'README.md'), 'utf8')).toContain('[Gamma](gamma.md)');
  } finally { await server.close(); }
});
