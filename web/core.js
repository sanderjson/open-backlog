// The backlog itself, with no page: reading the files, checking them, and working out the writes
// an edit needs. Pure functions over { name: text }, so they run in the browser and in Node.

import { load as loadYAML, CORE_SCHEMA } from "./vendor/js-yaml.js";
import { Marked } from "./vendor/marked.js";

export const CONFIG_FILE = "backlog.yml";
export const TEMPLATE_FILE = "_template.md";
// The kit's version: the tag these files ship in. Bumped when releasing (README, "Releasing").
export const VERSION = "0.5.0";
// The files a host reads and writes: Markdown and YAML directly in the backlog folder, including
// `_template.md`. No hidden files, no "..", no subfolders.
export const FILE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]*\.(md|ya?ml)$/;
export const COLORS = ["gray", "blue", "teal", "green", "amber", "orange", "red", "pink", "violet", "indigo"];

// The front matter keys the board reads itself, so they can't be choice fields.
const RESERVED = ["title", "id", "weight", "created", "tags", "branches", "depends_on", "related", "items"];

// What the board guesses when backlog.yml doesn't say: well-known values in their usual order.
const KNOWN_ORDER = {
  status: ["idea", "backlog", "todo", "new", "open", "ready", "planned", "in-progress", "doing", "active",
    "started", "wip", "review", "in-review", "blocked", "parked", "done", "closed", "complete", "completed",
    "shipped", "resolved", "cancelled", "canceled", "wontfix", "archived"],
  priority: ["critical", "urgent", "highest", "p0", "high", "p1", "medium", "mid", "normal", "p2", "low",
    "p3", "lowest"],
};
const DEFAULT_FIELDS = ["status", "priority", "type", "area"];
const DEFAULT_DONE = ["done", "closed", "complete", "completed", "shipped", "resolved"];
const DEFAULT_SET_ASIDE = ["parked", "cancelled", "canceled", "wontfix", "archived"];
const DEFAULT_STARTABLE = ["idea", "backlog", "todo", "new", "open", "ready", "planned"];
const DEFAULT_ACTIVE = ["in-progress", "doing", "active", "started", "wip", "review", "in-review"];

const UNWEIGHTED = 2 ** 30;
const UNRANKED = 2 ** 20;

// How the board names a field or a value: "in-progress" is "In progress".
export function label(s) {
  s = String(s ?? "").trim().replace(/[-_]/g, " ");
  return s === "" ? "None" : s[0].toUpperCase() + s.slice(1);
}

function yaml(text) {
  return loadYAML(text, { schema: CORE_SCHEMA });
}

