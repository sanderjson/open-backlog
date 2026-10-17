// The board: the page over core.js. It mounts on any element with data-open-backlog, reads the
// backlog from the host's two routes (data-api, default "."), and polls them to stay current.
//
//   GET  <api>/files          → { files: { "name.md": "text", … }, versions?, dir, path, writable }
//   PUT  <api>/files/<name>   ← the file's new text, with the header X-Open-Backlog: 1, and
//                               If-Match or If-None-Match: * when the host gives versions
//
// That's plain HTTP, so any host in any language can serve it (see README.md).

import * as core from "./core.js";

const POLL_MS = 2000;
const THEME_KEY = "open-backlog:theme";
const KEYS_KEY = "open-backlog:keys";

const ICONS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  board: '<rect x="3" y="4" width="4.5" height="16" rx="1.4"/><rect x="9.75" y="4" width="4.5" height="11" rx="1.4"/><rect x="16.5" y="4" width="4.5" height="13" rx="1.4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  unblocks: '<path d="M5 4v7a4 4 0 0 0 4 4h10"/><path d="M15 11l4 4-4 4"/>',
  branch: '<circle cx="6" cy="5.5" r="2"/><circle cx="6" cy="18.5" r="2"/><circle cx="18" cy="7.5" r="2"/><path d="M6 7.5v9M18 9.5v1a5 5 0 0 1-5 5H8"/>',
  edit: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  auto: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M8 5.5v13l10-6.5-10-6.5z"/>',
  hide: '<path d="M3 3l18 18"/><path d="M10.6 5.1A9.6 9.6 0 0 1 12 5c5 0 8.5 4.5 9.5 7a13 13 0 0 1-2.7 3.8M6.5 6.6C4.4 8 3 10.1 2.5 12c1 2.5 4.5 7 9.5 7a9.4 9.4 0 0 0 4.9-1.4"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  warning: '<path d="M12 3.5L2.5 20h19L12 3.5z"/><path d="M12 10v4.5M12 17.5h.01"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  sort: '<path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"/>',
  keys: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  copy: '<rect x="8.5" y="8.5" width="12" height="12" rx="2"/><path d="M15.5 8.5v-3a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/>',
  epic: '<path d="M12 3.5l8.5 4.5-8.5 4.5L3.5 8 12 3.5z"/><path d="M3.5 12l8.5 4.5 8.5-4.5"/><path d="M3.5 16l8.5 4.5 8.5-4.5"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11.5v5M12 8h.01"/>',
};

