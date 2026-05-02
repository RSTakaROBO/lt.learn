import { STORAGE_KEYS, TRAIN_MODE } from "./config.js";
import { state } from "./state.js";

export function loadSelectedCases() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cases);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSelectedCases(keys) {
  try {
    localStorage.setItem(STORAGE_KEYS.cases, JSON.stringify(keys));
  } catch {
    /* ignore */
  }
}

export function loadSelectedPacks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.packs);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSelectedPacks(ids) {
  try {
    localStorage.setItem(STORAGE_KEYS.packs, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

/** Записанные пользователем наборы (как в JSON словарей: id, title, words). */
export function loadCustomPackRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.customPacks);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendCustomPackRecord(record) {
  const rows = loadCustomPackRecords();
  rows.push({
    id: record.id,
    title: record.title,
    words: record.words,
  });
  try {
    localStorage.setItem(STORAGE_KEYS.customPacks, JSON.stringify(rows));
  } catch (e) {
    if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
      throw new Error("Не хватило места в локальном хранилище браузера.");
    }
    throw e;
  }
}

export function removeCustomPackById(id) {
  if (typeof id !== "string" || !id.startsWith("custom-")) return;
  const rows = loadCustomPackRecords().filter((r) => r && r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.customPacks, JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function loadTrainMode() {
  try {
    const m = localStorage.getItem(STORAGE_KEYS.trainMode);
    if (m === TRAIN_MODE.VOCAB || m === TRAIN_MODE.CASES) return m;
  } catch {
    /* ignore */
  }
  return TRAIN_MODE.CASES;
}

export function saveTrainMode(mode) {
  try {
    if (mode === TRAIN_MODE.VOCAB || mode === TRAIN_MODE.CASES) {
      localStorage.setItem(STORAGE_KEYS.trainMode, mode);
    }
  } catch {
    /* ignore */
  }
}

export function normalizeWordStatRow(raw) {
  return {
    correct: Math.max(0, Math.floor(Number(raw?.correct) || 0)),
    wrong: Math.max(0, Math.floor(Number(raw?.wrong) || 0)),
    skipped: Math.max(0, Math.floor(Number(raw?.skipped) || 0)),
  };
}

export function loadPersistedWordStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.wordStats);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = normalizeWordStatRow(v);
    }
    return out;
  } catch {
    return {};
  }
}

export function saveWordStatsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.wordStats, JSON.stringify(state.wordStats));
  } catch {
    /* ignore */
  }
}

export function getWordStat(lemma) {
  const row = state.wordStats[lemma];
  return row ? normalizeWordStatRow(row) : { correct: 0, wrong: 0, skipped: 0 };
}

export function bumpWordStat(lemma, field) {
  if (!lemma || !["correct", "wrong", "skipped"].includes(field)) return;
  if (!state.wordStats[lemma]) state.wordStats[lemma] = { correct: 0, wrong: 0, skipped: 0 };
  state.wordStats[lemma][field]++;
  saveWordStatsToStorage();
}

export function loadVocabBestStreak() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.vocabBestStreak);
    const n = raw == null ? NaN : parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

/** Сохраняет серию, если она выше уже сохранённого рекорда. */
export function saveVocabBestStreakIfHigher(streak) {
  if (!Number.isFinite(streak) || streak < 0) return;
  const prev = loadVocabBestStreak();
  if (streak <= prev) return;
  try {
    localStorage.setItem(STORAGE_KEYS.vocabBestStreak, String(Math.floor(streak)));
  } catch {
    /* ignore */
  }
}

const VOCAB_DIRECTIONS_DEFAULT = { ru_to_lt: true, lt_to_ru: false, hardcore: false };

export function loadVocabDirections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.vocabDirections);
    if (!raw) return { ...VOCAB_DIRECTIONS_DEFAULT };
    const p = JSON.parse(raw);
    let ru_to_lt = !!p.ru_to_lt;
    let lt_to_ru = !!p.lt_to_ru;
    if (!ru_to_lt && !lt_to_ru) {
      ru_to_lt = VOCAB_DIRECTIONS_DEFAULT.ru_to_lt;
      lt_to_ru = VOCAB_DIRECTIONS_DEFAULT.lt_to_ru;
    }
    const hardcore = !!p.hardcore;
    return { ru_to_lt, lt_to_ru, hardcore };
  } catch {
    return { ...VOCAB_DIRECTIONS_DEFAULT };
  }
}

export function saveVocabDirections(dirs) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.vocabDirections,
      JSON.stringify({
        ru_to_lt: !!dirs.ru_to_lt,
        lt_to_ru: !!dirs.lt_to_ru,
        hardcore: !!dirs.hardcore,
      }),
    );
  } catch {
    /* ignore */
  }
}

export function loadCasesShowTranslation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.casesShowTranslation);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function saveCasesShowTranslation(show) {
  try {
    localStorage.setItem(STORAGE_KEYS.casesShowTranslation, show ? "1" : "0");
  } catch {
    /* ignore */
  }
}