function text(v) {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

// A list of strings, or a single one as a list of one.
function list(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.filter((x) => x != null && typeof x !== "object").map(text).filter(Boolean);
  if (typeof v === "object") return [];
  return text(v) ? [text(v)] : [];
}

const isMap = (v) => v != null && typeof v === "object" && !Array.isArray(v);

// ---- backlog.yml -------------------------------------------------------------------------------

// Reads backlog.yml. Every setting is optional; what it leaves out comes from the items.
export function parseConfig(source) {
  const config = { title: "", fields: null, done: null, closed: null, startable: null, active: null,
    index: "", editor: "", prefix: "", colors: {} };
  if (source == null) return { config };

  let doc;
  try {
    doc = yaml(source);
  } catch (e) {
    return { config, error: `${CONFIG_FILE} isn't YAML: ${e.reason || e.message}` };
  }
  if (doc == null) return { config };
  if (!isMap(doc)) return { config, error: `${CONFIG_FILE} should be a list of settings` };

  for (const [key, value] of Object.entries(doc)) {
    switch (key) {
      case "title": case "index": case "editor":
        config[key] = text(value);
        break;
      case "done": case "closed": case "startable": case "active":
        config[key] = list(value);
        break;
      case "prefix":
        // The letters before an item's ID: W-456, or OB-456 with prefix: OB.
        if (!/^[A-Za-z][A-Za-z0-9]{0,9}$/.test(text(value))) return { config, error: `${CONFIG_FILE}: prefix should be letters (and digits after the first), like W or OB` };
        config.prefix = text(value);
        break;
      case "fields": {
        // {status: [idea, done], area: []}, or just the names: [status, area]
        const entries = Array.isArray(value) ? value.map((name) => [name, []]) : isMap(value) ? Object.entries(value) : null;
        if (!entries) return { config, error: `${CONFIG_FILE}: fields should map each field to its values` };
        config.fields = [];
        for (const [name, values] of entries) {
          if (RESERVED.includes(name)) return { config, error: `${CONFIG_FILE}: ${name} can't be a choice field` };
          const vals = list(values);
          config.fields.push({ name: text(name), values: vals, strict: vals.length > 0 });
        }
        break;
      }
      case "colors":
        if (!isMap(value)) return { config, error: `${CONFIG_FILE}: colors should map each field to its values' colours` };
        for (const [field, values] of Object.entries(value)) {
          if (!isMap(values)) return { config, error: `${CONFIG_FILE}: colors.${field} should map values to colours` };
          config.colors[field] = {};
          for (const [v, color] of Object.entries(values)) {
            if (!COLORS.includes(color)) {
              return { config, error: `${CONFIG_FILE}: colors.${field}.${v} is "${color}", not one of ${COLORS.join(", ")}` };
            }
            config.colors[field][v] = color;
          }
        }
        break;
      default:
        return { config, error: `${CONFIG_FILE} has a setting "${key}" the board doesn't know` };
    }
  }
  return { config };
}

// ---- One item ----------------------------------------------------------------------------------

// The front matter's opening line, the front matter, the line break before the closing line, the
// closing line and the body, or null when the text doesn't start with front matter.
const FRONT_RE = /^(\uFEFF?---[ \t]*\r?\n)(?:([\s\S]*?)(\r?\n))?(---[ \t]*(?:\r?\n|$))([\s\S]*)$/;

export function splitFront(source) {
  const m = FRONT_RE.exec(source);
  if (!m) return null;
  return { open: m[1], front: m[2] ?? "", nl: m[3] ?? "\n", close: m[4], body: m[5] };
}

function joinFront({ open, front, nl, close, body }) {
  return open + (front === "" ? "" : front + nl) + close + body;
}

const TITLE_RE = /^\s*#[ \t]+([^\n]*)\n?/;

// The body's own "# Title" line: the board shows the title from the front matter instead.
function takeTitle(body) {
  const m = TITLE_RE.exec(body);
  return m ? [m[1].replace(/\r$/, "").trim(), body.slice(m[0].length)] : ["", body];
}

export function parseItem(slug, source) {
  const item = {
    slug, file: `${slug}.md`, title: "", weight: "", created: "", fields: {},
    tags: [], branches: [], dependsOn: [], related: [], items: [], problems: [], invalidDependencies: false,
  };

  const split = splitFront(source);
  let body = source;
  if (!split) {
    item.problems.push("it doesn't start with front matter between --- lines");
    item.invalidDependencies = true;
  } else {
    body = split.body;
    readFront(item, split.front);
  }

  const [heading, rest] = takeTitle(body);
  if (heading && item.title && heading !== item.title) item.problems.push("its H1 title disagrees with its front matter title");
  item.title ||= heading;
  if (!item.title) {
    item.title = slug;
    item.problems.push("it has no title");
  }
  item.body = rest.trim();
  item.summary = summary(rest);
  item.html = renderMarkdown(rest);
  return item;
}

function readFront(item, front) {
  let meta;
  try {
    meta = yaml(front);
  } catch (e) {
    item.problems.push(`its front matter isn't YAML (${e.reason || e.message})`);
    item.invalidDependencies = true;
    return;
  }
  if (meta == null) return;
  if (!isMap(meta)) {
    item.problems.push("its front matter isn't a list of fields");
    item.invalidDependencies = true;
    return;
  }
  for (const [key, value] of Object.entries(meta)) {
    switch (key) {
      case "tags": item.tags = list(value); break;
      case "branches": item.branches = list(value); break;
      case "depends_on":
        if (value != null && (typeof value === "object" && !Array.isArray(value) || Array.isArray(value) && value.some((v) => v == null || typeof v === "object"))) {
          item.problems.push("depends_on should be a list of item slugs");
          item.invalidDependencies = true;
        }
        item.dependsOn = list(value);
        break;
      case "related": item.related = list(value); break;
      case "items": item.items = list(value); break;
      case "title": case "id": case "weight": case "created": item[key] = text(value); break;
      default:
        if (value != null && typeof value !== "object" && text(value) !== "") item.fields[key] = text(value);
    }
  }
}

// The first paragraph of words, for a card: usually the item's "Why". A heading may sit right on
// top of its paragraph, with no blank line between.
function summary(body) {
  for (let p of body.replace(/\r\n/g, "\n").split(/\n\s*\n/)) {
    p = p.replace(/^(\s*#[^\n]*\n?)+/, "").trim();
    if (p === "" || /^(#|\||```|~~~|-|\*|>|<|\+|\d+\.)/.test(p)) continue;
    p = p.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*`]|~~|__/g, "").replace(/\s+/g, " ").trim();
    return p.length > 280 ? p.slice(0, 279).trim() + "…" : p;
  }
  return "";
}

export function escapeHTML(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

const unsafeURL = (href) => /^\s*(javascript|vbscript|data|file):/i.test(href ?? "");

// Markdown as HTML that's safe to show: raw HTML is shown as text, and script links go nowhere.
const markdown = new Marked({ gfm: true });
markdown.use({
  renderer: { html: ({ text }) => escapeHTML(text) },
  walkTokens(token) {
    if ((token.type === "link" || token.type === "image") && unsafeURL(token.href)) token.href = "#";
  },
});

export function renderMarkdown(body) {
  return markdown.parse(body);
}

// ---- The whole backlog -------------------------------------------------------------------------

// Reads a backlog from its files ({ name: text }) as the host sent them. `dir` and `path` say
// where it lives (for the page and for editor links); `writable` whether the host takes writes.
export function parseBacklog({ files = {}, dir = "docs/backlog", path = "", writable = false } = {}) {
  const { config, error } = parseConfig(files[CONFIG_FILE]);
  const s = {
    title: config.title || "Backlog", dir, path, writable,
    editor: config.editor || "vscode",
    prefix: config.prefix || "W",
    index: config.index === "none" ? "" : config.index || "README.md",
    problems: error ? [{ slug: "", message: error }] : [],
    files, config,
  };
  // Only backlog.yml is read. A backlog.yaml beside it, or instead of it, is reported, not read.
  const yaml = CONFIG_FILE.replace(/\.yml$/, ".yaml");
  if (files[yaml] != null) {
    s.problems.push({ slug: "", message: files[CONFIG_FILE] != null
      ? `${yaml} isn't read, ${CONFIG_FILE} is: move what you need from ${yaml} into ${CONFIG_FILE}, then delete ${yaml}`
      : `${yaml} isn't read, so the fields are guessed: name it ${CONFIG_FILE}` });
  }

  s.items = Object.keys(files)
    .filter((name) => isItemFile(name, s.index))
    .sort()
    .map((name) => parseItem(name.slice(0, -3), files[name]));
  s.bySlug = new Map(s.items.map((item) => [item.slug, item]));
  s.fields = resolveFields(config, s.items);
  resolveStatuses(s, config);
  s.indexTables = readIndex(s);
  link(s);
  s.items = sortItems(s, s.items, "weight");
  s.problems.push(...problems(s));
  s.tags = tagCounts(s.items);
  return s;
}

// The item files: every .md file but the index, and none starting with _ or . (templates, an
// editor's own files).
function isItemFile(name, index) {
  return name.endsWith(".md") && !name.includes("/") && !/^[._]/.test(name) &&
    name.toLowerCase() !== "readme.md" && name.toLowerCase() !== index.toLowerCase();
}

// The choice fields: backlog.yml's, or else the usual four the items use. A field without listed
// values takes the ones its items use, well-known ones in their usual order.
function resolveFields(config, items) {
  const given = config.fields?.length ? config.fields : DEFAULT_FIELDS.map((name) => ({ name, values: [], strict: false }));
  const out = [];
  for (const f of given) {
    const values = f.strict ? f.values : usedValues(f.name, items);
    if (!f.strict && values.length === 0 && !config.fields?.length) continue;
    out.push({ name: f.name, label: label(f.name), values, strict: f.strict, colors: { ...config.colors[f.name] } });
  }
  return out;
}

function usedValues(field, items) {
  const values = [...new Set(items.map((item) => item.fields[field]).filter(Boolean))];
  const known = KNOWN_ORDER[field] ?? [];
  return values.sort((a, b) => {
    const ia = known.indexOf(a), ib = known.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0 || ib >= 0) return ia >= 0 ? -1 : 1;
    return a.localeCompare(b);
  });
}

export function field(s, name) {
  return s.fields.find((f) => f.name === name) ?? { name, label: label(name), values: [], strict: false, colors: {} };
}

// Which statuses are done, closed, startable and active: backlog.yml's lists, or the well-known
// ones the status field has.
function resolveStatuses(s, config) {
  const statuses = field(s, "status").values;
  const pick = (given, known) => given ?? statuses.filter((v) => known.includes(v));
  s.done = pick(config.done, DEFAULT_DONE);
  s.closed = [...new Set([...pick(config.closed, [...DEFAULT_DONE, ...DEFAULT_SET_ASIDE]), ...s.done])];
  s.startable = pick(config.startable, DEFAULT_STARTABLE);
  s.active = pick(config.active, DEFAULT_ACTIVE);
}

// What each item waits on and unblocks, and whether it's open, done or can start.
function link(s) {
  const hasStatus = field(s, "status").values.length > 0;
  for (const item of s.items) {
    const status = item.fields.status;
    item.done = s.done.includes(status);
    item.open = !s.closed.includes(status);
    item.blockers = [];
    item.dependents = [];
  }
  for (const item of s.items) {
    for (const dep of item.dependsOn) {
      const other = s.bySlug.get(dep);
      if (!other || other === item) {
        item.invalidDependencies = true;
        continue;
      }
      if (!other.done) item.blockers.push(dep);
      other.dependents.push(item.slug);
    }
  }
  for (const item of s.items) {
    const ready = !hasStatus || s.startable.includes(item.fields.status);
    item.startable = item.open && ready && !item.invalidDependencies && item.blockers.length === 0;
  }
  // An epic can start when one of its open items can. One whose open items are all under way,
  // waiting on unfinished work or not in a startable status has nothing to start with, however
  // little its own depends_on holds. One with no open item left can: its own acceptance remains.
  for (const epic of s.items.filter(isEpic)) {
    const open = members(s, epic).filter((item) => item.open);
    if (open.length && !open.some((item) => item.startable)) epic.startable = false;
  }
}

// Where a weight sorts: positive whole numbers by size, anything else after them.
export function weightRank(weight) {
  return /^\d+$/.test(weight ?? "") && Number(weight) > 0 ? Number(weight) : UNWEIGHTED;
}

// An item's ID as a number, or 0 when it has none (or one that isn't a positive whole number).
export function idNumber(item) {
  return /^\d+$/.test(item?.id ?? "") && Number(item.id) > 0 ? Number(item.id) : 0;
}

// An item's ID as people write it, the backlog's prefix and the number (W-456), or "".
export function itemCode(s, item) {
  const n = idNumber(item);
  return n ? `${s.prefix}-${n}` : "";
}

// The ID a new item gets: one more than the highest in the folder, done and parked items included.
// The kit keeps no counter, so a deleted item's number can come back; keeping items keeps it taken.
export function nextId(s) {
  return Math.max(0, ...s.items.map(idNumber)) + 1;
}

// Where value comes in field's order; values it doesn't list come last.
export function rank(s, name, value) {
  const i = field(s, name).values.indexOf(value);
  return i >= 0 ? i : UNRANKED;
}

const compare = (a, b) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
};

// A column's own direction: created newest first, everything else ascending.
export function sortDirection(by) {
  return by === "created" ? "desc" : "asc";
}

// The items in an order: "weight" (work order: weight, priority, title), "title", "created" or a
// field's own order, "asc" or "desc" (the column's own direction unless given). Only the column
// turns around: items without a value (or with one the field doesn't list) stay last, and ties
// keep the same order both ways, ending with the slug.
export function sortItems(s, items, by, dir = sortDirection(by)) {
  const title = (item) => item.title.toLowerCase();
  const priority = (item) => rank(s, "priority", item.fields.priority);
  const [value, missing, ties] = {
    weight: [(item) => weightRank(item.weight), (v) => v === UNWEIGHTED, (item) => [priority(item), title(item), item.slug]],
    title: [title, () => false, (item) => [item.slug]],
    id: [(item) => idNumber(item), (v) => v === 0, (item) => [item.slug]],
    created: [(item) => item.created || "", (v) => !v, (item) => [title(item), item.slug]],
  }[by] ?? [(item) => rank(s, by, item.fields[by]), (v) => v === UNRANKED, (item) => [priority(item), weightRank(item.weight), title(item), item.slug]];
  const sign = dir === "desc" ? -1 : 1;
  return [...items].sort((a, b) => {
    const [va, vb] = [value(a), value(b)];
    const [ma, mb] = [missing(va), missing(vb)];
    if (ma !== mb) return ma ? 1 : -1;
    if (!ma && va !== vb) return va < vb ? -sign : sign;
    return compare(ties(a), ties(b));
  });
}

function tagCounts(items) {
  const counts = new Map();
  for (const item of items) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// What doesn't add up: a file the board can't read well, a value backlog.yml doesn't allow, a field
// a strict list leaves empty, a weight that isn't a positive whole number, a link to no item or to
// a file that isn't there, a dependency loop, an epic's list or status, and an index that disagrees
// with the items. A problem with `notice: true` is a suggestion rather than something wrong.
function problems(s) {
  const out = [];
  const add = (slug, message) => out.push({ slug, message });
  try { managedRegion(s.files[s.index] || ""); } catch (e) { add("", e.message); }
  // An item without an ID is worth a word only once the backlog numbers its items.
  const usesIds = s.items.some(idNumber);
  for (const item of [...s.items].sort((a, b) => (a.slug < b.slug ? -1 : 1))) {
    for (const p of item.problems) add(item.slug, p);
    for (const f of s.fields) {
      const value = item.fields[f.name];
      if (!f.strict) continue;
      if (!value) add(item.slug, `it has no ${f.name}`);
      else if (!f.values.includes(value)) add(item.slug, `${f.name} is "${value}", not one of ${f.values.join(", ")}`);
    }
    if (item.weight && weightRank(item.weight) === UNWEIGHTED) {
      add(item.slug, `weight is "${item.weight}", not a positive whole number`);
    }
    if (item.id && !idNumber(item)) add(item.slug, `id is "${item.id}", not a positive whole number`);
    else if (!item.id && usesIds) out.push({ slug: item.slug, message: "it has no ID: node bin/open-backlog.mjs ids --write gives every item one", notice: true });
    const twins = idNumber(item) ? s.items.filter((other) => other !== item && idNumber(other) === idNumber(item)) : [];
    if (twins.length) add(item.slug, `its ID ${itemCode(s, item)} is also ${twins.map((x) => x.slug).join(" and ")}'s`);
    for (const [name, slugs] of [["depends_on", item.dependsOn], ["related", item.related]]) {
      for (const slug of slugs) {
        if (slug === item.slug) add(item.slug, `${name} names the item itself`);
        else if (!s.bySlug.has(slug)) add(item.slug, `${name} names ${slug}, which isn't an item`);
      }
    }
    for (const name of fileLinks(item.body)) {
      if (s.files[name] == null) add(item.slug, `it links to ${name}, which isn't in ${s.dir}`);
    }
    out.push(...suggestions(s, item));
    const loop = dependencyLoop(s, item);
    if (loop) add(item.slug, `its dependencies go round in a loop: ${loop.join(" → ")}`);
    out.push(...epicProblems(s, item));
    out.push(...indexProblems(s, item));
  }
  for (const row of indexRows(s)) {
    if (!s.bySlug.has(row.slug)) add("", `${s.index} lists ${row.slug}.md, which isn't there`);
  }
  return out;
}

// Suggestions about an item, worth a look rather than wrong: an unfinished prerequisite that
// comes after the item in work order, `related` repeating `depends_on`, and `type: epic` on an
// item that lists no items.
function suggestions(s, item) {
  const out = [];
  const add = (message) => out.push({ slug: item.slug, message, notice: true });
  for (const dep of item.dependsOn) {
    const other = s.bySlug.get(dep);
    if (!other || other === item || other.done || weightRank(other.weight) <= weightRank(item.weight)) continue;
    add(`it depends on ${dep}, which comes after it in work order (${other.weight ? `weight ${other.weight} after ${item.weight}` : "no weight"})`);
  }
  for (const slug of item.related) {
    if (item.dependsOn.includes(slug)) add(`related names ${slug}, which is already in depends_on`);
  }
  if ((item.fields.type ?? "").toLowerCase() === "epic" && !isEpic(item)) add("its type is epic, but it lists no items");
  return out;
}

// The files in the backlog folder an item's text links to: `[x](name.md)`, with or without `./`,
// `<>` or an anchor, outside code. A link with a path in it points outside the folder and a
// scheme points to the web, and only names the host sends (.md and .yml) can be checked.
function fileLinks(body) {
  const text = body.replace(/^(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1[ \t]*$/gm, "").replace(/`[^`\n]*`/g, "");
  const names = new Set();
  for (const m of text.matchAll(/\]\(<?([^)\s<>]+)>?(?:\s+"[^"]*")?\)/g)) {
    const target = m[1].replace(/^\.\//, "").replace(/#.*$/, "");
    if (target && !target.includes("/") && !/^[a-z][a-z0-9+.-]*:/i.test(target) && FILE_NAME.test(target)) names.add(target);
  }
  return [...names];
}

// A dependency loop from start back to itself, as the slugs along it, or null. Only the loop's
// first item in slug order reports it, so each loop shows once.
function dependencyLoop(s, start) {
  const seen = new Set();
  const walk = (slug, path) => {
    for (const dep of s.bySlug.get(slug)?.dependsOn ?? []) {
      if (dep === slug) continue; // an item naming itself is its own problem
      if (dep === start.slug) return [...path, dep];
      if (seen.has(dep)) continue;
      seen.add(dep);
      const found = walk(dep, [...path, dep]);
      if (found) return found;
    }
    return null;
  };
  const path = walk(start.slug, [start.slug]);
  return path && path.every((slug) => slug >= start.slug) ? path : null;
}

// ---- Epics -------------------------------------------------------------------------------------
// An epic is an item whose front matter lists other items (`items: [a, b]`): work that belongs
// together and is worked through as one. Its items keep their own dependencies; the epic groups
// them, in the order it lists them. People set its status; the board only points out mismatches.

export function isEpic(item) {
  return !!item && item.items.length > 0;
}

// The items an epic lists, each once, in its order. Not the epic itself, and not slugs that are no
// item: both are problems of their own.
function members(s, epic) {
  return [...new Set(epic.items)].filter((slug) => slug !== epic.slug && s.bySlug.has(slug)).map((slug) => s.bySlug.get(slug));
}

function itemCalled(s, slug) {
  const item = s.bySlug.get(slug);
  if (!item) throw new Error(`there's no item called ${slug}`);
  return item;
}

// The epics an item belongs to, in title order.
export function epicsOf(s, slug) {
  return sortItems(s, s.items.filter((epic) => epic.slug !== slug && epic.items.includes(slug)), "title");
}

// Where an item stands: "done"; "setAside" (closed but not done, like parked); "active" (under
// way); "ready" (not started, with nothing unfinished before it); "blocked" (not started, waiting
// on something unfinished); or "other" (open in any other status, or in none).
export function stage(s, item) {
  if (item.done) return "done";
  if (!item.open) return "setAside";
  if (s.active.includes(item.fields.status)) return "active";
  if (item.startable) return "ready";
  const notStarted = field(s, "status").values.length === 0 || s.startable.includes(item.fields.status);
  return notStarted ? "blocked" : "other";
}

// An epic's items in work order: each after the items it depends on in the epic, and otherwise as
// early as the epic's list allows. Its first item and what that needs come first, then its second,
// and so on. Items in a dependency loop can't all follow each other; the loop is reported on its
// own and the order goes on regardless.
// Also what holds the epic up from outside (each unfinished item outside it that its open items
// wait on, with those items) and the slugs it lists that are no item.
export function epicOrder(s, slug) {
  const epic = itemCalled(s, slug);
  const left = members(s, epic);
  const inEpic = new Set(left.map((item) => item.slug));
  // Filled from the end: last comes the last-listed item that nothing left waits on, or, in a
  // loop, the last-listed one.
  const order = [];
  while (left.length) {
    const free = left.filter((item) => !left.some((other) => other !== item && other.dependsOn.includes(item.slug)));
    const last = (free.length ? free : left).at(-1);
    order.unshift(last);
    left.splice(left.indexOf(last), 1);
  }

  const outside = new Map();
  for (const item of order.filter((i) => i.open)) {
    for (const dep of item.blockers) {
      if (inEpic.has(dep)) continue;
      if (!outside.has(dep)) outside.set(dep, { item: s.bySlug.get(dep), waiting: [] });
      const { waiting } = outside.get(dep);
      if (!waiting.includes(item)) waiting.push(item);
    }
  }
  const missing = [...new Set(epic.items)].filter((x) => x !== epic.slug && !s.bySlug.has(x));
  return { order, outside: [...outside.values()], missing };
}

// How far an epic has got: how many items it has, how many are at each stage (done, set aside,
// active, ready, blocked, other), and next, the first ready item in work order.
export function epicProgress(s, slug) {
  const { order } = epicOrder(s, slug);
  const progress = { total: order.length, done: 0, setAside: 0, active: 0, ready: 0, blocked: 0, other: 0, next: null };
  for (const item of order) {
    const at = stage(s, item);
    progress[at]++;
    if (at === "ready") progress.next ??= item;
  }
  return progress;
}

// What doesn't add up in an epic: a slug in its list that's no item, the epic itself, another epic
// or listed twice, and the epic done while items in it are open. And, as a suggestion, every item
// in it closed while it's still open.
function epicProblems(s, epic) {
  if (!epic.items.length) return [];
  const out = [];
  const add = (message) => out.push({ slug: epic.slug, message });
  const counts = new Map();
  for (const slug of epic.items) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  for (const [slug, count] of counts) {
    const other = s.bySlug.get(slug);
    if (slug === epic.slug) add("items names the epic itself");
    else if (!other) add(`items names ${slug}, which isn't an item`);
    else if (isEpic(other)) add(`items names ${slug}, which is an epic: epics can't contain epics`);
    if (count > 1) add(`items names ${slug} ${count === 2 ? "twice" : `${count} times`}`);
  }

  const items = members(s, epic);
  const open = items.filter((item) => item.open);
  if (epic.done && open.length) {
    add(`it's ${epic.fields.status}, but ${open.length} of its ${items.length} items ${open.length === 1 ? "isn't" : "aren't"} done or closed: ${open.map((item) => item.slug).join(", ")}`);
  } else if (epic.open && items.length && !open.length) {
    const done = items.filter((item) => item.done).length;
    const message = done === 0
      ? "every item in it is closed and none is done: close it too, or list the work that's left"
      : `every item in it is ${done === items.length ? "done" : "done or closed"}: set it to ${s.done[0]} once its own acceptance holds`;
    out.push({ slug: epic.slug, message, notice: true });
  }
  return out;
}

// ---- The README's index ------------------------------------------------------------------------
// Any Markdown table whose rows start with a link to an item's file. Columns whose header names a
// field (Status, Priority, Weight…) are checked against the items and kept up to date when the
// board changes them; other columns are left alone. A table under `<!-- open-backlog:ignore -->`
// isn't an index table at all: an overview that links items can keep its own cells.

const ROW_LINK_RE = /^\[(?:[^\]\\]|\\.)*\]\(<?(?:\.\/)?([^)\s/<>]+)\.md(?:#[^)]*)?>?\)/;

function readIndex(s) {
  const source = s.index ? s.files[s.index] : undefined;
  s.indexLines = source == null ? [] : source.split("\n");
  s.indexCRLF = source?.includes("\r\n") ?? false;
  const names = ["id", "weight", ...s.fields.map((f) => f.name)];
  const tables = [];
  const lines = s.indexLines;
  let group = null, ignore = false;
  for (let i = 0; i + 1 < lines.length; i++) {
    const annotation = /^<!-- open-backlog:(group area=(.*?)|ignore) -->\r?$/.exec(lines[i]);
    if (annotation?.[1] === "ignore") ignore = true;
    else if (annotation) {
      try { group = decodeURIComponent(annotation[2]); } catch { group = null; }
    }
    const header = cells(lines[i]), sep = cells(lines[i + 1]);
    if (!header || !sep || sep.length !== header.length || !sep.every((c) => /^:?-+:?$/.test(c))) continue;
    // The item's link is in the first cell, or the second when an ID column comes first.
    const table = { cols: [], link: -1, rows: [], group };
    let j = i + 2;
    for (; j < lines.length; j++) {
      const row = cells(lines[j]);
      if (!row) break;
      const at = row.slice(0, 2).findIndex((cell) => ROW_LINK_RE.test(cell));
      if (at < 0 || table.link >= 0 && at !== table.link) continue;
      table.link = at;
      const m = ROW_LINK_RE.exec(row[at]);
      table.rows.push({ line: j, slug: m[1], cells: row, title: /^\[((?:[^\]\\]|\\.)*)\]/.exec(row[at])?.[1].replace(/\\([\[\]|])/g, "$1") });
    }
    table.cols = header.map((h, c) => (c !== table.link && names.find((n) => squash(n) === squash(h))) || "");
    if (table.rows.length && !ignore) tables.push(table);
    group = null;
    ignore = false;
    i = j - 1;
  }
  return tables;
}

// A table line's cells, trimmed, or null for a line that isn't one. `\|` stays in its cell.
function cells(line) {
  line = line.replace(/\r$/, "").trim();
  if (!line.startsWith("|") || line.length < 2) return null;
  line = line.slice(1);
  if (line.endsWith("|") && !line.endsWith("\\|")) line = line.slice(0, -1);
  return line.split(/(?<!\\)\|/).map((c) => c.trim());
}

// A header or field name squashed for comparing: "Depends on" and "depends_on" match.
const squash = (s) => s.toLowerCase().replace(/[\s\-_`*]/g, "");

function indexRows(s) {
  return s.indexTables.flatMap((t) => t.rows);
}

function indexProblems(s, item) {
  if (indexRows(s).length === 0) return [];
  const out = [];
  const rows = indexRows(s).filter((row) => row.slug === item.slug);
  if (rows.length > 1) out.push({ slug: item.slug, message: `it's listed ${rows.length} times in ${s.index}'s index` });
  let found = false;
  for (const table of s.indexTables) {
    for (const row of table.rows.filter((r) => r.slug === item.slug)) {
      found = true;
      if (row.title !== item.title) out.push({ slug: item.slug, message: `${s.index}'s index title disagrees with the item` });
      if (table.group != null && (item.fields.area || "") !== table.group) out.push({ slug: item.slug, message: `${s.index}'s index puts it in area ${table.group || "none"}, the item says ${item.fields.area || "none"}` });
      table.cols.forEach((name, c) => {
        if (!name || c >= row.cells.length) return;
        const want = name === "id" ? itemCode(s, item) : name === "weight" ? item.weight : item.fields[name];
        const got = row.cells[c].replace(/^[`*]+|[`*]+$/g, "");
        if (want && got !== want) {
          out.push({ slug: item.slug, message: `${s.index}'s index says ${name} ${got || "nothing"}, the item says ${want}` });
        }
      });
    }
  }
  if (!found) out.push({ slug: item.slug, message: `it's missing from ${s.index}'s index` });
  return out;
}

function rowLine(s, cells) {
  return `| ${cells.join(" | ")} |${s.indexCRLF ? "\r" : ""}`;
}

// The index with a field set for each item in values (a Map from slug to value), or null when
// nothing changes. Updating several items together keeps every changed row.
function indexWithValues(s, name, values) {
  const lines = [...s.indexLines];
  let changed = false;
  for (const table of s.indexTables) {
    const c = table.cols.indexOf(name);
    if (c < 0) continue;
    for (const row of table.rows) {
      if (!values.has(row.slug)) continue;
      const value = values.get(row.slug);
      if (c >= row.cells.length || row.cells[c] === value) continue;
      const updated = [...row.cells];
      updated[c] = value;
      lines[row.line] = rowLine(s, updated);
      changed = true;
    }
  }
  return changed ? lines.join("\n") : null;
}

// The index with a row for a new item, at the end of the table it fits best: the one whose items
// most often share its values for the fields the table doesn't show (a README with a table per
// area puts it under its area). With nothing to go on, the last table.
function indexWithItem(s, item) {
  if (s.indexTables.length === 0) return null;
  let best = s.indexTables.at(-1), bestScore = -1;
  for (const table of s.indexTables) {
    let matches = 0, compared = 0;
    for (const f of s.fields) {
      if (table.cols.includes(f.name) || !item.fields[f.name]) continue;
      for (const row of table.rows) {
        const other = s.bySlug.get(row.slug);
        if (!other) continue;
        compared++;
        if (other.fields[f.name] === item.fields[f.name]) matches++;
      }
    }
    const score = compared ? matches / compared : 0;
    if (score >= bestScore) [best, bestScore] = [table, score];
  }
  const title = item.title.replace(/[|[\]]/g, (c) => "\\" + c);
  const row = best.cols.map((name, c) =>
    c === best.link ? `[${title}](${item.slug}.md)` : name === "id" ? itemCode(s, item) : name === "weight" ? item.weight : name ? item.fields[name] ?? "" : "");
  const lines = [...s.indexLines];
  lines.splice(best.rows.at(-1).line + 1, 0, rowLine(s, row));
  return lines.join("\n");
}

export const INDEX_START = "<!-- open-backlog:index start -->";
export const INDEX_END = "<!-- open-backlog:index end -->";

function hasManagedIndex(s) {
  return !!s.index && !!managedRegion(s.files[s.index] || "");
}

function managedRegion(source) {
  const markers = [];
  let fence = "", offset = 0;
  for (const line of source.split("\n")) {
    const boundary = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (boundary && boundary[1][0] === fence[0] && boundary[1].length >= fence.length && !boundary[2].trim()) fence = "";
    } else if (boundary) fence = boundary[1];
    else if ([INDEX_START, INDEX_END].includes(line.trim())) markers.push({ kind: line.trim(), at: offset + line.indexOf("<!--") });
    offset += line.length + 1;
  }
  if (!markers.length) return null;
  if (markers.length !== 2 || markers[0].kind !== INDEX_START || markers[1].kind !== INDEX_END) throw new Error("the managed index needs one matching start/end marker pair");
  return { start: markers[0].at, end: markers[1].at + INDEX_END.length };
}

