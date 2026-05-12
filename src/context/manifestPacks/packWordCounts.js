import { TRAIN_MODE } from "js/config.js"
import { filterLearnedWords } from "js/learned-words.js"
import { normalizeWordEntries } from "js/word-entry.js"
import { isCasesTrainingWord } from "src/screens/quiz/cases/casesWords.js"
import { isVocabTrainingWord } from "src/screens/quiz/vocab/vocabWords.js"
import { isVerbsTrainingWord } from "src/screens/quiz/verbs/verbsWords.js"

function filterWordsByMode(words, trainMode) {
    if (trainMode === TRAIN_MODE.VOCAB) return words.filter(isVocabTrainingWord)
    if (trainMode === TRAIN_MODE.VERBS) return words.filter(isVerbsTrainingWord)
    return words.filter((word) => isCasesTrainingWord(word))
}

export function countWords(words, trainMode) {
    return {
        total: words.length,
        suitable: filterWordsByMode(words, trainMode).length,
    }
}

export function countPackWords(
    words,
    trainMode,
    { excludeLearnedWords = false, wordStats = {} } = {}
) {
    const modeWords = filterWordsByMode(words, trainMode)
    const suitableWords = excludeLearnedWords ? filterLearnedWords(modeWords, wordStats) : modeWords
    return {
        total: words.length,
        suitable: suitableWords.length,
    }
}

export function wordsForPack(pack, fileMap) {
    const words = []
    if (pack.custom && Array.isArray(pack.words)) {
        words.push(...normalizeWordEntries(pack.words))
    } else if (Array.isArray(pack.files)) {
        for (const file of pack.files) {
            const data = fileMap.get(file)
            words.push(...normalizeWordEntries(data?.words))
        }
    }
    return words
}

/** Счётчик слов для карточки после prefetch. */
export function wordCountsForPackWords(words, trainMode) {
    if (!Array.isArray(words)) return null
    return countPackWords(words, trainMode)
}
