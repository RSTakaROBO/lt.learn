import { comparableAnswerKey } from "../../../../js/text-utils.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function vocabLemma(word) {
    return cleanString(word?.lemma || word?.nominative)
}

export function vocabRuPrimary(word) {
    if (Array.isArray(word?.ru_list)) return cleanString(word.ru_list[0])
    if (Array.isArray(word?.ru)) return cleanString(word.ru[0])
    return cleanString(word?.ru)
}

export function vocabRuAlt(word) {
    if (Array.isArray(word?.ru_list)) return word.ru_list.slice(1).map(cleanString).filter(Boolean)
    if (Array.isArray(word?.ru)) return word.ru.slice(1).map(cleanString).filter(Boolean)
    return cleanString(word?.ru_alt).split(",").map(cleanString).filter(Boolean)
}

export function vocabRuAcceptedList(word) {
    const out = []
    const primary = vocabRuPrimary(word)
    if (primary) out.push(primary)
    for (const alt of vocabRuAlt(word)) {
        if (alt && !out.includes(alt)) out.push(alt)
    }
    return out
}

export function vocabRuUserMatches(word, userInput) {
    const keys = vocabRuAcceptedList(word).map(comparableAnswerKey)
    if (!keys.length) return false
    const userKey = comparableAnswerKey(userInput)
    return keys.some((key) => key === userKey)
}

export function vocabRuFeedbackLine(word) {
    const primary = vocabRuPrimary(word)
    const alt = vocabRuAlt(word).join(", ")
    if (!primary) return ""
    return alt ? `${primary} (${alt})` : primary
}

export function isVocabTrainingWord(word) {
    return !!vocabRuPrimary(word) && !!vocabLemma(word)
}