// Only an explicitly marked region is generated. Hand-written prose and indexes stay owned by
// their author; wrap existing item tables in the markers before adopting generation.
export function planIndex(s) {
  if (!s.index) throw new Error("this backlog has index: none");
  const source = s.files[s.index] || "";
  const bounds = managedRegion(source);
  if (!bounds && s.indexTables.length) throw new Error("wrap the existing index tables in open-backlog:index start/end comments before regenerating");
  if (bounds) {
    const first = source.slice(0, bounds.start).split("\n").length - 1;
    const last = source.slice(0, bounds.end).split("\n").length - 1;
    if (indexRows(s).some((row) => row.line < first || row.line > last)) throw new Error("move all item index rows inside the managed region before regenerating");
  }
  const nl = source.includes("\r\n") ? "\r\n" : "\n";
  const cols = ["weight", ...s.fields.map((f) => f.name).filter((name) => name !== "area")];
  const areas = [...new Set([...field(s, "area").values, ...s.items.map((item) => item.fields.area || "")])];
  const lines = [INDEX_START];
  const cell = (value) => String(value ?? "").replace(/[\r\n]+/g, " ").replace(/\|/g, "\\|");
  // Once any item has an ID, the tables lead with an ID column.
  const ids = s.items.some(idNumber);
  for (const area of areas) {
    const items = s.items.filter((item) => (item.fields.area || "") === area);
    if (!items.length) continue;
    const head = ids ? "| ID | Item" : "| Item";
    lines.push("", `### ${label(area)}`, "", `<!-- open-backlog:group area=${encodeURIComponent(area)} -->`, "", `${head} | ${cols.map(label).join(" | ")} |`, `|${ids ? " --- |" : ""} --- | ${cols.map(() => "---").join(" | ")} |`);
    for (const item of sortItems(s, items, "weight")) {
      const title = item.title.replace(/[|[\]]/g, (c) => "\\" + c);
      lines.push(`|${ids ? ` ${itemCode(s, item)} |` : ""} [${title}](${item.slug}.md) | ${cols.map((name) => cell(name === "weight" ? item.weight : item.fields[name])).join(" | ")} |`);
    }
  }
  lines.push("", INDEX_END);
  const region = lines.join(nl);
  const index = bounds ? source.slice(0, bounds.start) + region + source.slice(bounds.end) : source + (!source ? "" : source.endsWith(nl) ? nl : nl + nl) + region + nl;
  return index === source ? {} : { [s.index]: index };
}

