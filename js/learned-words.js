import { LEARNED_WORD_CORRECT_WRONG_DELTA } from "./config.js"
import { parseCurrentWordStatRow } from "./storage.js"
import { lemmaKey } from "../src/screens/quiz/shared/quizTaskSelection.js"

export function isLearnedWordStat(raw) {
    const row = parseCurrentWordStatRow(raw)
    if (!row) return false
    return row.progress >= LEARNED_WORD_CORRECT_WRONG_DELTA
}

export function isLearnedWord(word, wordStats) {
    return isLearnedWordStat(wordStats?.[lemmaKey(word)])
}

export function filterLearnedWords(words, wordStats) {
    if (!Array.isArray(words)) return []
    return words.filter((word) => !isLearnedWord(word, wordStats))
}
