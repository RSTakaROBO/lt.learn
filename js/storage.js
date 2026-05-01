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
