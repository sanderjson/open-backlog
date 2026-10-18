// node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import * as core from "../web/core.js";

// A small backlog: `palette` (high, idea, nothing before it), `logo` (high, idea, waits on
// `palette`) and `backups` (mid, done, with an index row that disagrees on its status). Weights
// 10, 2 and 1, so work order differs from priority order, and `logo` comes before what it waits
// on: the board suggests a look at that (a notice, never a problem).
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

test("front matter behind a byte-order mark reads, and accents leave slugs", () => {
  const text = "---\ntitle: Café menu\nstatus: idea\n---\n\n# Café menu\n";
  for (const [name, body] of [["LF", text], ["CRLF", text.replaceAll("\n", "\r\n")]]) {
    const s = load({ "menu.md": "\uFEFF" + body });
    assert.equal(s.bySlug.get("menu").title, "Café menu", name);
    assert.equal(s.bySlug.get("menu").fields.status, "idea", name);
    assert.deepEqual(s.problems.filter((p) => !p.notice), [], name);
  }
  assert.equal(core.slugify("Caf\u00E9 cr\u00E8me"), "cafe-creme", "composed");
  assert.equal(core.slugify("Cafe\u0301 cre\u0300me"), "cafe-creme", "decomposed");
  assert.equal(core.slugify("Ægir straße"), "gir-stra-e", "letters without a decomposition are dropped, as before");
});

test("backlog.yaml is reported, never read", () => {
  const yaml = "title: From yaml\nfields:\n  status: [someday, now]\n";
  const top = (s) => s.problems.filter((p) => p.slug === "").map((p) => p.message);

  const f = files();
  delete f["backlog.yml"];
  const alone = load({ ...f, "backlog.yaml": yaml });
  assert.deepEqual(top(alone), ["backlog.yaml isn't read, so the fields are guessed: name it backlog.yml"]);
  assert.equal(alone.title, "Backlog", "its settings aren't used");
  assert.deepEqual(core.field(alone, "status").values, ["idea", "done"], "the fields are guessed as without a file");

  const both = load({ ...files(), "backlog.yaml": yaml });
  assert.deepEqual(top(both), ["backlog.yaml isn't read, backlog.yml is: move what you need from backlog.yaml into backlog.yml, then delete backlog.yaml"]);
  assert.equal(both.title, "Example", "backlog.yml is read as usual");
  assert.deepEqual(core.field(both, "status").values, ["idea", "ready", "in-progress", "parked", "done"]);

  assert.deepEqual(top(load()), [], "backlog.yml alone is fine");
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
  assert.deepEqual(again.problems.filter((p) => !p.notice).map((p) => p.slug), ["backups"]); // the fixture's own stale row
  assert.equal(core.planCreate(again, { title: "Restore drill: monthly" }).slug, "restore-drill-monthly-2");
});

