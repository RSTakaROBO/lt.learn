import { TRAIN_MODE } from "js/config.js"
import { normalizeWordEntries } from "js/word-entry.js"
import { isCasesTrainingWord } from "src/screens/quiz/cases/casesWords.js"
import { isVocabTrainingWord } from "src/screens/quiz/vocab/vocabWords.js"
import { isVerbsTrainingWord } from "src/screens/quiz/verbs/verbsWords.js"

function countWordsInData(data, trainMode) {
    const words = normalizeWordEntries(data?.words)
    let suitable
    if (trainMode === TRAIN_MODE.VOCAB) {
        suitable = words.filter(isVocabTrainingWord).length
    } else if (trainMode === TRAIN_MODE.VERBS) {
        suitable = words.filter(isVerbsTrainingWord).length
    } else {
        suitable = words.filter((word) => isCasesTrainingWord(word)).length
    }
    return { total: words.length, suitable }
}

/** Счётчик слов для карточки после prefetch. */
export function wordCountsForPack(pack, fileMap, trainMode) {
    if (pack.custom && Array.isArray(pack.words)) {
        return countWordsInData({ words: pack.words }, trainMode)
    }
    if (!pack.files?.length) return null
    let total = 0
    let suitable = 0
    let ok = true
    for (const file of pack.files) {
        const data = fileMap.get(file)
        if (data == null) {
            ok = false
            break
        }
        const counts = countWordsInData(data, trainMode)
        total += counts.total
        suitable += counts.suitable
    }
    return ok ? { total, suitable } : null
}
