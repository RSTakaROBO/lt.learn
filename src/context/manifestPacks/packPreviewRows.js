import { parseCurrentWordEntries } from "js/word-entry.js"
import { vocabRuAcceptedList } from "src/screens/quiz/vocab/vocabWords.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function wordPreviewLemma(word) {
    return cleanString(word?.lemma)
}

export function wordPreviewTranslations(word) {
    return vocabRuAcceptedList(word)
}

export function wordsForPackPreview(pack, fileMap) {
    const words = []
    if (pack.custom && Array.isArray(pack.words)) {
        words.push(...parseCurrentWordEntries(pack.words))
    } else if (Array.isArray(pack.files)) {
        for (const file of pack.files) {
            const data = fileMap.get(file)
            words.push(...parseCurrentWordEntries(data?.words))
        }
    }

    return words
        .map((word) => ({
            type: cleanString(word?.type),
            lemma: wordPreviewLemma(word),
            translations: wordPreviewTranslations(word),
        }))
        .filter((row) => row.lemma)
}
