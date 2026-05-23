import { normalizeWordEntries } from "js/word-entry.js"
import { vocabRuAcceptedList } from "src/screens/quiz/vocab/vocabWords.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function wordPreviewLemma(word) {
    return cleanString(word?.lemma || word?.nominative)
}

export function wordPreviewTranslation(word) {
    return vocabRuAcceptedList(word).join(", ")
}

export function wordPreviewTranslations(word) {
    return vocabRuAcceptedList(word)
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
            translations: wordPreviewTranslations(word),
        }))
        .filter((row) => row.lemma || row.translation)
}