// The writes that give every item without an ID the next free numbers, oldest `created` first
// (undated last), then in work order, with `id:` under the title line. Nothing else in the items
// changes; a managed index is regenerated, or existing ID cells in a handwritten one are updated.
export function planIds(s) {
  const day = (item) => item.created || "￿";
  const missing = sortItems(s, s.items.filter((item) => !item.id), "weight").sort((a, b) => (day(a) < day(b) ? -1 : day(a) > day(b) ? 1 : 0));
  let next = nextId(s);
  const writes = {};
  const ids = new Map();
  for (const item of missing) {
    const id = next++;
    const source = withId(s.files[item.file], id);
    if (idNumber(parseItem(item.slug, source)) !== id) throw new Error(`${item.file}: couldn't add an ID without invalidating its front matter`);
    writes[item.file] = source;
    ids.set(item.slug, itemCode(s, { id }));
  }
  if (missing.length) {
    if (hasManagedIndex(s)) Object.assign(writes, planIndex(parseBacklog({ files: { ...s.files, ...writes }, dir: s.dir, path: s.path })));
    else {
      const index = indexWithValues(s, "id", ids);
      if (index != null) writes[s.index] = index;
    }
  }
  return writes;
}

// Sets an existing ID, or adds one under a complete single-line title (otherwise at the end).
function withId(source, n) {
  const split = splitFront(source);
  const front = split?.front ? yaml(split.front) : null;
  if (!isMap(front) || Object.hasOwn(front, "id")) return setFront(source, "id", String(n));
  const parts = split.front.split(/(\r?\n)/);
  const at = parts.findIndex((part, i) => i % 2 === 0 && /^title:/.test(part));
  let title;
  try { title = yaml(parts[at] ?? "")?.title; } catch { /* A quoted title may continue on another line. */ }
  if (at < 0 || title !== front.title) return setFront(source, "id", String(n));
  parts.splice(at + 1, 0, parts[at + 1] ?? split.nl, `id: ${n}`);
  return joinFront({ ...split, front: parts.join("") });
}

