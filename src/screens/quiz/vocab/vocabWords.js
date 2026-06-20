import { comparableAnswerKey } from "js/text-utils.js"

function cleanString(value) {
    return typeof value === "string" ? value.trim() : ""
}

export function vocabLemma(word) {
    return cleanString(word?.lemma)
}

export function vocabVerbFormsLine(word) {
    if (word?.type !== "verb") return ""
    return [word.forms?.infinitive, word.forms?.present3, word.forms?.past3]
        .map(cleanString)
        .filter(Boolean)
        .join("\n")
}

export function vocabLtDisplay(word, showVerbForms = false) {
    if (showVerbForms) {
        const verbForms = vocabVerbFormsLine(word)
        if (verbForms) return verbForms
    }
    return vocabLemma(word)
}

export function vocabRuPrimary(word) {
    return Array.isArray(word?.translations) ? cleanString(word.translations[0]) : ""
}

export function vocabRuAlt(word) {
    return Array.isArray(word?.translations)
        ? word.translations.slice(1).map(cleanString).filter(Boolean)
        : []
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
