import {
    MIN_GAP_BEFORE_SAME_LEMMA,
    TRAIN_MODE,
    VOCAB_DIRECTION,
    WEIGHT_BASE,
    WEIGHT_MIN,
    WEIGHT_PER_CORRECT,
    WEIGHT_PER_SKIP,
    WEIGHT_PER_WRONG,
} from "./config.js"
import { pickRandom, pickWeightedRandom, shuffleArray } from "./random.js"
import { getEngine } from "./trainer-ui-state.js"
import { computeVocabRoundWeightForLemma, roundLemmaKey } from "./vocab-round.js"
import { getWordStat, loadVocabDirections } from "./storage.js"
import { comparableAnswerKey } from "./text-utils.js"
import { WORD_ENTRY_TYPE, wordLemma } from "./word-entry.js"
import { hasWordRu, wordRuAcceptedList, wordRuPrimary } from "./word-ru.js"

export function lemmaKey(word) {
    return wordLemma(word)
}

function computeWordSelectionWeight(word) {
    const s = getWordStat(lemmaKey(word))
    const w =
        WEIGHT_BASE +
        (s ? s.wrong : 0) * WEIGHT_PER_WRONG +
        (s ? s.skipped : 0) * WEIGHT_PER_SKIP -
        (s ? s.correct : 0) * WEIGHT_PER_CORRECT
    return Math.max(WEIGHT_MIN, w)
}

function vocabTaskSelectionWeight(word) {
    if (getEngine().vocabRound) return computeVocabRoundWeightForLemma(roundLemmaKey(word))
    return computeWordSelectionWeight(word)
}

/** Сколько слов уже показано после последнего вхождения этой леммы (0 — это последнее показанное слово). */
function countWordsSinceLemma(lemma, history) {
    const lastIdx = history.lastIndexOf(lemma)
    if (lastIdx === -1) return Infinity
    return history.length - 1 - lastIdx
}

/** Кандидаты с тем же зазором, что в истории showQuiz (ключ леммы = roundLemmaKey). */
function usableAfterLemmaGap(usableSubset) {
    let c = usableSubset.filter(
        (w) =>
            countWordsSinceLemma(roundLemmaKey(w), getEngine().shownLemmaHistory) >=
            MIN_GAP_BEFORE_SAME_LEMMA
    )
    if (!c.length) {
        const lastLemma =
            getEngine().shownLemmaHistory.length > 0
                ? getEngine().shownLemmaHistory[getEngine().shownLemmaHistory.length - 1]
                : null
        c =
            lastLemma != null
                ? usableSubset.filter((w) => roundLemmaKey(w) !== lastLemma)
                : usableSubset.slice()
    }
    if (!c.length) {
        c = usableSubset
    }
    return c
}

export function nextTask(selectedKeys) {
    const usable = getEngine().wordBank.filter(
        (w) =>
            w.type === WORD_ENTRY_TYPE.NOUN &&
            selectedKeys.every((k) => typeof w[k] === "string" && w[k])
    )
    if (!usable.length) return null

    let candidates = usable.filter(
        (w) =>
            countWordsSinceLemma(lemmaKey(w), getEngine().shownLemmaHistory) >=
            MIN_GAP_BEFORE_SAME_LEMMA
    )

    if (!candidates.length) {
        const lastLemma =
            getEngine().shownLemmaHistory.length > 0
                ? getEngine().shownLemmaHistory[getEngine().shownLemmaHistory.length - 1]
                : null
        candidates =
            lastLemma != null ? usable.filter((w) => lemmaKey(w) !== lastLemma) : usable.slice()
    }

    if (!candidates.length) {
        candidates = usable
    }

    const word = pickWeightedRandom(candidates, computeWordSelectionWeight)
    const targetCase = pickRandom(selectedKeys)
    return { mode: TRAIN_MODE.CASES, word, targetCase }
}