test("a new item can take a file name of the project's own", () => {
  const s = load();
  const { slug, writes } = core.planCreate(s, { title: "Restore drill", slug: "ops-07-restore", fields: { status: "ready", priority: "low", area: "ops" } }, "2026-10-16");
  assert.equal(slug, "ops-07-restore");
  assert.deepEqual(Object.keys(writes), ["ops-07-restore.md", "README.md"]);
  assert.match(writes["ops-07-restore.md"], /^title: Restore drill$/m);
  assert.match(writes["README.md"], /^\| \[Restore drill\]\(ops-07-restore\.md\) \| low \| ready \|$/m);
  const again = load({ ...files(), ...writes });
  assert.equal(again.bySlug.get("ops-07-restore").title, "Restore drill");
  assert.deepEqual(again.problems.filter((p) => !p.notice).map((p) => p.slug), ["backups"]); // the fixture's own stale row
  assert.equal(core.planCreate(s, { title: "Restore drill" }).slug, "restore-drill", "without a slug, the title names it");

  const epic = core.planCreate(load(epicFiles()), { title: "Gift cards", slug: "pay-gift", epic: "checkout" }).writes;
  assert.match(epic["checkout.md"], /^items: \[.*, pay-gift\]$/m);
  const managed = { ...files(), "README.md": "# Backlog\n\n<!-- open-backlog:index start -->\n<!-- open-backlog:index end -->\n" };
  const ided = core.planCreate(load(managed), { title: "Restore drill", slug: "ops-07-restore", fields: { area: "ops" } }).writes;
  assert.match(ided["README.md"], /\[Restore drill\]\(ops-07-restore\.md\)/);

  const custom = load({ ...files(), "backlog.yml": files()["backlog.yml"] + "index: INDEX.md\n" });
  for (const [backlog, requested, message] of [
    [s, "palette", / palette\.md already exists$/],
    [s, "Palette", / palette\.md already exists$/],
    [s, "x.md", /without \.md: x$/],
    [s, "../x", /can't be a slug/],
    [s, "a/b", /can't be a slug/],
    [s, ".x", /can't be a slug/],
    [s, "-x", /can't be a slug/],
    [s, "two words", /can't be a slug/],
    [s, "_draft", /starts with _/],
    [s, "README", /README or index/],
    [s, "readme", /README or index/],
    [custom, "index", /README or index/],
  ]) {
    assert.throws(() => core.planCreate(backlog, { title: "X", slug: requested }), message, requested);
  }
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

test("an item copies as a prompt for an agent", () => {
  const s = load();
  const logo = core.itemPrompt(s, "logo");
  assert.match(logo, /^Work on this item from the backlog: Logo build\n\nIt waits on unfinished work: Brand palette\. Ask me before you start on it\.\n\nIf you go ahead, start by setting its status to in-progress, in its front matter and its row in docs\/backlog\/README\.md\. Set it to done there when it's finished\.\n\nRead its file before you start: the file is current, and this copy may not be\. If it lists open questions, ask me before you decide any of them\.\n\nFile: /);
  assert.match(logo, /^File: docs\/backlog\/logo\.md$/m);
  assert.match(logo, /^Fields: priority: high, status: idea, area: design, weight: 2$/m);
  assert.match(logo, /^Tags: brand$/m);
  assert.match(logo, /^Depends on:\n- Brand palette \(docs\/backlog\/palette\.md, status: idea\)$/m);
  assert.match(logo, /\n```markdown\nThe logo, drawn from the palette\.\n```\n/);
  assert.match(logo, /\nIts text \(links in it are relative to docs\/backlog\):\n\n```markdown\nThe logo, drawn from the palette\.\n```\n$/, "the text comes last, and the status isn't repeated after it");
  assert.equal(logo.match(/set it to done|set its status to done/gi)?.length ?? 0, 1, "done is said once");

  const palette = core.itemPrompt(s, "palette");
  assert.match(palette, /^Work on this item from the backlog: Brand palette\n\nStart by setting its status to in-progress, in its front matter and its row in docs\/backlog\/README\.md\. Set it to done there when it's finished\.\n\nRead its file /);
  assert.doesNotMatch(palette, /waits on/);
  assert.match(palette, /^Unblocks:\n- Logo build \(docs\/backlog\/logo\.md, status: idea\)$/m);
  assert.match(palette, /^Related:\n- Logo build/m);
  assert.match(core.itemPrompt(s, "backups"), /^Problems the board found in it:\n- README\.md's index says/m);
  // Suggestions are told apart from problems: logo comes before what it waits on.
  assert.match(logo, /^The board suggests:\n- /m);
  assert.doesNotMatch(logo, /^Problems the board found/m);

  // The opening follows the item's status and the backlog's own statuses, and is left out without one.
  const started = core.itemPrompt(load(withFront(files(), "palette", "status", "in-progress")), "palette");
  assert.match(started, /^Work on this item from the backlog: Brand palette\n\nIt's in-progress already\. Set its status to done, in its front matter and its row in docs\/backlog\/README\.md, when it's finished\.\n\nRead its file /);
  assert.doesNotMatch(started, /Start by/, "an item under way isn't told to start again");
  const own = { ...files(), "backlog.yml": "fields:\n  status: [idea, doing, shipped]\nactive: [doing]\ndone: [shipped]\n" };
  const custom = core.itemPrompt(load(own), "palette");
  assert.match(custom, /^Start by setting its status to doing, in its front matter and its row in docs\/backlog\/README\.md\. Set it to shipped there when it's finished\.$/m);
  assert.doesNotMatch(custom, /in-progress|\bdone\b/, "only the backlog's own statuses");
  const unset = core.itemPrompt(load({ ...files(), "backlog.yml": "fields:\n  status: [idea, doing, shipped]\nactive: []\ndone: []\n" }), "palette");
  assert.doesNotMatch(unset, /its status/, "no status is made up when the backlog names none");
  const unindexed = core.itemPrompt(load({ ...files(), "README.md": "# Backlog\n" }), "palette");
  assert.match(unindexed, /^Start by setting its status to in-progress, in its front matter\. Set it to done there when it's finished\.$/m);
  const untracked = core.itemPrompt(load(withFront(files(), "palette", "status", "")), "palette");
  assert.match(untracked, /^Work on this item from the backlog: Brand palette\n\nRead its file /);
  assert.doesNotMatch(untracked, /its status/);

  // A dependency that's no item is named as such, and reported as a problem.
  const ghost = core.itemPrompt(load(withFront(files(), "palette", "depends_on", ["ghost"])), "palette");
  assert.match(ghost, /^Depends on:\n- ghost \(no such item\)$/m);
  assert.match(ghost, /^Problems the board found in it:\n- .*ghost/m);

  // A code block in the item can't close the prompt's own fence.
  const fenced = load({ ...files(), "logo.md": files()["logo.md"] + "\n```sh\nmake logo\n```\n" });
  assert.match(core.itemPrompt(fenced, "logo"), /\n````markdown\n[\s\S]*```sh\nmake logo\n```\n````\n/);
  assert.throws(() => core.itemPrompt(s, "missing"), /no item called missing/);
});

// The small backlog plus an epic, `checkout`, listing six items in its own order: `receipt-email`
// first, though it waits on `payment-retry`, which waits on `cart-rules` (done). `refund-page` can
// start, `checkout-copy` waits on `palette` outside the epic, and `apple-pay` is parked.
const epicFiles = () => {
  const f = files();
  f["README.md"] += "\n### Checkout\n\n| Item | Priority | Status |\n|---|---|---|\n";
  const add = (slug, title, front, body = "") => {
    f[`${slug}.md`] = `---\ntitle: ${title}\npriority: mid\narea: ops\n${front}\n---\n\n# ${title}\n\n${body}`;
    f["README.md"] += `| [${title}](${slug}.md) | mid | ${/status: (\S+)/.exec(front)[1]} |\n`;
  };
  add("checkout", "Checkout v2", "status: in-progress\nweight: 1\nitems: [receipt-email, cart-rules, payment-retry, refund-page, checkout-copy, apple-pay]",
    "## Why\nOne checkout for web and app.\n\n## Acceptance\n- A customer pays, a failed payment retries, and a receipt arrives.\n");
  add("cart-rules", "Cart rules", "status: done\nweight: 3");
  add("payment-retry", "Payment retry", "status: in-progress\ndepends_on: [cart-rules]");
  add("receipt-email", "Receipt email", "status: idea\ndepends_on: [payment-retry]", "## Open questions\n- Plain text or HTML?\n");
  add("refund-page", "Refund page", "status: idea");
  add("checkout-copy", "Checkout copy", "status: ready\ndepends_on: [palette]");
  add("apple-pay", "Apple Pay", "status: parked");
  return f;
};

// Replaces the checkout epic's list (and any other front matter line) in a copy of the files.
const withFront = (f, slug, name, value) => ({ ...f, [`${slug}.md`]: core.setFront(f[`${slug}.md`], name, value) });

test("an item that lists items is an epic", () => {
  const s = load(epicFiles());
  const checkout = s.bySlug.get("checkout");
  assert.deepEqual(checkout.items, ["receipt-email", "cart-rules", "payment-retry", "refund-page", "checkout-copy", "apple-pay"]);
  assert.equal(core.isEpic(checkout), true);
  assert.equal(core.isEpic(s.bySlug.get("cart-rules")), false);
  assert.equal(checkout.fields.items, undefined, "items isn't a choice field");
  assert.deepEqual(s.problems.filter((p) => !p.notice).map((p) => p.slug), ["backups"]); // the fixture's own stale row

  const f = epicFiles();
  f["solo.md"] = "---\ntitle: Solo\nitems: refund-page\n---\n";
  f["empty.md"] = "---\ntitle: Empty\nitems: []\n---\n";
  const t = load(f);
  assert.deepEqual(t.bySlug.get("solo").items, ["refund-page"]);
  assert.equal(core.isEpic(t.bySlug.get("empty")), false);

  const reserved = load({ ...epicFiles(), "backlog.yml": "fields:\n  status: []\n  items: []\n" });
  assert.equal(reserved.problems[0].message, "backlog.yml: items can't be a choice field");
});

test("an item knows its epics, in title order", () => {
  const f = epicFiles();
  f["alpha.md"] = "---\ntitle: Alpha launch\nstatus: idea\npriority: low\narea: ops\nitems: [cart-rules]\n---\n";
  const s = load(f);
  assert.deepEqual(core.epicsOf(s, "cart-rules").map((e) => e.slug), ["alpha", "checkout"]);
  assert.deepEqual(core.epicsOf(s, "refund-page").map((e) => e.slug), ["checkout"]);
  assert.deepEqual(core.epicsOf(s, "palette"), []);
  assert.deepEqual(core.epicsOf(s, "checkout"), []);
});

test("an epic's work order puts dependencies first, then follows its list", () => {
  const s = load(epicFiles());
  assert.deepEqual(core.epicOrder(s, "checkout").order.map((i) => i.slug),
    ["cart-rules", "payment-retry", "receipt-email", "refund-page", "checkout-copy", "apple-pay"]);

  // Where dependencies don't decide, the list does: the first item and what it needs come first,
  // so `launch` (listed first) comes before `analytics`, right after what it waits on.
  const f = epicFiles();
  f["backlog.yml"] += "index: none\n";
  const item = (slug, deps = "[]") => `---\ntitle: ${slug}\nstatus: idea\npriority: low\narea: ops\ndepends_on: ${deps}\n---\n`;
  Object.assign(f, {
    "site.md": "---\ntitle: Site\nstatus: idea\npriority: low\narea: ops\nitems: [launch, analytics, copy, design]\n---\n",
    "launch.md": item("launch", "[design, copy]"), "analytics.md": item("analytics"), "copy.md": item("copy"), "design.md": item("design"),
  });
  assert.deepEqual(core.epicOrder(load(f), "site").order.map((i) => i.slug), ["copy", "design", "launch", "analytics"]);

  // A loop can't be ordered: each item still comes once, and only the loop check reports it.
  f["copy.md"] = item("copy", "[launch]");
  const looped = load(f);
  assert.deepEqual(core.epicOrder(looped, "site").order.map((i) => i.slug).sort(), ["analytics", "copy", "design", "launch"]);
  assert.deepEqual(looped.problems.filter((p) => !p.notice).map((p) => p.message), ["its dependencies go round in a loop: copy → launch → copy"]);
});

test("an epic lists what holds it up from outside", () => {
  const s = load(epicFiles());
  const { outside, missing } = core.epicOrder(s, "checkout");
  assert.deepEqual(outside.map(({ item, waiting }) => [item.slug, waiting.map((w) => w.slug)]), [["palette", ["checkout-copy"]]]);
  assert.deepEqual(missing, []);

  // Once palette is done nothing holds it up; a finished item's own dependencies don't count.
  const done = load(withFront(withFront(epicFiles(), "palette", "status", "done"), "cart-rules", "depends_on", ["logo"]));
  assert.deepEqual(core.epicOrder(done, "checkout").outside, []);
});

test("an epic's progress counts its items by stage", () => {
  const s = load(epicFiles());
  const { next, ...counts } = core.epicProgress(s, "checkout");
  assert.deepEqual(counts, { total: 6, done: 1, setAside: 1, active: 1, ready: 1, blocked: 2, other: 0 });
  assert.equal(next.slug, "refund-page");

  const f = withFront(epicFiles(), "refund-page", "status", "in-progress");
  const busy = core.epicProgress(load(f), "checkout");
  assert.equal(busy.next, null);
  assert.equal(busy.active, 2);
  assert.throws(() => core.epicProgress(s, "nope"), /no item called nope/);
});

test("epics report what doesn't add up", () => {
  const f = withFront(epicFiles(), "checkout", "items", ["receipt-email", "ghost", "checkout", "alpha", "refund-page", "refund-page"]);
  f["alpha.md"] = "---\ntitle: Alpha launch\nstatus: idea\npriority: low\narea: ops\nitems: [cart-rules]\n---\n";
  const messages = load(f).problems.filter((p) => p.slug === "checkout").map((p) => p.message);
  assert.deepEqual(messages, [
    "items names ghost, which isn't an item",
    "items names the epic itself",
    "items names alpha, which is an epic: epics can't contain epics",
    "items names refund-page twice",
  ]);

  const done = load(withFront(epicFiles(), "checkout", "status", "done")).problems.filter((p) => p.slug === "checkout");
  assert.deepEqual(done.map((p) => p.message), [
    "it's done, but 4 of its 6 items aren't done or closed: receipt-email, payment-retry, refund-page, checkout-copy",
    "README.md's index says status in-progress, the item says done",
  ]);
  assert.ok(done.every((p) => !p.notice));
});

test("an epic whose items are all done gets a suggestion, not a problem", () => {
  let f = epicFiles();
  for (const slug of ["payment-retry", "receipt-email", "refund-page", "checkout-copy", "apple-pay"]) f = withFront(f, slug, "status", "done");
  const notes = load(f).problems.filter((p) => p.slug === "checkout");
  assert.deepEqual(notes, [{ slug: "checkout", message: "every item in it is done: set it to done once its own acceptance holds", notice: true }]);

  const parked = load(withFront(f, "apple-pay", "status", "parked")).problems.filter((p) => p.slug === "checkout");
  assert.equal(parked[0].message, "every item in it is done or closed: set it to done once its own acceptance holds");

  // Done, and the index row says so too: nothing left to say.
  const closed = withFront(f, "checkout", "status", "done");
  closed["README.md"] = closed["README.md"].replace("| [Checkout v2](checkout.md) | mid | in-progress |", "| [Checkout v2](checkout.md) | mid | done |");
  assert.deepEqual(load(closed).problems.filter((p) => p.slug === "checkout"), []);
});

test("adding to and removing from an epic writes only the epic's file", () => {
  const s = load(epicFiles());
  const add = core.planAddToEpic(s, "checkout", "palette");
  assert.deepEqual(Object.keys(add), ["checkout.md"]);
  assert.match(add["checkout.md"], /^items: \[receipt-email, cart-rules, payment-retry, refund-page, checkout-copy, apple-pay, palette\]$/m);
  assert.deepEqual(core.planAddToEpic(s, "checkout", "refund-page"), {}, "adding twice changes nothing");

  const remove = core.planRemoveFromEpic(s, "checkout", "payment-retry");
  assert.match(remove["checkout.md"], /^items: \[receipt-email, cart-rules, refund-page, checkout-copy, apple-pay\]$/m);
  assert.deepEqual(core.planRemoveFromEpic(s, "checkout", "palette"), {});
  assert.equal(remove["checkout.md"].replace(/^items:.*$/m, ""), epicFiles()["checkout.md"].replace(/^items:.*$/m, ""), "nothing else changes");

  assert.throws(() => core.planAddToEpic(s, "checkout", "checkout"), /can't list itself/);
  assert.throws(() => core.planAddToEpic(s, "checkout", "ghost"), /no item called ghost/);
  const f = { ...epicFiles(), "alpha.md": "---\ntitle: Alpha launch\nstatus: idea\npriority: low\narea: ops\nitems: [palette]\n---\n" };
  assert.throws(() => core.planAddToEpic(load(f), "checkout", "alpha"), /alpha is an epic/);
  assert.throws(() => core.planAddToEpic(load(f), "refund-page", "logo"), /refund-page is in the epic checkout/);

  // Any other item can start a list, and the last item out leaves an empty one: no longer an epic.
  assert.match(core.planAddToEpic(s, "palette", "logo")["palette.md"], /\nitems: \[logo\]\n---\n/);
  const solo = load(withFront(epicFiles(), "checkout", "items", ["refund-page"]));
  assert.match(core.planRemoveFromEpic(solo, "checkout", "refund-page")["checkout.md"], /^items: \[\]$/m);
});

test("a list keeps its style when it changes", () => {
  const block = "---\r\ntitle: Checkout\r\nitems:\r\n  - cart-rules\r\n  # next\r\n  - refund-page\r\nstatus: idea\r\n---\r\n\r\nBody\r\n";
  assert.equal(core.setFront(block, "items", ["cart-rules", "refund-page", "palette"]),
    "---\r\ntitle: Checkout\r\nitems:\r\n  - cart-rules\r\n  - refund-page\r\n  - palette\r\nstatus: idea\r\n---\r\n\r\nBody\r\n");
  assert.equal(core.setFront("---\nitems:\n- a\n- b\n---\n", "items", ["b"]), "---\nitems:\n- b\n---\n");
  assert.equal(core.setFront("---\nitems: [a,\n  b]\nstatus: idea\n---\n", "items", ["a"]), "---\nitems: [a]\nstatus: idea\n---\n");
  assert.equal(core.setFront("---\ntitle: X\nitems:\n  - a\n---\n", "items", ""), "---\ntitle: X\n---\n");
  assert.equal(core.setFront("---\ntitle: X\n---\n", "items", ["a", "b"]), "---\ntitle: X\nitems: [a, b]\n---\n");
  assert.equal(core.setFront("---\ntitle: X\n---\n", "items", ["x,y"]), '---\ntitle: X\nitems: ["x,y"]\n---\n');
});

test("a new item can go straight into an epic", () => {
  const s = load(epicFiles());
  const { slug, writes } = core.planCreate(s, { title: "Gift cards", fields: { status: "idea", priority: "low", area: "ops" }, epic: "checkout" }, "2026-10-16");
  assert.equal(slug, "gift-cards");
  assert.deepEqual(Object.keys(writes), ["gift-cards.md", "checkout.md", "README.md"]);
  assert.match(writes["checkout.md"], /^items: \[receipt-email, cart-rules, payment-retry, refund-page, checkout-copy, apple-pay, gift-cards\]$/m);

  const again = load({ ...epicFiles(), ...writes });
  assert.deepEqual(core.epicsOf(again, "gift-cards").map((e) => e.slug), ["checkout"]);
  assert.deepEqual(again.problems.filter((p) => !p.notice).map((p) => p.slug), ["backups"]);
  assert.throws(() => core.planCreate(s, { title: "X", epic: "ghost" }), /no item called ghost/);
  assert.throws(() => core.planCreate(s, { title: "X", epic: "refund-page" }), /refund-page is in the epic checkout/);
});

test("a new item is dated by the local day, not the UTC one", () => {
  // Just after midnight in Berlin is still the evening before in UTC; the evening in Los Angeles
  // is already tomorrow in UTC.
  const day = (tz, iso) => spawnSync(process.execPath, ["--input-type=module", "-e",
    `import { localDay } from ${JSON.stringify(new URL("../web/core.js", import.meta.url).href)}; process.stdout.write(localDay(new Date(${JSON.stringify(iso)})))`],
  { encoding: "utf8", env: { ...process.env, TZ: tz } }).stdout;
  assert.equal(day("Europe/Berlin", "2026-10-17T22:39:00Z"), "2026-10-18");
  assert.equal(day("America/Los_Angeles", "2026-10-18T03:00:00Z"), "2026-10-17");
  assert.equal(day("UTC", "2026-10-17T22:39:00Z"), "2026-10-17");
  assert.equal(core.localDay(new Date(2026, 0, 5, 0, 1)), "2026-01-05");
  assert.match(core.planCreate(load(), { title: "Today" }).writes["today.md"], new RegExp(`^created: ${core.localDay()}$`, "m"));
});

test("a new item can be an epic over existing items", () => {
  const s = load(epicFiles());
  const { slug, writes } = core.planCreate(s, { title: "Brand refresh", fields: { status: "idea", priority: "high", area: "design" }, items: ["logo", "palette"] }, "2026-10-17");
  assert.equal(slug, "brand-refresh");
  assert.deepEqual(Object.keys(writes), ["brand-refresh.md", "README.md"]);
  assert.match(writes["brand-refresh.md"], /^created: 2026-10-17\nitems: \[logo, palette\]\ndepends_on: \[\]$/m);
  assert.doesNotMatch(writes["brand-refresh.md"], /^type:/m, "no type is needed to be an epic");
  assert.match(writes["README.md"], /^\| \[Brand refresh\]\(brand-refresh\.md\) \| high \| idea \|$/m);

  const again = load({ ...epicFiles(), ...writes });
  const epic = again.bySlug.get("brand-refresh");
  assert.equal(core.isEpic(epic), true);
  assert.deepEqual(epic.items, ["logo", "palette"]);
  assert.deepEqual(core.epicOrder(again, "brand-refresh").order.map((i) => i.slug), ["palette", "logo"], "logo waits on palette");
  assert.deepEqual(again.problems.filter((p) => !p.notice).map((p) => p.slug), ["backups"]);

  const create = (items, more = {}) => () => core.planCreate(s, { title: "X", items, ...more });
  assert.throws(create(["logo", "ghost"]), /there's no item called ghost/);
  assert.throws(create(["logo", "logo"]), /logo is listed twice/);
  assert.throws(create(["checkout"]), /checkout is an epic, and epics can't contain epics/);
  assert.throws(create([]), /an epic needs at least one item/);
  assert.throws(create(["logo"], { epic: "checkout" }), /a new epic can't go into an epic/);
  assert.equal(core.planCreate(s, { title: "X" }).writes["x.md"].includes("items:"), false);
});

test("an epic copies as one prompt for an agent", () => {
  const f = epicFiles();
  f["checkout-copy.md"] = f["checkout-copy.md"].replace("status: ready", "status: idea"); // its index row now disagrees
  const s = load(f);
  const prompt = core.epicPrompt(s, "checkout");
  assert.match(prompt, /^Work through this epic from the backlog: Checkout v2\n\nThe epic is in-progress already\.\n\nHow to work:\n- Read the epic's file now, and each item's file before you start that item: the files are current, and this copy may not be\./);
  const at = (text) => prompt.indexOf(text);
  assert.ok(at("How to work:") < at("Its items in work order") && at("Its items in work order") < at("Epic: ") && at("Epic: ") < at("```markdown"), "what to do comes before what to know, and the epic's text last");
  assert.equal(prompt.match(/as you start it|when you start it/g).length, 1, "the items' status rule is said once");
  assert.match(prompt, /^Epic: docs\/backlog\/checkout\.md$/m);
  assert.match(prompt, /^Progress: 1 of 6 items done, 1 in progress, 1 can start, 2 waiting, 1 set aside$/m);
  assert.match(prompt, /\n```markdown\n## Why\nOne checkout for web and app\.\n\n## Acceptance\n- A customer pays, a failed payment retries, and a receipt arrives\.\n```\n/);
  assert.ok(prompt.includes([
    "",
    "1. Cart rules (docs/backlog/cart-rules.md)",
    "   status: done, priority: mid, weight: 3",
    "2. Payment retry (docs/backlog/payment-retry.md)",
    "   status: in-progress, priority: mid",
    "3. Receipt email (docs/backlog/receipt-email.md)",
    "   status: idea, priority: mid",
    "   waits on: 2. Payment retry",
    "4. Refund page (docs/backlog/refund-page.md)",
  ].join("\n")), prompt);
  assert.match(prompt, /^5\. Checkout copy \(docs\/backlog\/checkout-copy\.md\)\n   status: idea, priority: mid\n   waits on: Brand palette \(docs\/backlog\/palette\.md, status: idea\), outside the epic\n   problems: README\.md's index says status ready, the item says idea$/m);
  assert.match(prompt, /\n```\n$/, "the epic's text comes last");
  assert.match(prompt, /^Next up: 4\. Refund page, the first item that can start now\.$/m);
  assert.match(prompt, /^- Brand palette \(docs\/backlog\/palette\.md, status: idea\): 5\. Checkout copy waits on it$/m);
  assert.match(prompt, /^- Read the epic's file now, and each item's file before you start that item/m);
  assert.match(prompt, /^- Follow the work order below unless an item's file says otherwise\.$/m);
  assert.match(prompt, /^- Keep each item's status current: set it to in-progress when you start it and to done when it's finished, in its front matter and its row in docs\/backlog\/README\.md\.$/m);
  assert.doesNotMatch(prompt, /Set the epic's status/, "it's in progress already");
  assert.match(prompt, /^- Set the epic to done only when every item in it is done \(or parked\) and the epic's own acceptance holds\.$/m);
  assert.match(prompt, /^- If an item lists open questions, stop and ask me before you decide any of them\.$/m);
  assert.doesNotMatch(prompt, /Plain text or HTML/, "items' text stays in their files");

  const ideaFiles = withFront(epicFiles(), "checkout", "status", "idea");
  const idea = core.epicPrompt(load(ideaFiles), "checkout");
  assert.match(idea, /^Work through this epic from the backlog: Checkout v2\n\nStart by setting the epic's status to in-progress, in its front matter and its row in docs\/backlog\/README\.md\.\n\nHow to work:\n/);
  const blocked = core.epicPrompt(load(withFront(ideaFiles, "checkout", "depends_on", ["palette"])), "checkout");
  assert.match(blocked, /^Work through this epic from the backlog: Checkout v2\n\nThe epic itself waits on unfinished work: Brand palette\. Ask me before you start on it\.\n\nIf you go ahead, start by setting the epic's status to in-progress, /);
  assert.match(core.itemPrompt(s, "refund-page"), /^In the epic:\n- Checkout v2 \(docs\/backlog\/checkout\.md, status: in-progress\)$/m);
  assert.throws(() => core.epicPrompt(s, "refund-page"), /refund-page isn't an epic/);
  assert.throws(() => core.epicPrompt(s, "nope"), /no item called nope/);
});

test("an epic can start only when one of its items can", () => {
  // In a startable status, with refund-page able to start, the epic can start.
  const f = withFront(epicFiles(), "checkout", "status", "idea");
  assert.equal(load(f).bySlug.get("checkout").startable, true);

  // Every open item under way or waiting: the epic waits too, though nothing of its own holds it.
  const held = withFront(f, "refund-page", "status", "in-progress");
  const epic = load(held).bySlug.get("checkout");
  assert.equal(epic.startable, false);
  assert.deepEqual(epic.blockers, []);
  assert.equal(core.epicProgress(load(held), "checkout").next, null);
  assert.equal(core.stage(load(held), epic), "blocked");

  // Once palette is done, checkout-copy can start, and so can the epic.
  assert.equal(load(withFront(held, "palette", "status", "done")).bySlug.get("checkout").startable, true);

  // Nothing open left: what remains is the epic's own acceptance, so it can start.
  let finished = held;
  for (const slug of ["payment-retry", "receipt-email", "refund-page", "checkout-copy"]) finished = withFront(finished, slug, "status", "done");
  assert.equal(load(finished).bySlug.get("checkout").startable, true);

  // Its own dependencies and status still count.
  assert.equal(load(withFront(f, "checkout", "depends_on", ["palette"])).bySlug.get("checkout").startable, false);
  assert.equal(load(epicFiles()).bySlug.get("checkout").startable, false, "in progress isn't a startable status");
});

test("a prerequisite that comes after its dependent in work order is a suggestion", () => {
  assert.deepEqual(load().problems.filter((p) => p.slug === "logo"),
    [{ slug: "logo", message: "it depends on palette, which comes after it in work order (weight 10 after 2)", notice: true }]);
  assert.deepEqual(load(withFront(files(), "palette", "status", "done")).problems.filter((p) => p.slug === "logo"), [], "a finished one is no longer in the way");
  assert.equal(load(withFront(files(), "palette", "weight", "")).problems.find((p) => p.slug === "logo").message,
    "it depends on palette, which comes after it in work order (no weight)");
  assert.deepEqual(load(withFront(files(), "logo", "weight", "")).problems.filter((p) => p.slug === "logo"), [], "an unweighted item comes last anyway");
  assert.deepEqual(load(withFront(files(), "logo", "weight", "10")).problems.filter((p) => p.slug === "logo"), [], "equal weights are a tie, not an order");
});

test("related repeating depends_on is a suggestion", () => {
  const s = load(withFront(files(), "logo", "related", ["palette", "backups"]));
  assert.deepEqual(s.problems.filter((p) => p.slug === "logo").map((p) => [p.message, p.notice]), [
    ["it depends on palette, which comes after it in work order (weight 10 after 2)", true],
    ["related names palette, which is already in depends_on", true],
  ]);
});

test("type epic on an item that lists no items is a suggestion", () => {
  const f = withFront(files(), "palette", "type", "epic");
  assert.deepEqual(load(f).problems.filter((p) => p.slug === "palette"), [{ slug: "palette", message: "its type is epic, but it lists no items", notice: true }]);
  assert.deepEqual(load(withFront(f, "palette", "items", ["logo"])).problems.filter((p) => p.slug === "palette"), []);
  assert.deepEqual(load(withFront(epicFiles(), "checkout", "type", "epic")).problems.filter((p) => p.slug === "checkout"), []);
});

test("a link in an item's text to a file that isn't there is a problem", () => {
  const f = files();
  f["palette.md"] += "\nSee [retired](retired.md), [./notes](./old-notes.md), [the config](backlog.yml), [outside](../notes.md), [deep](sub/x.md), " +
    "[web](https://example.com/x.md), [mail](mailto:a@b.md), [a section](logo.md#why), [titled](<backups.md> \"Backups\") and `[code](nope.md)`.\n\n```md\n[fenced](nope.md)\n```\n";
  const messages = load(f).problems.filter((p) => p.slug === "palette").map((p) => p.message);
  assert.deepEqual(messages, ["it links to retired.md, which isn't in docs/backlog", "it links to old-notes.md, which isn't in docs/backlog"]);
  assert.match(core.itemPrompt(load(f), "palette"), /^- it links to retired\.md, which isn't in docs\/backlog$/m);
});

test("a table under open-backlog:ignore is neither checked nor rewritten", () => {
  const f = files();
  f["README.md"] += "\n## Overview\n\n<!-- open-backlog:ignore -->\n\n| Item | Status | Note |\n|---|---|---|\n| [Brand palette](palette.md) | someday | first |\n| [Backups](backups.md) | done | nightly |\n";
  const s = load(f);
  assert.equal(s.indexTables.length, 2);
  assert.deepEqual(s.problems.filter((p) => !p.notice).map((p) => `${p.slug}: ${p.message}`), ["backups: README.md's index says status idea, the item says done"]);
  const writes = core.planUpdate(s, "palette", "status", "ready");
  assert.match(writes["README.md"], /^\| \[Brand palette\]\(palette\.md\) \| high \| ready \|$/m);
  assert.match(writes["README.md"], /^\| \[Brand palette\]\(palette\.md\) \| someday \| first \|$/m);

  // The annotation covers the next table only: one after it is an index table again.
  const t = load({ ...f, "README.md": f["README.md"] + "\n| Item | Status |\n|---|---|\n| [Logo build](logo.md) | idea |\n" });
  assert.equal(t.indexTables.length, 3);
  assert.ok(t.problems.some((p) => p.slug === "logo" && p.message === "it's listed 2 times in README.md's index"));
});

test("the starter backlog reads cleanly, epic included", () => {
  const dir = new URL("../starter/", import.meta.url);
  const f = Object.fromEntries(readdirSync(dir).filter((name) => core.FILE_NAME.test(name)).map((name) => [name, readFileSync(new URL(name, dir), "utf8")]));
  const s = load(f);
  assert.deepEqual(s.problems, []);
  assert.deepEqual(core.epicOrder(s, "adopt-the-backlog").order.map((i) => i.slug), ["set-up-the-backlog", "move-ideas-in"]);
  assert.equal(core.epicProgress(s, "adopt-the-backlog").next, null);
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

test("items have short IDs: shown with the prefix, checked, assigned, searched and prompted", () => {
  const numbered = () => {
    const f = files();
    f["palette.md"] = f["palette.md"].replace('title: "Brand palette"\n', 'title: "Brand palette"\nid: 1\n');
    f["logo.md"] = f["logo.md"].replace('title: "Logo build"\n', 'title: "Logo build"\nid: 2\n');
    f["backups.md"] = f["backups.md"].replace("title: Backups\n", "title: Backups\nid: 7\n"); // done, and the highest
    return f;
  };
  const s = load(numbered());
  assert.equal(core.itemCode(s, s.bySlug.get("palette")), "W-1");
  assert.equal(core.nextId(s), 8, "a done item's number stays taken");
  assert.deepEqual(s.problems.filter((p) => /ID|id is/.test(p.message)), []);

  // backlog.yml can change the letters; id is the board's, so it can't be a choice field.
  const ob = load({ ...numbered(), "backlog.yml": files()["backlog.yml"] + "prefix: OB\n" });
  assert.equal(core.itemCode(ob, ob.bySlug.get("logo")), "OB-2");
  assert.match(load({ ...files(), "backlog.yml": "prefix: W-\n" }).problems[0].message, /prefix should be letters/);
  assert.match(load({ ...files(), "backlog.yml": "fields:\n  id: [a]\n" }).problems[0].message, /id can't be a choice field/);
  assert.equal(load({ ...files(), "x.md": "---\ntitle: X\nid: 4\n---\n" }).fields.some((f) => f.name === "id"), false);

  // A bad or shared ID is a problem; a missing one is a suggestion, once the backlog uses IDs.
  const twins = load({ ...numbered(), "logo.md": numbered()["logo.md"].replace("id: 2", "id: 1"), "notes.md": "---\ntitle: Notes\nid: soon\nstatus: idea\npriority: low\narea: ops\n---\n\n# Notes\n" });
  const about = (st, slug) => st.problems.filter((p) => p.slug === slug && /ID|id is/.test(p.message)).map((p) => [p.message, !!p.notice]);
  assert.deepEqual(about(twins, "palette"), [["its ID W-1 is also logo's", false]]);
  assert.deepEqual(about(twins, "logo"), [["its ID W-1 is also palette's", false]]);
  assert.deepEqual(about(twins, "notes"), [['id is "soon", not a positive whole number', false]]);
  const mixed = load({ ...numbered(), "logo.md": files()["logo.md"] });
  assert.deepEqual(about(mixed, "logo"), [["it has no ID: node bin/open-backlog.mjs ids --write gives every item one", true]]);
  assert.deepEqual(load().problems.filter((p) => /ID/.test(p.message)), [], "a backlog without IDs isn't told about each item");

  // New items: numbered in a numbered backlog or an empty one, not in one that doesn't number yet.
  assert.match(core.planCreate(s, { title: "Icons" }, "2026-10-18").writes["icons.md"], /^---\ntitle: Icons\nid: 8\n/);
  assert.doesNotMatch(core.planCreate(load(), { title: "Icons" }).writes["icons.md"], /^id:/m);
  assert.match(core.planCreate(load({}), { title: "First" }).writes["first.md"], /^id: 1$/m);

  // Search: the ID with or without its hyphen, in any case; a bare number is text.
  const show = (st, q) => core.viewItems(st, core.viewParams(st, `?q=${encodeURIComponent(q)}`)).map((i) => i.slug);
  for (const q of ["W-2", "w2", "W2", "w-2"]) assert.deepEqual(show(s, q), ["logo"], q);
  assert.deepEqual(core.parseQuery(s, "W-2").map((t) => t.kind), ["id"]);
  assert.deepEqual(core.parseQuery(s, '2 W-0 "W-2" X-2').map((t) => t.kind), ["text", "text", "text", "text"]);
  assert.deepEqual(show(ob, "ob-2"), ["logo"]);
  assert.deepEqual(core.parseQuery(ob, "W-2").map((t) => t.kind), ["text"]);
  assert.deepEqual(show(s, "W-9"), [], "no item has it");
  assert.deepEqual(core.viewItems(s, core.viewParams(s, "?sort=id&dir=desc")).map((i) => i.slug), ["backups", "logo", "palette"]);

  // The prompt leads with it, so it lands in commit messages.
  assert.match(core.itemPrompt(s, "logo"), /^Work on this item from the backlog: W-2 Logo build\n/);
  assert.match(core.itemPrompt(load(), "logo"), /^Work on this item from the backlog: Logo build\n/);
});

test("the index leads with an ID column once items have IDs, and checks it", () => {
  const f = { ...files(), "README.md": `# Backlog\n\n${core.INDEX_START}\n${core.INDEX_END}\n` };
  f["palette.md"] = f["palette.md"].replace('title: "Brand palette"\n', 'title: "Brand palette"\nid: 1\n');
  f["logo.md"] = f["logo.md"].replace('title: "Logo build"\n', 'title: "Logo build"\nid: 2\n');
  const index = core.planIndex(load(f))["README.md"];
  assert.match(index, /^\| ID \| Item \| Weight \| Status \| Priority \|$/m);
  assert.match(index, /^\| W-2 \| \[Logo build\]\(logo\.md\) \| 2 \| idea \| high \|$/m);
  assert.match(index, /^\|  \| \[Backups\]\(backups\.md\) \| 1 \| done \| mid \|$/m);
  const again = load({ ...f, "README.md": index });
  assert.deepEqual(again.problems.filter((p) => /index/.test(p.message)), []);
  assert.deepEqual(core.planIndex(again), {});
  const stale = load({ ...f, "README.md": index.replace("| W-2 |", "| W-9 |") });
  assert.deepEqual(stale.problems.filter((p) => /index/.test(p.message)).map((p) => p.message), ["README.md's index says id W-9, the item says W-2"]);
  // A hand-written table with an ID column gets the new item's ID in it.
  const hand = { ...f, "README.md": "| ID | Item | Status |\n|---|---|---|\n| W-1 | [Brand palette](palette.md) | idea |\n| W-2 | [Logo build](logo.md) | idea |\n|  | [Backups](backups.md) | done |\n" };
  assert.match(core.planCreate(load(hand), { title: "Icons", fields: { status: "idea" } }).writes["README.md"], /^\| W-3 \| \[Icons\]\(icons\.md\) \| idea \|$/m);
});

test("ids numbers the items without one, oldest first, under their titles", () => {
  const f = { ...files(), "README.md": `# Backlog\n\n${core.INDEX_START}\n${core.INDEX_END}\n` };
  f["logo.md"] = f["logo.md"].replace('title: "Logo build"\n', 'title: "Logo build"\nid: 4\n');
  f["undated.md"] = "---\ntitle: Undated\nstatus: idea\npriority: low\narea: ops\nweight: 1\n---\n\n# Undated\n";
  const writes = core.planIds(load(f));
  assert.deepEqual(Object.keys(writes).sort(), ["README.md", "backups.md", "palette.md", "undated.md"]);
  assert.match(writes["backups.md"], /^---\ntitle: Backups\nid: 5\npriority: mid\n/, "created 2026-10-01, the oldest");
  assert.match(writes["palette.md"], /^---\ntitle: "Brand palette"\nid: 6\n/);
  assert.match(writes["undated.md"], /^---\ntitle: Undated\nid: 7\n/, "no date: last");
  assert.equal(writes["palette.md"].replace("id: 6\n", ""), f["palette.md"], "nothing else changes");
  const after = load({ ...f, ...writes });
  assert.deepEqual(core.planIds(after), {});
  assert.deepEqual(after.problems.filter((p) => !p.notice).map((p) => p.slug), []);
  assert.match(core.planIds(load({ "x.md": "---\nstatus: idea\n---\n\n# X\n" }))["x.md"], /^---\nstatus: idea\nid: 1\n---/, "no title line: at the end");
});

test("ids preserves empty ID fields and multiline titles", () => {
  for (const [front, title] of [
    ["title: A\nid:\nstatus: idea", "A"],
    ["id: null\ntitle: A\nstatus: idea", "A"],
    ['title: A\nid: ""\nstatus: idea', "A"],
    ["title: >-\n\n  A long\n  title\nstatus: idea", "A long title"],
    ['title: "A long\n  title"\nstatus: idea', "A long title"],
  ]) {
    for (const nl of ["\n", "\r\n"]) {
      const source = `---\n${front}\n---\n\n# ${title}\n\nKeep **this** body.\n`.replaceAll("\n", nl);
      const f = { "a.md": source };
      assert.deepEqual(load(f).problems, [], front);
      const writes = core.planIds(load(f));
      const after = load({ ...f, ...writes });
      assert.deepEqual(after.problems, [], front);
      const { id, ...actual } = after.bySlug.get("a");
      const { id: previous, ...original } = load(f).bySlug.get("a");
      assert.equal(id, "1", front);
      assert.deepEqual(actual, original, front);
      assert.equal(core.splitFront(writes["a.md"]).body, core.splitFront(source).body);
      assert.deepEqual(core.planIds(after), {});
    }
  }
});

test("ids fills handwritten ID columns without changing other cells or prose", () => {
  const f = {
    "backlog.yml": "prefix: OB\n",
    "a.md": "---\ntitle: A\nid: 3\nstatus: ready\n---\n\n# A\n",
    "b.md": "---\ntitle: B\nstatus: idea\ncreated: 2026-10-01\n---\n\n# B\n",
    "c.md": "---\ntitle: C\nstatus: ready\ncreated: 2026-10-02\n---\n\n# C\n",
    "README.md": "Before\r\n\r\n| ID | Item | Notes | Status |\r\n|---|---|---|---|\r\n| OB-3 | [A](a.md) | Keep A | ready |\r\n|  | [B](b.md) | Keep B | idea |\r\n|  | [C](c.md) | Keep C | ready |\r\n\r\n<!-- open-backlog:ignore -->\r\n\r\n| ID | Item |\r\n|---|---|\r\n|  | [B](b.md) |\r\n\r\nAfter\r\n",
  };
  assert.equal(load(f).problems.some((p) => !p.notice), false);
  const writes = core.planIds(load(f));
  assert.equal(writes["README.md"], f["README.md"].replace("|  | [B](b.md) | Keep B", "| OB-4 | [B](b.md) | Keep B").replace("|  | [C](c.md) | Keep C", "| OB-5 | [C](c.md) | Keep C"));
  const after = load({ ...f, ...writes });
  assert.deepEqual(after.problems, []);
  assert.deepEqual(core.planIds(after), {});
});
