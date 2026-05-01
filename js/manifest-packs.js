import { createCheckboxTileLabel } from "./checkbox-tile.js";
import { els } from "./dom.js";
import { state } from "./state.js";
import { loadSelectedPacks } from "./storage.js";
import { formatWordCountRu } from "./text-utils.js";
import { countValidWordsInData, isWordEntryComplete } from "./word-validation.js";

export function normalizeManifest(raw) {
  if (raw.packs && Array.isArray(raw.packs) && raw.packs.length) {
    return raw;
  }
  if (raw.files && Array.isArray(raw.files) && raw.files.length) {
    return {
      ...raw,
      packs: [{ id: "default", title_ru: "Основной набор", files: [...raw.files] }],
    };
  }
  throw new Error("В manifest.json нужны поля packs или files");
}

export function safePackInputId(packId) {
  return `pack-${String(packId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

export function renderPackList(packs) {
  const saved = loadSelectedPacks();
  const defaultAll = !saved || !saved.length;

  els.packList.innerHTML = "";
  for (const p of packs) {
    if (!p || typeof p.id !== "string" || !p.id || !Array.isArray(p.files)) continue;

    const inputId = safePackInputId(p.id);
    const title =
      typeof p.title_ru === "string" && p.title_ru.trim() ? p.title_ru.trim() : p.id;

    const wrap = createCheckboxTileLabel({
      id: inputId,
      value: p.id,
      checked: defaultAll ? true : saved.includes(p.id),
      titleText: title,
      metaClass: "pack-word-count",
      metaChildren: [document.createTextNode("…")],
    });
    els.packList.appendChild(wrap);
  }
}

export function getCheckedPackIds() {
  return Array.from(els.packList.querySelectorAll('input[type="checkbox"]:checked')).map(
    (input) => input.value,
  );
}

export function resolveFilesFromPackIds(packIds) {
  if (!state.manifestCache?.packs) return [];
  const out = [];
  const seen = new Set();
  for (const id of packIds) {
    const pack = state.manifestCache.packs.find((p) => p.id === id);
    if (!pack?.files) continue;
    for (const file of pack.files) {
      if (typeof file !== "string" || !file || seen.has(file)) continue;
      seen.add(file);
      out.push(file);
    }
  }
  return out;
}

async function fetchFileWordCount(base, file) {
  const url = `${base}${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${file}: ${res.status}`);
  const data = await res.json();
  return countValidWordsInData(data);
}

export async function fillPackWordCountsInUi() {
  if (!state.manifestCache?.packs?.length) return;

  const base = "words/";
  const uniqueFiles = new Set();
  for (const p of state.manifestCache.packs) {
    if (!p.files) continue;
    for (const f of p.files) {
      if (typeof f === "string" && f) uniqueFiles.add(f);
    }
  }

  const fileCounts = new Map();
  try {
    await Promise.all(
      [...uniqueFiles].map(async (file) => {
        try {
          fileCounts.set(file, await fetchFileWordCount(base, file));
        } catch {
          fileCounts.set(file, null);
        }
      }),
    );
  } catch {
    /* отдельные файлы уже помечены null */
  }

  for (const p of state.manifestCache.packs) {
    const input = [...els.packList.querySelectorAll('input[type="checkbox"]')].find((i) => i.value === p.id);
    const countEl = input?.closest(".pack-card")?.querySelector(".pack-word-count");
    if (!countEl || !p.files?.length) continue;

    let sum = 0;
    let ok = true;
    for (const f of p.files) {
      const c = fileCounts.get(f);
      if (c == null) {
        ok = false;
        break;
      }
      sum += c;
    }
    countEl.textContent = ok ? formatWordCountRu(sum) : "не удалось посчитать";
  }
}

export async function loadWordsFromFiles(files) {
  if (!Array.isArray(files) || !files.length) throw new Error("Нет файлов для загрузки");

  const base = "words/";
  const all = [];
  for (const file of files) {
    const url = `${base}${file}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${file}: ${res.status}`);
    const data = await res.json();
    const words = data.words;
    if (!Array.isArray(words)) throw new Error(`${file}: нет массива words`);
    for (const w of words) {
      if (isWordEntryComplete(w)) all.push(w);
    }
  }

  state.wordBank = all;
}

export async function loadManifestAndRenderPacks() {
  const base = "words/";
  const manifestRes = await fetch(`${base}manifest.json`, { cache: "no-store" });
  if (!manifestRes.ok) throw new Error(`manifest.json: ${manifestRes.status}`);
  const raw = await manifestRes.json();
  state.manifestCache = normalizeManifest(raw);
  renderPackList(state.manifestCache.packs);
  if (!els.packList.querySelector("input")) {
    throw new Error("В manifest нет ни одного корректного пака");
  }
  await fillPackWordCountsInUi();
}
