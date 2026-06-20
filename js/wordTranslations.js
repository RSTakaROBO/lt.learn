import { comparableAnswerKey } from "./text-utils.js"

export function wordRuPrimary(word) {
    return Array.isArray(word?.translations) ? (word.translations[0] ?? "") : ""
}

export function wordRuAlt(word) {
    return Array.isArray(word?.translations) ? word.translations.slice(1).join(", ") : ""
}

/** Основной и альтернативный перевод (оба засчитываются при проверке). */
export function wordRuAcceptedList(word) {
    return Array.isArray(word?.translations) ? word.translations : []
}

export function hasWordRu(word) {
    return wordRuPrimary(word).length > 0
}

export function vocabRuUserMatches(word, userInput) {
    const keys = wordRuAcceptedList(word).map(comparableAnswerKey)
    if (!keys.length) return false
    const u = comparableAnswerKey(userInput)
    return keys.some((k) => k === u)
}

/** Строка для обратной связи: основной вариант и альтернатива в скобках. */
export function wordRuFeedbackLine(word) {
    const p = wordRuPrimary(word)
    const a = wordRuAlt(word)
    if (!p) return ""
    return a ? `${p} (${a})` : p
}
