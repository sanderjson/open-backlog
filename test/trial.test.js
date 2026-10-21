import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBacklog } from "../web/core.js";
import { NOTES_FILE, appendTrialNote } from "../web/trial.js";
import { example } from "./server.mjs";

test("trial notes append without entering the work items or changing their index", () => {
  const files = example();
  files[NOTES_FILE] = "# Existing observations\n\nKeep this hand edit.\n";
  const snapshot = parseBacklog({ files });
  const writes = appendTrialNote(snapshot, { note: "The waiting label helped.", topic: "Grayscale", view: "?group=status", item: "b" }, new Date("2026-10-21T09:00:00Z"));
  assert.deepEqual(Object.keys(writes), [NOTES_FILE]);
  assert.match(writes[NOTES_FILE], /^# Existing observations\n\nKeep this hand edit\./);
  assert.match(writes[NOTES_FILE], /2026-10-21T09:00:00.000Z — Grayscale/);
  assert.match(writes[NOTES_FILE], /Appearance: grayscale/);
  assert.match(writes[NOTES_FILE], /Item: b/);
  const updated = parseBacklog({ files: { ...files, ...writes } });
  assert.deepEqual(updated.items.map(item => item.slug), snapshot.items.map(item => item.slug));
  assert.equal(updated.files["README.md"], files["README.md"]);
  assert.deepEqual(updated.problems, snapshot.problems);
});

test("trial notes validate before planning a write and preserve Markdown as text", () => {
  const snapshot = { files: {} };
  assert.throws(() => appendTrialNote(snapshot, { note: "  " }), /Write a note/);
  assert.throws(() => appendTrialNote(snapshot, { note: "a".repeat(10001) }), /10,000/);
  assert.throws(() => appendTrialNote(snapshot, { note: "x", topic: "invented" }), /listed topics/);
  const note = "<img src=x onerror=alert(1)>\n\n**Observation**";
  const result = appendTrialNote(snapshot, { note, grayscale: false, theme: "dark\nInjected heading" });
  assert.ok(result[NOTES_FILE].endsWith(note + "\n"));
  assert.match(result[NOTES_FILE], /Appearance: colour; theme: dark Injected heading\n/);
  assert.deepEqual(snapshot.files, {});
});
