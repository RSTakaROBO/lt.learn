import {
  WEIGHT_BASE,
  WEIGHT_MIN,
  WEIGHT_PER_CORRECT,
  WEIGHT_PER_SKIP,
  WEIGHT_PER_WRONG,
} from "./config.js";
import { fmt } from "./i18n/core.js";
import { STR } from "./i18n/strings-ru.js";
import { state } from "./state.js";
import { hasWordRu } from "./word-ru.js";

/** Сколько верных подряд по одному слову — исключение из пула раунда. */
export const VOCAB_ROUND_STREAK_TO_REMOVE = 3;

/**
 * Ключ леммы в раунде (trim), чтобы пул, веса и счётчики совпадали.
 *
 * Семантика «подряд» только по **этой лемме**: между показами одного и того же слова
 * могут быть любые другие слова — прогресс к трём верным подряд по этой лемме не сбрасывается.
 * Обнуляется счётчик только при неверном ответе по этой лемме или при пропуске карточки.
 */
export function roundLemmaKey(word) {
  return typeof word?.nominative === "string" ? word.nominative.trim() : "";
}

function ensureRoundRow(vr, lemma) {
  if (!vr.roundRow[lemma]) vr.roundRow[lemma] = { correct: 0, wrong: 0, skipped: 0 };
  return vr.roundRow[lemma];
}

/**
 * Инициализация конечного раунда «Слова»: пул — все подходящие слова из wordBank.
 * @returns {boolean}
 */
export function initVocabRound() {
  const usable = state.wordBank.filter(
    (w) => hasWordRu(w) && typeof w.nominative === "string" && w.nominative.trim(),
  );
  if (!usable.length) {
    state.vocabRound = null;
    syncVocabRoundProgress();
    syncVocabRoundLemmaDots(null);
    return false;
  }
  const pool = new Set(usable.map((w) => roundLemmaKey(w)).filter(Boolean));
  const roundRow = {};
  for (const w of usable) {
    const k = roundLemmaKey(w);
    if (k) roundRow[k] = { correct: 0, wrong: 0, skipped: 0 };
  }
  state.vocabRound = {
    pool,
    initialSize: pool.size,
    gradedCorrect: 0,
    gradedWrong: 0,
    wrongByLemma: Object.create(null),
    roundRow,
    lemmaTowardThree: Object.create(null),
    maxStreak: 0,
  };
  syncVocabRoundProgress();
  syncVocabRoundLemmaDots(null);
  return true;
}

export function clearVocabRound() {
  state.vocabRound = null;
  syncVocabRoundProgress();
  syncVocabRoundLemmaDots(null);
}

export function isVocabRoundActive() {
  return !!state.vocabRound;
}

/** Вес слова в раунде (без учёта глобальной статистики). */
export function computeVocabRoundWeightForLemma(lemma) {
  const vr = state.vocabRound;
  if (!vr) {
    const z = { correct: 0, wrong: 0, skipped: 0 };
    return weightFromRoundRow(z);
  }
  const row = vr.roundRow[lemma] || { correct: 0, wrong: 0, skipped: 0 };
  return weightFromRoundRow(row);
}

function weightFromRoundRow(row) {
  const w =
    WEIGHT_BASE +
    row.wrong * WEIGHT_PER_WRONG +
    row.skipped * WEIGHT_PER_SKIP -
    row.correct * WEIGHT_PER_CORRECT;
  return Math.max(WEIGHT_MIN, w);
}

/** Учитывает ответ по текущей карточке: серия «к 3» только по этой лемме, без сброса при смене карточки на другую. */
export function applyVocabRoundAnswer(word, ok) {
  const vr = state.vocabRound;
  if (!vr) return;
  const lem = roundLemmaKey(word);
  if (!lem) return;
  const inPool = vr.pool.has(lem);
  if (!inPool) {
    if (!ok) vr.lemmaTowardThree[lem] = 0;
    const slot = vr.lemmaTowardThree[lem];
    syncVocabRoundLemmaDots(word, typeof slot === "number" ? slot : 0);
    return;
  }
  const row = ensureRoundRow(vr, lem);
  let dotsForUi = 0;
  if (ok) {
    row.correct += 1;
    vr.gradedCorrect += 1;
    const n = (vr.lemmaTowardThree[lem] || 0) + 1;
    vr.lemmaTowardThree[lem] = n;
    dotsForUi = Math.min(n, VOCAB_ROUND_STREAK_TO_REMOVE);
    if (n >= VOCAB_ROUND_STREAK_TO_REMOVE) {
      vr.pool.delete(lem);
      delete vr.lemmaTowardThree[lem];
      dotsForUi = VOCAB_ROUND_STREAK_TO_REMOVE;
    }
  } else {
    row.wrong += 1;
    vr.gradedWrong += 1;
    vr.lemmaTowardThree[lem] = 0;
    dotsForUi = 0;
    vr.wrongByLemma[lem] = (vr.wrongByLemma[lem] || 0) + 1;
  }
  if (ok) {
    vr.maxStreak = Math.max(vr.maxStreak, state.vocabCorrectStreak || 0);
  }
  syncVocabRoundLemmaDots(word, dotsForUi);
  syncVocabRoundProgress();
}

