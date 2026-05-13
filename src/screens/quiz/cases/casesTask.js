import { TRAIN_MODE } from "js/config.js"
import { pickRandom, pickWeightedRandom } from "js/random.js"
import { getEngine } from "js/trainer-ui-state.js"
import { roundLemmaKey } from "js/vocab-round.js"
import {
    usableAfterLemmaGap,
    vocabTaskSelectionWeight,
} from "src/screens/quiz/shared/quizTaskSelection.js"
import { isCasesTrainingWord } from "src/screens/quiz/cases/casesWords.js"

function usableIgnoringExcludedLemma(usable, excludeLemma) {
    if (getEngine().vocabRound) {
        return usable.filter(
            (word) =>
                getEngine().vocabRound.pool.has(roundLemmaKey(word)) &&
                roundLemmaKey(word) !== excludeLemma
        )
    }
    return usable.filter((word) => roundLemmaKey(word) !== excludeLemma)
}

export function nextCasesTask(selectedKeys, opts = {}) {
    const excludeLemma = opts.excludeLemma || null
    const usable = getEngine().wordBank.filter((word) => isCasesTrainingWord(word, selectedKeys))
    if (!usable.length) return null

    let candidates
    if (getEngine().vocabRound) {
        const pool = getEngine().vocabRound.pool
        if (pool.size === 0) return null
        const poolUsable = usable.filter((word) => pool.has(roundLemmaKey(word)))
        if (!poolUsable.length) return null
        candidates = usableAfterLemmaGap(poolUsable)
    } else {
        candidates = usableAfterLemmaGap(usable)
    }

    if (excludeLemma) {
        const filtered = candidates.filter((word) => roundLemmaKey(word) !== excludeLemma)
        if (filtered.length) {
            candidates = filtered
        } else {
            const fallback = usableIgnoringExcludedLemma(usable, excludeLemma)
            if (fallback.length) candidates = fallback
        }
    }

    if (!candidates.length) return null

    const word = pickWeightedRandom(candidates, vocabTaskSelectionWeight)
    const targetCase = pickRandom(selectedKeys)
    return { mode: TRAIN_MODE.CASES, word, targetCase }
}
