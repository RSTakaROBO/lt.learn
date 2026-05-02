import { createCheckboxTileLabel } from "./checkbox-tile.js";
import { hydrateCustomPacksFromStorage, packDisplayTitle } from "./custom-packs.js";
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
      packs: [{ id: "default", files: [...raw.files] }],
    };
  }
  throw new Error("В manifest.json нужны поля packs или files");
}

/** Загружает каждый JSON словарь один раз (пути из всех паков). */
async function prefetchPackWordFiles(base, packs) {
  const uniqueFiles = new Set();
  for (const p of packs) {
    if (!p?.files) continue;
    for (const f of p.files) {
      if (typeof f === "string" && f) uniqueFiles.add(f);
    }
  }
  const map = new Map();
  await Promise.all(
    [...uniqueFiles].map(async (file) => {
      try {
        const res = await fetch(`${base}${file}`);
        if (!res.ok) throw new Error(`${file}: ${res.status}`);
        map.set(file, await res.json());
      } catch {
        map.set(file, null);
      }
    }),
  );
  return map;
}

/** Заголовок встроенного пака из `title` первого файла словаря; у пользовательских — уже в записи (или legacy title_ru). */
function attachPackTitlesFromFiles(packs, fileMap) {
  for (const p of packs) {
    if (p?.custom && Array.isArray(p.words)) {
      p.title = packDisplayTitle(p, p.id);
      continue;
    }
    if (!p?.files?.length) continue;
    const first = p.files[0];
    const data = fileMap.get(first);
    p.title = packDisplayTitle(data, p.id);
  }
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
    const title = packDisplayTitle(p, p.id);

    const wrap = createCheckboxTileLabel({
      id: inputId,
      value: p.id,
      checked: defaultAll ? true : saved.includes(p.id),
      titleText: title,
      metaClass: "pack-word-count",
      metaChildren: [document.createTextNode("…")],
    });

    if (p.custom) {
      wrap.classList.add("pack-card--custom-user");
      const face = wrap.querySelector(".pack-card-face");
      const tick = wrap.querySelector(".pack-card-tick");
      const del = document.createElement("button");
      del.type = "button";
      del.className = "pack-card-delete-btn";
      del.setAttribute("aria-label", `Удалить пользовательский набор «${title}»`);
      del.dataset.deletePackId = p.id;
      del.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      if (face && tick) {
        const slot = document.createElement("div");
        slot.className = "pack-card-delete-slot";
        slot.appendChild(del);
        face.insertBefore(slot, tick);
      }
      els.packList.appendChild(wrap);
    } else {
      els.packList.appendChild(wrap);
    }
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
    if (!pack) continue;
    if (pack.custom && Array.isArray(pack.words)) {
      const token = `custom:${pack.id}`;
      if (!seen.has(token)) {
        seen.add(token);
        out.push(token);
      }
      continue;
    }
    if (!pack.files?.length) continue;
    for (const file of pack.files) {
      if (typeof file !== "string" || !file || seen.has(file)) continue;
      seen.add(file);
      out.push(file);
    }
  }
  return out;
}

function fillPackWordCountsFromFileMap(packs, fileMap) {
  if (!packs?.length) return;

  for (const p of packs) {
    const input = [...els.packList.querySelectorAll('input[type="checkbox"]')].find((i) => i.value === p.id);
    const countEl = input?.closest(".pack-card")?.querySelector(".pack-word-count");
    if (!countEl) continue;

    if (p.custom && Array.isArray(p.words)) {
      countEl.textContent = formatWordCountRu(countValidWordsInData({ words: p.words }));
      continue;
    }

    if (!p.files?.length) continue;

    let sum = 0;
    let ok = true;
    for (const f of p.files) {
      const data = fileMap.get(f);
      if (data == null) {
        ok = false;
        break;
      }
      sum += countValidWordsInData(data);
    }
    countEl.textContent = ok ? formatWordCountRu(sum) : "не удалось посчитать";
  }
}

/** refs — пути вида «имя.json» или «custom:id». */
export async function loadWordsFromFiles(refs) {
  if (!Array.isArray(refs) || !refs.length) throw new Error("Нет файлов для загрузки");

  const base = "words/";
  const all = [];
  for (const ref of refs) {
    if (typeof ref === "string" && ref.startsWith("custom:")) {
      const id = ref.slice("custom:".length);
      const pack = state.manifestCache?.packs?.find((p) => p.id === id && p.custom);
      if (!pack?.words?.length) throw new Error("Пользовательский набор не найден или пуст.");
      for (const w of pack.words) {
        if (isWordEntryComplete(w)) all.push(w);
      }
      continue;
    }
    const url = `${base}${ref}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${ref}: ${res.status}`);
    const data = await res.json();
    const words = data.words;
    if (!Array.isArray(words)) throw new Error(`${ref}: нет массива words`);
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
  state.manifestCache.packs = [...state.manifestCache.packs, ...hydrateCustomPacksFromStorage()];

  const packs = state.manifestCache.packs;
  const fileMap = await prefetchPackWordFiles(base, packs);
  attachPackTitlesFromFiles(packs, fileMap);

  renderPackList(packs);
  if (!els.packList.querySelector("input")) {
    throw new Error("В manifest нет ни одного корректного пака");
  }
  fillPackWordCountsFromFileMap(packs, fileMap);
}
