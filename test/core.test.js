// node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import * as core from "../web/core.js";

// A small backlog: `palette` (high, idea, nothing before it), `logo` (high, idea, waits on
// `palette`) and `backups` (mid, done, with an index row that disagrees on its status). Weights
// 10, 2 and 1, so work order differs from priority order.
const files = () => ({
  "backlog.yml": "title: Example\nfields:\n  status: [idea, ready, in-progress, parked, done]\n  priority: [high, mid, low]\n  area: [design, ops]\n",
  "palette.md": "---\ntitle: \"Brand palette\"\npriority: high\nweight: 10\nstatus: idea\narea: design\ntags: [brand, palette]\ncreated: 2026-10-15\ndepends_on: []\nrelated: [logo]\n---\n\n# Brand palette\n\n## Why\nOne palette drives **every** screen.\n\n- See [the logo](logo.md) and [notes](../notes.md).\n",
  "logo.md": "---\ntitle: \"Logo build\"\npriority: high\nweight: 2\nstatus: idea\narea: design\ntags: [brand]\ncreated: 2026-10-14\ndepends_on: [palette]\nrelated: []\n---\n\n# Logo build\n\nThe logo, drawn from the palette.\n",
  "backups.md": "---\ntitle: Backups\npriority: mid\nweight: 1\nstatus: done\narea: ops\ntags: []\ncreated: 2026-10-01\ndepends_on: []\nrelated: []\n---\n\n# Backups\n\nNightly copies.\n",
  "README.md": "# Backlog\n\n### Design\n\n| Item | Priority | Status |\n|---|---|---|\n| [Brand palette](palette.md) | high | idea |\n| [Logo build](logo.md) | high | idea |\n\n### Ops\n\n| Item | Priority | Status |\n|---|---|---|\n| [Backups](backups.md) | mid | idea |\n",
});

const load = (f = files()) => core.parseBacklog({ files: f, dir: "docs/backlog", path: "/p/docs/backlog", writable: true });

test("reads items, fields and work order", () => {
  const s = load();
  assert.equal(s.title, "Example");
  assert.deepEqual(s.items.map((i) => i.slug), ["backups", "logo", "palette"]);
  assert.deepEqual(s.fields.map((f) => f.name), ["status", "priority", "area"]);
  const palette = s.bySlug.get("palette");
  assert.equal(palette.title, "Brand palette");
  assert.equal(palette.weight, "10");
  assert.equal(palette.created, "2026-10-15");
  assert.deepEqual(palette.tags, ["brand", "palette"]);
  assert.equal(palette.summary, "One palette drives every screen.");
  assert.match(palette.html, /<strong>every<\/strong>/);
  assert.doesNotMatch(palette.html, /<h1>/);
});

test("works out what waits on what", () => {
  const s = load();
  const [palette, logo, backups] = ["palette", "logo", "backups"].map((x) => s.bySlug.get(x));
  assert.deepEqual(logo.blockers, ["palette"]);
  assert.deepEqual(palette.dependents, ["logo"]);
  assert.equal(palette.startable, true);
  assert.equal(logo.startable, false);
  assert.equal(backups.done, true);
  assert.equal(backups.open, false);
});

test("reports what doesn't add up", () => {
  const f = files();
  f["logo.md"] = f["logo.md"].replace("status: idea", "status: someday").replace("depends_on: [palette]", "depends_on: [palette, ghost]");
  f["loop-a.md"] = "---\ntitle: A\nstatus: idea\npriority: low\narea: ops\ndepends_on: [loop-b]\n---\n";
  f["loop-b.md"] = "---\ntitle: B\nstatus: idea\npriority: low\narea: ops\ndepends_on: [loop-a]\nweight: soon\n---\n";
  f["broken.md"] = "no front matter here";
  const messages = load(f).problems.map((p) => `${p.slug}: ${p.message}`);
  for (const expected of [
    'logo: status is "someday", not one of idea, ready, in-progress, parked, done',
    "logo: depends_on names ghost, which isn't an item",
    "backups: README.md's index says status idea, the item says done",
    "loop-a: its dependencies go round in a loop: loop-a → loop-b → loop-a",
    'loop-b: weight is "soon", not a positive whole number',
    "loop-a: it's missing from README.md's index",
    "broken: it doesn't start with front matter between --- lines",
    "broken: it has no status",
  ]) {
    assert.ok(messages.includes(expected), `missing: ${expected}\n${messages.join("\n")}`);
  }
  assert.equal(messages.filter((m) => m.includes("loop")).filter((m) => m.includes("go round")).length, 1);
});

