// Trial notes share the backlog's existing file routes. The leading underscore keeps the log
// out of work items and indexes; appending always plans from the freshly read file.
import { VERSION } from "./core.js";

export const NOTES_FILE = "_trial-notes.md";
export const NOTE_TOPICS = ["Grayscale", "Roadmap", "Header", "Item details", "Other"];

export function appendTrialNote(snapshot, { note = "", topic = "Other", grayscale = true, theme = "auto", view = "", item = "" } = {}, at = new Date()) {
  const body = String(note).trim();
  if (!body) throw new Error("Write a note before saving.");
  if (body.length > 10000) throw new Error("Keep each note to 10,000 characters or fewer.");
  if (!NOTE_TOPICS.includes(topic)) throw new Error("Choose one of the listed topics.");
  const line = (value) => String(value).replace(/[\r\n]+/g, " ").trim();
  const previous = snapshot.files[NOTES_FILE] ?? "# open-backlog trial notes\n";
  const entry = [
    `## ${at.toISOString()} — ${topic}`,
    "",
    `- Version: v${VERSION}`,
    `- Appearance: ${grayscale ? "grayscale" : "colour"}; theme: ${line(theme)}`,
    ...(view ? [`- View: ${line(view)}`] : []),
    ...(item ? [`- Item: ${line(item)}`] : []),
    "",
    body,
    "",
  ].join("\n");
  return { [NOTES_FILE]: `${previous.trimEnd()}\n\n${entry}` };
}
