// The backlog itself, with no page: reading the files, checking them, and working out the writes
// an edit needs. Pure functions over { name: text }, so they run in the browser and in Node.

import { load as loadYAML, CORE_SCHEMA } from "./vendor/js-yaml.js";
import { Marked } from "./vendor/marked.js";

export const CONFIG_FILE = "backlog.yml";
export const TEMPLATE_FILE = "_template.md";
// The files a host reads and writes: Markdown and YAML directly in the backlog folder, including
// `_template.md`. No hidden files, no "..", no subfolders.
export const FILE_NAME = /^[A-Za-z0-9_][A-Za-z0-9._-]*\.(md|ya?ml)$/;
export const COLORS = ["gray", "blue", "teal", "green", "amber", "orange", "red", "pink", "violet", "indigo"];

// The front matter keys the board reads itself, so they can't be choice fields.
const RESERVED = ["title", "weight", "created", "tags", "branches", "depends_on", "related"];

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
    index: "", editor: "", colors: {} };
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
const FRONT_RE = /^(﻿?---[ \t]*\r?\n)(?:([\s\S]*?)(\r?\n))?(---[ \t]*(?:\r?\n|$))([\s\S]*)$/;

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
    tags: [], branches: [], dependsOn: [], related: [], problems: [],
  };

  const split = splitFront(source);
  let body = source;
  if (!split) {
    item.problems.push("it doesn't start with front matter between --- lines");
  } else {
    body = split.body;
    readFront(item, split.front);
  }

  const [heading, rest] = takeTitle(body);
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
    return;
  }
  if (meta == null) return;
  if (!isMap(meta)) {
    item.problems.push("its front matter isn't a list of fields");
    return;
  }
  for (const [key, value] of Object.entries(meta)) {
    switch (key) {
      case "tags": item.tags = list(value); break;
      case "branches": item.branches = list(value); break;
      case "depends_on": item.dependsOn = list(value); break;
      case "related": item.related = list(value); break;
      case "title": case "weight": case "created": item[key] = text(value); break;
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
    index: config.index === "none" ? "" : config.index || "README.md",
    problems: error ? [{ slug: "", message: error }] : [],
    files, config,
  };

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
      if (!other || other === item) continue;
      if (!other.done) item.blockers.push(dep);
      other.dependents.push(item.slug);
    }
  }
  for (const item of s.items) {
    const ready = !hasStatus || s.startable.includes(item.fields.status);
    item.startable = item.open && ready && item.blockers.length === 0;
  }
}

