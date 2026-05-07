import { normalizeWordEntries } from "../../../js/word-entry.js"
import { vocabRuFeedbackLine } from "../../screens/quiz/vocab/vocabWords.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function wordPreviewLemma(word) {
    return cleanString(word?.lemma || word?.nominative)
}

export function wordPreviewTranslation(word) {
    return vocabRuFeedbackLine(word)
}

export function wordsForPackPreview(pack, fileMap) {
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
        .map((word) => ({
            type: cleanString(word?.type) || "noun",
            lemma: wordPreviewLemma(word),
            translation: wordPreviewTranslation(word),
        }))
        .filter((row) => row.lemma || row.translation)
}