export function applyVocabRoundSkip(word) {
  const vr = state.vocabRound;
  if (!vr) return;
  const lem = roundLemmaKey(word);
  if (!lem || !vr.pool.has(lem)) return;
  vr.maxStreak = Math.max(vr.maxStreak, state.vocabCorrectStreak || 0);
  const row = ensureRoundRow(vr, lem);
  row.skipped += 1;
  vr.lemmaTowardThree[lem] = 0;
  syncVocabRoundLemmaDots(word, 0);
  syncVocabRoundProgress();
}

/**
 * Три точки внизу карточки: сколько верных подряд по этой лемме в раунде (0–3).
 * @param {object | null} word
 * @param {number} [filledOverride] явное значение после ответа (например 3 в момент снятия с пула)
 */
export function syncVocabRoundLemmaDots(word, filledOverride) {
  const wrap = document.getElementById("vocab-round-lemma-dots");
  if (!wrap) return;
  const vr = state.vocabRound;
  if (!vr || !word) {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    wrap.removeAttribute("aria-label");
    wrap.querySelectorAll(".vocab-round-lemma-dot").forEach((d) => d.classList.remove("is-filled"));
    return;
  }
  const lem = roundLemmaKey(word);
  let filled = 0;
  if (typeof filledOverride === "number" && Number.isFinite(filledOverride)) {
    filled = Math.max(0, Math.min(VOCAB_ROUND_STREAK_TO_REMOVE, filledOverride));
  } else if (lem) {
    filled = Math.min(VOCAB_ROUND_STREAK_TO_REMOVE, vr.lemmaTowardThree[lem] || 0);
  }
  wrap.querySelectorAll(".vocab-round-lemma-dot").forEach((d, i) => {
    d.classList.toggle("is-filled", i < filled);
  });
  wrap.classList.remove("hidden");
  wrap.setAttribute("aria-hidden", "false");
  wrap.setAttribute(
    "aria-label",
    fmt(STR.vocabRound.ariaDots, { filled, max: VOCAB_ROUND_STREAK_TO_REMOVE }),
  );
}

export function syncVocabRoundProgress() {
  const wrap = document.getElementById("vocab-round-progress");
  const fill = document.getElementById("vocab-round-progress-fill");
  if (!wrap || !fill) return;
  const vr = state.vocabRound;
  if (!vr || vr.initialSize <= 0) {
    wrap.classList.add("hidden");
    wrap.setAttribute("aria-hidden", "true");
    wrap.removeAttribute("aria-valuenow");
    wrap.removeAttribute("aria-valuemax");
    wrap.removeAttribute("aria-label");
    fill.style.width = "0%";
    return;
  }
  const done = vr.initialSize - vr.pool.size;
  const pct = Math.max(0, Math.min(100, (100 * done) / vr.initialSize));
  fill.style.width = `${pct}%`;
  wrap.setAttribute("aria-valuenow", String(done));
  wrap.setAttribute("aria-valuemax", String(vr.initialSize));
  wrap.setAttribute(
    "aria-label",
    fmt(STR.vocabRound.ariaProgress, { done, total: vr.initialSize }),
  );
  wrap.classList.remove("hidden");
  wrap.setAttribute("aria-hidden", "false");
}

export function getVocabRoundSummarySnapshot() {
  const vr = state.vocabRound;
  if (!vr) return null;
  const graded = vr.gradedCorrect + vr.gradedWrong;
  const accuracyPct = graded > 0 ? Math.round((100 * vr.gradedCorrect) / graded) : null;
  const topHard = Object.entries(vr.wrongByLemma)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "lt"))
    .slice(0, 3)
    .map(([lemma, wrong]) => ({ lemma, wrong }));
  return {
    accuracyPct,
    maxStreak: vr.maxStreak,
    topHard,
    initialSize: vr.initialSize,
    poolLeft: vr.pool.size,
  };
}
