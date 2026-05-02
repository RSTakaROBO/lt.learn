import { loadCustomPackRecords } from "./storage.js";
import { isWordEntryComplete } from "./word-validation.js";

/** Название набора из корня JSON/записи: `title`; устаревшее поле `title_ru` учитывается при чтении. */
export function packDisplayTitle(root, fallbackId) {
  if (!root || typeof root !== "object") {
    return typeof fallbackId === "string" && fallbackId.trim() ? fallbackId.trim() : "";
  }
  const t = root.title ?? root.title_ru;
  if (typeof t === "string" && t.trim()) return t.trim();
  return typeof fallbackId === "string" && fallbackId.trim() ? fallbackId.trim() : "";
}

function newCustomPackId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Из localStorage → объекты паков для manifestCache (поля как у встроенных + custom). */
export function hydrateCustomPacksFromStorage() {
  const rows = loadCustomPackRecords();
  const out = [];
  for (const row of rows) {
    if (!row || typeof row.id !== "string" || !row.id.startsWith("custom-")) continue;
    const words = Array.isArray(row.words) ? row.words.filter(isWordEntryComplete) : [];
    if (!words.length) continue;
    const title = packDisplayTitle(row, row.id);
    out.push({
      id: row.id,
      title,
      words,
      custom: true,
      files: [],
    });
  }
  return out;
}

/**
 * Разбор загруженного файла словаря (тот же формат, что у words/*.json).
 * @param {string} text
 * @param {string} [fileName]
 */
export function parseCustomPackJsonFile(text, fileName = "") {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Файл не является корректным JSON.");
  }
  if (!data || typeof data !== "object") throw new Error("Корень JSON должен быть объектом.");
  const wordsIn = data.words;
  if (!Array.isArray(wordsIn)) {
    throw new Error("Нужно поле «words» — массив статей с формами слова.");
  }
  const words = wordsIn.filter(isWordEntryComplete);
  if (!words.length) {
    throw new Error(
      "Нет ни одной полной статьи: нужны строковые nominative и все семь падежей.",
    );
  }
  let title = packDisplayTitle(data, "");
  if (!title && fileName) {
    const base = fileName.replace(/^.*[/\\]/, "").replace(/\.json$/i, "").trim();
    if (base) title = base;
  }
  if (!title) title = "Свой набор";
  return {
    id: newCustomPackId(),
    title,
    words,
  };
}
