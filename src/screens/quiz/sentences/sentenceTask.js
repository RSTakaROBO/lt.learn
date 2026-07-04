import { TRAIN_MODE } from "js/config.js"
import { loadSelectedSentencePacks } from "js/storage.js"
import { pickWeightedRandom, shuffleArray } from "js/random.js"
import { getEngine } from "js/trainer-ui-state.js"
import { roundLemmaKey } from "js/vocab-round.js"
import {
    computeWordSelectionWeight,
    usableAfterLemmaGap,
} from "src/screens/quiz/shared/quizTaskSelection.js"
import { sentenceExpectedText, sentencesForPackIds, sentenceToRoundWord } from "./sentenceBank.js"
import { sentenceFakeWords } from "./sentenceDistractors.js"

export function sentenceRoundWords() {
    return selectedSentences().map(sentenceToRoundWord)
}

function sentenceByLemma(lemma) {
    return selectedSentences().find((sentence) => sentenceExpectedText(sentence) === lemma) || null
}

function selectedSentences() {
    return sentencesForPackIds(loadSelectedSentencePacks())
}

function tokenRows(sentence) {
    const fakeWords = sentenceFakeWords(sentence, { wordBank: getEngine().wordBank })
    return shuffleArray([
        ...sentence.answer.map((text, index) => ({
            id: `${sentence.id}-answer-${index}`,
            text,
            answerIndex: index,
        })),
        ...fakeWords.map((text, index) => ({
            id: `${sentence.id}-extra-${index}`,
            text,
            answerIndex: -1,
        })),
    ])
}

export function nextSentenceTask(opts = {}) {
    const excludeLemmas = new Set(
        [
            opts.excludeLemma || null,
            ...(Array.isArray(opts.excludeLemmas) ? opts.excludeLemmas : []),
        ].filter(Boolean)
    )
    const allWords = sentenceRoundWords()
    const round = getEngine().vocabRound
    let candidates = round
        ? allWords.filter((word) => round.pool.has(roundLemmaKey(word)))
        : usableAfterLemmaGap(allWords)

    if (excludeLemmas.size) {
        const filtered = candidates.filter((word) => !excludeLemmas.has(roundLemmaKey(word)))
        if (filtered.length) candidates = filtered
    }

    if (!candidates.length) return null
    const word = pickWeightedRandom(candidates, computeWordSelectionWeight)
    const sentence = sentenceByLemma(roundLemmaKey(word))
    if (!sentence) return null

    return {
        mode: TRAIN_MODE.SENTENCES,
        word,
        sentence,
        tokens: tokenRows(sentence),
        expectedWords: sentence.answer.slice(),
    }
}
