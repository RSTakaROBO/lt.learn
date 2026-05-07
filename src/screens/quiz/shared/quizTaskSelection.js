import {
    MIN_GAP_BEFORE_SAME_LEMMA,
    WEIGHT_BASE,
    WEIGHT_MIN,
    WEIGHT_PER_CORRECT,
    WEIGHT_PER_SKIP,
    WEIGHT_PER_WRONG,
} from "../../../../js/config.js"
import { getWordStat } from "../../../../js/storage.js"
import { getEngine } from "../../../../js/trainer-ui-state.js"
import { computeVocabRoundWeightForLemma, roundLemmaKey } from "../../../../js/vocab-round.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function lemmaKey(word) {
    return cleanString(word?.lemma || word?.nominative)
}

export function computeWordSelectionWeight(word) {
    const s = getWordStat(lemmaKey(word))
    const w =
        WEIGHT_BASE +
        (s ? s.wrong : 0) * WEIGHT_PER_WRONG +
        (s ? s.skipped : 0) * WEIGHT_PER_SKIP -
        (s ? s.correct : 0) * WEIGHT_PER_CORRECT
    return Math.max(WEIGHT_MIN, w)
}

export function vocabTaskSelectionWeight(word) {
    if (getEngine().vocabRound) return computeVocabRoundWeightForLemma(roundLemmaKey(word))
    return computeWordSelectionWeight(word)
}

/** Сколько слов уже показано после последнего вхождения этой леммы (0 — это последнее показанное слово). */
export function countWordsSinceLemma(lemma, history) {
    const lastIdx = history.lastIndexOf(lemma)
    if (lastIdx === -1) return Infinity
    return history.length - 1 - lastIdx
}

/** Кандидаты с тем же зазором, что в истории showQuiz (ключ леммы = roundLemmaKey). */
export function usableAfterLemmaGap(usableSubset) {
    let candidates = usableSubset.filter(
        (word) =>
            countWordsSinceLemma(roundLemmaKey(word), getEngine().shownLemmaHistory) >=
            MIN_GAP_BEFORE_SAME_LEMMA
    )
    if (!candidates.length) {
        const lastLemma =
            getEngine().shownLemmaHistory.length > 0
                ? getEngine().shownLemmaHistory[getEngine().shownLemmaHistory.length - 1]
                : null
        candidates =
            lastLemma != null
                ? usableSubset.filter((word) => roundLemmaKey(word) !== lastLemma)
                : usableSubset.slice()
    }
    if (!candidates.length) {
        candidates = usableSubset
    }
    return candidates
}