const icon = (name, cls = "") => `<svg class="bb-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
const esc = core.escapeHTML;
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
// The same mark on an epic's card, its list row and its sheet, so it reads as one before its bar.
const epicBadge = (id = "") => `<span class="bb-epic-badge" ${id ? `id="${id}"` : ""}>${icon("epic")}<span>Epic</span></span>`;

// The order an epic's progress bar shows its items in (see core.stage).
const STAGES = ["done", "setAside", "active", "ready", "blocked", "other"];

const SHORTCUTS = [
  ["/", "Search"], ["n", "New item"], ["b", "Board"], ["l", "List"], ["Shift E", "Filter by epic"],
  ["j / k", "Next / previous item"], ["e", "Open the item in your editor"],
  ["c", "Copy the item, or the epic, as a prompt for an agent"], ["Esc", "Close"], ["?", "These shortcuts"],
];

class Board {
  constructor(root) {
    this.root = root;
    const api = root.dataset.api || ".";
    const page = location.href.replace(/[?#].*$/, "");
    this.api = new URL(api.endsWith("/") ? api : api + "/", page.endsWith("/") ? page : page + "/");
    this.snap = null;
    this.version = 0;
    this.live = null;
    this.etag = "";
    this.body = "";
    this.sheetKey = "";
    this.lastItem = "";
    this.problemsOpen = false;
    this.fieldsKey = "";
    this.writes = Promise.resolve();
    this.pendingWrites = 0;
    this.polling = false;
    // data-page: the board is the page (index.html), so it names the tab and takes keys pressed
    // on the page itself. Mounted in a host's page, it leaves the title alone and takes keys only
    // while focus is inside it.
    this.ownsPage = root.hasAttribute("data-page");
    this.charKeys = this.stored(KEYS_KEY) !== "off";
  }

  start() {
    this.root.classList.add("bb");
    if (!this.ownsPage && !this.root.hasAttribute("tabindex")) this.root.tabIndex = -1;
    this.applyTheme(this.storedTheme());
    this.root.innerHTML = this.skeleton();
    this.el = Object.fromEntries([...this.root.querySelectorAll("[data-el]")].map((el) => [el.dataset.el, el]));
    this.setCharKeys(this.charKeys);
    this.bind();
    this.poll();
  }

  // ---- Talking to the host ---------------------------------------------------------------------

  async fetchFiles({ fresh = false } = {}) {
    const headers = !fresh && this.etag ? { "If-None-Match": this.etag } : {};
    const res = await fetch(new URL("files", this.api), { headers, cache: "no-store" });
    if (res.status === 304) return null;
    if (!res.ok) throw new Error(`the host answered ${res.status}`);
    this.etag = res.headers.get("ETag") || "";
    return res.text();
  }

  async poll() {
    clearTimeout(this.timer);
    if (this.polling) return;
    this.polling = true;
    if (document.visibilityState !== "hidden" && !this.pendingWrites) {
      const version = this.version;
      let reached = false;
      try {
        const body = await this.fetchFiles();
        reached = true;
        this.setLive(true);
        if (version !== this.version || this.pendingWrites) this.etag = "";
        else if (body != null && body !== this.body) this.apply(body);
      } catch (e) {
        // Only a failed fetch means the host is down. The host answered if reached is set, so
        // the trouble is in what it sent: say so, and wait for the next change.
        if (reached) this.toast(`Couldn't read the backlog: ${e.message}`, "error");
        else {
          this.setLive(false);
          if (!this.snap) this.renderError(e);
        }
      }
    }
    this.polling = false;
    this.timer = setTimeout(() => this.poll(), POLL_MS);
  }

  apply(body) {
    this.body = body;
    const payload = JSON.parse(body);
    this.snap = core.parseBacklog(payload);
    this.payload = payload;
    this.version++;
    this.render();
  }

  // The backlog as it is on disk now, for planning a write against.
  async fresh() {
    const body = await this.fetchFiles({ fresh: true });
    this.apply(body);
    return this.snap;
  }

  // Saves each file with a PUT, as planned against this.payload. When the host gives versions,
  // each PUT carries one (If-Match, or If-None-Match: * for a new file) and the host refuses with
  // 412 if the file changed since it was read. Without them, the board reads the file again just
  // before writing it: that catches most edits made in between, but only the host can catch all.
  async write(writes) {
    if (!Object.keys(writes).length) return;
    const { files: before, versions } = this.payload;
    const saved = [];
    const changed = (name) => new Error(`${name} changed since the board read it, so it wasn't saved`);
    try {
      for (const [name, text] of Object.entries(writes)) {
        const headers = { "Content-Type": "text/plain; charset=utf-8", "X-Open-Backlog": "1" };
        if (versions && before[name] == null) headers["If-None-Match"] = "*";
        else if (versions?.[name] != null) headers["If-Match"] = `"${versions[name]}"`;
        else {
          const current = JSON.parse(await this.fetchFiles({ fresh: true }));
          if (!current.writable) throw new Error("the backlog is read-only now");
          if ((current.files[name] ?? null) !== (before[name] ?? null)) throw changed(name);
        }
        const res = await fetch(new URL(`files/${encodeURIComponent(name)}`, this.api), { method: "PUT", headers, body: text });
        if (res.status === 412) throw changed(name);
        if (!res.ok) {
          let why = `the host answered ${res.status}`;
          try { why = (await res.json()).error || why; } catch { /* not JSON */ }
          throw new Error(why);
        }
        saved.push(name);
      }
      await this.fresh();
    } catch (e) {
      try { await this.fresh(); } catch { this.setLive(false); }
      throw new Error(`Couldn't finish saving: ${e.message}${saved.length ? `. Already saved: ${saved.join(", ")}. Review the refreshed backlog before retrying.` : ""}`);
    } finally {
      this.etag = "";
    }
  }

  // A second quick edit must plan from the first edit's result. Keep polls out of the write
  // sequence, and always read the actual files after saving or encountering a conflict.
  mutate(prepare) {
    this.pendingWrites++;
    const run = this.writes.then(async () => {
      const snap = await this.fresh();
      if (!snap.writable) throw new Error("this backlog is read-only");
      const result = prepare(snap);
      await this.write(result.writes);
      return result;
    });
    this.writes = run.catch(() => {});
    return run.finally(() => { this.pendingWrites--; this.render(); });
  }

  async update(slug, name, value) {
    try {
      await this.mutate((snap) => ({ writes: core.planUpdate(snap, slug, name, value) }));
      const shown = value === "" ? "none" : name === "weight" ? value : core.label(value);
      this.toast(`${core.label(name)} → ${shown}`, "ok", `${slug}.md`);
    } catch (e) {
      this.toast(e.message, "error");
      this.sheetKey = "";
      this.render();
    }
  }

  async create(form) {
    if (this.creating) return;
    this.creating = true;
    const data = new FormData(form);
    const fields = {};
    for (const f of this.snap.fields) fields[f.name] = data.get(`field-${f.name}`) || "";
    const tags = String(data.get("tags") || "").split(",").map((t) => t.trim()).filter(Boolean);
    const epic = String(data.get("epic") || "");
    try {
      const { slug, epicTitle } = await this.mutate((snap) => ({ ...core.planCreate(snap, { title: data.get("title") || "", weight: data.get("weight") || "", fields, tags, epic }), epicTitle: snap.bySlug.get(epic)?.title }));
      this.el.newDialog.close();
      form.reset();
      this.setParams({ item: slug }, { push: true });
      this.toast(epic ? `Item created in ${epicTitle}` : "Item created", "ok", `${slug}.md`);
    } catch (e) {
      this.el.newError.textContent = e.message;
      this.el.newError.hidden = false;
    } finally {
      this.creating = false;
    }
  }

  // Adds an item to an epic, or takes it out: either way only the epic's file changes.
  async changeEpic(plan, epic, slug) {
    try {
      const { title, writes } = await this.mutate((snap) => ({
        title: snap.bySlug.get(epic)?.title ?? epic,
        writes: plan === "add" ? core.planAddToEpic(snap, epic, slug) : core.planRemoveFromEpic(snap, epic, slug),
      }));
      if (!Object.keys(writes).length) return this.toast(plan === "add" ? `Already in ${title}` : `Not in ${title}`, "ok", `${epic}.md`);
      const left = plan === "add" || core.isEpic(this.snap.bySlug.get(epic)) ? "" : ", which lists no items now";
      this.toast(`${plan === "add" ? "Added to" : "Taken out of"} ${title}${left}`, "ok", `${epic}.md`);
    } catch (e) {
      this.toast(e.message, "error");
      this.sheetKey = "";
      this.render();
    }
  }

  // ---- The address -----------------------------------------------------------------------------

  defaults() {
    return core.viewDefaults(this.snap);
  }

  params() {
    return core.viewParams(this.snap, location.search);
  }

  epicFilterOn() {
    return core.epicFilterOn(this.snap);
  }

  epics() {
    return core.sortItems(this.snap, this.snap.items.filter(core.isEpic), "title");
  }

  href(changes = {}) {
    return location.pathname + core.viewQuery(this.snap, location.search, changes);
  }

  setParams(changes, { push = false } = {}) {
    const url = this.href(changes);
    if (url !== location.pathname + location.search) history[push ? "pushState" : "replaceState"](null, "", url);
    this.render();
  }

  filters() {
    return core.viewFilters(this.snap);
  }

  filtering(p) {
    return core.isFiltering(this.snap, p);
  }

  visible(p) {
    return core.viewItems(this.snap, p);
  }

  // ---- Colours ---------------------------------------------------------------------------------

  tone(name, value) {
    return core.tone(this.snap, name, value);
  }

  chip(name, value) {
    return `<span class="bb-chip tone-${this.tone(name, value)}"><span class="bb-dot"></span>${esc(core.label(value))}</span>`;
  }

  priority(value, { text = false } = {}) {
    const f = core.field(this.snap, "priority");
    const i = f.values.indexOf(value);
    if (!f.values.length) return "";
    const bars = Math.min(3, f.values.length);
    const level = i < 0 ? 0 : Math.max(1, bars - i);
    const marks = Array.from({ length: bars }, (_, b) => `<span class="${b < level ? "on" : ""}"></span>`).join("");
    const title = value ? `${core.label(value)} priority` : "No priority";
    return `<span class="bb-priority tone-${this.tone("priority", value)}" title="${esc(title)}"><span class="bb-bars">${marks}</span>${text ? `<span>${esc(core.label(value))}</span>` : ""}</span>`;
  }

  // ---- Page ------------------------------------------------------------------------------------

  skeleton() {
    return `
      <div class="bb-app">
        <header class="bb-header">
          <div class="bb-heading">
            <p class="bb-eyebrow"><span class="bb-live" data-el="live" title="Connecting…"></span><span data-el="dir"></span></p>
            <h1 data-el="title">Backlog</h1>
          </div>
          <div class="bb-stats" data-el="stats"></div>
          <div class="bb-actions">
            <button type="button" class="bb-btn bb-btn-primary" data-el="newButton" data-action="new" hidden>${icon("plus")}<span>New item</span></button>
            <button type="button" class="bb-icon-btn" data-action="theme" data-el="themeButton"></button>
            <button type="button" class="bb-icon-btn" data-action="help" title="Keyboard shortcuts (?)" aria-label="Keyboard shortcuts">${icon("keys")}</button>
          </div>
        </header>
        <div data-el="problems"></div>
        <div class="bb-toolbar">
          <form class="bb-filters" data-el="filters" role="search">
            <label class="bb-search">
              ${icon("search")}
              <input type="search" name="q" placeholder="Search" autocomplete="off" aria-label="Search: words, #tag, field:value or is:epic" data-el="search"
                title="Words search titles, text, tags and field values. An ID (W-12), #tag, field:value and is:epic filter. Quotes keep a phrase, or text that looks like a filter, as text.">
              <kbd>/</kbd>
            </label>
            <span class="bb-query-chips" data-el="queryChips"></span>
            <span class="bb-filter-fields" data-el="fieldFilters"></span>
            <select name="epic" class="bb-select bb-epic-filter" data-el="epicFilter" aria-label="Epic" title="An epic's items (Shift E)" hidden></select>
            <select name="tag" class="bb-select" data-el="tagFilter" aria-label="Tag"></select>
            <button type="button" class="bb-toggle" data-toggle="next" title="Open items with nothing unfinished before them">${icon("play")}<span>Can start</span></button>
            <button type="button" class="bb-toggle" data-toggle="open" title="Hide closed items">${icon("hide")}<span>Hide closed</span></button>
            <button type="button" class="bb-link-btn" data-action="clear" data-el="clear" hidden>Clear</button>
            <span class="bb-spacer"></span>
            <span class="bb-count" data-el="count"></span>
            <span class="bb-group" data-el="group"></span>
            <span class="bb-seg" role="group" aria-label="View">
              <button type="button" data-view="board" title="Board (b)" aria-label="Board">${icon("board")}</button>
              <button type="button" data-view="list" title="List (l)" aria-label="List">${icon("list")}</button>
            </span>
          </form>
        </div>
        <main class="bb-main" data-el="main"><div class="bb-loading"><span></span><span></span><span></span></div></main>
        <div data-el="sheet"></div>
        <dialog class="bb-dialog" data-el="newDialog" aria-labelledby="bb-new-title">
          <form method="dialog" data-el="newForm" class="bb-new">
            <h2 id="bb-new-title">New item</h2>
            <label class="bb-field bb-field-wide"><span>Title</span><input name="title" required autocomplete="off" placeholder="What needs doing?"></label>
            <div class="bb-new-fields" data-el="newFields"></div>
            <label class="bb-field bb-field-wide"><span>Tags</span><input name="tags" autocomplete="off" placeholder="comma, separated"></label>
            <p class="bb-new-note" data-el="newNote"></p>
            <p class="bb-error" data-el="newError" hidden></p>
            <div class="bb-dialog-actions">
              <button type="button" class="bb-btn" data-action="dismiss">Cancel</button>
              <button type="submit" class="bb-btn bb-btn-primary">Create</button>
            </div>
          </form>
        </dialog>
        <dialog class="bb-dialog bb-help" data-el="helpDialog" aria-labelledby="bb-help-title">
          <h2 id="bb-help-title">Keyboard shortcuts</h2>
          <dl>${SHORTCUTS.map(([k, what]) => `<dt><kbd>${esc(k)}</kbd></dt><dd>${esc(what)}</dd>`).join("")}</dl>
          <label class="bb-switch"><input type="checkbox" data-el="charKeys"><span>Single-key shortcuts</span></label>
          <p class="bb-help-note">Turn them off if they get in the way of a screen reader or speech input. Esc, Tab and the buttons keep working, and this browser remembers the choice.</p>
          <p class="bb-help-version">open-backlog v${core.VERSION}</p>
          <div class="bb-dialog-actions"><button type="button" class="bb-btn" data-action="dismiss">Close</button></div>
        </dialog>
        <div class="bb-toasts" data-el="toasts" aria-live="polite"></div>
      </div>`;
  }

  bind() {
    const { filters, main, sheet, newForm, search } = this.el;

    this.root.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action],[data-toggle],[data-view],[data-group],[data-sort],[data-stat],[data-tag],[data-term],a[data-item],[data-row]");
      if (!target || !this.root.contains(target)) return;
      if (target.matches("a[data-item]")) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        this.open(target.dataset.item);
      } else if (target.dataset.row) {
        this.open(target.dataset.row);
      } else if (target.dataset.toggle) {
        const key = target.dataset.toggle;
        this.setParams({ [key]: this.params()[key] ? null : "1" });
      } else if (target.dataset.view) {
        this.setParams({ view: target.dataset.view });
      } else if (target.dataset.group) {
        this.setParams({ group: target.dataset.group });
      } else if (target.dataset.sort) {
        // The sorted column turns around; another one starts in its own direction.
        const { sort, dir } = this.params();
        const by = target.dataset.sort;
        this.setParams(by === sort ? { dir: dir === "desc" ? "asc" : "desc" } : { sort: by, dir: null });
      } else if (target.dataset.stat) {
        this.setParams(JSON.parse(target.dataset.stat));
      } else if (target.dataset.tag) {
        this.setParams({ tag: target.dataset.tag, item: null });
      } else if (target.dataset.term) {
        const terms = core.parseQuery(this.snap, this.params().q);
        this.setParams({ q: core.queryWithout(terms, Number(target.dataset.term)) || null });
        this.el.search.focus();
      } else {
        this.action(target.dataset.action, target);
      }
    });

    filters.addEventListener("submit", (e) => e.preventDefault());
    filters.addEventListener("input", (e) => {
      if (e.target === search) {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.setParams({ q: search.value.trim() || null }), 120);
      }
    });
    this.el.charKeys.addEventListener("change", (e) => this.setCharKeys(e.target.checked, { save: true }));
    filters.addEventListener("change", (e) => {
      if (e.target.matches("select")) this.setParams({ [e.target.name]: e.target.value || null });
    });

    sheet.addEventListener("submit", (e) => e.preventDefault());
    sheet.addEventListener("focusout", () => setTimeout(() => this.renderSheet(this.params()), 0));
    sheet.addEventListener("change", (e) => {
      const item = this.params().item;
      if (!item) return;
      if (e.target.matches("[data-add-epic]")) {
        if (e.target.value) this.changeEpic("add", e.target.value, item);
        return;
      }
      const input = e.target.closest("[data-field]");
      if (input) this.update(item, input.dataset.field, input.value);
    });

    newForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.create(newForm);
    });
    newForm.addEventListener("change", (e) => e.target.name === "epic" && this.noteNew());

    this.bindDrag(main);

    window.addEventListener("popstate", () => this.render());
    document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && this.poll());
    window.addEventListener("focus", () => this.poll());
    window.addEventListener("open-backlog:refresh", () => this.poll());
    document.addEventListener("keydown", (e) => this.key(e));
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", () => this.applyTheme(this.theme));
  }

  bindDrag(main) {
    main.addEventListener("dragstart", (e) => {
      const card = e.target.closest?.(".bb-card");
      if (!card) return;
      this.dragging = card.dataset.item;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", card.dataset.item);
      requestAnimationFrame(() => card.classList.add("is-dragging"));
      main.classList.add("is-dragging");
    });
    main.addEventListener("dragend", (e) => {
      e.target.closest?.(".bb-card")?.classList.remove("is-dragging");
      main.classList.remove("is-dragging");
      main.querySelectorAll(".is-over").forEach((c) => c.classList.remove("is-over"));
      this.dragging = null;
    });
    main.addEventListener("dragover", (e) => {
      const column = e.target.closest?.(".bb-column[data-drop]");
      if (!column || !this.dragging) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!column.classList.contains("is-over")) {
        main.querySelectorAll(".is-over").forEach((c) => c.classList.remove("is-over"));
        column.classList.add("is-over");
      }
    });
    main.addEventListener("dragleave", (e) => {
      const column = e.target.closest?.(".bb-column");
      if (column && !column.contains(e.relatedTarget)) column.classList.remove("is-over");
    });
    main.addEventListener("drop", (e) => {
      const column = e.target.closest?.(".bb-column[data-drop]");
      if (!column || !this.dragging) return;
      e.preventDefault();
      const slug = this.dragging;
      const item = this.snap.bySlug.get(slug);
      const group = this.params().group;
      column.classList.remove("is-over");
      if (item && (item.fields[group] ?? "") !== column.dataset.drop) this.update(slug, group, column.dataset.drop);
    });
  }

  action(name, target) {
    switch (name) {
      case "new": return this.openNew();
      case "help": return this.el.helpDialog.showModal();
      case "dismiss": return target.closest("dialog").close();
      case "theme": return this.cycleTheme();
      case "clear": return this.setParams(Object.fromEntries(this.filters().map((k) => [k, null])));
      case "close": return this.close();
      case "prev": return this.step(-1);
      case "next": return this.step(1);
      case "problems": return void (this.problemsOpen = !this.problemsOpen);
      case "prompt": return this.copyPrompt(this.params().item);
      case "new-in-epic": return this.openNew({ epic: this.params().item });
      case "show-epic": return this.setParams({ epic: this.params().item, item: null });
      case "leave-epic": return this.changeEpic("remove", target.dataset.epic, this.params().item);
    }
  }

  key(e) {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const onPage = e.target === document.body || e.target === document.documentElement;
    if (!this.root.contains(e.target) && !(this.ownsPage && onPage)) return;
    const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
    const dialogOpen = this.root.querySelector("dialog[open]");
    const panel = this.el.sheet.querySelector(".bb-panel");
    if (e.key === "Tab" && panel && !dialogOpen) {
      const targets = [...panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])')].filter((el) => el.getClientRects().length);
      const first = targets[0], last = targets.at(-1);
      if (first && (e.shiftKey && (document.activeElement === first || document.activeElement === panel) || !e.shiftKey && document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (e.key === "Escape") {
      if (dialogOpen) return;
      if (typing === this.el.search) {
        this.el.search.blur();
        return;
      }
      if (this.params().item) {
        e.preventDefault();
        this.close();
      }
      return;
    }
    if (typing || dialogOpen || !this.snap || !this.charKeys) return;
    const p = this.params();
    const run = {
      "/": () => this.el.search.focus(),
      n: () => this.snap.writable && this.openNew(),
      b: () => this.setParams({ view: "board" }),
      l: () => this.setParams({ view: "list" }),
      E: () => this.openEpicFilter(),
      j: () => (p.item ? this.step(1) : this.openFirst()),
      k: () => (p.item ? this.step(-1) : this.openFirst()),
      e: () => p.item && this.root.querySelector("[data-el-open]")?.click(),
      c: () => p.item && this.copyPrompt(p.item),
      "?": () => this.el.helpDialog.showModal(),
    }[e.key];
    if (run) {
      e.preventDefault();
      run();
    }
  }

  open(slug) {
    this.setParams({ item: slug }, { push: !this.params().item });
  }

  close() {
    this.setParams({ item: null });
  }

  openFirst() {
    const first = this.visible(this.params())[0];
    if (first) this.open(first.slug);
  }

  // The next or previous item in the order the page shows them.
  step(by) {
    const p = this.params();
    const items = p.view === "board" ? this.columns(this.visible(p), p.group).flatMap((c) => c.items) : this.visible(p);
    const i = items.findIndex((item) => item.slug === p.item);
    const next = items[i + by];
    if (next) this.setParams({ item: next.slug });
  }

  // The New item dialog starts where the board is looking: the values the filters pick, and the
  // epic they show (or the one given).
  openNew({ epic = "" } = {}) {
    const s = this.snap;
    const { newFields, newError, newDialog, newForm } = this.el;
    const epics = this.epics();
    const inEpic = epic || this.params().epic || "";
    newError.hidden = true;
    newFields.innerHTML = [
      ...s.fields.map((f) => {
        const preset = this.params()[f.name] || (f.name === "status" ? s.startable[0] || f.values[0] : "");
        return `<label class="bb-field"><span>${esc(f.label)}</span><select class="bb-select" name="field-${esc(f.name)}">
          <option value="">—</option>${f.values.map((v) => `<option value="${esc(v)}" ${v === preset ? "selected" : ""}>${esc(core.label(v))}</option>`).join("")}
        </select></label>`;
      }),
      `<label class="bb-field"><span>Weight</span><input name="weight" type="number" min="1" step="1" inputmode="numeric" placeholder="—"></label>`,
      epics.length ? `<label class="bb-field"><span>Epic</span><select class="bb-select" name="epic">
          <option value="">—</option>${epics.map((e) => `<option value="${esc(e.slug)}" ${e.slug === inEpic ? "selected" : ""}>${esc(e.title)}</option>`).join("")}
        </select></label>` : "",
    ].join("");
    this.noteNew();
    newDialog.showModal();
    newForm.elements.title.focus();
  }

  noteNew() {
    const s = this.snap;
    const epic = s.bySlug.get(this.el.newForm.elements.epic?.value || "");
    this.el.newNote.textContent = `Writes ${s.dir}/<name>.md${s.indexTables.length ? ` and a row in ${s.index}` : ""}.` +
      (epic ? ` Adds it to the end of ${epic.file}'s items.` : "");
  }

  // Shift E: the Epic filter, focused with its options open (an item's sheet closes first).
  openEpicFilter() {
    const select = this.el.epicFilter;
    if (select.hidden) return;
    if (this.params().item) this.close();
    select.focus();
    try {
      select.showPicker();
    } catch {
      // Focused is enough: the arrow keys pick an epic.
    }
  }

  // ---- Theme -----------------------------------------------------------------------------------

  storedTheme() {
    return this.stored(THEME_KEY) || "auto";
  }

  stored(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  // Single-key shortcuts on or off. The choice is kept per browser, or for this page if storage
  // is blocked.
  setCharKeys(on, { save = false } = {}) {
    this.charKeys = on;
    this.el.charKeys.checked = on;
    this.root.classList.toggle("bb-no-keys", !on);
    if (save) {
      try {
        if (on) localStorage.removeItem(KEYS_KEY);
        else localStorage.setItem(KEYS_KEY, "off");
      } catch {
        // the choice lasts for this page only
      }
    }
  }

  applyTheme(theme) {
    this.theme = theme;
    if (theme === "auto") delete this.root.dataset.theme;
    else this.root.dataset.theme = theme;
    const button = this.el?.themeButton;
    if (button) {
      const names = { auto: "Theme: follows the system", light: "Theme: light", dark: "Theme: dark" };
      button.innerHTML = icon(theme === "auto" ? "auto" : theme === "dark" ? "moon" : "sun");
      button.title = names[theme];
      button.setAttribute("aria-label", names[theme]);
    }
  }

  cycleTheme() {
    const next = { auto: "light", light: "dark", dark: "auto" }[this.theme];
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // the choice lasts for this page only
    }
    this.applyTheme(next);
  }

  // ---- Rendering -------------------------------------------------------------------------------

  setLive(live) {
    if (this.live === live) return;
    this.live = live;
    this.el.live.classList.toggle("is-live", live);
    this.el.live.classList.toggle("is-down", !live);
    this.el.live.title = live ? `Live: follows changes to the files every ${POLL_MS / 1000} s` : "Can't reach the host: retrying";
  }

  renderError(e) {
    this.el.main.innerHTML = `<div class="bb-empty"><h2>The backlog didn't load</h2>
      <p>${esc(e.message)} for <code>${esc(new URL("files", this.api).pathname)}</code>. The board tries again every few seconds.</p></div>`;
  }

  // A render that throws is the board's fault, not the host's: report it where the user sees it,
  // and let the next change or navigation draw the sheet from scratch.
  render() {
    try {
      this.draw();
    } catch (e) {
      // Empty means closed; an invalid key must still let closing clear the sheet and page lock.
      this.sheetKey = "invalid";
      console.error(e);
      this.toast(`Couldn't show the backlog: ${e.message}`, "error");
    }
  }

  draw() {
    if (!this.snap) return;
    const s = this.snap;
    const p = this.params();
    if (this.el.search !== document.activeElement) this.el.search.value = p.q ?? "";
    this.el.title.textContent = s.title;
    this.el.dir.textContent = s.dir;
    this.el.newButton.hidden = !s.writable;
    if (this.ownsPage) document.title = p.item && s.bySlug.get(p.item) ? `${s.bySlug.get(p.item).title} · ${s.title}` : s.title;
    this.applyTheme(this.theme);

    const visible = this.visible(p);
    this.renderStats(p);
    this.renderProblems(p);
    this.renderToolbar(p, visible);
    if (s.items.length === 0) this.renderEmpty();
    else if (p.view === "list") this.renderList(p, visible);
    else this.renderBoard(p, visible);
    this.renderSheet(p);
  }

  renderStats(p) {
    const s = this.snap;
    const items = s.items;
    const top = core.field(s, "priority").values[0];
    const stats = [
      ["Open", items.filter((i) => i.open).length, { open: p.open ? null : "1" }, !!p.open],
      s.active.length && [core.label(s.active[0]), items.filter((i) => s.active.includes(i.fields.status)).length, { status: p.status === s.active[0] ? null : s.active[0] }, p.status === s.active[0]],
      top && [`${core.label(top)} priority`, items.filter((i) => i.open && i.fields.priority === top).length, { priority: p.priority === top ? null : top }, p.priority === top],
      ["Can start", items.filter((i) => i.startable).length, { next: p.next ? null : "1" }, !!p.next],
      s.done.length && [core.label(s.done[0]), items.filter((i) => i.done).length, { status: p.status === s.done[0] ? null : s.done[0] }, p.status === s.done[0]],
    ].filter(Boolean);
    this.el.stats.innerHTML = stats.map(([name, count, change, on]) =>
      `<button type="button" class="bb-stat ${on ? "is-on" : ""}" data-stat='${esc(JSON.stringify(change))}' aria-pressed="${on}">
        <span class="bb-stat-name">${esc(name)}</span><span class="bb-stat-count">${count}</span></button>`).join("");
  }

  // Problems first, then suggestions (problems with `notice`), which aren't things to fix.
  renderProblems() {
    const { problems, bySlug } = this.snap;
    if (!problems.length) {
      this.el.problems.innerHTML = "";
      return;
    }
    const fixes = problems.filter((x) => !x.notice);
    const notes = problems.filter((x) => x.notice);
    const what = [fixes.length && `${plural(fixes.length, "thing")} to fix`, notes.length && plural(notes.length, "suggestion")].filter(Boolean).join(" and ");
    this.el.problems.innerHTML = `
      <details class="bb-problems ${fixes.length ? "" : "is-calm"}" ${this.problemsOpen ? "open" : ""}>
        <summary data-action="problems">${icon(fixes.length ? "warning" : "info")}<span>${what} in the backlog</span>${icon("down", "bb-chevron")}</summary>
        <ul>${[...fixes, ...notes].map(({ slug, message, notice }) => `<li class="${notice ? "is-notice" : ""}">${notice ? icon("info") : ""}${
          slug && bySlug.has(slug) ? `<a href="${esc(this.href({ item: slug }))}" data-item="${esc(slug)}">${esc(slug)}</a>` : slug ? `<b>${esc(slug)}</b>` : ""
        }<span>${esc(message)}</span></li>`).join("")}</ul>
      </details>`;
  }

  renderToolbar(p, visible) {
    const s = this.snap;
    const epics = (this.epicFilterOn() ? this.epics() : []).map((e) => {
      const { done, total } = core.epicProgress(s, e.slug);
      return [e.slug, `${e.title} · ${done}/${total}`];
    });
    const key = JSON.stringify([s.fields.map((f) => [f.name, f.values]), s.tags, epics]);
    if (key !== this.fieldsKey) {
      this.fieldsKey = key;
      this.el.epicFilter.innerHTML = `<option value="">Epic</option>` +
        epics.map(([slug, name]) => `<option value="${esc(slug)}">${esc(name)}</option>`).join("");
      this.el.epicFilter.hidden = epics.length === 0;
      this.el.fieldFilters.innerHTML = s.fields.map((f) =>
        `<select name="${esc(f.name)}" class="bb-select" aria-label="${esc(f.label)}">
          <option value="">${esc(f.label)}</option>
          ${f.values.map((v) => `<option value="${esc(v)}">${esc(core.label(v))}</option>`).join("")}
          <option value="none">No ${esc(f.name)}</option>
        </select>`).join("");
      this.el.tagFilter.innerHTML = `<option value="">Tag</option>` +
        s.tags.map(({ tag, count }) => `<option value="${esc(tag)}">${esc(tag)} · ${count}</option>`).join("");
      this.el.tagFilter.hidden = s.tags.length === 0;
    }
    for (const select of this.el.filters.querySelectorAll("select")) {
      const value = p[select.name] ?? "";
      if (value && ![...select.options].some((o) => o.value === value)) select.add(new Option(core.label(value), value));
      select.value = value;
      select.classList.toggle("is-on", !!value);
    }
    for (const button of this.el.filters.querySelectorAll("[data-toggle]")) {
      const on = !!p[button.dataset.toggle];
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on);
    }
    for (const button of this.el.filters.querySelectorAll("[data-view]")) {
      const on = p.view === button.dataset.view;
      button.classList.toggle("is-on", on);
      button.setAttribute("aria-pressed", on);
    }
    const chips = core.parseQuery(s, p.q).map((t, i) => {
      if (t.kind === "text") return "";
      const what = t.kind === "tag" ? `#${t.value}` : t.kind === "epic" ? "Epics" : t.kind === "id" ? `${s.prefix}-${t.value}`
        : t.value.toLowerCase() === "none" ? `No ${t.name}` : `${core.field(s, t.name).label}: ${core.label(t.value)}`;
      return `<button type="button" class="bb-query-chip" data-term="${i}" title="Remove ${esc(t.raw)} from the search" aria-label="Remove the filter ${esc(what)}">${esc(what)}${icon("x")}</button>`;
    }).join("");
    if (this.el.queryChips.innerHTML !== chips) this.el.queryChips.innerHTML = chips;
    this.el.clear.hidden = !this.filtering(p);
    this.el.count.textContent = this.filtering(p) ? `${visible.length} of ${s.items.length}` : plural(s.items.length, "item");
    this.el.group.innerHTML = p.view === "board" && s.fields.length > 1
      ? `<span class="bb-group-label">Group</span>` + s.fields.map((f) =>
        `<button type="button" data-group="${esc(f.name)}" class="${p.group === f.name ? "is-on" : ""}" aria-pressed="${p.group === f.name}">${esc(f.label)}</button>`).join("")
      : "";
  }

  columns(items, group) {
    return core.viewColumns(this.snap, items, group);
  }

  renderBoard(p, visible) {
    if (!p.group) {
      this.el.main.innerHTML = `<div class="bb-cards-flat">${visible.map((item) => this.card(item, p)).join("")}</div>`;
      return;
    }
    const canDrop = this.snap.writable;
    const columns = this.columns(visible, p.group);
    this.el.main.innerHTML = `<div class="bb-board">${columns.map((c) => `
      <section class="bb-column" ${canDrop && c.drop ? `data-drop="${esc(c.value)}"` : ""} aria-label="${esc(c.title)}">
        <h2 class="bb-column-head">
          ${c.value && c.value !== "other" ? `<span class="bb-dot tone-${this.tone(p.group, c.value)}"></span>` : ""}
          <span>${esc(c.title)}</span><span class="bb-column-count">${c.items.length}</span>
        </h2>
        <div class="bb-column-cards">
          ${c.items.map((item) => this.card(item, p)).join("") || `<p class="bb-column-empty">${this.filtering(p) ? "Nothing matches" : "Nothing here"}</p>`}
        </div>
      </section>`).join("")}</div>`;
  }

  // An item's ID as it's written (W-12), or nothing for an item without one.
  code(item, after = "") {
    const code = core.itemCode(this.snap, item);
    return code ? `<span class="bb-code">${esc(code)}</span>${after}` : "";
  }

  card(item, p) {
    const s = this.snap;
    const others = s.fields.filter((f) => f.name !== p.group && f.name !== "priority" && item.fields[f.name]);
    const signals = [
      item.branches.length && `<span title="${esc(item.branches.join(", "))}">${icon("branch")}</span>`,
      item.blockers.length && `<span title="Waits on ${plural(item.blockers.length, "open item")}">${icon("lock")}${item.blockers.length}</span>`,
      item.dependents.length && `<span title="${plural(item.dependents.length, "item")} wait on it">${icon("unblocks")}${item.dependents.length}</span>`,
      item.startable && s.active.length && `<span class="bb-can-start" title="Can start now">${icon("play")}</span>`,
    ].filter(Boolean).join("");
    const epic = core.isEpic(item);
    return `
      <a class="bb-card ${epic ? "is-epic" : ""} ${p.item === item.slug ? "is-selected" : ""} ${item.open ? "" : "is-closed"}" id="bb-card-${esc(item.slug)}"
         href="${esc(this.href({ item: item.slug }))}" data-item="${esc(item.slug)}" ${s.writable ? 'draggable="true"' : ""}>
        <span class="bb-card-top">${this.code(item, " ")}${epic ? epicBadge() : ""}<span class="bb-card-title">${esc(item.title)}</span>${this.priority(item.fields.priority)}</span>
        ${item.summary ? `<span class="bb-card-summary">${esc(item.summary)}</span>` : ""}
        ${epic ? this.progress(item) : ""}
        <span class="bb-card-meta">
          ${item.weight ? `<span class="bb-weight" title="Weight: lower comes first">${esc(item.weight)}</span>` : ""}
          ${others.map((f) => this.chip(f.name, item.fields[f.name])).join("")}
          ${signals ? `<span class="bb-signals">${signals}</span>` : ""}
        </span>
      </a>`;
  }

  // An epic's progress: a bar with a segment for each item in it, coloured by the item's status
  // (done first, then set aside, under way, ready, waiting and the rest), and how many are done.
  progress(epic, { large = false } = {}) {
    const s = this.snap;
    const { order } = core.epicOrder(s, epic.slug);
    const at = (item) => STAGES.indexOf(core.stage(s, item));
    const items = [...order].sort((a, b) => at(a) - at(b) || core.rank(s, "status", a.fields.status) - core.rank(s, "status", b.fields.status));
    const done = order.filter((item) => item.done).length;
    return `
      <span class="bb-progress ${large ? "is-large" : ""}">
        ${large ? "" : icon("epic")}
        <span class="bb-progress-bar ${order.length > 24 ? "is-dense" : ""}" aria-hidden="true">${items.map((item) =>
          `<span class="tone-${this.tone("status", item.fields.status)}"></span>`).join("")}</span>
        <span class="bb-progress-count" aria-hidden="true">${done}/${order.length}</span>
        <span class="bb-sr">${done} of ${plural(order.length, "item")} done</span>
      </span>`;
  }

  // The list's Epic column: an epic's own progress, or the epics an item is in.
  epicCell(item) {
    if (core.isEpic(item)) return this.progress(item);
    const epics = core.epicsOf(this.snap, item.slug);
    return epics.map((e) => `<a href="${esc(this.href({ item: e.slug }))}" data-item="${esc(e.slug)}" class="bb-epic-link" title="${esc(e.title)}">${esc(e.title)}</a>`).join("") ||
      '<span class="bb-faint">—</span>';
  }

  renderList(p, visible) {
    const s = this.snap;
    const epics = s.items.some(core.isEpic);
    const ids = s.items.some(core.idNumber);
    const cols = [...(ids ? [["ID", "id"]] : []), ["Item", "title"], ["Weight", "weight"], ...s.fields.map((f) => [f.label, f.name]), ...(epics ? [["Epic", null]] : []), ["Waits on", null], ["Created", "created"]];
    this.el.main.innerHTML = `
      <div class="bb-table-wrap">
        <table class="bb-table">
          <thead><tr>${cols.map(([name, sort]) => sort
            ? (p.sort === sort
              ? `<th aria-sort="${p.dir === "desc" ? "descending" : "ascending"}"><button type="button" data-sort="${esc(sort)}" class="is-on">${esc(name)}${icon(p.dir === "desc" ? "down" : "up")}</button></th>`
              : `<th><button type="button" data-sort="${esc(sort)}">${esc(name)}${icon("sort", "bb-sort-idle")}</button></th>`)
            : `<th>${esc(name)}</th>`).join("")}</tr></thead>
          <tbody>${visible.map((item) => `
            <tr class="${p.item === item.slug ? "is-selected" : ""} ${item.open ? "" : "is-closed"}" data-row="${esc(item.slug)}">
              ${ids ? `<td class="bb-num bb-nowrap">${this.code(item) || '<span class="bb-faint">—</span>'}</td>` : ""}
              <td class="bb-td-item"><a href="${esc(this.href({ item: item.slug }))}" data-item="${esc(item.slug)}">${core.isEpic(item) ? epicBadge() : ""}${esc(item.title)}</a><span>${esc(item.summary)}</span></td>
              <td class="bb-num">${esc(item.weight || "—")}</td>
              ${s.fields.map((f) => `<td>${f.name === "priority" ? this.priority(item.fields.priority, { text: true }) : item.fields[f.name] ? this.chip(f.name, item.fields[f.name]) : '<span class="bb-faint">—</span>'}</td>`).join("")}
              ${epics ? `<td class="bb-td-epic">${this.epicCell(item)}</td>` : ""}
              <td class="bb-num">${item.blockers.length || '<span class="bb-faint">—</span>'}</td>
              <td class="bb-num bb-nowrap">${esc(item.created || "—")}</td>
            </tr>`).join("")}</tbody>
        </table>
        ${visible.length ? "" : `<p class="bb-column-empty">Nothing matches</p>`}
      </div>`;
  }

  renderEmpty() {
    const s = this.snap;
    this.el.main.innerHTML = `
      <div class="bb-empty">
        <h2>No items yet</h2>
        <p>Each work item is a Markdown file in <code>${esc(s.dir)}</code>, starting with front matter:</p>
        <pre><code>---
title: Write the first item
status: idea
priority: high
weight: 1
tags: [example]
depends_on: []
---

## Why
…</code></pre>
        ${s.writable ? `<button type="button" class="bb-btn bb-btn-primary" data-action="new">${icon("plus")}<span>New item</span></button>` : ""}
      </div>`;
  }

  renderSheet(p) {
    const s = this.snap;
    const item = p.item && s.bySlug.get(p.item);
    const key = item ? `${item.slug}:${this.version}` : "";
    if (key === this.sheetKey) return;
    const wasOpen = !!this.sheetKey;
    const sameItem = item && this.sheetKey.startsWith(`${item.slug}:`);
    const focused = this.el.sheet.contains(document.activeElement) ? document.activeElement : null;
    const focusAttribute = focused && ["data-field", "data-action", "data-el-open", "data-item", "data-tag", "data-add-epic"].find((name) => focused.hasAttribute(name));
    const focusSelector = focusAttribute ? `[${focusAttribute}="${CSS.escape(focused.getAttribute(focusAttribute))}"]` : "";
    // An external edit must not replace a focused control or its uncommitted value. On blur,
    // the deferred refresh runs; the change handler saves against freshly read source.
    if (sameItem && this.el.sheet.contains(document.activeElement) && document.activeElement.closest("[data-field], [data-add-epic]")) return;
    const scroll = sameItem ? this.el.sheet.querySelector(".bb-panel")?.scrollTop : 0;
    this.sheetKey = key;

    if (!item) {
      this.el.sheet.innerHTML = "";
      document.documentElement.classList.remove("bb-locked");
      for (const el of this.root.querySelectorAll('.bb-header, .bb-toolbar, .bb-main')) el.inert = false;
      if (wasOpen && this.lastItem) this.root.querySelector(`#bb-card-${CSS.escape(this.lastItem)}, [data-row="${CSS.escape(this.lastItem)}"] a`)?.focus();
      return;
    }
    this.lastItem = item.slug;
    document.documentElement.classList.add("bb-locked");
    for (const el of this.root.querySelectorAll('.bb-header, .bb-toolbar, .bb-main')) el.inert = true;

    const file = s.path ? core.resolvePath(s.path, item.file) : "";
    const editor = core.editorURL(s.editor, file);
    const epic = core.isEpic(item);
    const found = s.problems.filter((x) => x.slug === item.slug);
    const notes = (list, kind) => list.length
      ? `<ul class="bb-item-problems ${kind === "info" ? "is-notice" : ""}">${list.map((x) => `<li>${icon(kind)}<span>${esc(x.message)}</span></li>`).join("")}</ul>` : "";
    const relation = (title, slugs) => `
      <div class="bb-relation"><h3>${title}</h3>${slugs.length ? `<ul>${slugs.map((slug) => {
        const other = s.bySlug.get(slug);
        return other
          ? `<li><a href="${esc(this.href({ item: slug }))}" data-item="${esc(slug)}" class="${other.done ? "is-done" : ""}"><span class="bb-dot tone-${this.tone("status", other.fields.status)}" title="${esc(core.label(other.fields.status))}"></span>${esc(other.title)}</a></li>`
          : `<li class="bb-missing">${esc(slug)} <span>(missing)</span></li>`;
      }).join("")}</ul>` : `<p class="bb-faint">None</p>`}</div>`;

    const fields = s.writable ? `
      <form class="bb-item-fields">
        <label class="bb-field"><span>Weight</span><input data-field="weight" type="number" min="1" step="1" inputmode="numeric" value="${esc(item.weight)}" placeholder="—"></label>
        ${s.fields.map((f) => {
          const value = item.fields[f.name] ?? "";
          const values = value && !f.values.includes(value) ? [...f.values, value] : f.values;
          return `<label class="bb-field"><span>${esc(f.label)}</span><select class="bb-select" data-field="${esc(f.name)}">
            ${value ? "" : `<option value="" selected>—</option>`}
            ${values.map((v) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(core.label(v))}</option>`).join("")}
          </select></label>`;
        }).join("")}
      </form>` : `
      <div class="bb-item-chips">
        ${item.weight ? `<span class="bb-weight">Weight ${esc(item.weight)}</span>` : ""}
        ${s.fields.map((f) => (item.fields[f.name] ? this.chip(f.name, item.fields[f.name]) : "")).join("")}
      </div>`;

    const status = item.blockers.length
      ? `<p class="bb-notice">${icon("lock")}<span>Waits on ${plural(item.blockers.length, "open item")} under <b>Depends on</b>.</span></p>`
      : item.startable && s.active.length && !epic
        ? `<p class="bb-notice is-good">${icon("play")}<span>Nothing open stands in front of it: it can start now.</span></p>`
        : "";

    // The epics it's in, each opening the epic, with a way out of each and into another. An epic
    // can't go in an epic, so an epic only gets the row when one lists it by mistake.
    const epics = core.epicsOf(s, item.slug);
    const others = s.writable && !epic ? this.epics().filter((e) => e !== item && !e.items.includes(item.slug)) : [];
    const memberships = epics.length || others.length ? `
      <div class="bb-epics">
        <span class="bb-epics-label">${icon("epic")}<span>Epics</span></span>
        ${epics.map((e) => {
          const { done, total } = core.epicProgress(s, e.slug);
          return `<span class="bb-epic-chip">
            <a href="${esc(this.href({ item: e.slug }))}" data-item="${esc(e.slug)}" title="Open the epic">${esc(e.title)}<span class="bb-epic-chip-count">${done}/${total}</span></a>
            ${s.writable ? `<button type="button" data-action="leave-epic" data-epic="${esc(e.slug)}" title="Take it out of this epic" aria-label="Take it out of ${esc(e.title)}">${icon("x")}</button>` : ""}
          </span>`;
        }).join("")}
        ${others.length ? `<select class="bb-select bb-epic-add" data-add-epic aria-label="Add it to an epic">
          <option value="">Add to epic…</option>${others.map((e) => `<option value="${esc(e.slug)}">${esc(e.title)}</option>`).join("")}
        </select>` : ""}
      </div>` : "";

    this.el.sheet.innerHTML = `
      <div class="bb-sheet">
        <div class="bb-scrim" data-action="close"></div>
        <aside class="bb-panel ${epic ? "is-epic" : ""}" role="dialog" aria-modal="true" aria-labelledby="${epic ? "bb-item-kind " : ""}bb-item-title" tabindex="-1">
          <div class="bb-panel-bar">
            ${editor
              ? `<a class="bb-path" href="${esc(editor)}" data-el-open title="Open in your editor (e)">${icon("edit")}<span>${esc(s.dir)}/${esc(item.file)}</span></a>`
              : `<span class="bb-path">${esc(s.dir)}/${esc(item.file)}</span>`}
            <span class="bb-spacer"></span>
            <button type="button" class="bb-btn bb-prompt-btn" data-action="prompt" title="${epic ? "Copy the epic and its items, in work order, as a prompt for an agent (c)" : "Copy as a prompt for an agent (c)"}" aria-label="${epic ? "Copy epic as prompt" : "Copy as prompt"}">${icon("copy")}<span>${epic ? "Copy epic as prompt" : "Copy as prompt"}</span></button>
            <button type="button" class="bb-icon-btn" data-action="prev" title="Previous (k)" aria-label="Previous item">${icon("up")}</button>
            <button type="button" class="bb-icon-btn" data-action="next" title="Next (j)" aria-label="Next item">${icon("down")}</button>
            <button type="button" class="bb-icon-btn" data-action="close" title="Close (Esc)" aria-label="Close">${icon("x")}</button>
          </div>
          <div class="bb-panel-body">
            ${epic ? `<p class="bb-item-kind">${epicBadge("bb-item-kind")}</p>` : ""}
            <h2 id="bb-item-title" class="bb-item-title">${this.code(item, " ")}${esc(item.title)}</h2>
            ${fields}
            ${notes(found.filter((x) => !x.notice), "warning")}
            ${notes(found.filter((x) => x.notice), "info")}
            <div class="bb-tags">
              ${item.tags.map((t) => `<button type="button" data-tag="${esc(t)}" title="Show items tagged ${esc(t)}">#${esc(t)}</button>`).join("")}
              ${item.branches.map((b) => `<span class="bb-branch">${icon("branch")}${esc(b)}</span>`).join("")}
              ${item.created ? `<span class="bb-faint">Created ${esc(item.created)}</span>` : ""}
            </div>
            ${memberships}
            ${status}
            ${epic ? this.epicSection(item) : ""}
            <div class="bb-relations">
              ${relation("Depends on", item.dependsOn)}${relation("Unblocks", item.dependents)}${relation("Related", item.related)}
            </div>
            <article class="bb-prose">${item.html}</article>
          </div>
        </aside>
      </div>`;

    this.linkBody(this.el.sheet.querySelector(".bb-prose"), s);
    const panel = this.el.sheet.querySelector(".bb-panel");
    if (sameItem) {
      panel.scrollTop = scroll;
      if (focused) (this.el.sheet.querySelector(focusSelector || ".bb-panel") || panel).focus({ preventScroll: true });
    } else if (!this.el.sheet.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }

  // An epic's part of its sheet: its progress, what's next, its items in work order with what each
  // waits on, what holds it up from outside, and a new item in it.
  epicSection(epic) {
    const s = this.snap;
    const { order, outside, missing } = core.epicOrder(s, epic.slug);
    const progress = core.epicProgress(s, epic.slug);
    const link = (item, text = item.title) => `<a href="${esc(this.href({ item: item.slug }))}" data-item="${esc(item.slug)}">${esc(text)}</a>`;
    const numbered = (item) => link(item, `${order.indexOf(item) + 1}. ${item.title}`);
    const summary = [
      `<b>${progress.done} of ${plural(progress.total, "item")} done</b>`,
      progress.active && `${progress.active} ${esc(core.label(s.active[0]).toLowerCase())}`,
      progress.ready && `${progress.ready} can start`,
      progress.blocked && `${progress.blocked} waiting`,
      progress.setAside && `${progress.setAside} set aside`,
      progress.other && `${progress.other} in another status`,
    ].filter(Boolean).join(" · ");
    const next = progress.next
      ? `<p class="bb-notice is-good">${icon("play")}<span>Next up: ${numbered(progress.next)}</span></p>`
      : !progress.total ? ""
        : progress.done + progress.setAside === progress.total
          ? `<p class="bb-notice is-good">${icon("check")}<span>Every item is done${progress.setAside ? " or closed" : ""}.</span></p>`
          : `<p class="bb-notice">${icon("lock")}<span>Nothing can start now: the open items are under way or wait on unfinished work.</span></p>`;

    const steps = order.map((item, i) => {
      const at = core.stage(s, item);
      const waits = item.open ? item.blockers.map((slug) => s.bySlug.get(slug)) : [];
      const meta = [
        item.fields.status && this.chip("status", item.fields.status),
        waits.length && `<span class="bb-step-waits">${icon("lock")}<span>Waits on ${waits.map((w) =>
          order.includes(w) ? numbered(w) : `${link(w)} <span class="bb-outside">outside</span>`).join(", ")}</span></span>`,
      ].filter(Boolean).join("");
      return `
        <li class="bb-step is-${at === "setAside" ? "set-aside" : at} ${item === progress.next ? "is-next" : ""}">
          <span class="bb-step-n tone-${this.tone("status", item.fields.status)}">${i + 1}</span>
          <span class="bb-step-body">${link(item)}${meta ? `<span class="bb-step-meta">${meta}</span>` : ""}</span>
        </li>`;
    }).join("") + missing.map((slug) => `
        <li class="bb-step is-missing">
          <span class="bb-step-n">?</span>
          <span class="bb-step-body"><span class="bb-missing">${esc(slug)} <span>(no such item)</span></span></span>
        </li>`).join("");

    const held = outside.length ? `
      <div class="bb-epic-outside">
        <h4>Waiting on, outside the epic</h4>
        <ul>${outside.map(({ item, waiting }) => `
          <li><span class="bb-dot tone-${this.tone("status", item.fields.status)}" title="${esc(core.label(item.fields.status))}"></span>
            <span>${link(item)} <span class="bb-faint">holds up ${waiting.map((w) => `${order.indexOf(w) + 1}. ${esc(w.title)}`).join(", ")}</span></span></li>`).join("")}
        </ul>
      </div>` : "";

    return `
      <section class="bb-epic" aria-labelledby="bb-epic-head">
        <div class="bb-epic-head">
          <h3 id="bb-epic-head">${icon("epic")}<span>Epic</span></h3>
          ${this.epicFilterOn() ? `<button type="button" class="bb-link-btn" data-action="show-epic" title="Show only this epic's items on the board">Show on the board</button>` : ""}
        </div>
        ${this.progress(epic, { large: true })}
        <p class="bb-epic-summary">${summary}</p>
        ${next}
        <ol class="bb-steps" aria-label="Its items in work order">${steps}</ol>
        ${held}
        ${s.writable ? `<button type="button" class="bb-btn bb-epic-new" data-action="new-in-epic">${icon("plus")}<span>New item in this epic</span></button>` : ""}
      </section>`;
  }

  // Links in an item: to another item, they open it here; to another file, in the editor; to the
  // web, in a new tab.
  linkBody(prose, s) {
    for (const a of prose.querySelectorAll("a[href]")) {
      const href = a.getAttribute("href");
      if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        continue;
      }
      if (href.startsWith("#")) continue;
      let path;
      try {
        path = decodeURI(href.replace(/[?#].*$/, ""));
      } catch {
        // Badly percent-encoded: it can't name a file, so it shows like a link to an unknown one.
        a.removeAttribute("href");
        a.title = href;
        continue;
      }
      const slug = path.replace(/^\.\//, "").replace(/\.md$/, "");
      if (path.endsWith(".md") && !slug.includes("/") && s.bySlug.has(slug)) {
        a.href = this.href({ item: slug });
        a.dataset.item = slug;
        continue;
      }
      const editor = s.path ? core.editorURL(s.editor, core.resolvePath(s.path, path)) : "";
      if (editor) {
        a.href = editor;
        a.title = "Open in your editor";
      } else {
        a.removeAttribute("href");
        a.title = path;
      }
    }
  }

  // Copies the item as a prompt for an agent, or an epic with its items in work order. The
  // clipboard API needs a secure context (https or localhost); elsewhere, fall back to copying from
  // a hidden text area.
  async copyPrompt(slug) {
    const item = this.snap?.bySlug.get(slug);
    if (!item) return;
    const epic = core.isEpic(item);
    const text = epic ? core.epicPrompt(this.snap, slug) : core.itemPrompt(this.snap, slug);
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const back = document.activeElement;
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.className = "bb-copy-area";
      this.root.append(area);
      area.select();
      try {
        copied = document.execCommand("copy");
      } catch {}
      area.remove();
      back?.focus({ preventScroll: true });
    }
    if (copied) this.toast(epic ? "Copied the epic as a prompt" : "Copied as a prompt", "ok", item.file);
    else this.toast("The browser didn't allow copying", "error");
  }

  toast(message, kind = "ok", detail = "") {
    const el = document.createElement("div");
    el.className = `bb-toast is-${kind}`;
    el.setAttribute("role", kind === "error" ? "alert" : "status");
    el.innerHTML = `${icon(kind === "error" ? "warning" : "check")}<span>${detail ? `<b>${esc(detail)}</b> ` : ""}${esc(message)}</span>`;
    this.el.toasts.append(el);
    setTimeout(() => {
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 250);
    }, kind === "error" ? 6000 : 3000);
  }
}

// Mounts a board on el. Hosts that build their own page can call it; the page shell doesn't need to.
export function mount(el) {
  const board = new Board(el);
  board.start();
  return board;
}

for (const el of document.querySelectorAll("[data-open-backlog]")) mount(el);