function buildVocabChoicesRuToLt(usable, word) {
    const correct = wordLemma(word)
    if (!correct) return null
    const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word))
    const picks = shuffleArray(others).slice(0, 3)
    if (picks.length < 3) return null
    const distractors = picks.map((w) => wordLemma(w)).filter(Boolean)
    if (distractors.length < 3) return null
    return shuffleArray([correct, ...distractors])
}

function buildVocabChoicesLtToRu(usable, word) {
    const correct = wordRuPrimary(word)
    if (!correct) return null
    const seen = new Set(wordRuAcceptedList(word).map((s) => comparableAnswerKey(s)))
    const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word))
    const distractorHints = []
    for (const w of shuffleArray(others)) {
        const h = wordRuPrimary(w)
        if (!h) continue
        const key = comparableAnswerKey(h)
        if (seen.has(key)) continue
        seen.add(key)
        distractorHints.push(h)
        if (distractorHints.length >= 3) break
    }
    if (distractorHints.length < 3) return null
    return shuffleArray([correct, ...distractorHints])
}

export function nextVocabTask(opts = {}) {
    const excludeLemma = opts.excludeLemma || null
    const dirsCfg = loadVocabDirections()
    if (!dirsCfg) return null
    const enabled = []
    if (dirsCfg.ru_to_lt) enabled.push(VOCAB_DIRECTION.RU_TO_LT)
    if (dirsCfg.lt_to_ru) enabled.push(VOCAB_DIRECTION.LT_TO_RU)
    if (!enabled.length) return null

    const hardcore = !!dirsCfg.hardcore

    const usable = getEngine().wordBank.filter((w) => hasWordRu(w) && wordLemma(w))
    const minWords = hardcore ? 1 : 4
    if (usable.length < minWords) return null

    let candidates

    if (getEngine().vocabRound) {
        const pool = getEngine().vocabRound.pool
        const poolUsable = usable.filter((w) => pool.has(roundLemmaKey(w)))
        if (!poolUsable.length) return null
        if (pool.size < MIN_GAP_BEFORE_SAME_LEMMA) {
            candidates = poolUsable.slice()
        } else {
            candidates = usableAfterLemmaGap(usable)
            let inPool = candidates.filter((w) => pool.has(roundLemmaKey(w)))
            if (!inPool.length && pool.size > 0) {
                inPool = usableAfterLemmaGap(poolUsable)
            }
            if (!inPool.length) return null
            candidates = inPool
        }
    } else {
        candidates = usableAfterLemmaGap(usable)
    }

    if (excludeLemma) {
        const filtered = candidates.filter((w) => roundLemmaKey(w) !== excludeLemma)
        if (filtered.length) {
            candidates = filtered
        } else {
            const usableIgnoringGap = getEngine().vocabRound
                ? usable.filter(
                      (w) =>
                          getEngine().vocabRound.pool.has(roundLemmaKey(w)) &&
                          roundLemmaKey(w) !== excludeLemma
                  )
                : usable.filter((w) => roundLemmaKey(w) !== excludeLemma)
            if (usableIgnoringGap.length) {
                candidates = usableIgnoringGap
            } else {
                return null
            }
        }
    }

    const dir = pickRandom(enabled)

    if (hardcore) {
        const word = pickWeightedRandom(candidates, vocabTaskSelectionWeight)
        return {
            mode: TRAIN_MODE.VOCAB,
            word,
            vocabDirection: dir,
            vocabHardcore: true,
        }
    }

    for (let attempt = 0; attempt < 48; attempt++) {
        const word = pickWeightedRandom(candidates, vocabTaskSelectionWeight)
        const choices =
            dir === VOCAB_DIRECTION.LT_TO_RU
                ? buildVocabChoicesLtToRu(usable, word)
                : buildVocabChoicesRuToLt(usable, word)
        if (choices) {
            return {
                mode: TRAIN_MODE.VOCAB,
                word,
                choices,
                vocabDirection: dir,
                vocabHardcore: false,
            }
        }
    }

    return null
}
