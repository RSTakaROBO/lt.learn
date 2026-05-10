import { TRAIN_MODE, VERB_FORM_KEYS } from "js/config.js"
import { pickRandom, pickWeightedRandom } from "js/random.js"
import { getEngine } from "js/trainer-ui-state.js"
import { roundLemmaKey } from "js/vocab-round.js"
import {
    usableAfterLemmaGap,
    vocabTaskSelectionWeight,
} from "src/screens/quiz/shared/quizTaskSelection.js"
import { isVerbsTrainingWord } from "src/screens/quiz/verbs/verbsWords.js"

export function nextVerbTask(opts = {}) {
    const excludeLemma = opts.excludeLemma || null
    const usable = getEngine().wordBank.filter(isVerbsTrainingWord)
    if (!usable.length) return null

    let candidates = usableAfterLemmaGap(usable)
    if (getEngine().vocabRound) {
        const pool = getEngine().vocabRound.pool
        if (pool.size === 0) return null
        const poolUsable = usable.filter((word) => pool.has(roundLemmaKey(word)))
        if (!poolUsable.length) return null
        candidates = usableAfterLemmaGap(poolUsable)
    }

    if (excludeLemma) {
        const filtered = candidates.filter((word) => roundLemmaKey(word) !== excludeLemma)
        if (filtered.length) {
            candidates = filtered
        } else {
            const fallback = usable.filter((word) => roundLemmaKey(word) !== excludeLemma)
            if (fallback.length) candidates = fallback
        }
    }

    if (!candidates.length) return null

    const word = pickWeightedRandom(candidates, vocabTaskSelectionWeight)
    const hiddenVerbFormKey = pickRandom(VERB_FORM_KEYS)
    return {
        mode: TRAIN_MODE.VERBS,
        word,
        hiddenVerbFormKey,
    }
}
