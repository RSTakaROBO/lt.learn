import { LEARNED_WORD_CORRECT_WRONG_DELTA } from "./config.js"
import { normalizeWordStatRow } from "./storage.js"
import { lemmaKey } from "../src/screens/quiz/shared/quizTaskSelection.js"

export function isLearnedWordStat(raw) {
    const row = normalizeWordStatRow(raw)
    if (!row) return false
    return row.correct - row.wrong >= LEARNED_WORD_CORRECT_WRONG_DELTA
}

export function isLearnedWord(word, wordStats) {
    return isLearnedWordStat(wordStats?.[lemmaKey(word)])
}

export function filterLearnedWords(words, wordStats) {
    if (!Array.isArray(words)) return []
    return words.filter((word) => !isLearnedWord(word, wordStats))
}
