import { TRAIN_MODE, VERB_FORM_KEYS, VERB_MODE, VOCAB_DIRECTION, VOCAB_MODE } from "js/config.js"
import { pickRandom, pickWeightedRandom } from "js/random.js"
import { getResolvedVerbMode } from "js/storage.js"
import { getEngine } from "js/trainer-ui-state.js"
import { roundLemmaKey } from "js/vocab-round.js"
import {
    usableAfterLemmaGap,
    vocabTaskSelectionWeight,
} from "src/screens/quiz/shared/quizTaskSelection.js"
import {
    isVerbCardsTrainingWord,
    isVerbConjugationTrainingWord,
    isVerbsTrainingWord,
} from "src/screens/quiz/verbs/verbsWords.js"
import {
    VERB_CONJUGATION_PERSONS,
    VERB_CONJUGATION_TENSES,
    verbConjugationExpectedForTask,
} from "src/screens/quiz/verbs/verbConjugation.js"

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

export function nextVerbTask(opts = {}) {
    const excludeLemma = opts.excludeLemma || null
    const verbMode = opts.verbMode || getResolvedVerbMode()
    const usable = getEngine().wordBank.filter((word) => {
        if (verbMode === VERB_MODE.CARDS) return isVerbCardsTrainingWord(word)
        if (verbMode === VERB_MODE.CONJUGATION) return isVerbConjugationTrainingWord(word)
        return isVerbsTrainingWord(word)
    })
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
            const fallback = usableIgnoringExcludedLemma(usable, excludeLemma)
            if (fallback.length) candidates = fallback
        }
    }

    if (!candidates.length) return null

    const word = pickWeightedRandom(candidates, vocabTaskSelectionWeight)
    if (verbMode === VERB_MODE.CARDS || verbMode === VERB_MODE.FORM_CARDS) {
        return {
            mode: TRAIN_MODE.VERBS,
            verbMode,
            word,
            hiddenVerbFormKey: verbMode === VERB_MODE.FORM_CARDS ? pickRandom(VERB_FORM_KEYS) : "",
            vocabDirection:
                verbMode === VERB_MODE.FORM_CARDS
                    ? VOCAB_DIRECTION.LT_TO_LT
                    : VOCAB_DIRECTION.RU_TO_LT,
            vocabMode: VOCAB_MODE.SINGLE,
        }
    }

    if (verbMode === VERB_MODE.CONJUGATION) {
        const tense = pickRandom(VERB_CONJUGATION_TENSES)
        const person = pickRandom(VERB_CONJUGATION_PERSONS)
        const task = {
            mode: TRAIN_MODE.VERBS,
            verbMode: VERB_MODE.CONJUGATION,
            word,
            tenseKey: tense.key,
            timeCueLt: tense.timeCueLt,
            personKey: person.key,
            pronounLt: person.pronounLt,
        }
        return {
            ...task,
            expected: verbConjugationExpectedForTask(task),
        }
    }

    const hiddenVerbFormKey = pickRandom(VERB_FORM_KEYS)
    return {
        mode: TRAIN_MODE.VERBS,
        verbMode: VERB_MODE.FORMS,
        word,
        hiddenVerbFormKey,
    }
}
