import {
  MIN_GAP_BEFORE_SAME_LEMMA,
  TRAIN_MODE,
  VOCAB_DIRECTION,
  WEIGHT_BASE,
  WEIGHT_MIN,
  WEIGHT_PER_CORRECT,
  WEIGHT_PER_SKIP,
  WEIGHT_PER_WRONG,
} from "./config.js";
import { pickRandom, pickWeightedRandom, shuffleArray } from "./random.js";
import { state } from "./state.js";
import { getWordStat, loadVocabDirections } from "./storage.js";
import { comparableAnswerKey } from "./text-utils.js";
import { hasWordRu, wordRuAcceptedList, wordRuPrimary } from "./word-ru.js";

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

function buildVocabChoicesRuToLt(usable, word) {
  const correct = (word.nominative || "").trim();
  if (!correct) return null;
  const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word));
  const picks = shuffleArray(others).slice(0, 3);
  if (picks.length < 3) return null;
  const distractors = picks.map((w) => (w.nominative || "").trim()).filter(Boolean);
  if (distractors.length < 3) return null;
  return shuffleArray([correct, ...distractors]);
}

function buildVocabChoicesLtToRu(usable, word) {
  const correct = wordRuPrimary(word);
  if (!correct) return null;
  const seen = new Set(wordRuAcceptedList(word).map((s) => comparableAnswerKey(s)));
  const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word));
  const distractorHints = [];
  for (const w of shuffleArray(others)) {
    const h = wordRuPrimary(w);
    if (!h) continue;
    const key = comparableAnswerKey(h);
    if (seen.has(key)) continue;
    seen.add(key);
    distractorHints.push(h);
    if (distractorHints.length >= 3) break;
  }
  if (distractorHints.length < 3) return null;
  return shuffleArray([correct, ...distractorHints]);
}

export function nextVocabTask() {
  const dirsCfg = loadVocabDirections();
  const enabled = [];
  if (dirsCfg.ru_to_lt) enabled.push(VOCAB_DIRECTION.RU_TO_LT);
  if (dirsCfg.lt_to_ru) enabled.push(VOCAB_DIRECTION.LT_TO_RU);
  if (!enabled.length) return null;

  const hardcore = !!dirsCfg.hardcore;

  const usable = state.wordBank.filter(
    (w) => hasWordRu(w) && typeof w.nominative === "string" && w.nominative.trim(),
  );
  const minWords = hardcore ? 1 : 4;
  if (usable.length < minWords) return null;

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

  const dir = pickRandom(enabled);

  if (hardcore) {
    const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
    return {
      mode: TRAIN_MODE.VOCAB,
      word,
      vocabDirection: dir,
      vocabHardcore: true,
    };
  }

  for (let attempt = 0; attempt < 48; attempt++) {
    const word = pickWeightedRandom(candidates, computeWordSelectionWeight);
    const choices =
      dir === VOCAB_DIRECTION.LT_TO_RU
        ? buildVocabChoicesLtToRu(usable, word)
        : buildVocabChoicesRuToLt(usable, word);
    if (choices) {
      return { mode: TRAIN_MODE.VOCAB, word, choices, vocabDirection: dir, vocabHardcore: false };
    }
  }

  return null;
}
