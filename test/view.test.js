// The board's view as pure functions: what an address shows, in what order, and the address itself.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as core from "../web/core.js";

// `a` ready and startable, `b` an idea waiting on `a` that mentions auth in its text, `c` done
// with no area and no weight, `d` in a status the list doesn't have and with no created date, and
// `launch` an epic over `a` and `b`.
const files = () => ({
  "backlog.yml": "fields:\n  status: [idea, ready, in-progress, done]\n  priority: [high, mid, low]\n  area: [web, ops]\nstartable: [ready]\ndone: [done]\ncolors:\n  area: {ops: pink}\n",
  "a.md": "---\ntitle: Alpha login\nstatus: ready\npriority: high\narea: web\nweight: 2\ntags: [auth]\ncreated: 2026-10-01\n---\n\n# Alpha login\n\nSign in with a passkey.\n",
  "b.md": "---\ntitle: Beta export\nstatus: idea\npriority: mid\narea: ops\nweight: 1\ncreated: 2026-10-03\ndepends_on: [a]\n---\n\n# Beta export\n\nExports, and auth in passing.\n",
  "c.md": "---\ntitle: Gamma docs\nstatus: done\npriority: low\ncreated: 2026-10-02\n---\n\n# Gamma docs\n\nDocs.\n",
  "d.md": "---\ntitle: Delta release\nstatus: shipped\npriority: high\narea: web\nweight: 3\ntags: [auth, release]\n---\n\n# Delta release\n\nRelease notes.\n",
  "launch.md": "---\ntitle: Launch\nstatus: ready\npriority: mid\narea: web\nweight: 5\ncreated: 2026-10-04\nitems: [a, b]\n---\n\n# Launch\n\nShip it.\n",
});

const load = (f = files()) => core.parseBacklog({ files: f, dir: "docs/backlog" });
const slugs = (items) => items.map((item) => item.slug);
const show = (s, search) => slugs(core.viewItems(s, core.viewParams(s, search)));

test("the address keeps only what the board knows", () => {
  const s = load();
  assert.deepEqual(core.viewDefaults(s), { view: "board", sort: "weight", group: "status" });
  assert.deepEqual(core.viewParams(s, ""), { view: "board", group: "status", sort: "weight" });
  assert.deepEqual(core.viewParams(s, "?view=list&group=area&sort=created&q=+auth+&tag=release&item=a&status=ready&open=1&next=1&epic=launch"),
    { view: "list", group: "area", sort: "created", q: "auth", tag: "release", item: "a", status: "ready", open: "1", next: "1", epic: "launch" });
  // Unknown keys and values fall away: a view, group or sort the board lacks, a toggle that isn't
  // 1, an epic that isn't one, a blank value.
  assert.deepEqual(core.viewParams(s, "?view=grid&group=kind&sort=size&open=yes&next=0&epic=a&q=+&colour=red"),
    { view: "board", group: "status", sort: "weight" });
  assert.equal(core.viewParams(s, "?epic=nope").epic, undefined);
  assert.equal(core.viewParams(s, "?sort=priority").sort, "priority");

  // A backlog with a choice field called epic keeps ?epic= for that field.
  const own = load({ ...files(), "backlog.yml": files()["backlog.yml"].replace("  area: [web, ops]", "  area: [web, ops]\n  epic: [q4]") });
  assert.equal(core.epicFilterOn(own), false);
  assert.equal(core.viewParams(own, "?epic=launch").epic, "launch");
  assert.equal(core.epicFilterOn(null), false);
  assert.deepEqual(core.viewDefaults(null), { view: "board", sort: "weight", group: "" });
  assert.equal(core.viewDefaults(load({ "x.md": "---\ntitle: X\npriority: high\n---\n" })).group, "priority", "no status: the first field");
});

test("the address leaves defaults out and sorts its keys", () => {
  const s = load();
  assert.equal(core.viewQuery(s, ""), "");
  assert.equal(core.viewQuery(s, "?view=board&sort=weight&group=status"), "");
  assert.equal(core.viewQuery(s, "?status=ready&view=list"), "?status=ready&view=list");
  assert.equal(core.viewQuery(s, "?view=list", { item: "a", tag: "auth" }), "?item=a&tag=auth&view=list");
  assert.equal(core.viewQuery(s, "?item=a&view=list", { item: null, view: "board" }), "");
  assert.equal(core.viewQuery(s, "?q=two words&colour=red"), "?q=two+words");
});

