import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../web/core.js';

const item = (title, extra = '') => `---\ntitle: ${title}\nstatus: ready\nweight: 10\narea: one\n${extra}\n---\n\n# ${title}\n`;
const config = 'fields:\n  status: [idea, ready, done]\n  area: [one, two]\nstartable: [ready]\n';

test('invalid dependencies cannot become execution suggestions', () => {
  for (const deps of ['[missing]', '[a]', '{unexpected: a}', '[{}]', '[null]']) {
    const s = core.parseBacklog({ files: { 'backlog.yml': config, 'a.md': item('A', `depends_on: ${deps}`) } });
    assert.equal(s.bySlug.get('a').startable, false, deps);
    assert(s.problems.some((p) => p.message.includes('depends_on')), deps);
  }
  const loop = core.parseBacklog({ files: { 'backlog.yml': config, 'a.md': item('A', 'depends_on: [b]'), 'b.md': item('B', 'depends_on: [a]') } });
  assert(loop.items.every((i) => !i.startable));
  const repaired = core.parseBacklog({ files: { 'backlog.yml': config, 'a.md': item('A', 'depends_on: [b]'), 'b.md': item('B').replace('status: ready', 'status: done') } });
  assert.equal(repaired.bySlug.get('a').startable, true);
});

test('title and duplicate-row diagnostics do not block otherwise valid work', () => {
  const s = core.parseBacklog({ files: {
    'backlog.yml': config,
    'a.md': item('A').replace('# A', '# Old title'),
    'README.md': '| Item | Status |\n| --- | --- |\n| [Old](a.md) | ready |\n| [A](a.md) | ready |\n',
  } });
  assert(s.problems.some((p) => p.message.includes('H1')));
  assert(s.problems.some((p) => p.message.includes('index title')));
  assert(s.problems.some((p) => p.message.includes('listed 2 times')));
  assert.equal(s.bySlug.get('a').startable, true);
});

test('managed index generation preserves prose, orders work and follows area changes', () => {
  let files = {
    'backlog.yml': config,
    'a.md': item('A'),
    'b.md': item('B').replace('weight: 10', 'weight: 2'),
    'README.md': `Keep this prose.\r\n\r\n${core.INDEX_START}\r\nold tables\r\n${core.INDEX_END}\r\n\r\nKeep this ending.\r\n`,
  };
  const generated = core.planIndex(core.parseBacklog({ files }));
  files = { ...files, ...generated };
  assert(files['README.md'].startsWith('Keep this prose.\r\n'));
  assert(files['README.md'].endsWith('Keep this ending.\r\n'));
  assert(files['README.md'].indexOf('[B]') < files['README.md'].indexOf('[A]'));
  assert.deepEqual(core.parseBacklog({ files }).problems, []);
  assert.deepEqual(core.planIndex(core.parseBacklog({ files })), {});
  const moved = core.planUpdate(core.parseBacklog({ files }), 'a', 'area', 'two');
  files = { ...files, ...moved };
  assert(files['README.md'].indexOf('[A]') > files['README.md'].indexOf('### Two'));
  assert.deepEqual(core.parseBacklog({ files }).problems, []);
  const created = core.planCreate(core.parseBacklog({ files }), { title: 'C', weight: 1, fields: { status: 'ready', area: 'two' } });
  assert(created.writes['README.md'].indexOf('[C]') < created.writes['README.md'].indexOf('[A]'));
  assert.deepEqual(core.parseBacklog({ files: { ...files, ...created.writes } }).problems, []);
});

test('an index generated from nothing starts with the marker and ends with one newline', () => {
  for (const readme of [undefined, '']) {
    const files = { 'backlog.yml': config, 'a.md': item('A'), ...(readme == null ? {} : { 'README.md': readme }) };
    const generated = core.planIndex(core.parseBacklog({ files }))['README.md'];
    assert(generated.startsWith(`${core.INDEX_START}\n\n### One`), JSON.stringify(generated.slice(0, 40)));
    assert(generated.endsWith(`${core.INDEX_END}\n`) && !generated.endsWith('\n\n'));
    assert.deepEqual(core.planIndex(core.parseBacklog({ files: { ...files, 'README.md': generated } })), {}, 'generating again writes nothing');
  }
  const prose = core.planIndex(core.parseBacklog({ files: { 'backlog.yml': config, 'a.md': item('A'), 'README.md': '# Backlog\n' } }))['README.md'];
  assert(prose.startsWith(`# Backlog\n\n${core.INDEX_START}`), 'text before it keeps its blank line');
});

test('unmanaged tables require deliberate adoption and explicit grouping catches drift', () => {
  const files = { 'backlog.yml': config, 'a.md': item('A'), 'README.md': '<!-- open-backlog:group area=two -->\n\n| Item | Status |\n| --- | --- |\n| [A](a.md) | ready |\n' };
  const s = core.parseBacklog({ files });
  assert(s.problems.some((p) => p.message.includes('puts it in area two')));
  assert.throws(() => core.planIndex(s), /wrap the existing index/);
  assert.throws(() => core.planIndex(core.parseBacklog({ files: { ...files, 'README.md': core.INDEX_START } })), /marker pair/);
});

test('special tag and index-title characters round trip', () => {
  const s = core.parseBacklog({ files: { 'backlog.yml': config, 'README.md': `${core.INDEX_START}\n${core.INDEX_END}\n` } });
  const created = core.planCreate(s, { title: 'A [square] | pipe', tags: ['a,b', '[one]', 'normal'], fields: { status: 'ready', area: 'one' } });
  const again = core.parseBacklog({ files: { ...s.files, ...created.writes } });
  assert.deepEqual(again.bySlug.get(created.slug).tags, ['a,b', '[one]', 'normal']);
  assert.deepEqual(again.problems, []);
});

test('index examples are prose, and generation cannot duplicate rows outside its region', () => {
  const example = `Instructions\n\n\x60\x60\x60markdown\n${core.INDEX_START}\n${core.INDEX_END}\n\x60\x60\x60\n`;
  let s = core.parseBacklog({ files: { 'a.md': item('A'), 'README.md': example } });
  const generated = core.planIndex(s)['README.md'];
  assert(generated.startsWith(example));
  assert.equal(generated.split(core.INDEX_START).length - 1, 2);
  s = core.parseBacklog({ files: { 'a.md': item('A'), 'README.md': `${core.INDEX_START}\n${core.INDEX_END}\n\n| Item | Status |\n| --- | --- |\n| [A](a.md) | ready |\n` } });
  assert.throws(() => core.planIndex(s), /all item index rows inside/);
  const broken = core.parseBacklog({ files: { 'README.md': core.INDEX_START } });
  assert(broken.problems.some((p) => p.message.includes('marker pair')));
});

test('creating inside an epic regenerates its managed index without losing membership', () => {
  const files = { 'backlog.yml': config, 'a.md': item('A'), 'epic.md': item('Epic', 'items: [a]'), 'README.md': `${core.INDEX_START}\n${core.INDEX_END}\n` };
  const s = core.parseBacklog({ files });
  const created = core.planCreate(s, { title: 'New task', fields: { status: 'ready', area: 'one' }, epic: 'epic' });
  const again = core.parseBacklog({ files: { ...files, ...created.writes } });
  assert.deepEqual(again.bySlug.get('epic').items, ['a', created.slug]);
  assert.deepEqual(again.problems, []);
  assert.match(core.epicPrompt(again, 'epic'), /New task/);
});