// ---- Edits -------------------------------------------------------------------------------------

export function editable(s, name) {
  return name === "weight" || s.fields.some((f) => f.name === name);
}

// What's wrong with setting a field to value, or "" when nothing is. An empty weight takes the
// weight away; a choice field takes one of its values, or any plain word when it isn't strict.
export function validate(s, name, value) {
  if (!editable(s, name)) return `${name} can't be changed here`;
  if (name === "weight") return value === "" || weightRank(value) !== UNWEIGHTED ? "" : "weight should be a positive whole number";
  const f = field(s, name);
  if (f.strict && !f.values.includes(value)) return `${name} can't be "${value}": ${f.values.join(", ")}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9 ._/-]*$/.test(value)) return `${name} can't be "${value}"`;
  return "";
}

// Sets one field of the front matter, adding it (or the front matter itself) when it isn't there.
// It replaces the field's whole value, even one that runs over several lines, and leaves the other
// lines as they are. An empty value removes the field. A list (an array) is written the way the
// field had it: as [a, b], or as a "- a" line per value.
export function setFront(source, name, value) {
  const split = splitFront(source);
  if (!split) return value === "" ? source : `---\n${fieldLines(name, value).join("\n")}\n---\n\n${source}`;
  // The front matter's lines with the line breaks between them: [line, break, line, …].
  const parts = split.front === "" ? [] : split.front.split(/(\r?\n)/);
  const start = parts.findIndex((part, i) => i % 2 === 0 && part.startsWith(`${name}:`));
  if (start < 0) {
    if (value === "") return source;
    const front = (split.front === "" ? "" : split.front.replace(/\r?\n$/, "") + split.nl) + fieldLines(name, value).join(split.nl);
    return joinFront({ ...split, front });
  }

  // The value goes on over the lines below it that are indented or list entries, and over blank
  // lines and comments between those.
  let end = start;
  for (let i = start + 2; i < parts.length; i += 2) {
    if (/^([ \t]|-([ \t]|$))/.test(parts[i])) end = i;
    else if (!/^\s*(#.*)?$/.test(parts[i])) break;
  }
  if (value === "") {
    // The field's lines go with one line break: the one after them, or the one before at the end.
    parts.splice(end + 1 < parts.length ? start : Math.max(start - 1, 0), end - start + 2);
  } else {
    const entry = parts.slice(start + 2, end + 1).find((part, i) => i % 2 === 0 && /^\s*-([ \t]|$)/.test(part));
    const indent = entry && /^\s*(#.*)?$/.test(parts[start].slice(name.length + 1)) ? /^\s*/.exec(entry)[0] : null;
    parts.splice(start, end - start + 1, fieldLines(name, value, indent).join(parts[start + 1] ?? split.nl));
  }
  return joinFront({ ...split, front: parts.join("") });
}

// A field as lines of front matter: `name: value`, `name: [a, b]`, or, for a list given an indent,
// `name:` and a `- a` line per value.
function fieldLines(name, value, indent = null) {
  if (!Array.isArray(value)) return [`${name}: ${scalar(value)}`];
  if (indent == null || value.length === 0) return [`${name}: [${value.map(flowScalar).join(", ")}]`];
  return [`${name}:`, ...value.map((v) => `${indent}- ${scalar(v)}`)];
}

// value inside [a, b], where a comma or a bracket would end it early.
function flowScalar(value) {
  return /[,[\]{}]/.test(value) ? JSON.stringify(value) : scalar(value);
}

// value as YAML: bare when it reads back the same, quoted when it wouldn't.
export function scalar(value) {
  try {
    const back = yaml(`v: ${value}`)?.v;
    if (text(back) === value && typeof back !== "object" && !/[:#]/.test(value)) return value;
  } catch {
    // quote it
  }
  return JSON.stringify(value);
}

// The writes ({ name: text }) that set a field of one item, in its file and in the index.
export function planUpdate(s, slug, name, value) {
  value = String(value ?? "").trim();
  const item = s.bySlug.get(slug);
  if (!item) throw new Error(`there's no item ${slug}`);
  const problem = validate(s, name, value);
  if (problem) throw new Error(problem);
  const writes = { [item.file]: setFront(s.files[item.file], name, value) };
  const index = hasManagedIndex(s) ? planIndex(parseBacklog({ files: { ...s.files, ...writes } }))[s.index] : indexWithValues(s, name, new Map([[slug, value]]));
  if (index != null) writes[s.index] = index;
  return writes;
}

// A file name for a title: "Rig: Logo Build" is "rig-logo-build".
export function slugify(title) {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036F]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return slug || "item";
}

const DEFAULT_TEMPLATE = "## Why\n\n\n## Acceptance\n\n- \n";

// A moment's calendar day where the board or the CLI runs, as YYYY-MM-DD: an item made after local
// midnight is dated today, not by the UTC clock.
export function localDay(at = new Date()) {
  const two = (n) => String(n).padStart(2, "0");
  return `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}`;
}

// The writes for a new item, { slug, writes }: its file, with the body from _template.md when the
// folder has one, then the epic's list when epic names one to add it to, then its row in the index.
// The file is named after the title unless slug asks for a name of the project's own, which is
// used exactly as given or refused, never suffixed.
export function planCreate(s, { title = "", weight = "", fields = {}, tags = [], epic = "", items = null, slug: requested = "" }, today = localDay()) {
  title = title.trim();
  weight = String(weight ?? "").trim();
  if (!title) throw new Error("a new item needs a title");
  if (weight && validate(s, "weight", weight)) throw new Error(validate(s, "weight", weight));
  const values = {};
  for (const [name, value] of Object.entries(fields)) {
    const v = String(value ?? "").trim();
    if (!v) continue;
    const problem = validate(s, name, v);
    if (problem) throw new Error(problem);
    values[name] = v;
  }
  const target = epic ? itemCalled(s, epic) : null;
  if (target) canListItems(s, target);
  // `items` makes the new item an epic over existing items, in work order.
  if (items != null) {
    if (epic) throw new Error("a new epic can't go into an epic: epics can't contain epics");
    if (!items.length) throw new Error("an epic needs at least one item");
    items.forEach((slug, i) => {
      if (isEpic(itemCalled(s, slug))) throw new Error(`${slug} is an epic, and epics can't contain epics`);
      if (items.indexOf(slug) !== i) throw new Error(`${slug} is listed twice`);
    });
  }

  if (requested) checkSlug(s, requested);
  const base = requested || slugify(title);
  let slug = base;
  for (let i = 2; s.files[`${slug}.md`] != null; i++) slug = `${base}-${i}`;

  // A backlog that numbers its items (or has none yet) numbers the new one; one that doesn't yet
  // starts with ids --write, not with whichever item happens to be made next.
  const id = s.items.length === 0 || s.items.some(idNumber) ? String(nextId(s)) : "";
  const lines = ["---", `title: ${scalar(title)}`, ...(id ? [`id: ${id}`] : [])];
  for (const f of s.fields) if (values[f.name]) lines.push(`${f.name}: ${scalar(values[f.name])}`);
  if (weight) lines.push(`weight: ${weight}`);
  lines.push(`tags: [${tags.map((t) => t.trim()).filter(Boolean).map((t) => JSON.stringify(t)).join(", ")}]`);
  lines.push(`created: ${today}`, ...(items ? [`items: [${items.join(", ")}]`] : []), "depends_on: []", "related: []", "---", "", `# ${title}`, "", "");

  const writes = { [`${slug}.md`]: lines.join("\n") + template(s, title) };
  if (target) writes[target.file] = setFront(s.files[target.file], "items", [...target.items, slug]);
  const index = hasManagedIndex(s) ? planIndex(parseBacklog({ files: { ...s.files, ...writes } }))[s.index] : indexWithItem(s, { slug, title, id, weight, fields: values });
  if (index != null) writes[s.index] = index;
  return { slug, writes };
}

// Whether a requested slug can name a new item: a file name the hosts accept, that would be an
// item and not the index, the template or a hidden file, and that no file has, whatever its case.
function checkSlug(s, slug) {
  const name = `${slug}.md`;
  if (/\.md$/i.test(slug)) throw new Error(`give the slug without .md: ${slug.slice(0, -3)}`);
  if (!FILE_NAME.test(name)) throw new Error(`${slug} can't be a slug: use letters, digits, dots, dashes and underscores, starting with a letter or digit`);
  if (slug.startsWith("_")) throw new Error(`${name} starts with _, so it wouldn't be read as an item`);
  if (!isItemFile(name, s.index)) throw new Error(`${name} is the backlog's README or index, not an item`);
  const taken = Object.keys(s.files).find((f) => f.toLowerCase() === name.toLowerCase());
  if (taken) throw new Error(`${taken} already exists`);
}

function template(s, title) {
  const source = s.files[TEMPLATE_FILE];
  if (source == null) return DEFAULT_TEMPLATE;
  const [, body] = takeTitle(splitFront(source)?.body ?? source);
  const out = body.replace(/^(\r?\n)+/, "").replaceAll("{{title}}", title);
  return out.trim() ? out : DEFAULT_TEMPLATE;
}

// The write ({ name: text }) that adds an item to the end of an epic's list, or none ({}) when the
// list has it already. Only the epic's file changes. Epics can't contain epics, so an epic can't
// be added, and an item in an epic can't start a list of its own.
export function planAddToEpic(s, epic, slug) {
  const target = itemCalled(s, epic);
  const item = itemCalled(s, slug);
  if (target.items.includes(slug)) return {};
  if (item === target) throw new Error("an epic can't list itself");
  if (isEpic(item)) throw new Error(`${slug} is an epic, and epics can't contain epics`);
  canListItems(s, target);
  return { [target.file]: setFront(s.files[target.file], "items", [...target.items, slug]) };
}

// The write that takes an item out of an epic's list, keeping the rest in order, or none when the
// list doesn't have it. A slug that's no item comes out the same way.
export function planRemoveFromEpic(s, epic, slug) {
  const target = itemCalled(s, epic);
  if (!target.items.includes(slug)) return {};
  return { [target.file]: setFront(s.files[target.file], "items", target.items.filter((x) => x !== slug)) };
}

// Whether target may list items: an epic may, and so may any item that isn't in an epic itself.
function canListItems(s, target) {
  const outer = isEpic(target) ? null : epicsOf(s, target.slug)[0];
  if (outer) throw new Error(`${target.slug} is in the epic ${outer.slug}, so it can't be an epic itself`);
}

// ---- The board's view ----------------------------------------------------------------------------

// What the board shows for an address, as pure functions of the backlog and the query string, so
// Node tests reach them. board.js reads location and calls these.

export function viewDefaults(s) {
  const names = s?.fields.map((f) => f.name) ?? [];
  return { view: "board", sort: "weight", group: names.includes("status") ? "status" : names[0] || "" };
}

// ?epic= filters to an epic's items, unless the backlog has a choice field called epic.
export function epicFilterOn(s) {
  return !!s && !s.fields.some((f) => f.name === "epic");
}

// Only what the board knows: anything else in the address is left out.
export function viewParams(s, search) {
  const raw = Object.fromEntries(new URLSearchParams(search));
  const d = viewDefaults(s);
  const names = s?.fields.map((f) => f.name) ?? [];
  const p = {
    view: ["board", "list"].includes(raw.view) ? raw.view : d.view,
    group: names.includes(raw.group) ? raw.group : d.group,
    sort: ["weight", "title", "id", "created", ...names].includes(raw.sort) ? raw.sort : d.sort,
  };
  p.dir = ["asc", "desc"].includes(raw.dir) ? raw.dir : sortDirection(p.sort);
  for (const key of ["q", "tag", "item", ...names]) if (raw[key]?.trim()) p[key] = raw[key].trim();
  for (const key of ["open", "next"]) if (raw[key] === "1") p[key] = "1";
  if (epicFilterOn(s) && isEpic(s.bySlug.get(raw.epic?.trim()))) p.epic = raw.epic.trim();
  return p;
}

// The query string for the address with `changes` applied, "" when it's all defaults. Keys come
// sorted, and defaults and empty values are left out; a sort's direction is left out when it's the
// column's own.
export function viewQuery(s, search, changes = {}) {
  const p = { ...viewParams(s, search), ...changes };
  const d = { ...viewDefaults(s), dir: sortDirection(p.sort) };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(p).sort()) {
    if (value != null && value !== "" && d[key] !== value) query.set(key, value);
  }
  const q = query.toString();
  return q ? `?${q}` : "";
}

export function viewFilters(s) {
  return ["q", "tag", "epic", "open", "next", ...s.fields.map((f) => f.name)];
}

export function isFiltering(s, p) {
  return viewFilters(s).some((k) => p[k]);
}

// The items the address shows, in its order. The Epic filter puts the epic itself first.
export function viewItems(s, p) {
  const terms = parseQuery(s, p.q);
  const epic = epicFilterOn(s) && p.epic ? s.bySlug.get(p.epic) : null;
  const items = s.items.filter((item) =>
    s.fields.every((f) => !p[f.name] || (item.fields[f.name] ?? "") === (p[f.name] === "none" ? "" : p[f.name])) &&
    (!epic || item === epic || epic.items.includes(item.slug)) &&
    (!p.tag || item.tags.includes(p.tag)) &&
    (!p.open || item.open) &&
    (!p.next || item.startable) &&
    matchesQuery(item, terms));
  const sorted = sortItems(s, items, p.sort, p.dir);
  return epic && sorted.includes(epic) ? [epic, ...sorted.filter((item) => item !== epic)] : sorted;
}

// A search query in the qualifier style GitHub uses for issues. Plain words and "quoted phrases"
// are text; #tag, field:value (field:"two words") and is:epic filter. A quoted term is always text,
// and a qualifier that isn't one (http:, is: with anything but epic, a name that isn't a field) is
// text too. Each term keeps its raw text, so the board can take one out of the query.
export function parseQuery(s, q = "") {
  const terms = [];
  const text = (raw, value) => { if (value) terms.push({ raw, kind: "text", value: value.toLowerCase() }); };
  const code = s ? new RegExp(`^${s.prefix}-?(\\d+)$`, "i") : null;
  for (const m of (q ?? "").matchAll(/([^\s"]*)"([^"]*)"?|\S+/g)) {
    const raw = m[0];
    const quoted = m[2] !== undefined;
    const id = !quoted && code?.exec(raw);
    if (id && Number(id[1]) > 0) { terms.push({ raw, kind: "id", value: Number(id[1]) }); continue; }
    const [head, value] = quoted ? [m[1], m[2]] : raw.startsWith("#") ? ["#", raw.slice(1)] : [raw.slice(0, raw.indexOf(":") + 1), raw.slice(raw.indexOf(":") + 1)];
    if (quoted && !head) text(raw, value);
    else if (head === "#" && value) terms.push({ raw, kind: "tag", value });
    else if (head.endsWith(":") && head.length > 1 && value) {
      const name = head.slice(0, -1).toLowerCase();
      const f = name === "is" ? null : s?.fields.find((x) => x.name.toLowerCase() === name);
      if (name === "is" && value.toLowerCase() === "epic") terms.push({ raw, kind: "epic" });
      else if (f) terms.push({ raw, kind: "field", name: f.name, value });
      else text(raw, raw.replaceAll('"', ""));
    } else text(raw, raw.replaceAll('"', ""));
  }
  return terms;
}

// Does the item match every term? Text looks at the title, slug, summary, text, tags and
// choice-field values; field:none matches an item without that field, as the selects' None does.
export function matchesQuery(item, terms) {
  const same = (a, b) => a.toLowerCase() === b.toLowerCase();
  let hay;
  return terms.every((t) => {
    if (t.kind === "tag") return item.tags.some((tag) => same(tag, t.value));
    if (t.kind === "epic") return isEpic(item);
    if (t.kind === "id") return idNumber(item) === t.value;
    if (t.kind === "field") return same(t.value, "none") ? !item.fields[t.name] : same(item.fields[t.name] ?? "", t.value);
    hay ??= [item.title, item.slug, item.summary, item.body, ...item.tags, ...Object.values(item.fields)].filter(Boolean).map((x) => x.toLowerCase());
    return hay.some((x) => x.includes(t.value));
  });
}

// The query without its index-th term.
export function queryWithout(terms, index) {
  return terms.filter((_, i) => i !== index).map((t) => t.raw).join(" ");
}

// The board's columns: one for each value of the grouping field, then one for items without a
// value and one for values the field doesn't list.
export function viewColumns(s, items, group) {
  const f = field(s, group);
  const columns = f.values.map((value) => ({ value, title: label(value), drop: true, items: items.filter((i) => i.fields[group] === value) }));
  const none = items.filter((i) => !i.fields[group]);
  const other = items.filter((i) => i.fields[group] && !f.values.includes(i.fields[group]));
  if (none.length) columns.push({ value: "", title: `No ${group}`, drop: false, items: none });
  if (other.length) columns.push({ value: "other", title: "Other", drop: false, items: other });
  return columns;
}

// The colour a value gets when backlog.yml doesn't give one.
const STATUS_TONES = {
  idea: "gray", backlog: "gray", todo: "gray", new: "gray", open: "gray", ready: "teal", planned: "teal",
  "in-progress": "blue", doing: "blue", active: "blue", started: "blue", wip: "blue", review: "violet",
  "in-review": "violet", blocked: "red", parked: "amber", done: "green", closed: "green", complete: "green",
  completed: "green", shipped: "green", resolved: "green", cancelled: "gray", canceled: "gray",
  wontfix: "gray", archived: "gray",
};
const CYCLE = ["violet", "orange", "teal", "blue", "pink", "green", "indigo", "amber"];

// A value's tone: backlog.yml's colour, else a well-known status's, else the priority ladder (red,
// amber, gray), else a cycle through the field's values. "none" for no value.
export function tone(s, name, value) {
  const f = field(s, name);
  if (!value) return "none";
  if (f.colors[value]) return f.colors[value];
  const i = f.values.indexOf(value);
  if (name === "status") return STATUS_TONES[value] ?? (i >= 0 ? CYCLE[i % CYCLE.length] : "gray");
  if (name === "priority") return i === 0 ? "red" : i === 1 && f.values.length > 2 ? "amber" : "gray";
  return i >= 0 ? CYCLE[i % CYCLE.length] : "gray";
}

// ---- Prompts -----------------------------------------------------------------------------------

// Paths in prompts are relative to the project, so a prompt works in any session there.
const promptPath = (s, file) => `${s.dir}/${file}`;

// An item in a prompt: its title, file and status.
function promptRef(s, item) {
  return `${item.title} (${promptPath(s, item.file)}${item.fields.status ? `, status: ${item.fields.status}` : ""})`;
}

// Linked items for a prompt: a heading, then a line for each.
function promptList(s, heading, slugs) {
  if (!slugs.length) return [];
  return [`${heading}:`, ...slugs.map((x) => (s.bySlug.has(x) ? `- ${promptRef(s, s.bySlug.get(x))}` : `- ${x} (no such item)`)), ""];
}

function promptFields(item) {
  return [...Object.entries(item.fields).map(([name, value]) => `${name}: ${value}`), item.weight && `weight: ${item.weight}`].filter(Boolean);
}

// Markdown in a fence that its own code blocks can't close.
function fenced(body) {
  const fence = "`".repeat(Math.max(3, ...[...body.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return [`${fence}markdown`, body, fence];
}

// Where items keep their status: their front matter, and their index rows when they have them.
function statusPlaces(s, items) {
  const rows = items.filter((item) => indexRows(s).some((r) => r.slug === item.slug)).length;
  if (rows === 0) return "in its front matter";
  return `in its front matter and${rows < items.length ? ", where it has one," : ""} its row in ${promptPath(s, s.index)}`;
}

// A blocked item's warning, naming what it waits on. It comes before the status change: the agent
// waits for the go-ahead.
function blockedLine(s, what, item) {
  if (!item.blockers.length) return [];
  const names = item.blockers.map((slug) => s.bySlug.get(slug)?.title ?? slug);
  return [`${what} waits on unfinished work: ${names.join("; ")}. Ask me before you start on it.`, ""];
}

// What the board found in an item, problems first, then its suggestions, each under a heading.
function promptFindings(s, slug, whose) {
  const found = s.problems.filter((p) => p.slug === slug);
  const problems = found.filter((p) => !p.notice).map((p) => `- ${p.message}`);
  const notices = found.filter((p) => p.notice).map((p) => `- ${p.message}`);
  return [
    ...(problems.length ? [`Problems the board found in ${whose}:`, ...problems, ""] : []),
    ...(notices.length ? ["The board suggests:", ...notices, ""] : []),
  ];
}

const QUESTIONS = "If it lists open questions, ask me before you decide any of them.";

// An item as a prompt to paste into a coding agent's session in the project. What to do comes
// first: any warning, the status change, and reading the file. Then what it may want to know: its
// file, fields, what it depends on, unblocks and relates to, its epics, what the board found, and
// its text.
export function itemPrompt(s, slug) {
  const item = itemCalled(s, slug);
  const fields = promptFields(item);
  const epics = epicsOf(s, item.slug);
  const active = s.active[0], done = s.done[0];
  const places = statusPlaces(s, [item]);
  const started = s.active.includes(item.fields.status);
  // The prompt starts with the status change, so an agent makes it before the work instead of
  // forgetting it at the end.
  let opening = "";
  if ("status" in item.fields) {
    if (active && !started) opening = `${item.blockers.length ? "If you go ahead, start" : "Start"} by setting its status to ${active}, ${places}.${done ? ` Set it to ${done} there when it's finished.` : ""}`;
    else if (done) opening = `${started ? `It's ${item.fields.status} already. ` : ""}Set its status to ${done}, ${places}, when it's finished.`;
  }

  return [
    `Work on this item from the backlog: ${[itemCode(s, item), item.title].filter(Boolean).join(" ")}`,
    "",
    ...blockedLine(s, "It", item),
    ...(opening ? [opening, ""] : []),
    `Read its file before you start: the file is current, and this copy may not be. ${QUESTIONS}`,
    "",
    `File: ${promptPath(s, item.file)}`,
    ...(fields.length ? [`Fields: ${fields.join(", ")}`] : []),
    ...(item.tags.length ? [`Tags: ${item.tags.join(", ")}`] : []),
    ...(item.branches.length ? [`Branches: ${item.branches.join(", ")}`] : []),
    "",
    ...promptList(s, "Depends on", item.dependsOn),
    ...promptList(s, "Unblocks", item.dependents),
    ...promptList(s, "Related", item.related),
    ...promptList(s, epics.length === 1 ? "In the epic" : "In the epics", epics.map((epic) => epic.slug)),
    ...promptFindings(s, item.slug, "it"),
    `Its text (links in it are relative to ${s.dir}):`,
    "",
    ...fenced(item.body),
  ].join("\n") + "\n";
}

// An epic as one brief for a coding agent working through it in the project. What to do comes
// first: any warning, the epic's status, how to work, its items in work order (each with its file,
// status, priority, weight, what it waits on and what the board found) and what holds it up from
// outside. Then the epic's file, fields and progress, and its whole text (its goal and end-to-end
// acceptance). It points to the items' files rather than pasting them: the agent reads each one
// when it gets there, and the brief stays short.
export function epicPrompt(s, slug) {
  const epic = itemCalled(s, slug);
  if (!isEpic(epic)) throw new Error(`${slug} isn't an epic: it lists no items`);
  const { order, outside } = epicOrder(s, slug);
  const progress = epicProgress(s, slug);
  const step = (item) => `${order.indexOf(item) + 1}. ${item.title}`;
  const fields = promptFields(epic);
  const counts = [
    progress.active && `${progress.active} ${label(s.active[0]).toLowerCase()}`,
    progress.ready && `${progress.ready} can start`,
    progress.blocked && `${progress.blocked} waiting`,
    progress.setAside && `${progress.setAside} set aside`,
    progress.other && `${progress.other} in another status`,
  ].filter(Boolean);

  const items = order.flatMap((item, i) => {
    const facts = [
      item.fields.status && `status: ${item.fields.status}`,
      item.fields.priority && `priority: ${item.fields.priority}`,
      item.weight && `weight: ${item.weight}`,
    ].filter(Boolean);
    const waits = (item.open ? item.blockers : []).map((dep) => {
      const other = s.bySlug.get(dep);
      return order.includes(other) ? step(other) : `${promptRef(s, other)}, outside the epic`;
    });
    const found = s.problems.filter((p) => p.slug === item.slug);
    const problems = found.filter((p) => !p.notice).map((p) => p.message);
    const notices = found.filter((p) => p.notice).map((p) => p.message);
    return [
      `${i + 1}. ${item.title} (${promptPath(s, item.file)})`,
      ...(facts.length ? [`   ${facts.join(", ")}`] : []),
      ...(waits.length ? [`   waits on: ${waits.join("; ")}`] : []),
      ...(problems.length ? [`   problems: ${problems.join("; ")}`] : []),
      ...(notices.length ? [`   suggestions: ${notices.join("; ")}`] : []),
    ];
  });

  const next = progress.next
    ? `Next up: ${step(progress.next)}, the first item that can start now.`
    : progress.total && progress.done + progress.setAside === progress.total
      ? "Every item is done or closed: what's left is the epic's own acceptance."
      : "No item can start right now: the open ones are under way or wait on unfinished work.";

  const active = s.active[0], done = s.done[0];
  const setAside = s.closed.filter((status) => !s.done.includes(status));
  const keep = [active && `to ${active} when you start it`, done && `to ${done} when it's finished`].filter(Boolean);
  const opening = active && "status" in epic.fields && (s.active.includes(epic.fields.status)
    ? `The epic is ${epic.fields.status} already.`
    : `${epic.blockers.length ? "If you go ahead, start" : "Start"} by setting the epic's status to ${active}, ${statusPlaces(s, [epic])}.`);
  const work = [
    "Read the epic's file now, and each item's file before you start that item: the files are current, and this copy may not be. This brief points to the items' files rather than repeating them.",
    "Follow the work order below unless an item's file says otherwise.",
    keep.length && `Keep each item's status current: set it ${keep.join(" and ")}, ${statusPlaces(s, order)}.`,
    done && `Set the epic to ${done} only when every item in it is ${done}${setAside.length ? ` (or ${setAside.join(" or ")})` : ""} and the epic's own acceptance holds.`,
    "If an item lists open questions, stop and ask me before you decide any of them.",
  ].filter(Boolean);

  return [
    `Work through this epic from the backlog: ${[itemCode(s, epic), epic.title].filter(Boolean).join(" ")}`,
    "",
    ...blockedLine(s, "The epic itself", epic),
    ...(opening ? [opening, ""] : []),
    "How to work:",
    ...work.map((line) => `- ${line}`),
    "",
    "Its items in work order (each after the items it depends on, and otherwise in the epic's order):",
    "",
    ...items,
    "",
    next,
    "",
    ...(outside.length
      ? [
        "Outside the epic, these unfinished items hold up items in it. Ask me before you start an item that waits on one of them:",
        ...outside.map(({ item, waiting }) => `- ${promptRef(s, item)}: ${waiting.map(step).join("; ")} ${waiting.length === 1 ? "waits" : "wait"} on it`),
        "",
      ]
      : []),
    `Epic: ${promptPath(s, epic.file)}`,
    ...(fields.length ? [`Fields: ${fields.join(", ")}`] : []),
    ...(epic.tags.length ? [`Tags: ${epic.tags.join(", ")}`] : []),
    ...(epic.branches.length ? [`Branches: ${epic.branches.join(", ")}`] : []),
    `Progress: ${progress.done} of ${progress.total} ${progress.total === 1 ? "item" : "items"} done${counts.length ? `, ${counts.join(", ")}` : ""}`,
    "",
    ...promptList(s, "Depends on", epic.dependsOn),
    ...promptList(s, "Unblocks", epic.dependents),
    ...promptList(s, "Related", epic.related),
    ...promptFindings(s, epic.slug, "the epic"),
    `Its text says what the whole is for and how to tell it's finished (links in it are relative to ${s.dir}):`,
    "",
    ...fenced(epic.body),
  ].join("\n") + "\n";
}

// ---- Links and editors -------------------------------------------------------------------------

// A path inside the backlog folder, resolved: "../music.md" from /p/docs/backlog is /p/docs/music.md.
export function resolvePath(dir, relative) {
  const parts = dir.replace(/\\/g, "/").split("/");
  for (const part of relative.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== "." && part !== "") parts.push(part);
  }
  return parts.join("/") || "/";
}

// A link that opens file in an editor, or "" when the board doesn't know how. editor is vscode,
// cursor, zed, idea, windsurf or none, or a URL with {path} in it.
export function editorURL(editor, file) {
  if (!file || !editor || editor === "none") return "";
  const path = file.replace(/\\/g, "/").replace(/^(?=[^/])/, "/");
  if (editor.includes("{path}")) return editor.replaceAll("{path}", encodeURI(path));
  const scheme = { vscode: "vscode", cursor: "cursor", windsurf: "windsurf", zed: "zed" }[editor];
  if (scheme) return `${scheme}://file${encodeURI(path)}`;
  if (editor === "idea") return `idea://open?file=${encodeURIComponent(path)}`;
  return "";
}