test("each filter keeps what it says, alone and together", () => {
  const s = load();
  assert.deepEqual(show(s, ""), ["b", "a", "d", "launch", "c"]);
  assert.deepEqual(show(s, "?status=ready"), ["a", "launch"]);
  assert.deepEqual(show(s, "?priority=high"), ["a", "d"]);
  assert.deepEqual(show(s, "?area=none"), ["c"]);
  assert.deepEqual(show(s, "?status=shipped"), ["d"], "a value the list doesn't have still filters");
  assert.deepEqual(show(s, "?tag=auth"), ["a", "d"]);
  assert.deepEqual(show(s, "?open=1"), ["b", "a", "d", "launch"]);
  assert.deepEqual(show(s, "?next=1"), ["a", "launch"]);
  assert.deepEqual(show(s, "?area=web&priority=high&tag=release"), ["d"]);
  assert.deepEqual(show(s, "?area=ops&status=ready"), []);
  assert.equal(core.isFiltering(s, core.viewParams(s, "?view=list&sort=title")), false);
  for (const search of ["?q=x", "?tag=auth", "?epic=launch", "?open=1", "?next=1", "?area=none"]) {
    assert.equal(core.isFiltering(s, core.viewParams(s, search)), true, search);
  }
});

test("search looks at title, slug, summary, text and tags, in any case", () => {
  const s = load();
  assert.deepEqual(show(s, "?q=AUTH"), ["b", "a", "d"]); // b's text, a's and d's tags
  assert.deepEqual(show(s, "?q=passkey"), ["a"]);
  assert.deepEqual(show(s, "?q=gamma"), ["c"]);
  assert.deepEqual(show(s, "?q=launch"), ["launch"]);
  assert.deepEqual(show(s, "?q=release notes"), ["d"]);
  assert.deepEqual(show(s, "?q=web"), [], "field values aren't searched");
});

test("the Epic filter shows the epic first, then its items", () => {
  const s = load();
  assert.deepEqual(show(s, "?epic=launch"), ["launch", "b", "a"]);
  assert.deepEqual(show(s, "?epic=launch&sort=title"), ["launch", "a", "b"]);
  assert.deepEqual(show(s, "?epic=launch&status=idea"), ["b"], "a filtered-out epic isn't added back");
});

test("every sort puts items in its order", () => {
  const s = load();
  assert.deepEqual(show(s, "?sort=weight"), ["b", "a", "d", "launch", "c"], "unweighted last");
  assert.deepEqual(show(s, "?sort=title"), ["a", "b", "d", "c", "launch"]);
  assert.deepEqual(show(s, "?sort=created"), ["launch", "b", "c", "a", "d"], "newest first, undated last");
  assert.deepEqual(show(s, "?sort=status"), ["b", "a", "launch", "c", "d"], "the field's order, then priority; unlisted last");
  assert.deepEqual(show(s, "?sort=area"), ["a", "d", "launch", "b", "c"]);
});

test("columns follow the grouping field, then None and Other", () => {
  const s = load();
  const columns = (group) => core.viewColumns(s, core.viewItems(s, core.viewParams(s, "")), group)
    .map((c) => [c.value, c.title, c.drop, slugs(c.items)]);
  assert.deepEqual(columns("status"), [
    ["idea", "Idea", true, ["b"]], ["ready", "Ready", true, ["a", "launch"]], ["in-progress", "In progress", true, []],
    ["done", "Done", true, ["c"]], ["other", "Other", false, ["d"]],
  ]);
  assert.deepEqual(columns("area"), [["web", "Web", true, ["a", "d", "launch"]], ["ops", "Ops", true, ["b"]], ["", "No area", false, ["c"]]]);
});

test("tones come from backlog.yml, well-known statuses, the priority ladder or a cycle", () => {
  const s = load();
  assert.equal(core.tone(s, "area", "ops"), "pink");
  assert.equal(core.tone(s, "area", "web"), "violet");
  assert.equal(core.tone(s, "area", "elsewhere"), "gray");
  assert.equal(core.tone(s, "status", "ready"), "teal");
  assert.equal(core.tone(s, "status", "shipped"), "green");
  assert.equal(core.tone(s, "status", "in-progress"), "blue");
  assert.deepEqual(["high", "mid", "low"].map((v) => core.tone(s, "priority", v)), ["red", "amber", "gray"]);
  assert.equal(core.tone(s, "status", ""), "none");
  const two = load({ ...files(), "backlog.yml": "fields:\n  priority: [urgent, later]\n  status: [new, triaged]\n" });
  assert.deepEqual(["urgent", "later"].map((v) => core.tone(two, "priority", v)), ["red", "gray"]);
  assert.equal(core.tone(two, "status", "triaged"), "orange", "an unknown status cycles by its place");
});
