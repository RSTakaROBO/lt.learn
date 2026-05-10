import { MIN_GAP_BEFORE_SAME_LEMMA, TRAIN_MODE, VOCAB_DIRECTION } from "js/config.js"
import { pickRandom, pickWeightedRandom, shuffleArray } from "js/random.js"
import { loadVocabDirections } from "js/storage.js"
import { comparableAnswerKey } from "js/text-utils.js"
import { getEngine } from "js/trainer-ui-state.js"
import { roundLemmaKey } from "js/vocab-round.js"
import {
    lemmaKey,
    usableAfterLemmaGap,
    vocabTaskSelectionWeight,
} from "src/screens/quiz/shared/quizTaskSelection.js"
import {
    isVocabTrainingWord,
    vocabLemma,
    vocabRuAcceptedList,
    vocabRuPrimary,
} from "src/screens/quiz/vocab/vocabWords.js"

function buildVocabChoicesRuToLt(usable, word) {
    const correct = vocabLemma(word)
    if (!correct) return null
    const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word))
    const picks = shuffleArray(others).slice(0, 3)
    if (picks.length < 3) return null
    const distractors = picks.map((w) => vocabLemma(w)).filter(Boolean)
    if (distractors.length < 3) return null
    const entries = shuffleArray([word, ...picks])
    const choiceReveals = {}
    const choices = entries.map((w) => {
        const choice = vocabLemma(w)
        choiceReveals[choice] = vocabRuPrimary(w)
        return choice
    })
    return { choices, choiceReveals }
}

function buildVocabChoicesLtToRu(usable, word) {
    const correct = vocabRuPrimary(word)
    if (!correct) return null
    const seen = new Set(vocabRuAcceptedList(word).map((s) => comparableAnswerKey(s)))
    const others = usable.filter((w) => lemmaKey(w) !== lemmaKey(word))
    const distractorHints = []
    for (const w of shuffleArray(others)) {
        const h = vocabRuPrimary(w)
        if (!h) continue
        const key = comparableAnswerKey(h)
        if (seen.has(key)) continue
        seen.add(key)
        distractorHints.push(h)
        if (distractorHints.length >= 3) break
    }
    if (distractorHints.length < 3) return null
    const entries = shuffleArray([
        { choice: correct, reveal: vocabLemma(word) },
        ...distractorHints.map((choice) => {
            const source = others.find((w) => vocabRuPrimary(w) === choice)
            return { choice, reveal: source ? vocabLemma(source) : "" }
        }),
    ])
    const choiceReveals = {}
    const choices = entries.map((entry) => {
        choiceReveals[entry.choice] = entry.reveal
        return entry.choice
    })
    return { choices, choiceReveals }
}

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

export function nextVocabTask(opts = {}) {
    const excludeLemma = opts.excludeLemma || null
    const dirsCfg = loadVocabDirections()
    if (!dirsCfg) return null
    const enabled = []
    if (dirsCfg.ru_to_lt) enabled.push(VOCAB_DIRECTION.RU_TO_LT)
    if (dirsCfg.lt_to_ru) enabled.push(VOCAB_DIRECTION.LT_TO_RU)
    if (!enabled.length) return null

    const hardcore = !!dirsCfg.hardcore
    const usable = getEngine().wordBank.filter(isVocabTrainingWord)
    const minWords = hardcore ? 1 : 4
    if (usable.length < minWords) return null

    let candidates

    if (getEngine().vocabRound) {
        const pool = getEngine().vocabRound.pool
        const poolUsable = usable.filter((word) => pool.has(roundLemmaKey(word)))
        if (!poolUsable.length) return null
        if (pool.size < MIN_GAP_BEFORE_SAME_LEMMA) {
            candidates = poolUsable.slice()
        } else {
            candidates = usableAfterLemmaGap(usable)
            let inPool = candidates.filter((word) => pool.has(roundLemmaKey(word)))
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
        const filtered = candidates.filter((word) => roundLemmaKey(word) !== excludeLemma)
        if (filtered.length) {
            candidates = filtered
        } else {
            const fallback = usableIgnoringExcludedLemma(usable, excludeLemma)
            if (fallback.length) {
                candidates = fallback
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
        const choicesResult =
            dir === VOCAB_DIRECTION.LT_TO_RU
                ? buildVocabChoicesLtToRu(usable, word)
                : buildVocabChoicesRuToLt(usable, word)
        if (choicesResult) {
            return {
                mode: TRAIN_MODE.VOCAB,
                word,
                choices: choicesResult.choices,
                choiceReveals: choicesResult.choiceReveals,
                vocabDirection: dir,
                vocabHardcore: false,
            }
        }
    }

    return null
}