// Where a weight sorts: positive whole numbers by size, anything else after them.
export function weightRank(weight) {
  return /^\d+$/.test(weight ?? "") && Number(weight) > 0 ? Number(weight) : UNWEIGHTED;
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

// The items in an order: "weight" (work order: weight, priority, title), "title", "created"
// (newest first) or a field's own order.
export function sortItems(s, items, by) {
  const title = (item) => item.title.toLowerCase();
  const key = {
    weight: (item) => [weightRank(item.weight), rank(s, "priority", item.fields.priority), title(item), item.slug],
    title: (item) => [title(item), item.slug],
    created: (item) => [item.created || "", title(item)],
  }[by] ?? ((item) => [rank(s, by, item.fields[by]), rank(s, "priority", item.fields.priority), weightRank(item.weight), title(item)]);
  const sorted = [...items].sort((a, b) => compare(key(a), key(b)));
  return by === "created" ? sorted.reverse() : sorted;
}

function tagCounts(items) {
  const counts = new Map();
  for (const item of items) for (const tag of item.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts].map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// What doesn't add up: a file the board can't read well, a value backlog.yml doesn't allow, a field
// a strict list leaves empty, a weight that isn't a positive whole number, a link to no item, a
// dependency loop, and an index that disagrees with the items.
function problems(s) {
  const out = [];
  const add = (slug, message) => out.push({ slug, message });
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
    for (const [name, slugs] of [["depends_on", item.dependsOn], ["related", item.related]]) {
      for (const slug of slugs) {
        if (slug === item.slug) add(item.slug, `${name} names the item itself`);
        else if (!s.bySlug.has(slug)) add(item.slug, `${name} names ${slug}, which isn't an item`);
      }
    }
    const loop = dependencyLoop(s, item);
    if (loop) add(item.slug, `its dependencies go round in a loop: ${loop.join(" → ")}`);
    out.push(...indexProblems(s, item));
  }
  for (const row of indexRows(s)) {
    if (!s.bySlug.has(row.slug)) add("", `${s.index} lists ${row.slug}.md, which isn't there`);
  }
  return out;
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

// ---- The README's index ------------------------------------------------------------------------
// Any Markdown table whose rows start with a link to an item's file. Columns whose header names a
// field (Status, Priority, Weight…) are checked against the items and kept up to date when the
// board changes them; other columns are left alone.

const ROW_LINK_RE = /^\[(?:[^\]\\]|\\.)*\]\(<?(?:\.\/)?([^)\s/<>]+)\.md(?:#[^)]*)?>?\)/;

function readIndex(s) {
  const source = s.index ? s.files[s.index] : undefined;
  s.indexLines = source == null ? [] : source.split("\n");
  s.indexCRLF = source?.includes("\r\n") ?? false;
  const names = ["weight", ...s.fields.map((f) => f.name)];
  const tables = [];
  const lines = s.indexLines;
  for (let i = 0; i + 1 < lines.length; i++) {
    const header = cells(lines[i]), sep = cells(lines[i + 1]);
    if (!header || !sep || sep.length !== header.length || !sep.every((c) => /^:?-+:?$/.test(c))) continue;
    const table = { cols: header.map((h, c) => (c > 0 && names.find((n) => squash(n) === squash(h))) || ""), rows: [] };
    let j = i + 2;
    for (; j < lines.length; j++) {
      const row = cells(lines[j]);
      if (!row) break;
      const m = ROW_LINK_RE.exec(row[0]);
      if (m) table.rows.push({ line: j, slug: m[1], cells: row });
    }
    if (table.rows.length) tables.push(table);
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
  let found = false;
  for (const table of s.indexTables) {
    for (const row of table.rows.filter((r) => r.slug === item.slug)) {
      found = true;
      table.cols.forEach((name, c) => {
        if (!name || c >= row.cells.length) return;
        const want = name === "weight" ? item.weight : item.fields[name];
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

// The index with value shown for field in each of slug's rows, or null when nothing changes.
function indexWithValue(s, slug, name, value) {
  const lines = [...s.indexLines];
  let changed = false;
  for (const table of s.indexTables) {
    for (const row of table.rows.filter((r) => r.slug === slug)) {
      const c = table.cols.indexOf(name);
      if (c < 0 || c >= row.cells.length || row.cells[c] === value) continue;
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
    c === 0 ? `[${title}](${item.slug}.md)` : name === "weight" ? item.weight : name ? item.fields[name] ?? "" : "");
  const lines = [...s.indexLines];
  lines.splice(best.rows.at(-1).line + 1, 0, rowLine(s, row));
  return lines.join("\n");
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

// Sets one line of the front matter (adding it, or the front matter itself, when it isn't there).
// An empty value removes the line.
export function setFront(source, name, value) {
  const split = splitFront(source);
  if (!split) return value === "" ? source : `---\n${name}: ${scalar(value)}\n---\n\n${source}`;
  const key = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const line = new RegExp(`^${key}:[^\\r\\n]*$`, "m");
  let front = split.front;
  if (value === "") {
    front = front.replace(new RegExp(`^${key}:[^\\r\\n]*(\\r?\\n|$)`, "m"), "").replace(/\r?\n$/, "");
  } else if (line.test(front)) {
    front = front.replace(line, () => `${name}: ${scalar(value)}`);
  } else {
    front = (front === "" ? "" : front.replace(/\r?\n$/, "") + split.nl) + `${name}: ${scalar(value)}`;
  }
  return joinFront({ ...split, front });
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
  const index = indexWithValue(s, slug, name, value);
  if (index != null) writes[s.index] = index;
  return writes;
}

// A file name for a title: "Rig: Logo Build" is "rig-logo-build".
export function slugify(title) {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return slug || "item";
}

const DEFAULT_TEMPLATE = "## Why\n\n\n## Acceptance\n\n- \n";

// The writes for a new item, { slug, writes }: its file, with the body from _template.md when the
// folder has one, and its row in the index.
export function planCreate(s, { title = "", weight = "", fields = {}, tags = [] }, today = new Date().toISOString().slice(0, 10)) {
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

  const base = slugify(title);
  let slug = base;
  for (let i = 2; s.files[`${slug}.md`] != null; i++) slug = `${base}-${i}`;

  const lines = ["---", `title: ${scalar(title)}`];
  for (const f of s.fields) if (values[f.name]) lines.push(`${f.name}: ${scalar(values[f.name])}`);
  if (weight) lines.push(`weight: ${weight}`);
  lines.push(`tags: [${tags.map((t) => scalar(t.trim())).filter((t) => t !== '""').join(", ")}]`);
  lines.push(`created: ${today}`, "depends_on: []", "related: []", "---", "", `# ${title}`, "", "");

  const writes = { [`${slug}.md`]: lines.join("\n") + template(s, title) };
  const index = indexWithItem(s, { slug, title, weight, fields: values });
  if (index != null) writes[s.index] = index;
  return { slug, writes };
}

function template(s, title) {
  const source = s.files[TEMPLATE_FILE];
  if (source == null) return DEFAULT_TEMPLATE;
  const [, body] = takeTitle(splitFront(source)?.body ?? source);
  const out = body.replace(/^(\r?\n)+/, "").replaceAll("{{title}}", title);
  return out.trim() ? out : DEFAULT_TEMPLATE;
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