test("guesses fields and their order without backlog.yml", () => {
  const f = files();
  delete f["backlog.yml"];
  const s = load(f);
  assert.deepEqual(s.fields.map((f) => f.name), ["status", "priority", "area"]);
  assert.deepEqual(core.field(s, "status").values, ["idea", "done"]);
  assert.deepEqual(core.field(s, "priority").values, ["high", "mid"]);
  assert.equal(core.field(s, "status").strict, false);
  assert.deepEqual(s.done, ["done"]);
});

test("an update writes the front matter and the index row", () => {
  const s = load();
  const writes = core.planUpdate(s, "backups", "status", "parked");
  assert.match(writes["backups.md"], /^status: parked$/m);
  assert.match(writes["README.md"], /^\| \[Backups\]\(backups\.md\) \| mid \| parked \|$/m);

  const weight = core.planUpdate(s, "logo", "weight", "");
  assert.doesNotMatch(weight["logo.md"], /weight/);
  assert.equal(weight["README.md"], undefined);

  assert.throws(() => core.planUpdate(s, "logo", "status", "someday"), /can't be "someday"/);
  assert.throws(() => core.planUpdate(s, "logo", "title", "x"), /can't be changed here/);
  assert.throws(() => core.planUpdate(s, "nope", "status", "idea"), /no item/);
});

test("a new item gets a file and a row in the table it fits", () => {
  const s = load();
  const { slug, writes } = core.planCreate(s, { title: "Restore drill: monthly", fields: { status: "ready", priority: "low", area: "ops" }, weight: "3" }, "2026-10-16");
  assert.equal(slug, "restore-drill-monthly");
  const text = writes["restore-drill-monthly.md"];
  assert.match(text, /^title: "Restore drill: monthly"$/m);
  assert.match(text, /^status: ready$/m);
  assert.match(text, /^weight: 3$/m);
  assert.match(text, /^created: 2026-10-16$/m);
  assert.match(text, /\n# Restore drill: monthly\n/);
  const lines = writes["README.md"].split("\n");
  const at = lines.indexOf("| [Restore drill: monthly](restore-drill-monthly.md) | low | ready |");
  assert.ok(at > lines.indexOf("### Ops"), "should land in the Ops table");

  const again = load({ ...files(), ...writes });
  assert.deepEqual(again.problems.map((p) => p.slug), ["backups"]); // the fixture's own stale row
  assert.equal(core.planCreate(again, { title: "Restore drill: monthly" }).slug, "restore-drill-monthly-2");
});

test("hosts send the template, and it's not an item", () => {
  for (const name of [core.TEMPLATE_FILE, core.CONFIG_FILE, "README.md", "palette.md", "notes.yaml"]) {
    assert.match(name, core.FILE_NAME);
  }
  for (const name of [".hidden.md", "../palette.md", "old/palette.md", "..", "run.sh", "palette.md.bak"]) {
    assert.doesNotMatch(name, core.FILE_NAME);
  }

  const s = load({ ...files(), [core.TEMPLATE_FILE]: "# {{title}}\n\n## Notes\n\nAbout {{title}}.\n" });
  assert.equal(s.bySlug.has("_template"), false);
  const { writes } = core.planCreate(s, { title: "Restore drill" }, "2026-10-16");
  assert.match(writes["restore-drill.md"], /\n# Restore drill\n\n## Notes\n\nAbout Restore drill\.\n$/);
});

test("setFront keeps the rest of the file as it is", () => {
  const text = "---\r\ntitle: X\r\nstatus: idea\r\n---\r\n\r\nBody\r\n";
  assert.equal(core.setFront(text, "status", "done"), "---\r\ntitle: X\r\nstatus: done\r\n---\r\n\r\nBody\r\n");
  assert.equal(core.setFront(text, "weight", "4"), "---\r\ntitle: X\r\nstatus: idea\r\nweight: 4\r\n---\r\n\r\nBody\r\n");
  assert.equal(core.setFront("---\n---\nBody", "status", "idea"), "---\nstatus: idea\n---\nBody");
  assert.equal(core.setFront("Body", "status", "idea"), "---\nstatus: idea\n---\n\nBody");
});

test("raw HTML and script links in an item stay harmless", () => {
  const html = core.renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) <img src=x onerror=alert(1)>');
  assert.doesNotMatch(html, /<script|<img|javascript:/);
});

test("editor links and paths", () => {
  assert.equal(core.resolvePath("/p/docs/backlog", "../notes.md"), "/p/docs/notes.md");
  assert.equal(core.editorURL("vscode", "/p/a b.md"), "vscode://file/p/a%20b.md");
  assert.equal(core.editorURL("idea", "/p/a.md"), "idea://open?file=%2Fp%2Fa.md");
  assert.equal(core.editorURL("none", "/p/a.md"), "");
  assert.equal(core.editorURL("myeditor://open?path={path}", "/p/a.md"), "myeditor://open?path=/p/a.md");
});
