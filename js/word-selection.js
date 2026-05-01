import {
  CASE_ORDER,
  MIN_GAP_BEFORE_SAME_LEMMA,
  TRAIN_MODE,
  WEIGHT_BASE,
  WEIGHT_MIN,
  WEIGHT_PER_CORRECT,
  WEIGHT_PER_SKIP,
  WEIGHT_PER_WRONG,
} from "./config.js";
import { pickRandom, pickWeightedRandom, shuffleArray } from "./random.js";
import { state } from "./state.js";
import { getWordStat } from "./storage.js";

export function lemmaKey(word) {
  return word.nominative;
}

function computeWordSelectionWeight(word) {
  const s = getWordStat(lemmaKey(word));
  const w =
    WEIGHT_BASE +
    s.wrong * WEIGHT_PER_WRONG +
    s.skipped * WEIGHT_PER_SKIP -
    s.correct * WEIGHT_PER_CORRECT;
  return Math.max(WEIGHT_MIN, w);
}

/** Сколько слов уже показано после последнего вхождения этой леммы (0 — это последнее показанное слово). */
function countWordsSinceLemma(lemma, history) {
  const lastIdx = history.lastIndexOf(lemma);
  if (lastIdx === -1) return Infinity;
  return history.length - 1 - lastIdx;
}

export function nextTask(selectedKeys) {
  const usable = state.wordBank.filter((w) =>
    selectedKeys.every((k) => typeof w[k] === "string" && w[k]),
  );
  if (!usable.length) return null;

  let candidates = usable.filter(
    (w) => countWordsSinceLemma(lemmaKey(w), state.shownLemmaHistory) >= MIN_GAP_BEFORE_SAME_LEMMA,
  );

  if (!candidates.length) {
    const lastLemma =
      state.shownLemmaHistory.length > 0
        ? state.shownLemmaHistory[state.shownLemmaHistory.length - 1]
        : null;
    candidates = lastLemma != null ? usable.filter((w) => lemmaKey(w) !== lastLemma) : usable.slice();
  }

  if (!candidates.length) {
    candidates = usable;
  }

  const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
  const targetCase = pickRandom(selectedKeys);
  return { mode: TRAIN_MODE.CASES, word, targetCase };
}

export function nextVocabTask() {
  const usable = state.wordBank.filter(
    (w) =>
      typeof w.hint_ru === "string" &&
      w.hint_ru.trim() &&
      typeof w.nominative === "string" &&
      w.nominative,
  );
  if (usable.length < 4) return null;

  let candidates = usable.filter(
    (w) => countWordsSinceLemma(lemmaKey(w), state.shownLemmaHistory) >= MIN_GAP_BEFORE_SAME_LEMMA,
  );

  if (!candidates.length) {
    const lastLemma =
      state.shownLemmaHistory.length > 0
        ? state.shownLemmaHistory[state.shownLemmaHistory.length - 1]
        : null;
    candidates = lastLemma != null ? usable.filter((w) => lemmaKey(w) !== lastLemma) : usable.slice();
  }

  if (!candidates.length) {
    candidates = usable;
  }

  const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
  const correct = word.nominative;
  const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word));
  const picks = shuffleArray(others).slice(0, 3);
  if (picks.length < 3) return null;
  const distractors = picks.map((w) => w.nominative);
  const choices = shuffleArray([correct, ...distractors]);
  return { mode: TRAIN_MODE.VOCAB, word, choices };
}
